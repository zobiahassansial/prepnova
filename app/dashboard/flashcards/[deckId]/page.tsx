"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit2, Trophy, HelpCircle, Lightbulb, Hand } from "lucide-react"
import { toast } from "sonner"
import { Flashcard, calculateNextReview } from "@/lib/flashcard-logic"
import ReactConfetti from 'react-confetti'
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"

// --- TEXT CLEANER FUNCTION ---
const cleanText = (text: string) => {
  if (!text) return "";
  // 1. Replace **Bold** with "Quotes"
  let cleaned = text.replace(/\*\*(.*?)\*\*/g, '"$1"');
  // 2. Remove single * used for bullets, replace with standard bullet or clean space
  cleaned = cleaned.replace(/^\s*\*\s*/gm, '• '); 
  return cleaned;
}

export default function StudySessionPage({ params }: { params: Promise<{ deckId: string }> }) {
  const resolvedParams = use(params)
  const deckId = resolvedParams.deckId
  const { user } = useAuth()
  const router = useRouter()
  
  const [deck, setDeck] = useState<any>(null)
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFront, setEditFront] = useState("")
  const [editBack, setEditBack] = useState("")

  useEffect(() => {
    async function fetchDeck() {
      if (!user) return
      const docSnap = await getDoc(doc(db, "users", user.uid, "flashcard_decks", deckId))
      if (docSnap.exists()) {
        const data = docSnap.data()
        setDeck(data)
        setStudyQueue(data.cards)
      }
    }
    fetchDeck()
  }, [user, deckId])

  const handleRate = async (rating: number) => {
    const currentCard = studyQueue[currentIndex]
    const updatedStats = calculateNextReview(currentCard, rating)
    const updatedCard = { ...currentCard, ...updatedStats }
    
    const newAllCards = deck.cards.map((c: Flashcard) => c.id === currentCard.id ? updatedCard : c)
    setDeck({ ...deck, cards: newAllCards }) 
    updateDoc(doc(db, "users", user!.uid, "flashcard_decks", deckId), { cards: newAllCards, lastStudied: Timestamp.now() })

    if (rating === 1) {
        setStudyQueue(prev => [...prev, updatedCard])
        toast("Requeued for review", { icon: "🔄" })
    }

    setIsFlipped(false)
    setTimeout(() => {
        if (rating === 1) {
             setCurrentIndex(prev => prev + 1)
        } else {
             if (currentIndex < studyQueue.length - 1) {
                 setCurrentIndex(prev => prev + 1)
             } else {
                 setIsFinished(true)
             }
        }
    }, 300)
  }

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation() 
    const card = studyQueue[currentIndex]
    setEditFront(card.front)
    setEditBack(card.back)
    setIsEditing(true)
  }

  const saveEdit = () => {
    const currentCard = studyQueue[currentIndex]
    const updatedCard = { ...currentCard, front: editFront, back: editBack }
    const newQueue = [...studyQueue]
    newQueue[currentIndex] = updatedCard
    setStudyQueue(newQueue)
    const newAllCards = deck.cards.map((c: Flashcard) => c.id === currentCard.id ? updatedCard : c)
    setDeck({ ...deck, cards: newAllCards })
    updateDoc(doc(db, "users", user!.uid, "flashcard_decks", deckId), { cards: newAllCards })
    setIsEditing(false)
    toast.success("Card updated")
  }

  if (!deck) return <div className="h-screen flex items-center justify-center text-slate-400 bg-[#020817]">Loading deck...</div>

  if (isFinished) {
    return (
      <div className="container max-w-2xl py-20 text-center h-screen flex flex-col justify-center items-center bg-[#020817] text-white">
        <ReactConfetti recycle={false} numberOfPieces={500} />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 mb-8 backdrop-blur-md">
            <div className="bg-green-500/20 p-6 rounded-full inline-flex mb-6 animate-bounce">
                <Trophy className="h-12 w-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
            <Button onClick={() => router.push("/dashboard/flashcards")} size="lg" className="mt-6 rounded-full bg-slate-800 hover:bg-slate-700">
              Back to Dashboard
            </Button>
        </motion.div>
      </div>
    )
  }

  const currentCard = studyQueue[currentIndex]
  const progress = ((currentIndex + 1) / studyQueue.length) * 100

  return (
    <div className="flex flex-col min-h-screen bg-[#020817] text-slate-100 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="h-16 flex items-center px-4 justify-between max-w-4xl mx-auto w-full z-10">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full px-2">
            <ArrowLeft className="h-5 w-5 mr-1" /> Exit
        </Button>
        <div className="flex flex-col items-end">
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-indigo-500 rounded-full" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1">
                {currentIndex + 1} / {studyQueue.length}
            </span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full z-0">
        
        {/* CARD CONTAINER - Fixed Height */}
        <div className="relative w-full max-w-xl h-[500px] perspective-1000">
            <motion.div
                className="w-full h-full relative preserve-3d cursor-grab active:cursor-grabbing"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onClick={() => !isEditing && setIsFlipped(!isFlipped)}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.05}
                whileTap={{ scale: 0.98 }}
            >
                {/* --- FRONT SIDE (QUESTION) --- */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden group">
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500/50 to-purple-500/50 shrink-0" />

                    <div className="flex-1 flex flex-col p-6 md:p-8 min-h-0"> {/* min-h-0 is crucial for flex child scrolling */}
                        {/* Top Bar */}
                        <div className="flex justify-between items-start mb-4 shrink-0">
                            <span className="text-xs font-bold tracking-widest text-slate-500 flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-blue-500" /> QUESTION
                            </span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-white hover:bg-white/5" onClick={openEdit}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content - SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col justify-center">
                            <h2 className="text-2xl md:text-3xl font-semibold leading-snug text-slate-100 text-center select-none whitespace-pre-wrap">
                                {cleanText(currentCard.front)}
                            </h2>
                        </div>

                        {/* Footer Hint */}
                        <div className="mt-4 pt-4 border-t border-slate-800/50 text-center shrink-0">
                            <span className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center justify-center gap-2 group-hover:text-slate-400 transition-colors">
                                <Hand className="h-3 w-3" /> Tap to Flip
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- BACK SIDE (ANSWER) --- */}
                <div 
                    className="absolute inset-0 backface-hidden bg-slate-900 rounded-[2rem] border border-indigo-500/30 shadow-[0_0_40px_-10px_rgba(99,102,241,0.15)] flex flex-col overflow-hidden"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="h-1.5 w-full bg-indigo-500 shrink-0" />

                    <div className="flex-1 flex flex-col p-6 md:p-8 min-h-0">
                        {/* Top Bar */}
                        <div className="flex justify-between items-start mb-4 shrink-0">
                            <span className="text-xs font-bold tracking-widest text-slate-500 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500" /> ANSWER
                            </span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-white hover:bg-white/5" onClick={openEdit}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content - SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col justify-center">
                            <h2 className="text-lg md:text-xl font-medium leading-relaxed text-indigo-50 text-center select-none whitespace-pre-wrap">
                                {cleanText(currentCard.back)}
                            </h2>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* --- CONTROLS --- */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 10, pointerEvents: isFlipped ? 'auto' : 'none' }}
            className="mt-8 grid grid-cols-4 gap-3 w-full max-w-lg"
        >
            <Button 
                onClick={() => handleRate(1)}
                className="h-14 rounded-xl bg-slate-900/50 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 text-red-400 hover:text-red-300 flex flex-col gap-0.5 transition-all"
            >
                <span className="font-bold">Again</span>
                <span className="text-[9px] uppercase opacity-60">Fail</span>
            </Button>

            <Button 
                onClick={() => handleRate(2)}
                className="h-14 rounded-xl bg-slate-900/50 border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/50 text-orange-400 hover:text-orange-300 flex flex-col gap-0.5 transition-all"
            >
                <span className="font-bold">Hard</span>
                <span className="text-[9px] uppercase opacity-60">2d</span>
            </Button>

            <Button 
                onClick={() => handleRate(3)}
                className="h-14 rounded-xl bg-slate-900/50 border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 flex flex-col gap-0.5 transition-all"
            >
                <span className="font-bold">Good</span>
                <span className="text-[9px] uppercase opacity-60">4d</span>
            </Button>

            <Button 
                onClick={() => handleRate(4)}
                className="h-14 rounded-xl bg-slate-900/50 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 flex flex-col gap-0.5 transition-all"
            >
                <span className="font-bold">Easy</span>
                <span className="text-[9px] uppercase opacity-60">7d</span>
            </Button>
        </motion.div>
      </main>

      {/* EDIT DIALOG */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-white">
            <DialogHeader><DialogTitle>Edit Content</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Question</label>
                    <Textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} className="resize-none h-24 bg-slate-900 border-slate-800 focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Answer</label>
                    <Textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} className="resize-none h-24 bg-slate-900 border-slate-800 focus:border-indigo-500" />
                </div>
                <Button onClick={saveEdit} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">Save Changes</Button>
            </div>
        </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  )
}