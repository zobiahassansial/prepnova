"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Mic, StopCircle, Loader2, Play } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { generateInterviewResponse } from "@/actions/ai-interview"

interface Message {
    role: "assistant" | "user"
    content: string
}

export default function MockInterviewPage({ params }: { params: { id: string } }) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your AI interviewer today. I'll be conducting a behavioral interview. To start, could you tell me a little about yourself?" }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || !user) return

        const userMsg = { role: "user" as const, content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            const response = await generateInterviewResponse([...messages, userMsg])

            if (response.error) throw new Error(response.error)

            setMessages(prev => [...prev, { role: "assistant", content: response.reply! }])

        } catch (e: any) {
            toast.error(e.message || "Failed to get response")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full gap-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        Mock Interviewer
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted max-w-[80%] rounded-lg p-3 flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </CardContent>
                <CardFooter className="border-t p-4">
                    <div className="flex w-full gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type your answer..."
                            onKeyDown={e => e.key === "Enter" && handleSend()}
                            disabled={loading}
                        />
                        <Button onClick={handleSend} disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
