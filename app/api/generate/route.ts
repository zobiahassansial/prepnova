import { NextRequest, NextResponse } from "next/server"
import { getGroqModel, GROQ_MODEL } from "@/lib/groq"
import { verifyIdToken } from "@/lib/firebase-admin"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkLimit, incrementUsage, decrementUsage } from "@/lib/limits"

const PDFParser = require("pdf2json")

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
    easy: `
DIFFICULTY: EASY — basic recall and definitions.
- Questions should test whether the student remembers key terms, names, dates, or simple facts.
- Example Q style: "What is [term]?", "Define [concept].", "Who/What/When is [X]?"
- Answers should be short and direct (1–2 sentences).`,
    medium: `
DIFFICULTY: MEDIUM — understanding and explanation.
- Questions should test whether the student understands how or why something works.
- Example Q style: "How does [X] work?", "What is the difference between [A] and [B]?", "Explain the role of [X] in [context]."
- Answers should cover the key idea with brief supporting detail (2–4 sentences).`,
    hard: `
DIFFICULTY: HARD — analysis, application, and critical thinking.
- Questions should require the student to compare, evaluate, apply, or reason about concepts.
- Example Q style: "Why does [X] lead to [Y]?", "Compare [A] and [B] in terms of [criterion].", "What would happen if [condition]? Explain."
- Answers should be thorough and precise, referencing specific content from the text.`,
}

export async function POST(req: NextRequest) {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const token = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    let userId: string
    try {
        const decoded = await verifyIdToken(token)
        userId = decoded.uid
    } catch {
        return NextResponse.json({ error: "Invalid or expired session. Please log in again." }, { status: 401 })
    }

    // ── 2. Rate limit ─────────────────────────────────────────────────────────
    const rate = checkRateLimit(userId)
    if (!rate.allowed) {
        return NextResponse.json(
            { error: `Too many requests. Please wait ${rate.retryAfter}s before trying again.` },
            { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
        )
    }

    // ── 3. Plan limit ─────────────────────────────────────────────────────────
    const quota = await checkLimit(userId, "flashcards")
    if (!quota.allowed) {
        return NextResponse.json({ error: quota.error, upgradeRequired: true }, { status: 403 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const difficulty = (formData.get("difficulty") as string) || "medium"

        if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 })

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const rawText = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1)
            pdfParser.on("pdfParser_dataError", (err: any) => reject(err.parserError))
            pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()))
            pdfParser.parseBuffer(buffer)
        })

        const text = rawText
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[^\x20-\x7E\n]/g, " ")
            .trim()

        if (text.length < 100) {
            return NextResponse.json(
                { error: "Could not extract readable text from this PDF. Make sure it is not a scanned image PDF." },
                { status: 400 }
            )
        }

        const targetCardCount = Math.max(5, Math.min(50, Math.ceil(text.length / 800)))
        const difficultyNote = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.medium

        // ── 4. Deduct credit before AI call ───────────────────────────────────
        await incrementUsage(userId, "flashcards")

        const model = getGroqModel()
        let result: any

        try {
            result = await model.chat.completions.create({
                model: GROQ_MODEL,
                messages: [{
                    role: "user",
                    content: `You are an expert educator creating flashcards STRICTLY from the provided document.

RULES — follow every rule exactly:
1. Every question and answer MUST be based only on information present in the document below. Do NOT invent, assume, or add outside knowledge.
2. Generate exactly ${targetCardCount} flashcards covering the full breadth of the document — spread them across all major topics, not just the beginning.
3. Each "front" must be a clear, self-contained question or prompt.
4. Each "back" must be an accurate, complete answer drawn directly from the document text.
5. Do not repeat the same concept twice.
6. Do not include questions about formatting, page numbers, headers, or metadata.
${difficultyNote}

OUTPUT FORMAT — return a JSON object with a single "flashcards" array:
{
  "flashcards": [
    { "front": "Question text here?", "back": "Answer text here." }
  ]
}

DOCUMENT TEXT:
${text.slice(0, 28000)}`
                }],
                response_format: { type: "json_object" },
            })
        } catch (aiError) {
            // Refund on AI failure
            await decrementUsage(userId, "flashcards")
            throw aiError
        }

        const parsed = JSON.parse(result.choices[0]?.message?.content || "{}")
        const flashcards = parsed.flashcards

        if (!Array.isArray(flashcards) || flashcards.length === 0) {
            await decrementUsage(userId, "flashcards")
            return NextResponse.json({ error: "AI returned no flashcards. Try again." }, { status: 500 })
        }

        const valid = flashcards.filter(
            (c: any) =>
                typeof c.front === "string" && c.front.trim() &&
                typeof c.back === "string" && c.back.trim()
        )

        return NextResponse.json({
            flashcards: valid,
            usage: { used: quota.used + 1, limit: quota.limit },
        })

    } catch (error: any) {
        console.error("Flashcard generation error:", error)
        return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
    }
}
