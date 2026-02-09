"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db, storage } from "@/lib/firebase" // Ensure storage is exported from firebase config
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { processAndSummarizeNote } from "@/actions/notes" // Link to File 1

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Loader2, CheckCircle2, List, Zap, BookOpen } from "lucide-react"
import { toast } from "sonner"

export default function NoteSummarizerPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<any>(null)
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleProcess = async () => {
    if (!selectedFile || !user) return;
    setLoading(true);

    try {
        // 1. Upload File to Firebase Storage
        const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${selectedFile.name}`);
        const uploadTask = await uploadBytes(storageRef, selectedFile);
        const downloadURL = await getDownloadURL(uploadTask.ref);

        // 2. Call Server Action (AI Analysis)
        toast.info("AI is analyzing your document...");
        const result = await processAndSummarizeNote(downloadURL, selectedFile.type);

        if (result.success) {
            const aiData = result.data;
            setSummaryData(aiData);

            // 3. Save to Firebase (Link for Flashcards) 🔗
            await addDoc(collection(db, "users", user.uid, "summaries"), {
                fileName: selectedFile.name,
                fileUrl: downloadURL,
                fileType: selectedFile.type,
                title: aiData.title,
                emoji: aiData.emoji,
                summary: aiData.summary,
                keyPoints: aiData.keyPoints,
                actionItems: aiData.actionItems, // Saving extra data
                createdAt: serverTimestamp(),
                extractedText: result.extractedText 
            });

            toast.success("Summary generated & saved to Library!");
        } else {
            toast.error(result.error || "Failed to summarize");
        }

    } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">AI Note Summarizer</h1>
        <p className="text-muted-foreground">Upload notes, get structured summaries, and auto-sync to Flashcards.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* LEFT: Upload Section */}
        <div className="space-y-4">
            <div 
                className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 cursor-pointer transition-all"
                onClick={() => fileInputRef.current?.click()}
            >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileSelect} />
                
                <div className="bg-primary/10 p-4 rounded-full text-primary">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
                </div>
                <div>
                    <h3 className="font-semibold text-lg">
                        {selectedFile ? selectedFile.name : "Upload Document"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {selectedFile ? "Click 'Summarize' to start" : "PDF, DOCX, or TXT (Max 10MB)"}
                    </p>
                </div>
            </div>
            
            <Button 
                onClick={handleProcess} 
                className="w-full" 
                size="lg" 
                disabled={!selectedFile || loading}
            >
                {loading ? "Analyzing..." : "Summarize Now ✨"}
            </Button>
        </div>

        {/* RIGHT: Summary Display */}
        <div className="space-y-4">
            {summaryData ? (
                <Card className="border-l-4 border-l-primary shadow-lg animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <span>{summaryData.emoji}</span> {summaryData.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* Summary Block */}
                        <div className="bg-muted/30 p-4 rounded-lg">
                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                                <BookOpen className="h-4 w-4" /> Overview
                            </h4>
                            <p className="text-sm leading-relaxed">{summaryData.summary}</p>
                        </div>

                        {/* Key Points */}
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3 text-blue-600">
                                <List className="h-4 w-4" /> Key Takeaways
                            </h4>
                            <ul className="space-y-2">
                                {summaryData.keyPoints?.map((point: string, i: number) => (
                                    <li key={i} className="flex gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Items */}
                        {summaryData.actionItems && (
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
                <div className="h-full flex flex-col items-center justify-center border rounded-xl bg-muted/20 text-muted-foreground p-10 text-center">
                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                    <p>Upload a file to see the AI magic here.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}