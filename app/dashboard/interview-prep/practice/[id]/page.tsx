"use client"

import { useState, useRef, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Loader2, StopCircle, RotateCcw } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { generateInterviewResponse, generateInterviewFeedback } from "@/actions/ai-interview"
import { logActivity } from "@/lib/logger"
import { motion } from "framer-motion"

interface Message {
    role: "assistant" | "user"
    content: string
}

const INTERVIEW_TYPES: Record<string, { label: string; color: string; description: string }> = {
    behavioral: { label: "Behavioral",   color: "blue",   description: "STAR method — teamwork, leadership, challenges" },
    technical:  { label: "Technical",    color: "purple", description: "System design, algorithms, problem-solving" },
    product:    { label: "Product",      color: "orange", description: "Product thinking, metrics, case studies" },
    general:    { label: "General",      color: "green",  description: "Motivation, strengths/weaknesses, career goals" },
}

const INITIAL_MSG = (type: string) => {
    const labels: Record<string, string> = {
        behavioral: "Hello! I'm your AI interviewer. I'll be conducting a behavioral interview using the STAR method today. To start — could you briefly introduce yourself and tell me about your background?",
        technical:  "Hello! I'm your AI technical interviewer. We'll be covering system design, problem-solving, and technical concepts. Let's start — could you walk me through your technical background?",
        product:    "Hello! I'm your AI product interviewer. We'll discuss product thinking, metrics, and case studies today. To start — tell me about a product you love and why.",
        general:    "Hello! I'm your AI interviewer. We'll cover your experience, motivations, and goals today. Let's start — tell me a bit about yourself and what brings you here.",
    }
    return labels[type] || labels.behavioral
}

export default function MockInterviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const interviewType = INTERVIEW_TYPES[id] ? id : "behavioral"
    const { user } = useRouter ? { user: null } : { user: null }
    const { user: authUser } = useAuth()
    const router = useRouter()

    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: INITIAL_MSG(interviewType) }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [ending, setEnding] = useState(false)
    const [feedback, setFeedback] = useState<any>(null)
    const [turnCount, setTurnCount] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)
    const sessionLoggedRef = useRef(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const typeInfo = INTERVIEW_TYPES[interviewType]

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        if (!sessionLoggedRef.current && authUser) {
            sessionLoggedRef.current = true
            logActivity(authUser.uid, "interview_practice", `Started ${typeInfo.label} interview practice`)
        }

        const userMsg: Message = { role: "user", content: input.trim() }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            const allMessages = [...messages, userMsg]
            const response = await generateInterviewResponse(allMessages, interviewType)
            if (response.error) throw new Error(response.error)

            const newTurn = turnCount + 1
            setTurnCount(newTurn)
            setMessages(prev => [...prev, { role: "assistant", content: response.reply! }])

            // Auto-end after 7 exchanges
            if (newTurn >= 7) {
                setTimeout(() => handleEndInterview([...allMessages, { role: "assistant", content: response.reply! }]), 1500)
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to get response")
        } finally {
            setLoading(false)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }

    const handleEndInterview = async (msgs?: Message[]) => {
        const conversation = msgs || messages
        if (conversation.filter(m => m.role === "user").length === 0) {
            toast.error("Answer at least one question before ending.")
            return
        }
        setEnding(true)
        try {
            const result = await generateInterviewFeedback(conversation, interviewType)
            if (result.error) throw new Error(result.error)
            setFeedback(result.feedback)
        } catch (e: any) {
            toast.error(e.message || "Failed to generate feedback")
        } finally {
            setEnding(false)
        }
    }

    const handleRestart = () => {
        setMessages([{ role: "assistant", content: INITIAL_MSG(interviewType) }])
        setInput("")
        setFeedback(null)
        setTurnCount(0)
        sessionLoggedRef.current = false
    }

    // ── Feedback Screen ──────────────────────────────────────────────────────
    if (feedback) {
        const scoreColor = (s: number) => s >= 8 ? "text-green-500" : s >= 6 ? "text-yellow-500" : "text-red-500"
        const barColor   = (s: number) => s >= 8 ? "bg-green-500" : s >= 6 ? "bg-yellow-500" : "bg-red-500"

        return (
            <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Interview Feedback</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRestart}>
                            <RotateCcw className="h-4 w-4 mr-2" /> Retry
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/interview-prep")}>
                            ← Back
                        </Button>
                    </div>
                </div>

                {/* Score card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl border bg-card flex items-center gap-6">
                    <div className="text-center">
                        <div className={`text-6xl font-black ${scoreColor(feedback.overallScore)}`}>
                            {feedback.overallScore}<span className="text-2xl text-muted-foreground">/10</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Overall Score</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm leading-relaxed text-muted-foreground">{feedback.summary}</p>
                    </div>
                </motion.div>

                {/* Sub-scores */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Communication", key: "communication" },
                        { label: "Relevance",     key: "relevance" },
                        { label: "Confidence",    key: "confidence" },
                    ].map(({ label, key }) => (
                        <div key={key} className="p-4 rounded-xl border bg-card">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">{label}</span>
                                <span className={`text-sm font-bold ${scoreColor(feedback[key])}`}>{feedback[key]}/10</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${feedback[key] * 10}%` }}
                                    transition={{ delay: 0.3 }}
                                    className={`h-full rounded-full ${barColor(feedback[key])}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-5 rounded-xl border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                        <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3">✓ Strengths</h3>
                        <ul className="space-y-2">
                            {feedback.strengths?.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-green-800 dark:text-green-300 flex gap-2">
                                    <span className="mt-0.5 shrink-0">•</span>{s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Improvements */}
                    <div className="p-5 rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                        <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-3">↑ Areas to Improve</h3>
                        <ul className="space-y-2">
                            {feedback.improvements?.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-amber-800 dark:text-amber-300 flex gap-2">
                                    <span className="mt-0.5 shrink-0">•</span>{s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Pro tip */}
                {feedback.tip && (
                    <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 text-sm">
                        <span className="font-semibold text-primary">💡 Pro Tip: </span>
                        <span className="text-muted-foreground">{feedback.tip}</span>
                    </div>
                )}
            </div>
        )
    }

    // ── Chat Screen ──────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto w-full gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        {typeInfo.label} Interview
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {turnCount}/7 questions
                        </span>
                    </h1>
                    <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEndInterview()}
                    disabled={ending || turnCount === 0}
                    className="gap-2"
                >
                    {ending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                        : <><StopCircle className="h-4 w-4" /> End & Get Feedback</>}
                </Button>
            </div>

            {/* Chat */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className={msg.role === "user" ? "bg-primary text-primary-foreground text-xs" : "bg-muted text-xs"}>
                                    {msg.role === "user" ? "You" : "AI"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-muted rounded-tl-sm"
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-muted text-xs">AI</AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </CardContent>
                <CardFooter className="border-t p-3">
                    <div className="flex w-full gap-2">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type your answer..."
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                            disabled={loading || ending}
                            className="flex-1"
                        />
                        <Button onClick={handleSend} disabled={loading || ending || !input.trim()} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
