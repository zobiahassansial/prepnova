"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db } from "@/lib/firebase"
import {
    collection, onSnapshot, addDoc, deleteDoc, doc,
    Timestamp, query, orderBy, setDoc
} from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Plus, Brain, Loader2, Play, Trash2, Lock } from "lucide-react"
import { toast } from "sonner"
import { Flashcard, Deck } from "@/lib/flashcard-logic"
import { useUserPlan } from "@/hooks/useUserPlan"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"

export default function FlashcardsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const { plan, limits, usage, loading: planLoading } = useUserPlan()
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [existingFiles, setExistingFiles] = useState<any[]>([])
    const [decks, setDecks] = useState<Deck[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const canCreateMore = !planLoading && ((usage.flashcards ?? 0) < (limits.flashcards))
    const canUseAI = plan === "standard" || plan === "pro" || plan === "lifetime"

    // ── Live Decks (onSnapshot) ──────────────────────────────────────────────
    useEffect(() => {
        if (!user) return

        const unsubDecks = onSnapshot(
            query(collection(db, "users", user.uid, "flashcardDecks"), orderBy("createdAt", "desc")),
            (snap) => {
                const userDecks = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Deck[]
                setDecks(userDecks)
                setLoading(false)
            },
            (err) => {
                console.error("Decks error:", err)
                setLoading(false)
            }
        )

        // Existing summaries (for "From Library" tab)
        const unsubSummaries = onSnapshot(
            collection(db, "users", user.uid, "summaries"),
            (snap) => setExistingFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        )

        return () => {
            unsubDecks()
            unsubSummaries()
        }
    }, [user])

    const calculateProgress = (cards: Flashcard[]) => {
        if (!cards || cards.length === 0) return 0
        const mastered = cards.filter(c => c.interval > 1 || c.status === "mastered").length
        return Math.round((mastered / cards.length) * 100)
    }

    const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("Delete this deck? This cannot be undone.")) return
        try {
            await deleteDoc(doc(db, "users", user!.uid, "flashcardDecks", deckId))
            toast.success("Deck deleted")
        } catch {
            toast.error("Failed to delete deck")
        }
    }

    const handleCreateClick = () => {
        if (!canCreateMore) {
            setShowUpgradeModal(true)
            return
        }
        setIsCreating(true)
    }

    const generateAndSaveDeck = async (title: string, file: File | null, sourceId: string | null = null) => {
        if (!canCreateMore) { setShowUpgradeModal(true); return }
        if (file && !canUseAI) { setShowUpgradeModal(true); return }

        setProcessing(true)
        try {
            let aiCards: Flashcard[] = []

            if (file) {
                const formData = new FormData()
                formData.append("file", file)
                formData.append("difficulty", difficulty)

                const response = await fetch("/api/generate", { method: "POST", body: formData })
                const data = await response.json()
                if (!response.ok) throw new Error(data.error || "AI generation failed")
                if (!data.flashcards || data.flashcards.length === 0) throw new Error("No cards returned from AI")

                aiCards = data.flashcards.map((card: any, i: number) => ({
                    id: `${Date.now()}_${i}`,
                    front: card.front,
                    back: card.back,
                    interval: 0,
                    repetition: 0,
                    easeFactor: 2.5,
                    nextReviewDate: new Date(),
                    status: "learning",
                }))
            }

            const newDeck = {
                title,
                sourceFileId: sourceId || "manual",
                difficulty,
                cards: aiCards,
                createdAt: Timestamp.now(),
                lastStudied: null,
            }

            await addDoc(collection(db, "users", user!.uid, "flashcardDecks"), newDeck)
            await addDoc(collection(db, "users", user!.uid, "activityLog"), {
                type: "deck_created",
                description: `Created flashcard deck: "${title}"`,
                icon: "🃏",
                timestamp: Timestamp.now(),
            })

            setIsCreating(false)
            toast.success(`Deck created with ${aiCards.length} cards!`)
        } catch (err: any) {
            toast.error(err.message || "Failed to create deck")
        } finally {
            setProcessing(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!canUseAI) { setShowUpgradeModal(true); return }
        if (file.type !== "application/pdf") { toast.error("Only PDF files are supported"); return }
        generateAndSaveDeck(file.name.replace(".pdf", ""), file)
    }

    if (loading || planLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        )
    }

    // Create Deck View
    if (isCreating) {
        return (
            <div className="container max-w-4xl py-12">
                {showUpgradeModal && (
                    <UpgradeModal
                        feature="AI Flashcard Generation"
                        description="AI-powered flashcard generation from PDFs is available on Standard and above plans."
                        requiredPlan="standard"
                        onClose={() => setShowUpgradeModal(false)}
                    />
                )}
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="mb-6 pl-0">
                    ← Back to Decks
                </Button>
                <h1 className="text-3xl font-bold mb-2">Create New Flashcard Deck</h1>
                <p className="text-muted-foreground mb-8">
                    {canUseAI
                        ? "Upload a PDF to auto-generate 15+ cards with AI."
                        : "Upgrade to Standard or higher to use AI card generation."
                    }
                </p>

                {/* ── Difficulty Picker ── */}
                <div className="mb-8">
                    <p className="text-sm font-medium mb-3">Card Difficulty</p>
                    <div className="grid grid-cols-3 gap-3">
                        {(["easy", "medium", "hard"] as const).map((lvl) => {
                            const meta = {
                                easy:   { label: "Easy",   emoji: "🟢", desc: "Definitions & basic recall" },
                                medium: { label: "Medium", emoji: "🟡", desc: "Understanding & explanation" },
                                hard:   { label: "Hard",   emoji: "🔴", desc: "Analysis & critical thinking" },
                            }[lvl]
                            return (
                                <button
                                    key={lvl}
                                    onClick={() => setDifficulty(lvl)}
                                    className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                                        difficulty === lvl
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border hover:border-muted-foreground/40"
                                    }`}
                                >
                                    <span className="text-2xl">{meta.emoji}</span>
                                    <span className="font-semibold text-sm">{meta.label}</span>
                                    <span className="text-xs text-muted-foreground text-center leading-tight">{meta.desc}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="upload">
                            {canUseAI ? "Upload PDF (AI)" : <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> AI Generation</span>}
                        </TabsTrigger>
                        <TabsTrigger value="library">From My Library</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload">
                        {canUseAI ? (
                            <div
                                className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 cursor-pointer transition-all"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <div className="bg-muted p-4 rounded-full">
                                    {processing
                                        ? <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        : <Upload className="h-8 w-8 text-muted-foreground" />
                                    }
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {processing ? "Generating cards..." : "Drop PDF here or click to browse"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {processing ? "AI is analyzing your document..." : "Max 10MB · PDF only"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <UpgradeModal
                                    feature="AI Flashcard Generation"
                                    description="Upgrade to Standard or above to generate flashcards from PDFs automatically."
                                    requiredPlan="standard"
                                    inline
                                />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="library">
                        {existingFiles.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>No summaries in your library yet.</p>
                                <p className="text-xs mt-1">Generate summaries from the Note Summarizer module first.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {existingFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                                        onClick={() => generateAndSaveDeck(file.title || file.fileName, null, file.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-medium">{file.title || file.fileName}</p>
                                                <p className="text-xs text-muted-foreground">{file.keyPoints?.length || 0} key points</p>
                                            </div>
                                        </div>
                                        {processing
                                            ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            : <Brain className="h-4 w-4 text-muted-foreground" />
                                        }
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        )
    }

    return (
        <div className="container py-12 max-w-6xl">
            {showUpgradeModal && (
                <UpgradeModal
                    feature="More Flashcard Decks"
                    description={`Your ${plan} plan allows up to ${limits.flashcards} decks. Upgrade to create unlimited decks.`}
                    requiredPlan="standard"
                    onClose={() => setShowUpgradeModal(false)}
                />
            )}

            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold">My Flashcards</h1>
                    <p className="text-muted-foreground mt-1">
                        {decks.length} / {limits.flashcards >= 9999 ? "∞" : limits.flashcards} decks used
                    </p>
                </div>
                <Button onClick={handleCreateClick} disabled={!canCreateMore}>
                    {canCreateMore ? <Plus className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    Create Deck
                </Button>
            </div>

            {decks.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h2 className="text-xl font-bold">No flashcard decks yet</h2>
                    <p className="text-muted-foreground mt-2">Create your first deck to start studying smarter.</p>
                    <Button onClick={handleCreateClick} className="mt-6">
                        <Plus className="mr-2 h-4 w-4" /> Create First Deck
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => {
                        const progress = calculateProgress(deck.cards)
                        return (
                            <Card
                                key={deck.id}
                                className="group hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => router.push(`/dashboard/flashcards/${deck.id}`)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="line-clamp-1">{deck.title}</CardTitle>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {deck.cards?.length || 0} Cards
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:text-red-600 shrink-0"
                                            onClick={(e) => handleDeleteDeck(deck.id!, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span>Mastery</span>
                                        <span className="font-bold">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-muted h-2 rounded-full mb-4 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${progress === 100 ? "bg-green-500" : "bg-primary"}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <Button className="w-full" variant="secondary">
                                        Study Now <Play className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}