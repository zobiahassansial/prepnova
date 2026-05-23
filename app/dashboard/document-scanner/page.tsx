"use client"

import { useState, useRef, useCallback } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, Upload, FileType, Loader2, Copy, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

type ScanState = "idle" | "uploading" | "processing" | "done" | "error"

export default function DocumentScannerPage() {
    const { user } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [extractedText, setExtractedText] = useState<string>("")
    const [scanState, setScanState] = useState<ScanState>("idle")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [errorMsg, setErrorMsg] = useState<string>("")
    const [copied, setCopied] = useState(false)

    const resetState = () => {
        setImageSrc(null)
        setExtractedText("")
        setScanState("idle")
        setUploadProgress(0)
        setErrorMsg("")
    }

    const handleFileSelect = useCallback((file: File) => {
        // Validate type
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setErrorMsg(`Unsupported format: "${file.name}". Please use JPG, PNG, WEBP, or PDF.`)
            setScanState("error")
            return
        }
        // Validate size
        if (file.size > MAX_SIZE) {
            setErrorMsg(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 10 MB.`)
            setScanState("error")
            return
        }

        setErrorMsg("")
        // Preview
        if (file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = (e) => setImageSrc(e.target?.result as string)
            reader.readAsDataURL(file)
        } else {
            setImageSrc(null)
        }

        processFile(file)
    }, [])

    const processFile = async (file: File) => {
        if (!user) return
        setScanState("uploading")
        setUploadProgress(0)
        setExtractedText("")

        try {
            // 1. Upload to Firebase Storage
            const storageRef = ref(storage, `users/${user.uid}/uploads/${Date.now()}_${file.name}`)
            const uploadTask = uploadBytesResumable(storageRef, file)

            const downloadURL = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
                    reject,
                    async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
                )
            })

            // 2. Call OCR/AI API
            setScanState("processing")
            const response = await fetch("/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl: downloadURL, fileType: file.type }),
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.error || `API error: ${response.status}`)
            }

            const data = await response.json()
            const text = data.extractedText || data.text || ""

            if (!text.trim()) {
                throw new Error("No text could be extracted from this document. Try a clearer image.")
            }

            setExtractedText(text)
            setScanState("done")

            // Log activity
            await addDoc(collection(db, "users", user.uid, "activityLog"), {
                type: "doc_scanned",
                description: `Scanned document: "${file.name}"`,
                icon: "🔍",
                timestamp: Timestamp.now(),
            })

            toast.success("Text extracted successfully!")
        } catch (err: any) {
            const msg = err.message || "Scan failed"
            setErrorMsg(msg)
            setScanState("error")
            toast.error(msg)
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileSelect(file)
        // Reset input to allow re-selecting same file
        e.target.value = ""
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(extractedText)
        setCopied(true)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) handleFileSelect(file)
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Document Scanner</h1>
                <p className="text-muted-foreground mt-1">Upload images or PDFs to extract text with AI-powered OCR.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Upload Area */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Document</CardTitle>
                            <CardDescription>JPG, PNG, WEBP, or PDF · Max 10MB</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Drop Zone */}
                            <div
                                className={`
                                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4
                                    transition-all cursor-pointer min-h-[200px]
                                    ${scanState === "uploading" || scanState === "processing" ? "opacity-60 pointer-events-none" : "hover:bg-muted/50"}
                                `}
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={handleFileInputChange}
                                />

                                {scanState === "idle" || scanState === "error" ? (
                                    <>
                                        <div className="bg-primary/10 p-4 rounded-full">
                                            <Upload className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Click to upload or drag & drop</p>
                                            <p className="text-sm text-muted-foreground">Images or PDF</p>
                                        </div>
                                    </>
                                ) : scanState === "uploading" ? (
                                    <>
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <div>
                                            <p className="font-semibold">Uploading...</p>
                                            <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                                        </div>
                                    </>
                                ) : scanState === "processing" ? (
                                    <>
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <div>
                                            <p className="font-semibold">Extracting text with AI...</p>
                                            <p className="text-sm text-muted-foreground">This may take a moment</p>
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            {/* Upload Progress Bar */}
                            {scanState === "uploading" && (
                                <div className="mt-3 space-y-1">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {scanState === "error" && errorMsg && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-700 dark:text-red-400">Scan Failed</p>
                                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">{errorMsg}</p>
                                    </div>
                                </div>
                            )}

                            {/* Image Preview */}
                            {imageSrc && (
                                <div className="mt-4 relative">
                                    <img src={imageSrc} alt="Document preview" className="rounded-lg w-full object-contain max-h-48" />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={resetState}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-16 flex flex-col gap-1"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={scanState === "uploading" || scanState === "processing"}
                        >
                            <Upload className="h-5 w-5" />
                            <span className="text-xs">Upload New File</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-16 flex flex-col gap-1 opacity-60 cursor-not-allowed"
                            disabled
                            title="Coming soon"
                        >
                            <FileType className="h-5 w-5" />
                            <span className="text-xs">Merge PDFs</span>
                        </Button>
                    </div>
                </div>

                {/* RIGHT: Extracted Text */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Extracted Text</CardTitle>
                            <CardDescription>AI-powered OCR output</CardDescription>
                        </div>
                        {scanState === "done" && (
                            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                {copied ? "Copied!" : "Copy All"}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1">
                        {scanState === "done" && extractedText ? (
                            <div className="space-y-3">
                                <textarea
                                    value={extractedText}
                                    onChange={(e) => setExtractedText(e.target.value)}
                                    className="w-full min-h-[350px] rounded-lg border bg-muted/30 p-4 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Extracted text will appear here..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    {extractedText.trim().split(/\s+/).length} words extracted · You can edit the text above
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground text-center">
                                {scanState === "processing" ? (
                                    <>
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                                        <p className="font-medium">Extracting text...</p>
                                        <p className="text-xs mt-1">AI is reading your document</p>
                                    </>
                                ) : (
                                    <>
                                        <FileType className="h-12 w-12 opacity-20 mb-3" />
                                        <p className="font-medium">No document scanned yet</p>
                                        <p className="text-xs mt-1">Upload an image or PDF to extract text</p>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
