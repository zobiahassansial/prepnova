import { NextRequest, NextResponse } from "next/server"
import { getGroqModel } from "@/lib/groq"
import { verifyIdToken } from "@/lib/firebase-admin"
import { checkRateLimit } from "@/lib/rate-limit"
import { checkLimit, incrementUsage, decrementUsage } from "@/lib/limits"

const PDFParser = require("pdf2json")

async function countPdfPages(buffer: Buffer): Promise<number> {
    return new Promise((resolve) => {
        const parser = new PDFParser(null, 1)
        parser.on("pdfParser_dataError", () => resolve(1))
        parser.on("pdfParser_dataReady", () => {
            try {
                const data = parser.getRawTextContent()
                // pdf2json puts a form-feed character between pages
                resolve(Math.max(1, data.split("\f").length))
            } catch {
                resolve(1)
            }
        })
        parser.parseBuffer(buffer)
    })
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

    // ── 3. Plan check — scanner access ────────────────────────────────────────
    // We check 1 page minimum upfront; will re-check actual page count below
    const accessCheck = await checkLimit(userId, "scanPages", 1)
    if (!accessCheck.allowed) {
        return NextResponse.json({ error: accessCheck.error, upgradeRequired: true }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { fileUrl, fileType } = body

        if (!fileUrl) {
            return NextResponse.json({ error: "No fileUrl provided." }, { status: 400 })
        }

        // SSRF guard: only allow Firebase Storage URLs for this project
        let parsedUrl: URL
        try {
            parsedUrl = new URL(fileUrl)
        } catch {
            return NextResponse.json({ error: "Invalid file URL." }, { status: 400 })
        }
        const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""
        const allowedHosts = [
            "firebasestorage.googleapis.com",
            "storage.googleapis.com",
            `${storageBucket}`,
        ]
        const isAllowed = allowedHosts.some(h => parsedUrl.hostname.endsWith(h))
        if (!isAllowed) {
            return NextResponse.json({ error: "File URL must point to Firebase Storage." }, { status: 400 })
        }

        const fileRes = await fetch(fileUrl)
        if (!fileRes.ok) {
            throw new Error(`Failed to fetch file: ${fileRes.statusText}`)
        }

        const arrayBuffer = await fileRes.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        let extractedText = ""
        let pages = 1

        if (fileType === "application/pdf") {
            pages = await countPdfPages(buffer)

            // Re-check with actual page count
            const pageCheck = await checkLimit(userId, "scanPages", pages)
            if (!pageCheck.allowed) {
                return NextResponse.json({ error: pageCheck.error, upgradeRequired: true }, { status: 403 })
            }

            extractedText = await new Promise<string>((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1)
                pdfParser.on("pdfParser_dataError", (err: any) => reject(new Error(err.parserError)))
                pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()))
                pdfParser.parseBuffer(buffer)
            })
        } else if (fileType.startsWith("image/")) {
            pages = 1

            const base64Image = buffer.toString("base64")
            const dataUrl = `data:${fileType};base64,${base64Image}`

            const groq = getGroqModel()
            const response = await groq.chat.completions.create({
                model: "llama-3.2-90b-vision-preview",
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Please extract all the text from this image exactly as it appears. If there is no text, reply with 'No text found'. Do not add any formatting or conversational filler. Just the extracted text."
                        },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }],
            })

            extractedText = response.choices[0]?.message?.content || ""
        } else {
            return NextResponse.json({ error: "Unsupported file type." }, { status: 400 })
        }

        // ── 4. Deduct pages ───────────────────────────────────────────────────
        await incrementUsage(userId, "scanPages", pages)

        return NextResponse.json({
            extractedText,
            pages,
            usage: { used: accessCheck.used + pages, limit: accessCheck.limit },
        })

    } catch (error: any) {
        console.error("Scan error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
