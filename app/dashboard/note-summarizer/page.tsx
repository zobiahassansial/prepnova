"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db, storage } from "@/lib/firebase"
import {
    collection, addDoc, serverTimestamp, onSnapshot,
    query, orderBy, limit, Timestamp
} from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { processAndSummarizeNote } from "@/actions/notes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Upload, FileText, Loader2, CheckCircle2, List, Zap, BookOpen,
    History, Copy, Check, Lock
} from "lucide-react"
import { toast } from "sonner"
import { useUserPlan } from "@/hooks/useUserPlan"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"

export default function NoteSummarizerPage() {
    const { user } = useAuth()
    const { plan, limits, usage, loading: planLoading } = useUserPlan()
    const [loading, setLoading] = useState(false)
    const [summaryData, setSummaryData] = useState<any>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [summaryHistory, setSummaryHistory] = useState<any[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const summaryLimit = limits.summaries
    const summariesUsed = usage.summaries ?? 0
    const canSummarize = summariesUsed < summaryLimit

    // Live summary history
    useEffect(() => {
        if (!user) return
        const unsubHistory = onSnapshot(
            query(
                collection(db, "users", user.uid, "summaries"),
                orderBy("createdAt", "desc"),
                limit(20)
            ),
            (snap) => setSummaryHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        )
        return () => unsubHistory()
    }, [user])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large. Max 10MB allowed.")
            return
        }
        const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
        if (!allowed.includes(file.type)) {
            toast.error("Unsupported format. Use PDF, DOCX, or TXT.")
            return
        }
        setSelectedFile(file)
        setSummaryData(null)
    }

    const handleProcess = async () => {
        if (!selectedFile || !user) return

        if (!canSummarize) {
            setShowUpgradeModal(true)
            return
        }

        setLoading(true)
        setUploadProgress(0)

        try {
            // 1. Upload to Firebase Storage with progress
            const storageRef = ref(storage, `users/${user.uid}/uploads/${Date.now()}_${selectedFile.name}`)
            const uploadTask = uploadBytesResumable(storageRef, selectedFile)

            const downloadURL = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                    reject,
                    async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
                )
            })

            setUploadProgress(100)
            toast.info("File uploaded! AI is analyzing your document...")

            // 2. AI Summarization
            const result = await processAndSummarizeNote(downloadURL, selectedFile.type)

            if (!result.success) {
                throw new Error(result.error || "Summarization failed")
            }

            const aiData = result.data
            setSummaryData(aiData)

            // 3. Save to Firestore + log activity
            await addDoc(collection(db, "users", user.uid, "summaries"), {
                fileName: selectedFile.name,
                fileUrl: downloadURL,
                fileType: selectedFile.type,
                title: aiData.title,
                emoji: aiData.emoji,
                summary: aiData.summary,
                keyPoints: aiData.keyPoints,
                actionItems: aiData.actionItems,
                createdAt: serverTimestamp(),
                extractedText: result.extractedText,
            })

            await addDoc(collection(db, "users", user.uid, "activityLog"), {
                type: "summary_generated",
                description: `Summarized: "${selectedFile.name}"`,
                icon: "✨",
                timestamp: Timestamp.now(),
            })

            toast.success("Summary generated and saved to Library!")
        } catch (err: any) {
            const msg = err.message || "Something went wrong"
            if (msg.includes("unsupported") || msg.includes("format")) {
                toast.error("Unsupported file format. Please use PDF, DOCX, or TXT.")
            } else if (msg.includes("too large") || msg.includes("size")) {
                toast.error("File too large. Please use a file under 10MB.")
            } else {
                toast.error("Summary failed: " + msg)
            }
        } finally {
            setLoading(false)
            setUploadProgress(0)
        }
    }

    const handleCopy = () => {
        if (!summaryData) return
        const text = `${summaryData.title}\n\n${summaryData.summary}\n\nKey Points:\n${summaryData.keyPoints?.map((p: string) => `• ${p}`).join("\n")}`
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    if (planLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container max-w-5xl py-12">
            {showUpgradeModal && (
                <UpgradeModal
                    feature="More AI Summaries"
                    description={`You've used all ${summaryLimit} summaries for this month on the ${plan} plan. Upgrade to get more.`}
                    requiredPlan={plan === "free" ? "standard" : "pro"}
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold">AI Note Summarizer</h1>
                    <p className="text-muted-foreground mt-1">
                        Upload notes, get structured summaries, and auto-sync to Flashcards.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Usage indicator */}
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${canSummarize ? "bg-primary/10 text-primary" : "bg-red-100 text-red-700"}`}>
                        {summariesUsed} / {summaryLimit >= 9999 ? "∞" : summaryLimit} summaries this month
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="gap-2"
                    >
                        <History className="h-4 w-4" />
                        {showHistory ? "Hide History" : "History"}
                    </Button>
                </div>
            </div>

            {/* History Panel */}
            {showHistory && (
                <Card className="mb-8 animate-in slide-in-from-top-2 duration-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Summary History</CardTitle>
                        <CardDescription>Your last {summaryHistory.length} saved summaries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {summaryHistory.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No summaries yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {summaryHistory.map(s => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => { setSummaryData(s); setShowHistory(false) }}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xl">{s.emoji || "📄"}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{s.title || s.fileName}</p>
                                                <p className="text-xs text-muted-foreground">{s.keyPoints?.length || 0} key points</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground shrink-0 ml-2">
                                            {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-8 md:grid-cols-2">
                {/* LEFT: Upload */}
                <div className="space-y-4">
                    <div
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all
                            ${canSummarize ? "hover:bg-muted/50 cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
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
                            <h3 className="font-semibold text-lg">
                                {!canSummarize ? "Monthly limit reached" :
                                    selectedFile ? selectedFile.name : "Upload Document"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {!canSummarize
                                    ? `Upgrade to get more summaries`
                                    : selectedFile
                                    ? "Click 'Summarize' to start"
                                    : "PDF, DOCX, or TXT · Max 10MB"}
                            </p>
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {loading && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">Uploading... {uploadProgress}%</p>
                        </div>
                    )}

                    {!canSummarize ? (
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => setShowUpgradeModal(true)}
                        >
                            <Lock className="mr-2 h-4 w-4" /> Upgrade to Summarize More
                        </Button>
                    ) : (
                        <Button
                            onClick={handleProcess}
                            className="w-full"
                            size="lg"
                            disabled={!selectedFile || loading}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                            ) : "Summarize Now ✨"}
                        </Button>
                    )}
                </div>

                {/* RIGHT: Summary Display */}
                <div className="space-y-4">
                    {summaryData ? (
                        <Card className="border-l-4 border-l-primary shadow-lg animate-in fade-in slide-in-from-bottom-4">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <span>{summaryData.emoji}</span> {summaryData.title}
                                </CardTitle>
                                <Button size="icon" variant="ghost" onClick={handleCopy} className="shrink-0">
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Summary */}
                                <div className="bg-muted/30 p-4 rounded-lg">
                                    <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                                        <BookOpen className="h-4 w-4" /> Overview
                                    </h4>
                                    <p className="text-sm leading-relaxed">{summaryData.summary}</p>
                                </div>

                                {/* Key Points */}
                                {summaryData.keyPoints?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-blue-600">
                                            <List className="h-4 w-4" /> Key Takeaways
                                        </h4>
                                        <ul className="space-y-2">
                                            {summaryData.keyPoints.map((point: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Action Items */}
                                {summaryData.actionItems?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-orange-600">
                                            <Zap className="h-4 w-4" /> Action Plan
                                        </h4>
                                        <ul className="list-disc list-inside text-sm space-y-1 pl-1 marker:text-orange-400">
                                            {summaryData.actionItems.map((item: string, i: number) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border rounded-xl bg-muted/20 text-muted-foreground p-10 text-center min-h-[300px]">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">Upload a file to see the AI summary here</p>
                            <p className="text-xs mt-2">Or click "History" to view past summaries</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}