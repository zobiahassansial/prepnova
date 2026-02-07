"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Plus, Brain, Loader2, Play, CheckCircle2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Flashcard, Deck } from "@/lib/flashcard-logic"

export default function FlashcardsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [existingFiles, setExistingFiles] = useState<any[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  
  const [isCreating, setIsCreating] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      if (!user) return
      try {
        const filesRef = collection(db, "users", user.uid, "summaries") 
        const filesSnap = await getDocs(filesRef)
        const files = filesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setExistingFiles(files)

        const decksRef = collection(db, "users", user.uid, "flashcard_decks")
        const decksSnap = await getDocs(decksRef)
        const userDecks = decksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deck[]
        setDecks(userDecks)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  // Helper Function to Calculate Progress

  const calculateProgress = (cards: Flashcard[]) => {
    if (!cards || cards.length === 0) return 0;
    
    // Logic: Card tab master hota hai jab interval > 1 ho (yani ek baar pass ho chuka ho)
    // Ya agar 'mastered' status ho.
    const masteredCount = cards.filter(c => c.interval > 1 || c.status === 'mastered').length;
    
    return Math.round((masteredCount / cards.length) * 100);
  }
  // Delete Logic
  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this deck?")) return
    try {
        await deleteDoc(doc(db, "users", user!.uid, "flashcard_decks", deckId))
        setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId))
        toast.success("Deck deleted")
    } catch (error) {
        toast.error("Failed to delete")
    }
  }

  // Generation Logic
  const generateAndSaveDeck = async (title: string, file: File | null, sourceId: string | null = null) => {
    setProcessing(true)
    try {
        let aiCards: Flashcard[] = [];

        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/generate", { method: "POST", body: formData });
            if (!response.ok) throw new Error("API Failed");
            
            const data = await response.json();
            if (!data.flashcards) throw new Error("No cards returned");

            aiCards = data.flashcards.map((card: any, index: number) => ({
                id: Date.now().toString() + index,
                front: card.front,
                back: card.back,
                interval: 0,
                repetition: 0,
                easeFactor: 2.5,
                nextReviewDate: new Date(),
                status: 'learning'
            }));
        } 

        const newDeck = {
            title: title,
            sourceFileId: sourceId || "uploaded-file",
            cards: aiCards,
            createdAt: Timestamp.now(),
            lastStudied: null
        }
        
        const docRef = await addDoc(collection(db, "users", user!.uid, "flashcard_decks"), newDeck)
        setDecks([...decks, { ...newDeck, id: docRef.id } as Deck])
        setIsCreating(false)
        toast.success(`Success! Generated ${aiCards.length} cards.`)

    } catch (error: any) {
        console.error(error)
        toast.error("Failed to generate cards")
    } finally {
        setProcessing(false)
    }
  }

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) processFile(file)
  }
  const processFile = (file: File) => {
    if (file.type !== "application/pdf") { toast.error("PDF only"); return }
    generateAndSaveDeck(file.name.replace(".pdf", ""), file) 
  }
  const handleGenerateFromLibrary = () => {
    const fileDoc = existingFiles.find(f => f.id === selectedFileId)
    if (fileDoc) generateAndSaveDeck(fileDoc.fileName || "New Deck", null, selectedFileId)
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

  if (isCreating) {
    return (
      <div className="container max-w-4xl py-12">
        <Button variant="ghost" onClick={() => setIsCreating(false)} className="mb-6 pl-0 hover:pl-2 transition-all">← Back to Decks</Button>
        <h1 className="text-3xl font-bold mb-2">Create New Flashcards</h1>
        <p className="text-muted-foreground mb-8">Choose a source to generate 15+ cards.</p>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload">Upload New PDF</TabsTrigger>
            <TabsTrigger value="library">From My Library</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
              <div className="bg-muted p-4 rounded-full">
                {processing ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
              </div>
              <div>
                 <h3 className="font-semibold text-lg">{processing ? "Analyzing PDF..." : "Drop PDF here"}</h3>
                 <p className="text-sm text-muted-foreground">{processing ? "Creating 15+ cards..." : "Max 10MB"}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library">
            {/* Library Logic same as before */}
             <div className="text-center py-10"><p>Select from existing notes (Coming Soon)</p></div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="container py-12 max-w-6xl">
      <div className="flex justify-between items-center mb-10">
        <div><h1 className="text-3xl font-bold">My Flashcards</h1><p className="text-muted-foreground">Master your subjects.</p></div>
        <Button onClick={() => setIsCreating(true)}><Plus className="mr-2 h-4 w-4" /> Create Deck</Button>
      </div>

      {decks.length === 0 ? (
         <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
             <h2 className="text-xl font-bold">No decks yet</h2>
             <Button onClick={() => setIsCreating(true)} className="mt-4">Create First Deck</Button>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => {
            const progress = calculateProgress(deck.cards);
            return (
                <Card key={deck.id} className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push(`/dashboard/flashcards/${deck.id}`)}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="line-clamp-1">{deck.title}</CardTitle>
                            <div className="text-xs text-muted-foreground mt-1">{deck.cards.length} Cards</div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600" onClick={(e) => handleDeleteDeck(deck.id, e)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between text-xs mb-2">
                        <span>Mastery</span>
                        <span className="font-bold">{progress}%</span>
                    </div>
                    {/* DYNAMIC PROGRESS BAR */}
                    <div className="w-full bg-muted h-2 rounded-full mb-4 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <Button className="w-full" variant="secondary">Study Now <Play className="ml-2 h-4 w-4" /></Button>
                </CardContent>
                </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}