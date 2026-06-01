"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { db, storage } from "@/lib/firebase"
import {
    collection, addDoc, serverTimestamp, onSnapshot,
    query, orderBy, limit, Timestamp
} from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { processAndSummarizeNote } from "@/actions/notes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, FileText, Loader2, Lock, History, X, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useUserPlan } from "@/hooks/useUserPlan"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"

const OUTPUT_TYPES = [
    { value: "Bullet points",    label: "Bullet Points",    emoji: "📝", desc: "Clear, scannable key points" },
    { value: "Detailed notes",   label: "Detailed Notes",   emoji: "📖", desc: "Full coverage of all topics" },
    { value: "Short notes",      label: "Short Notes",      emoji: "⚡", desc: "Ultra-brief quick reference" },
    { value: "Exam prep",        label: "Exam Prep",        emoji: "🎓", desc: "Questions & key concepts" },
    { value: "Quiz",             label: "Quiz",             emoji: "❓", desc: "10 Q&A from the material" },
    { value: "Assignment guide", label: "Assignment Guide", emoji: "📋", desc: "Structured writing help" },
    { value: "Paragraph",        label: "Paragraph",        emoji: "📄", desc: "Flowing prose summary" },
]

export default function NoteSummarizerPage() {
    const { user }                                       = useAuth()
    const router                                         = useRouter()
    const { plan, limits, usage, loading: planLoading }  = useUserPlan()

    const [loading, setLoading]               = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [summaryHistory, setSummaryHistory] = useState<any[]>([])
    const [showHistory, setShowHistory]       = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [selectedFile, setSelectedFile]     = useState<File | null>(null)
    const [outputType, setOutputType]             = useState("Bullet points")
    const [specialInstructions, setSpecialInstructions] = useState("")

    const fileInputRef = useRef<HTMLInputElement>(null)

    const summaryLimit  = limits.summaries
    const summariesUsed = usage.summaries ?? 0
    const canSummarize  = summariesUsed < summaryLimit

    useEffect(() => {
        if (!user) return
        const unsub = onSnapshot(
            query(collection(db, "users", user.uid, "summaries"), orderBy("createdAt", "desc"), limit(20)),
            (snap) => setSummaryHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        )
        return () => unsub()
    }, [user])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Max 10 MB."); return }
        const allowed = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ]
        if (!allowed.includes(file.type)) { toast.error("Unsupported format. Use PDF, DOCX, or TXT."); return }
        setSelectedFile(file)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleProcess = async () => {
        if (!selectedFile || !user) return
        if (!canSummarize) { setShowUpgradeModal(true); return }

        setLoading(true)
        setUploadProgress(0)

        try {
            const storageRef  = ref(storage, `users/${user.uid}/uploads/${Date.now()}_${selectedFile.name}`)
            const uploadTask  = uploadBytesResumable(storageRef, selectedFile)

            const downloadURL = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                    (err) => reject(new Error("Upload failed: " + err.message)),
                    async () => { try { resolve(await getDownloadURL(uploadTask.snapshot.ref)) } catch (e: any) { reject(e) } }
                )
            })

            setUploadProgress(100)
            toast.info("File uploaded — AI is analysing your document...")

            const result = await processAndSummarizeNote(downloadURL, selectedFile.type, { outputType, specialInstructions })
            if (!result.success) throw new Error(result.error || "Summarisation failed")

            const aiData = result.data

            const docRef = await addDoc(collection(db, "users", user.uid, "summaries"), {
                fileName:      selectedFile.name,
                fileUrl:       downloadURL,
                fileType:      selectedFile.type,
                title:         aiData.title,
                emoji:         aiData.emoji,
                summary:       aiData.summary,
                keyPoints:     aiData.keyPoints,
                actionItems:   aiData.actionItems,
                questions:     aiData.questions || [],
                outputType,
                specialInstructions: specialInstructions || "",
                createdAt:     serverTimestamp(),
                extractedText: result.extractedText,
            })

            await addDoc(collection(db, "users", user.uid, "activityLog"), {
                type:        "summary_generated",
                description: `Summarised: "${selectedFile.name}"`,
                icon:        "✨",
                timestamp:   Timestamp.now(),
            })

            router.push(`/dashboard/note-summarizer/${docRef.id}`)

        } catch (err: any) {
            const msg = err.message || "Something went wrong"
            if (msg.includes("storage") || msg.includes("upload") || msg.includes("download")) {
                toast.error("File upload failed. Check your connection and try again.")
            } else if (msg.includes("scanned") || msg.includes("text")) {
                toast.error("Could not read text. Please use a text-based PDF.")
            } else {
                toast.error("Summary failed: " + msg)
            }
        } finally {
            setLoading(false)
            setUploadProgress(0)
        }
    }

    if (planLoading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    const selected = OUTPUT_TYPES.find(o => o.value === outputType)!

    return (
        <div className="flex flex-col items-center py-12 px-4">
            {showUpgradeModal && (
                <UpgradeModal
                    feature="More AI Summaries"
                    description={`You've used all ${summaryLimit} summaries on the ${plan} plan. Upgrade to get more.`}
                    requiredPlan={plan === "free" ? "standard" : "pro"}
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}

            {/* Header */}
            <div className="w-full max-w-xl text-center mb-8">
                <h1 className="text-3xl font-bold">AI Note Summarizer</h1>
                <p className="text-muted-foreground mt-2">Upload your notes and choose how you want them summarised.</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${canSummarize ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"}`}>
                        {summariesUsed} / {summaryLimit >= 9999 ? "∞" : summaryLimit} summaries this month
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5 text-xs">
                        <History className="h-3.5 w-3.5" />
                        {showHistory ? "Hide History" : "View History"}
                    </Button>
                </div>
            </div>

            {/* History */}
            {showHistory && (
                <div className="w-full max-w-xl mb-6 animate-in slide-in-from-top-2 duration-200">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Recent Summaries</CardTitle>
                            <CardDescription>Click to open</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summaryHistory.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No summaries yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-52 overflow-y-auto">
                                    {summaryHistory.map(s => (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                                            onClick={() => router.push(`/dashboard/note-summarizer/${s.id}`)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xl">{s.emoji || "📄"}</span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{s.title || s.fileName}</p>
                                                    <p className="text-xs text-muted-foreground">{s.outputType || "Summary"} · {s.keyPoints?.length || 0} points</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main card */}
            <div className="w-full max-w-xl space-y-5">
                {/* Drop zone */}
                <div
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3 transition-all
                        ${canSummarize ? "hover:bg-muted/40 cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                    onClick={() => canSummarize && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={!canSummarize}
                    />
                    <div className="bg-primary/10 p-4 rounded-full text-primary">
                        {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
                    </div>
                    <div>
                        <p className="font-semibold text-lg">
                            {!canSummarize ? "Monthly limit reached" :
                                selectedFile ? selectedFile.name : "Click to upload"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {!canSummarize ? "Upgrade to continue" :
                                selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` :
                                    "PDF, DOCX, or TXT · Max 10 MB"}
                        </p>
                    </div>
                    {selectedFile && (
                        <button
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                        >
                            <X className="h-3 w-3" /> Remove
                        </button>
                    )}
                </div>

                {/* Upload progress */}
                {loading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Uploading... {uploadProgress}%</p>
                    </div>
                )}
                {loading && uploadProgress === 100 && (
                    <p className="text-xs text-muted-foreground text-center animate-pulse">AI is analysing your document...</p>
                )}

                {/* Output format picker */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-center">What do you want?</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                        {OUTPUT_TYPES.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setOutputType(opt.value)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                                    outputType === opt.value
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                                }`}
                            >
                                <span className="text-2xl">{opt.emoji}</span>
                                <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                            </button>
                        ))}

                        {/* Special instructions — sits right next to Paragraph in the same grid row */}
                        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Special Instructions <span className="normal-case font-normal">(optional)</span>
                            </p>
                            <textarea
                                value={specialInstructions}
                                onChange={e => setSpecialInstructions(e.target.value)}
                                placeholder="Give AI instructions on what to generate"
                                className="flex-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* CTA */}
                {!canSummarize ? (
                    <Button className="w-full" size="lg" onClick={() => setShowUpgradeModal(true)}>
                        <Lock className="mr-2 h-4 w-4" /> Upgrade to Summarise More
                    </Button>
                ) : (
                    <Button
                        onClick={handleProcess}
                        className="w-full"
                        size="lg"
                        disabled={!selectedFile || loading}
                    >
                        {loading
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing...</>
                            : <>{selected.emoji} Generate {selected.label}</>}
                    </Button>
                )}
            </div>
        </div>
    )
}
