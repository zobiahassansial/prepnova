"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { UploadCloud, FileText, Brain, Loader2, Copy } from "lucide-react"
import { toast } from "sonner"
import { auth, db, storage } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, query, where, addDoc, Timestamp } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { checkQuota, incrementQuota } from "@/lib/subscription"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"

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

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                const q = query(collection(db, "notes"), where("userId", "==", currentUser.uid))
                // ... (rest of useEffect logic remains implied/unchanged if not touched, but replace block needs context)
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const fetched = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as any[]
                    // Sort by createdAt desc
                    fetched.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                    setSummaries(fetched)
                    if (fetched.length > 0 && !selectedSummary) {
                        setSelectedSummary(fetched[0])
                    }
                })
                return () => unsubscribe()
            } else {
                setSummaries([])
            }
        })
        return () => unsubscribeAuth()
    }, [selectedSummary])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0])
        }
    }

    const handleUpload = async (file: File) => {
        if (!user) {
            toast.error("You must be logged in.")
            return
        }

        // 1. Quota Check
        const allowed = await checkQuota(user.uid, "summary")
        if (!allowed) {
            setShowUpgrade(true)
            return
        }

        // Size validation (10MB)

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
                // Dynamic import to avoid server code in client bundle if needed, usually Next.js handles this map.
                // But better to import at top. I will add import. 
                const { processAndSummarizeNote } = await import("@/actions/notes")

                const result = await processAndSummarizeNote(downloadURL, file.type)

                if (result.error) {
                    toast.error(result.error)
                    setIsUploading(false)
                    return
                }

                const aiSummary = result.summary || "No summary generated."

                // Save to Firestore
                await addDoc(collection(db, "notes"), {
                    userId: user.uid,
                    title: file.name,
                    summary: aiSummary,
                    fileUrl: downloadURL,
                    createdAt: Timestamp.now()
                })

                await incrementQuota(user.uid, "summary")

                setIsUploading(false)
                toast.success("Summary generated successfully!")
            }
        )
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
            <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} featureName="AI Summary" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">AI Note Summarizer</h1>
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
                                <Button variant="ghost" size="icon">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto mt-4">
                                <div className="prose dark:prose-invert text-sm max-w-none">
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
