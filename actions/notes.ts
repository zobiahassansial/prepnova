"use server"

import { auth } from "@/auth"
import { getGroqModel, GROQ_MODEL } from "@/lib/groq"
import { checkLimit, incrementUsage, decrementUsage, getUserPlan } from "@/lib/limits"
import { PLAN_LIMITS } from "@/lib/plan-config"

const PDFParser = require("pdf2json")
const mammoth = require("mammoth")

export async function processAndSummarizeNote(
    fileUrl: string,
    fileType: string,
    options?: { outputType?: string; specialInstructions?: string; tone?: string; length?: string }
) {
    if (!fileUrl) return { success: false, error: "No file URL provided" }

    // ── Auth + quota check ────────────────────────────────────────────────────
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Authentication required." }
    const userId = session.user.id

    const quota = await checkLimit(userId, "summaries")
    if (!quota.allowed) return { success: false, error: quota.error, upgradeRequired: true }

    try {
        // ── 1. Download file ────────────────────────────────────────────────
        const fileResponse = await fetch(fileUrl)
        if (!fileResponse.ok) throw new Error(`Failed to download file (${fileResponse.status})`)

        const arrayBuffer = await fileResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // ── 2. Extract text ─────────────────────────────────────────────────
        let rawText = ""

        if (fileType.includes("pdf")) {
            rawText = await new Promise<string>((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1)
                pdfParser.on("pdfParser_dataError", (e: any) => reject(new Error(e.parserError)))
                pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()))
                pdfParser.parseBuffer(buffer)
            })
        } else if (
            fileType.includes("word") ||
            fileType.includes("docx") ||
            fileType.includes("officedocument")
        ) {
            const result = await mammoth.extractRawText({ buffer })
            rawText = result.value
        } else if (fileType.includes("text") || fileType.includes("plain")) {
            rawText = buffer.toString("utf-8")
        } else {
            return { success: false, error: "Unsupported file type. Use PDF, DOCX, or TXT." }
        }

        // ── 3. Clean text — preserve paragraphs ────────────────────────────
        const text = rawText
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")                    // max 2 consecutive blank lines
            .replace(/[ \t]+/g, " ")                        // collapse horizontal whitespace only
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip only true control chars; keep UTF-8 (accents, Greek, math symbols)
            .trim()

        if (!text || text.length < 50) {
            return {
                success: false,
                error: "Could not extract readable text. This may be a scanned/image PDF. Please use a text-based file."
            }
        }

        // ── 4. Word limit enforcement ───────────────────────────────────────
        const plan = await getUserPlan(userId)
        const maxWords = PLAN_LIMITS[plan].summaryMaxWords
        const wordCount = text.split(/\s+/).length
        if (wordCount > maxWords) {
            return {
                success: false,
                error: `Your ${plan} plan supports up to ${maxWords.toLocaleString()} words per summary. This document has ~${wordCount.toLocaleString()} words. Upgrade for a higher limit.`,
                upgradeRequired: true,
            }
        }

        // ── 5. Build prompt from options ─────────────────────────────────────
        const { outputType = "Bullet points", specialInstructions = "" } = options || {}

        // Output-type-specific instructions + expected JSON shape
        const outputConfigs: Record<string, { instruction: string; shape: object }> = {
            "Bullet points": {
                instruction: "Summarize the document as clear, concise bullet points covering all the main ideas.",
                shape: {
                    title: "[Document topic] — Summary",
                    summary: "2–3 sentence overview of the entire document.",
                    keyPoints: ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
                    actionItems: ["Action item 1", "Action item 2"]
                }
            },
            "Detailed notes": {
                instruction: "Create comprehensive, detailed notes that cover every important concept, section, and detail from the document.",
                shape: {
                    title: "[Topic] — Detailed Notes",
                    summary: "Complete overview of all topics covered.",
                    keyPoints: [
                        "Section 1: [detailed explanation]",
                        "Subsection: [explanation]",
                        "Key fact: [detail]",
                        "Section 2: [detailed explanation]",
                        "Key fact: [detail]"
                    ],
                    actionItems: ["Review section headings", "Create a mind map", "Identify gaps in understanding"]
                }
            },
            "Short notes": {
                instruction: "Create a concise bullet-point quick reference. Maximum 8 key points, each under 15 words.",
                shape: {
                    title: "Quick Notes: [topic]",
                    summary: "Ultra-brief overview in 1 sentence.",
                    keyPoints: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6"],
                    actionItems: ["Review before exam", "Expand unclear points"]
                }
            },
            "Exam prep": {
                instruction: "Create a structured exam preparation guide with likely exam questions and key concepts.",
                shape: {
                    title: "Exam Prep: [topic]",
                    summary: "Key topics and what to focus on for the exam.",
                    keyPoints: [
                        "Topic 1: [key concept]",
                        "Topic 2: [key concept]",
                        "Topic 3: [key concept]",
                        "Likely exam question: [question] — Model answer: [answer]",
                        "Likely exam question: [question] — Model answer: [answer]",
                        "Formula/Definition to memorize: [item]"
                    ],
                    actionItems: ["Make flashcards for key terms", "Practice past papers", "Review weak areas first"]
                }
            },
            "Quiz": {
                instruction: `Generate exactly 10 multiple-choice quiz questions (MCQs) strictly based on the document content.
Each question must have EXACTLY 4 options labelled A, B, C, D.
Only ONE option is correct.
Include a one-sentence explanation for the correct answer.
Questions must cover a broad range of topics from the document, not just the introduction.`,
                shape: {
                    title: "Quiz: [topic from document]",
                    summary: "10 multiple-choice questions covering the key concepts from this document.",
                    keyPoints: [],
                    actionItems: ["Review incorrect answers", "Retake the quiz to test retention"],
                    questions: [
                        {
                            q: "Question text here?",
                            options: ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
                            answer: "A",
                            explanation: "One sentence explaining why A is correct."
                        },
                        {
                            q: "Another question?",
                            options: ["A. Option", "B. Option", "C. Option", "D. Option"],
                            answer: "C",
                            explanation: "One sentence explaining why C is correct."
                        }
                    ]
                }
            },
            "Assignment guide": {
                instruction: "Create a structured assignment-writing guide from the content.",
                shape: {
                    title: "Assignment Guide: [topic]",
                    summary: "How to approach and complete this assignment successfully.",
                    keyPoints: [
                        "Key concept to address: [concept]",
                        "Suggested intro: [what to include]",
                        "Main body points: [points]",
                        "Suggested conclusion: [what to include]",
                        "Common mistake to avoid: [mistake]"
                    ],
                    actionItems: ["Outline your assignment before writing", "Cite all sources", "Proofread for clarity"]
                }
            },
            "Paragraph": {
                instruction: "Write a flowing, well-structured paragraph summary that captures the full meaning of the document.",
                shape: {
                    title: "[Topic] — Summary",
                    summary: "[Write a full flowing paragraph summary here]",
                    keyPoints: ["Main argument: [point]", "Supporting evidence: [point]", "Conclusion: [point]"],
                    actionItems: ["Identify the main thesis", "Note supporting arguments"]
                }
            }
        }

        const config = outputConfigs[outputType] || outputConfigs["Bullet points"]

        const prompt = `You are an expert academic assistant. ${config.instruction}
${specialInstructions?.trim() ? `\nADDITIONAL INSTRUCTIONS FROM USER: ${specialInstructions.trim()}\n` : ""}
You MUST return a single valid JSON object matching this exact structure. Fill every field with real content from the document — do not leave placeholders:
${JSON.stringify(config.shape, null, 2)}

DOCUMENT TEXT (${text.length.toLocaleString()} chars):
${text.slice(0, 28000)}`

        // ── 6. Deduct credit then call Groq ──────────────────────────────────
        await incrementUsage(userId, "summaries")

        const model = getGroqModel()
        let result: any
        try {
            result = await model.chat.completions.create({
                model: GROQ_MODEL,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.3,
            })
        } catch (aiError) {
            await decrementUsage(userId, "summaries")
            throw aiError
        }

        const content = result.choices[0]?.message?.content || "{}"

        let parsedData: any
        try {
            parsedData = JSON.parse(content)
        } catch {
            await decrementUsage(userId, "summaries")
            console.error("JSON parse failed:", content.slice(0, 300))
            return { success: false, error: "AI returned an invalid response. Please try again." }
        }

        // Validate required fields
        if (!parsedData.title || !parsedData.summary) {
            await decrementUsage(userId, "summaries")
            return { success: false, error: "AI summary was incomplete. Please try again." }
        }

        // Ensure arrays
        parsedData.keyPoints   = Array.isArray(parsedData.keyPoints)   ? parsedData.keyPoints   : []
        parsedData.actionItems = Array.isArray(parsedData.actionItems) ? parsedData.actionItems : []
        parsedData.questions   = Array.isArray(parsedData.questions)   ? parsedData.questions   : []

        return { success: true, data: parsedData, extractedText: text.slice(0, 5000) }

    } catch (error: any) {
        console.error("Note processing error:", error)
        return { success: false, error: error.message || "Failed to process document" }
    }
}
