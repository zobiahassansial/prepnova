import { NextRequest } from "next/server"
import { groq } from "@/lib/groq"

// Fast model — optimised for lowest latency on Groq
const FAST_MODEL = "llama-3.1-8b-instant"

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()
    if (!transcript?.trim()) {
      return new Response("No transcript provided", { status: 400 })
    }

    const stream = await groq.chat.completions.create({
      model: FAST_MODEL,
      stream: true,
      max_tokens: 100,       // 2-3 sentences max — generates faster
      temperature: 0.3,      // Low temp = focused, consistent answers
      messages: [
        {
          role: "system",
          content: "You are helping a job candidate answer interview questions in real time. Give direct, spoken answers — no bullet points, no markdown, no filler phrases like 'Great question'. Sound natural and confident. Max 2-3 sentences."
        },
        {
          role: "user",
          content: `Interviewer said: "${transcript.trim()}"\n\nGive the candidate's answer:`
        }
      ]
    })

    // Pipe the Groq stream straight to the browser as plain text chunks
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
      }
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",   // prevent nginx from buffering chunks
      }
    })
  } catch (err: any) {
    console.error("Interview answer error:", err)
    return new Response(err.message || "Failed", { status: 500 })
  }
}
