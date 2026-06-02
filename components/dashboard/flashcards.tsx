"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Plus, Play, RotateCw, Brain, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, db } from "@/lib/firebase" // Firebase imports
import { onAuthStateChanged } from "firebase/auth"
import { addDoc, collection, onSnapshot, query, where, Timestamp, doc, getDoc } from "firebase/firestore"
import { extractTextFromPDF } from "@/actions/pdf-loader"
import { checkClientQuota, incrementClientUsage } from "@/lib/usage-client"
import { generateFlashcardsFromText } from "@/actions/ai-flashcards"
import { Upload, BrainCircuit } from "lucide-react"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"
import { logActivity } from "@/lib/logger"

// Types
type Flashcard = {
    front: string
    back: string
}

type Deck = {
    id: string
    title: string
    count: number
    mastery: number
    cards: Flashcard[]
}

export function FlashcardsApp() {
    const [decks, setDecks] = useState<Deck[]>([])
    const [activeDeck, setActiveDeck] = useState<Deck | null>(null)
    const [studyMode, setStudyMode] = useState(false)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [newDeckOpen, setNewDeckOpen] = useState(false)
    const [newDeckTitle, setNewDeckTitle] = useState("")
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [decksLoading, setDecksLoading] = useState(true)
    const [showUpgrade, setShowUpgrade] = useState(false)

    // AI Creation State
    const [aiOpen, setAiOpen] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiFile, setAiFile] = useState<File | null>(null)
    const [aiTitle, setAiTitle] = useState("")

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | null = null

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            // Clean up previous snapshot listener if user changes
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot()
                unsubscribeSnapshot = null
            }

            if (currentUser) {
                setUser(currentUser)
                setDecksLoading(true)

                const q = query(collection(db, "decks"), where("userId", "==", currentUser.uid))

                unsubscribeSnapshot = onSnapshot(
                    q,
                    (snapshot) => {
                        const fetchedDecks = snapshot.docs.map(d => ({
                            id: d.id,
                            ...d.data()
                        })) as Deck[]
                        setDecks(fetchedDecks)
                        setDecksLoading(false)
                    },
                    (error) => {
                        console.error('Firestore error loading decks:', error)
                        setDecks([])
                        setDecksLoading(false)
                    }
                )
            } else {
                setUser(null)
                setDecks([])
                setDecksLoading(false)
            }
        })

        return () => {
            unsubscribeAuth()
            if (unsubscribeSnapshot) unsubscribeSnapshot()
        }
    }, [])

    const handleGenerateAI = useCallback(async () => {
        if (!user || !aiFile || !aiTitle) return
        setLoading(true)

        // Check Limit
        const allowed = await checkClientQuota(user.uid, "flashcards").then(r => r.allowed)
        if (!allowed) {
            setLoading(false)
            setShowUpgrade(true)
            return
        }

        try {
            // 2. Extract Text
            const formData = new FormData()
            formData.append("file", aiFile)
            const { text, error: pdfError } = await extractTextFromPDF(formData)

            if (pdfError || !text) throw new Error(pdfError || "Failed to extract text")

            // 3. Generate Flashcards
            const { flashcards, error: aiError } = await generateFlashcardsFromText(text)
            if (aiError || !flashcards) throw new Error(aiError)

            // 4. Save Deck
            await addDoc(collection(db, "decks"), {
                userId: user.uid,
                title: aiTitle,
                cards: flashcards,
                mastery: 0,
                count: flashcards.length,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            })
            await logActivity(user.uid, "deck_created", `Created AI deck: ${aiTitle}`, { count: flashcards.length, type: "AI" })

            await incrementClientUsage(user.uid, "flashcards")

            toast.success("Deck generated successfully!")
            setAiOpen(false)
            setAiFile(null)
            setAiTitle("")

        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Failed to generate deck")
        } finally {
            setAiLoading(false)
            setLoading(false)
        }
    }, [user, aiFile, aiTitle])


    const handleStartStudy = useCallback((deck: Deck) => {
        setActiveDeck(deck)
        setStudyMode(true)
        setCurrentCardIndex(0)
        setIsFlipped(false)
    }, [])

    const handleNextCard = useCallback(() => {
        if (activeDeck && currentCardIndex < activeDeck.cards.length - 1) {
            setCurrentCardIndex(prev => prev + 1)
            setIsFlipped(false)
        } else {
            toast.success("Deck completed!")
            setStudyMode(false)
        }
    }, [activeDeck, currentCardIndex])

    const handleCreateDeck = useCallback(async () => {
        if (!newDeckTitle || !user) return
        setLoading(true)

        // Check Limit
        const allowed = await checkClientQuota(user.uid, "flashcards").then(r => r.allowed)
        if (!allowed) {
            setLoading(false)
            setShowUpgrade(true)
            return
        }

        // Mock cards for now to demonstrate creation
        const mockCards = [
            { front: "What is " + newDeckTitle + "?", back: "It is a topic you are studying." },
            { front: "Why is it important?", back: "To master your exams." }
        ]

        try {
            await addDoc(collection(db, "decks"), {
                userId: user.uid,
                title: newDeckTitle,
                cards: mockCards,
                mastery: 0,
                count: mockCards.length,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            })
            await logActivity(user.uid, "deck_created", `Created deck: ${newDeckTitle}`, { count: mockCards.length })

            toast.success("Deck created!")
            setNewDeckOpen(false)
            setNewDeckTitle("")
            // No manual update needed, onSnapshot will handle it!
        } catch (error) {
            console.error(error)
            toast.error("Failed to create deck")
        } finally {
            setLoading(false)
        }
    }, [newDeckTitle, user])

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
            {showUpgrade && (
                <UpgradeModal 
                    feature="Flashcards" 
                    onClose={() => setShowUpgrade(false)} 
                />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Flashcards & Revision</h1>
                {!studyMode && (
                    <div className="flex gap-2">
                        <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><BrainCircuit className="mr-2 h-4 w-4" /> AI Generate</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Generate from PDF</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Deck Title</Label>
                                        <Input value={aiTitle} onChange={e => setAiTitle(e.target.value)} placeholder="e.g. Chapter 1 Notes" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Upload PDF Notes</Label>
                                        <Input type="file" accept=".pdf" onChange={e => setAiFile(e.target.files?.[0] || null)} />
                                    </div>
                                    <Button onClick={handleGenerateAI} disabled={aiLoading || !aiFile || !aiTitle}>
                                        {aiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Deck
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={newDeckOpen} onOpenChange={setNewDeckOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Create Deck</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Deck</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Deck Title</Label>
                                        <Input value={newDeckTitle} onChange={e => setNewDeckTitle(e.target.value)} placeholder="e.g. Biology Exam 1" />
                                    </div>
                                    <div className="flex gap-2 justify-end mt-4">
                                        <Button variant="outline" onClick={() => setNewDeckOpen(false)} disabled={loading}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleCreateDeck} disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create Manual Deck
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {decksLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading your decks...</p>
                </div>
            ) : studyMode && activeDeck ? (
                <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full">
                    <div className="mb-4 flex items-center justify-between w-full">
                        <Button variant="ghost" onClick={() => setStudyMode(false)}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Decks
                        </Button>
                        <div className="text-sm font-medium">
                            Card {currentCardIndex + 1} / {activeDeck.cards.length}
                        </div>
                    </div>

                    <div
                        className="w-full h-80 perspective-1000 cursor-pointer"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}
                            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

                            {/* Front */}
                            <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-8 text-center bg-background border-2">
                                <div>
                                    <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">Question</div>
                                    <div className="text-2xl font-bold">{activeDeck.cards[currentCardIndex]?.front}</div>
                                </div>
                            </Card>

                            {/* Back */}
                            <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-8 text-center bg-primary text-primary-foreground"
                                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                                <div>
                                    <div className="text-sm text-primary-foreground/80 uppercase tracking-widest mb-4">Answer</div>
                                    <div className="text-xl">{activeDeck.cards[currentCardIndex]?.back}</div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-8 w-full">
                        <Button variant="outline" size="lg" className="w-32" onClick={() => setIsFlipped(!isFlipped)}>
                            <RotateCw className="mr-2 h-4 w-4" /> Flip
                        </Button>
                        <Button size="lg" className="w-32" onClick={handleNextCard}>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => (
                        <Card key={deck.id} className="hover:border-primary/50 transition-all flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle>{deck.title}</CardTitle>
                                    <Brain className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <CardDescription>{deck.count || 0} cards</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Mastery</span>
                                        <span className="font-medium">{deck.mastery || 0}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${deck.mastery || 0}%` }}></div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleStartStudy(deck)}>
                                    <Play className="mr-2 h-4 w-4" /> Study Now
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    <Card
                        className="border-dashed flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setNewDeckOpen(true)}
                    >
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold">Create New Deck</h3>
                        <p className="text-sm text-muted-foreground text-center px-6 mt-1">
                            Use AI to generate cards from your notes.
                        </p>
                    </Card>
                </div>
            )}
        </div>
    )
}
