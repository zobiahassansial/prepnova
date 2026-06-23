"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { UploadCloud, FileText, Brain, Loader2, Copy } from "lucide-react"
import { toast } from "sonner"
import { useReactToPrint } from "react-to-print"
import { auth, db, storage } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, query, where, addDoc, Timestamp } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { logActivity } from "@/lib/logger"
import { checkClientQuota, incrementClientUsage } from "@/lib/usage-client"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, File as FileIcon, Printer } from "lucide-react"

type NoteSummary = {
    id: string
    title: string
    summary: string
    createdAt: any
}

export function NoteSummarizer() {
    const [summaries, setSummaries] = useState<NoteSummary[]>([])
    const [selectedSummary, setSelectedSummary] = useState<NoteSummary | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [user, setUser] = useState<any>(null)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const printRef = useRef<HTMLDivElement>(null)

    // Options
    const [outputType, setOutputType] = useState("Bullet points")
    const [tone, setTone] = useState("Academic")
    const [length, setLength] = useState("Medium")

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                const q = query(collection(db, "notes"), where("userId", "==", currentUser.uid))
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const fetched = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as any[]
                    // Sort by createdAt desc
                    fetched.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                    setSummaries(fetched)
                })
                return () => unsubscribe()
            } else {
                setSummaries([])
            }
        })
        return () => unsubscribeAuth()
    }, [])

    // Optimization: Handle initial selection in a separate effect or useMemo
    useEffect(() => {
        if (summaries.length > 0 && !selectedSummary) {
            setSelectedSummary(summaries[0])
        }
    }, [summaries, selectedSummary])

    const handleExportText = () => {
        if (!selectedSummary) return
        const blob = new Blob([selectedSummary.summary], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedSummary.title}-summary.txt`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Downloaded as Text")
    }

    const handleExportWord = () => {
        if (!selectedSummary) return
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${selectedSummary.title}</title></head><body><pre>${selectedSummary.summary}</pre></body></html>`
        const blob = new Blob([html], { type: 'application/vnd.ms-word;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedSummary.title}-summary.doc`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Downloaded as Word")
    }

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedSummary?.title || "AI Summary",
    })

    const handleUpload = useCallback(async (file: File) => {
        if (!user) {
            toast.error("You must be logged in.")
            return
        }

        // 1. Quota Check
        const allowed = await checkClientQuota(user.uid, "summaries").then(r => r.allowed)
        if (!allowed) {
            setShowUpgrade(true)
            return
        }

        // Size validation (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size exceeds 10MB limit.")
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        // upload to firebase storage
        const storageRef = ref(storage, `users/${user.uid}/notes/${Date.now()}_${file.name}`)
        const uploadTask = uploadBytesResumable(storageRef, file)

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                setUploadProgress(progress)
            },
            (error) => {
                toast.error("Upload failed: " + error.message)
                setIsUploading(false)
            },
            async () => {
                // Complete
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

                // Call Server Action to Process & Summarize
                const { processAndSummarizeNote } = await import("@/actions/notes")

                const result = await processAndSummarizeNote(downloadURL, file.type, {
                    outputType, tone, length
                })

                if (!result.success) {
                    toast.error(result.error || "Failed to process note")
                    setIsUploading(false)
                    return
                }

                let aiSummary = "No summary generated."
                if (result.data) {
                    aiSummary = `${result.data.title || 'Summary'}\n\n` +
                                `Overview:\n${result.data.summary}\n\n` +
                                `Key Points:\n${(result.data.keyPoints || []).map((p: string) => '- ' + p).join('\n')}\n\n` +
                                `Action Items:\n${(result.data.actionItems || []).map((p: string) => '- ' + p).join('\n')}`
                } else if (result.extractedText) {
                    aiSummary = result.extractedText
                }

                // Save to Firestore
                await addDoc(collection(db, "notes"), {
                    userId: user.uid,
                    title: file.name,
                    summary: aiSummary,
                    fileUrl: downloadURL,
                    createdAt: Timestamp.now()
                })

                await logActivity(user.uid, "summary_generated", `Summarized note: "${file.name}"`)

                await incrementClientUsage(user.uid, "summaries")

                setIsUploading(false)
                toast.success("Summary generated successfully!")
            }
        )
    }, [user, outputType, tone, length])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0])
        }
    }, [handleUpload])

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
            {showUpgrade && (
                <UpgradeModal 
                    feature="AI Summary" 
                    onClose={() => setShowUpgrade(false)} 
                />
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">AI Note Summarizer</h1>
                <div className="text-sm text-muted-foreground">{summaries.length} summaries saved</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Upload & List Section */}
                <div className="flex flex-col gap-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Upload Notes</CardTitle>
                            <CardDescription>Upload PDF, DOCX, or Images. AI will summarize them instantly.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Output Type</label>
                                    <Select value={outputType} onValueChange={setOutputType}>
                                        <SelectTrigger className="text-xs h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bullet points">Bullet Points</SelectItem>
                                            <SelectItem value="Paragraph">Paragraph</SelectItem>
                                            <SelectItem value="Q&A">Q&amp;A</SelectItem>
                                            <SelectItem value="Flashcards layout">Flashcards</SelectItem>
                                            <SelectItem value="Quiz">Quiz (10 Qs)</SelectItem>
                                            <SelectItem value="Assignment guide">Assignment Guide</SelectItem>
                                            <SelectItem value="Exam prep">Exam Prep</SelectItem>
                                            <SelectItem value="Detailed notes">Detailed Notes</SelectItem>
                                            <SelectItem value="Short notes">Short Notes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Tone</label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger className="text-xs h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Academic">Academic</SelectItem>
                                            <SelectItem value="Casual">Casual</SelectItem>
                                            <SelectItem value="Professional">Professional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Length</label>
                                    <Select value={length} onValueChange={setLength}>
                                        <SelectTrigger className="text-xs h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Short">Short</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Long">Long</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                            />
                            <div
                                className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={triggerFileInput}
                            >
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <UploadCloud className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Click to Upload</p>
                                    <p className="text-sm text-muted-foreground">or drag and drop files here</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-4">Max file size: 10MB</p>
                            </div>

                            {isUploading && (
                                <div className="mt-6 space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm font-medium">Uploading & Analyzing... {Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Summaries List */}
                    {summaries.length > 0 && (
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Recent Summaries</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {summaries.map((s, i) => (
                                        <div
                                            key={s.id}
                                            className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${selectedSummary?.id === s.id ? "bg-muted border-primary" : "hover:bg-muted/50"}`}
                                            onClick={() => setSelectedSummary(s)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium text-sm truncate max-w-[200px]">{s.title}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {selectedSummary ? (
                        <Card className="h-full flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle>AI Summary</CardTitle>
                                    <CardDescription>{selectedSummary.title}</CardDescription>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        navigator.clipboard.writeText(selectedSummary.summary)
                                        toast.success("Copied to clipboard!")
                                    }} title="Copy Text">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleExportText} title="Export as Text">
                                        <FileIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleExportWord} title="Export as Word">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handlePrint} title="Export as PDF / Print">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto mt-4" ref={printRef}>
                                <div className="prose dark:prose-invert text-sm max-w-none p-4 bg-background">
                                    <pre className="whitespace-pre-wrap font-sans">{selectedSummary.summary}</pre>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <Button className="w-full gap-2">
                                    <Brain className="h-4 w-4" /> Generate Flashcards from Summary
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground border rounded-lg p-8 bg-muted/10">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p>Select a summary or upload a document.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
