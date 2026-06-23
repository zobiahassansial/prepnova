"use server"

import { auth } from "@/auth"
import { getGroqModel, GROQ_MODEL } from "@/lib/groq"
import { checkLimit, incrementUsage, decrementUsage, getUserPlan } from "@/lib/limits"
import { PLAN_LIMITS } from "@/lib/plan-config"

// pdf2json and mammoth ship CommonJS only — dynamic import() returns a module
// wrapper that doesn't match their runtime API, so require() is necessary here.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json") as { new(a: null, b: number): {
    on(event: string, cb: (d?: unknown) => void): void
    parseBuffer(b: Buffer): void
    getRawTextContent(): string
} }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require("mammoth") as {
    extractRawText(opts: { buffer: Buffer }): Promise<{ value: string }>
}

type SummaryData = {
    title: string
    summary: string
    emoji: string
    keyPoints: string[]
    actionItems: string[]
    questions: string[]
}
type SummaryResult =
    | { success: true; data: SummaryData; extractedText: string }
    | { success: false; error: string; upgradeRequired?: boolean }

export async function processAndSummarizeNote(
    fileUrl: string,
    fileType: string,
    options?: { outputType?: string; specialInstructions?: string; tone?: string; length?: string }
): Promise<SummaryResult> {
    if (!fileUrl) return { success: false, error: "No file URL provided" }

    // ── Auth + quota check ────────────────────────────────────────────────────
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Authentication required." }
    const userId = session.user.id

    const quota = await checkLimit(userId, "summaries")
    if (!quota.allowed) return { success: false, error: quota.error ?? "Quota exceeded.", upgradeRequired: true }

    try {
        // ── 1. Download file ────────────────────────────────────────────────
        const fileResponse = await fetch(fileUrl)
        if (!fileResponse.ok) throw new Error(`Failed to download file (${fileResponse.status})`)

        const MAX_BYTES = 10 * 1024 * 1024
        const contentLength = Number(fileResponse.headers.get("content-length") ?? 0)
        if (contentLength > MAX_BYTES) {
            return { success: false, error: "File exceeds the 10 MB maximum size limit." }
        }

        const arrayBuffer = await fileResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (buffer.byteLength > MAX_BYTES) {
            return { success: false, error: "File exceeds the 10 MB maximum size limit." }
        }

        // ── 2. Extract text ─────────────────────────────────────────────────
        let rawText = ""

        if (fileType.includes("pdf")) {
            rawText = await new Promise<string>((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1)
                pdfParser.on("pdfParser_dataError", (e: unknown) => {
                    const msg = e && typeof e === "object" && "parserError" in e
                        ? String((e as { parserError: unknown }).parserError)
                        : "PDF parse error"
                    reject(new Error(msg))
                })
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

        const outputConfigs: Record<string, { instruction: string; shape: object }> = {
            "Bullet points": {
                instruction: `Analyze the ENTIRE document thoroughly and produce a rich, comprehensive set of bullet points.
Requirements:
- Generate 10-15 bullet points covering ALL major topics, concepts, arguments, and key facts — spread across the full document, not just the beginning
- Each bullet point must be substantive and specific (1-2 full sentences), not vague or generic
- Group related ideas logically — avoid repetition
- The summary must be 3-4 sentences capturing the document's main argument, purpose, and conclusion
- Action items must be specific and actionable based on the document content`,
                shape: {
                    title: "[Specific topic from document] — Key Points",
                    summary: "3-4 sentence overview of the document's main purpose, core argument, and key conclusion.",
                    keyPoints: [
                        "Full, specific key point 1 with detail and context",
                        "Full, specific key point 2 with detail and context",
                        "Full, specific key point 3",
                        "Full, specific key point 4",
                        "Full, specific key point 5",
                        "Full, specific key point 6",
                        "Full, specific key point 7",
                        "Full, specific key point 8",
                        "Full, specific key point 9",
                        "Full, specific key point 10"
                    ],
                    actionItems: [
                        "Specific action item 1 based on the document",
                        "Specific action item 2",
                        "Specific action item 3",
                        "Specific action item 4"
                    ]
                }
            },
            "Detailed notes": {
                instruction: `Create thorough, in-depth academic notes that comprehensively cover the ENTIRE document.
Requirements:
- Go section by section through the full document
- Generate 15-20 detailed key points — each must be 2-3 sentences explaining the concept fully, not just naming it
- Include definitions, explanations, examples, and relationships between ideas
- Notes should be comprehensive enough that a student could use them instead of reading the original document
- The summary must be a complete academic overview (4-5 sentences) covering purpose, methodology, findings, and conclusion
- Action items must include specific study strategies tied to this document's content`,
                shape: {
                    title: "[Topic] — Detailed Notes",
                    summary: "4-5 sentence comprehensive academic overview covering purpose, key arguments, methodology or structure, main findings, and conclusion.",
                    keyPoints: [
                        "Section/Concept 1: [full explanation with definition and context — 2-3 sentences]",
                        "Section/Concept 2: [full explanation]",
                        "Key term/Definition: [term] — [full explanation]",
                        "Section/Concept 3: [full explanation]",
                        "Important fact/argument: [full explanation with supporting detail]",
                        "Section/Concept 4: [full explanation]",
                        "Key relationship: [how X relates to Y — full explanation]",
                        "Section/Concept 5: [full explanation]",
                        "Critical point: [full explanation]",
                        "Section/Concept 6: [full explanation]",
                        "Example/Case study: [full explanation]",
                        "Section/Concept 7: [full explanation]",
                        "Conclusion/Summary of findings: [full explanation]"
                    ],
                    actionItems: [
                        "Specific study action 1 based on this document",
                        "Specific study action 2",
                        "Specific study action 3",
                        "Specific study action 4",
                        "Specific study action 5"
                    ]
                }
            },
            "Short notes": {
                instruction: `Create a high-quality ultra-compact quick reference covering the most critical points from the document.
Requirements:
- Exactly 8-10 bullet points — choose only the most essential, high-value information
- Each point must be punchy and under 20 words but still meaningful (not vague)
- Prioritize definitions, core arguments, key facts, and memorable conclusions
- Summary must be exactly 1 concise sentence
- Action items must be 2-3 specific revision tips`,
                shape: {
                    title: "Quick Notes: [topic]",
                    summary: "One precise sentence capturing the core purpose and main finding of the document.",
                    keyPoints: [
                        "Essential point 1 — concise but specific",
                        "Essential point 2 — concise but specific",
                        "Essential point 3 — concise but specific",
                        "Essential point 4 — concise but specific",
                        "Essential point 5 — concise but specific",
                        "Essential point 6 — concise but specific",
                        "Essential point 7 — concise but specific",
                        "Essential point 8 — concise but specific"
                    ],
                    actionItems: [
                        "Targeted revision action 1",
                        "Targeted revision action 2",
                        "Targeted revision action 3"
                    ]
                }
            },
            "Exam prep": {
                instruction: `Create a comprehensive exam preparation guide strictly based on the document.
Requirements:
- Write 12-16 key points covering: core concepts/definitions to memorize, likely exam question areas with model answers, important theories or frameworks, common traps/mistakes, and formulae or dates if applicable
- Format like this: start points with a TYPE tag — "CONCEPT:", "LIKELY QUESTION:", "DEFINITION:", "REMEMBER:", "COMMON MISTAKE:"
- For LIKELY QUESTION entries, include a concise model answer after a → arrow
- Summary must tell the student exactly what to focus on for the exam (3-4 sentences)
- Action items must be a specific exam study plan (5 items)`,
                shape: {
                    title: "Exam Prep: [specific topic]",
                    summary: "3-4 sentences on what this exam will likely test, which sections are most important, and what level of understanding is needed.",
                    keyPoints: [
                        "DEFINITION: [key term] — [clear, memorizable definition]",
                        "CONCEPT: [core concept] — [full explanation of what it is and why it matters]",
                        "CONCEPT: [another core concept] — [full explanation]",
                        "LIKELY QUESTION: [exam-style question]? → Model Answer: [concise, mark-worthy answer]",
                        "LIKELY QUESTION: [another exam question]? → Model Answer: [answer]",
                        "LIKELY QUESTION: [another exam question]? → Model Answer: [answer]",
                        "DEFINITION: [another key term] — [definition]",
                        "REMEMBER: [important fact, date, formula, or statistic to memorize]",
                        "CONCEPT: [concept] — [explanation]",
                        "LIKELY QUESTION: [exam question]? → Model Answer: [answer]",
                        "COMMON MISTAKE: Students often confuse [X] with [Y] — the difference is [explanation]",
                        "REMEMBER: [another key fact to memorize]"
                    ],
                    actionItems: [
                        "Day 1: Focus on memorizing all definitions and key terms",
                        "Day 2: Practice answering the likely exam questions without notes",
                        "Day 3: Review the CONCEPT sections and create your own examples",
                        "Day 4: Do a full timed practice test covering all topics",
                        "Day 5: Review COMMON MISTAKES and weak areas only"
                    ]
                }
            },
            "Quiz": {
                instruction: `Generate exactly 10 high-quality multiple-choice quiz questions strictly based on the document content.
Requirements:
- Each question must have EXACTLY 4 options labelled A, B, C, D
- Only ONE option is correct — the others must be plausible but clearly wrong distractors
- Include a detailed 1-2 sentence explanation for the correct answer
- Questions must span the ENTIRE document — cover different sections and difficulty levels (mix easy recall, understanding, and application questions)
- Do NOT ask about document formatting, page numbers, or trivial details
- The summary must describe what topics the quiz covers`,
                shape: {
                    title: "Quiz: [topic from document]",
                    summary: "10 questions testing recall, understanding, and application of the key concepts from this document.",
                    keyPoints: [],
                    actionItems: ["Review explanations for any questions you got wrong", "Retake the quiz after 24 hours to test retention", "Focus revision on topics where you struggled"],
                    questions: [
                        {
                            q: "Question 1 text here?",
                            options: ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
                            answer: "A",
                            explanation: "Detailed explanation of why A is correct and why the others are wrong."
                        },
                        {
                            q: "Question 2 text here?",
                            options: ["A. Option", "B. Option", "C. Option", "D. Option"],
                            answer: "C",
                            explanation: "Detailed explanation of why C is correct."
                        }
                    ]
                }
            },
            "Assignment guide": {
                instruction: `Create a detailed, practical assignment-writing guide based on this document's content.
Requirements:
- Generate 12-15 key points covering: thesis statement suggestion, introduction structure, 4-6 main body argument points with supporting evidence from the document, counterarguments to address, conclusion strategy, and citation/referencing tips
- Format points with TYPE tags: "THESIS:", "INTRO:", "ARGUMENT:", "EVIDENCE:", "COUNTERARGUMENT:", "CONCLUSION:", "CITATION:", "AVOID:"
- Summary must be a strategic overview of how to write a strong assignment on this topic (3-4 sentences)
- Action items must be a step-by-step writing plan`,
                shape: {
                    title: "Assignment Guide: [specific topic]",
                    summary: "3-4 sentences on the assignment's key requirements, the strongest approach to take, and what markers will be looking for.",
                    keyPoints: [
                        "THESIS: Suggested thesis statement — [specific, arguable claim based on the document]",
                        "INTRO: Opening hook — [specific suggestion for engaging the reader]",
                        "INTRO: Background context to establish — [what background to cover and why]",
                        "ARGUMENT: Main body point 1 — [specific argument with supporting evidence from the document]",
                        "EVIDENCE: Key evidence/quote to support point 1 — [specific evidence from document]",
                        "ARGUMENT: Main body point 2 — [specific argument]",
                        "EVIDENCE: Supporting evidence for point 2 — [specific evidence]",
                        "ARGUMENT: Main body point 3 — [specific argument]",
                        "COUNTERARGUMENT: Address the opposing view that [X] — refute it by explaining [Y]",
                        "CONCLUSION: Restate thesis in light of evidence — [how to close strongly]",
                        "CITATION: Key sources or concepts from this document to cite — [specific items]",
                        "AVOID: Common mistake — [specific error students make on this topic and how to avoid it]"
                    ],
                    actionItems: [
                        "Step 1: Write your thesis statement and get it approved/refined before drafting",
                        "Step 2: Create a detailed outline using the ARGUMENT points above",
                        "Step 3: Draft the introduction — hook, context, and thesis",
                        "Step 4: Write each body paragraph using point-evidence-explanation structure",
                        "Step 5: Write the conclusion, then proofread for argument coherence and citations"
                    ]
                }
            },
            "Paragraph": {
                instruction: `Write a rich, flowing, well-structured multi-paragraph summary of the document.
Requirements:
- Write 3-4 coherent paragraphs in the "summary" field: (1) introduction to the topic and document's purpose, (2) main arguments or content covered, (3) key findings or conclusions, (4) significance or implications (if applicable)
- Each paragraph must be 4-6 sentences — detailed and substantive, not a thin overview
- Key points should capture the 3-4 most important arguments or ideas from the document as complete sentences
- This should read like a high-quality academic abstract or executive summary
- Action items must be specific analytical follow-up tasks`,
                shape: {
                    title: "[Topic] — Written Summary",
                    summary: "[Paragraph 1: Introduction and purpose of the document — 4-6 sentences.]\n\n[Paragraph 2: Main arguments, content, or methodology covered — 4-6 sentences.]\n\n[Paragraph 3: Key findings, conclusions, or outcomes — 4-6 sentences.]",
                    keyPoints: [
                        "Core argument or thesis: [full sentence stating the main claim]",
                        "Key finding or conclusion: [full sentence with specific detail]",
                        "Important implication or significance: [full sentence]",
                        "Notable limitation or counterpoint: [full sentence]"
                    ],
                    actionItems: [
                        "Identify the document's primary thesis and evaluate whether the evidence supports it",
                        "Compare the key arguments against other sources on this topic",
                        "Note any gaps in the argument or areas needing further research"
                    ]
                }
            }
        }

        const config = outputConfigs[outputType] || outputConfigs["Bullet points"]

        const prompt = `You are an expert academic assistant and note-taking specialist. Your task is to produce high-quality, detailed, and genuinely useful output — NOT a brief or generic summary.

OUTPUT TYPE: ${outputType}
${specialInstructions?.trim() ? `\nSPECIAL INSTRUCTIONS FROM USER (follow these precisely): ${specialInstructions.trim()}\n` : ""}

TASK: ${config.instruction}

CRITICAL RULES:
- Fill EVERY field with real, specific content from the document — no placeholders, no generic filler
- Do NOT truncate or cut short — generate the full number of key points specified
- Base ALL content strictly on what is in the document below
- Return a single valid JSON object matching the exact structure below

REQUIRED JSON STRUCTURE:
${JSON.stringify(config.shape, null, 2)}

DOCUMENT TEXT (${text.length.toLocaleString()} chars):
${text.slice(0, 30000)}`

        // ── 6. Deduct credit then call Groq ──────────────────────────────────
        await incrementUsage(userId, "summaries")

        const model = getGroqModel()
        let result: Awaited<ReturnType<typeof model.chat.completions.create>>
        try {
            result = await model.chat.completions.create({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert academic assistant. Always return valid JSON only. Generate rich, detailed, complete content — never cut short. Never use placeholder text."
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.5,
                max_tokens: 4000,
            })
        } catch (aiError) {
            await decrementUsage(userId, "summaries")
            throw aiError
        }

        const content = result.choices[0]?.message?.content || "{}"

        type RawParsed = { title?: string; summary?: string; emoji?: string; keyPoints?: unknown[]; actionItems?: unknown[]; questions?: unknown[] }
        let parsedData: RawParsed
        try {
            parsedData = JSON.parse(content) as RawParsed
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

        // After the guard above, title and summary are guaranteed strings.
        const validatedData: SummaryData = {
            title:       parsedData.title,
            summary:     parsedData.summary,
            emoji:       parsedData.emoji ?? "",
            keyPoints:   Array.isArray(parsedData.keyPoints)   ? parsedData.keyPoints.map(String)   : [],
            actionItems: Array.isArray(parsedData.actionItems) ? parsedData.actionItems.map(String) : [],
            questions:   Array.isArray(parsedData.questions)   ? parsedData.questions.map(String)   : [],
        }

        return { success: true, data: validatedData, extractedText: text.slice(0, 5000) }

    } catch (error: unknown) {
        console.error("Note processing error:", error)
        const message = error instanceof Error ? error.message : "Failed to process document"
        return { success: false, error: message }
    }
}
