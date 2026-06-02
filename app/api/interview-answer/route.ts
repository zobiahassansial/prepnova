import { NextRequest } from "next/server"
import { groq } from "@/lib/groq"
import { verifyIdToken } from "@/lib/firebase-admin"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkLimit, incrementUsage, decrementUsage } from "@/lib/limits"

const FAST_MODEL = "llama-3.1-8b-instant"

export async function POST(req: NextRequest) {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
        return new Response(JSON.stringify({ error: "Authentication required." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        })
    }

    let userId: string
    try {
        const decoded = await verifyIdToken(token)
        userId = decoded.uid
    } catch {
        return new Response(JSON.stringify({ error: "Invalid or expired session." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        })
    }

    // ── 2. Rate limit ─────────────────────────────────────────────────────────
    const rate = checkRateLimit(userId)
    if (!rate.allowed) {
        return new Response(
            JSON.stringify({ error: `Too many requests. Wait ${rate.retryAfter}s.` }),
            { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rate.retryAfter) } }
        )
    }

    // ── 3. Plan check — interview access ─────────────────────────────────────
    const quota = await checkLimit(userId, "interviews")
    if (!quota.allowed) {
        return new Response(
            JSON.stringify({ error: quota.error, upgradeRequired: true }),
            { status: 403, headers: { "Content-Type": "application/json" } }
        )
    }

    try {
        const { transcript } = await req.json()
        if (!transcript?.trim()) {
            return new Response("No transcript provided.", { status: 400 })
        }

        // ── 4. Deduct before AI call ──────────────────────────────────────────
        await incrementUsage(userId, "interviews")

        let stream: any
        try {
            stream = await groq.chat.completions.create({
                model: FAST_MODEL,
                stream: true,
                max_tokens: 100,
                temperature: 0.3,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are helping a job candidate answer interview questions in real time. Give direct, spoken answers — no bullet points, no markdown, no filler phrases like 'Great question'. Sound natural and confident. Max 2-3 sentences.",
                    },
                    {
                        role: "user",
                        content: `Interviewer said: "${transcript.trim()}"\n\nGive the candidate's answer:`,
                    },
                ],
            })
        } catch (aiError) {
            await decrementUsage(userId, "interviews")
            throw aiError
        }

        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const token = chunk.choices[0]?.delta?.content
                        if (token) controller.enqueue(encoder.encode(token))
                    }
                } finally {
                    controller.close()
                }
            },
            cancel() {
                stream.controller.abort()
            },
        })

        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "X-Usage": JSON.stringify({ used: quota.used + 1, limit: quota.limit }),
            },
        })
    } catch (err: any) {
        console.error("Interview answer error:", err)
        return new Response(err.message || "Failed", { status: 500 })
    }
}
