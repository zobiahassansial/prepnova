"use server"

import { getGroqModel, GROQ_MODEL } from "@/lib/groq"

// ✅ FIX: Use 'require' to bypass TypeScript errors
const PDFParser = require("pdf2json");
const mammoth = require("mammoth");

export async function processAndSummarizeNote(
    fileUrl: string, 
    fileType: string, 
    options?: { outputType?: string, tone?: string, length?: string }
) {
    if (!fileUrl) return { error: "No file URL provided" }

    try {
        // --- 1. Download File ---
        const fileResponse = await fetch(fileUrl)
        if (!fileResponse.ok) throw new Error("Failed to download file from storage")

        const arrayBuffer = await fileResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // --- 2. Extract Text ---
        let text = ""

        if (fileType.includes("pdf")) {
            text = await new Promise<string>((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1);

                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    console.error("❌ PDF Parse Error:", errData.parserError);
                    reject(errData.parserError);
                });

                pdfParser.on("pdfParser_dataReady", () => {
                    const raw = pdfParser.getRawTextContent();
                    resolve(raw);
                });

                pdfParser.parseBuffer(buffer);
            });

        } else if (fileType.includes("word") || fileType.includes("docx") || fileType.includes("officedocument")) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;

        } else if (fileType.includes("text") || fileType.includes("plain")) {
            text = buffer.toString("utf-8");
        } else {
            return { error: "Unsupported file type." }
        }

        text = text.replace(/\s+/g, " ").trim();

        if (!text || text.length < 50) {
            return { error: "Could not read text. Is this a scanned PDF? Please use text-based files." }
        }

        const model = getGroqModel()

        const { outputType = "Bullet points", tone = "Academic", length = "Medium" } = options || {}

        // Map tone to instruction
        const toneMap: Record<string, string> = {
            "Academic": "Use formal, academic language with precise terminology.",
            "Casual": "Use simple, friendly, conversational language as if explaining to a classmate.",
            "Professional": "Use professional, concise business language."
        }
        const toneInstruction = toneMap[tone] || toneMap["Academic"]

        // Map length to word count
        const lengthMap: Record<string, string> = {
            "Short": "Keep the summary very concise, around 100-150 words total.",
            "Medium": "Aim for a moderate length, around 250-350 words total.",
            "Long": "Be comprehensive and detailed, around 500-600 words total."
        }
        const lengthInstruction = lengthMap[length] || lengthMap["Medium"]

        // Build output-type-specific prompt
        let outputInstruction = ""
        let jsonStructure = ""

        if (outputType === "Quiz" || outputType === "Q&A") {
            outputInstruction = "Generate exactly 10 quiz questions with answers based on the document."
            jsonStructure = `{
    "title": "Quiz: [topic]",
    "emoji": "❓",
    "summary": "A 1-sentence overview of what this quiz covers.",
    "keyPoints": [
        "Q1: [question] | A1: [answer]",
        "Q2: [question] | A2: [answer]",
        "Q3: [question] | A3: [answer]",
        "Q4: [question] | A4: [answer]",
        "Q5: [question] | A5: [answer]",
        "Q6: [question] | A6: [answer]",
        "Q7: [question] | A7: [answer]",
        "Q8: [question] | A8: [answer]",
        "Q9: [question] | A9: [answer]",
        "Q10: [question] | A10: [answer]"
    ],
    "actionItems": ["Review questions you got wrong", "Repeat the quiz after 24 hours"]
}`
        } else if (outputType === "Exam prep") {
            outputInstruction = "Create a structured exam preparation guide."
            jsonStructure = `{
    "title": "Exam Prep: [topic]",
    "emoji": "🎓",
    "summary": "Key topics and what to focus on for the exam.",
    "keyPoints": [
        "Topic 1: [key concept to know]",
        "Topic 2: [key concept to know]",
        "Topic 3: [key concept to know]",
        "Topic 4: [key concept to know]",
        "Likely exam question: [question with model answer]",
        "Likely exam question: [question with model answer]",
        "Formula/Definition to memorize: [item]",
        "Formula/Definition to memorize: [item]"
    ],
    "actionItems": ["Make flashcards for key terms", "Practice past papers", "Review weak areas first"]
}`
        } else if (outputType === "Assignment guide") {
            outputInstruction = "Create a structured assignment help guide from the content."
            jsonStructure = `{
    "title": "Assignment Guide: [topic]",
    "emoji": "📋",
    "summary": "How to approach and complete this assignment successfully.",
    "keyPoints": [
        "Key concept to address: [concept]",
        "Key concept to address: [concept]",
        "Key concept to address: [concept]",
        "Suggested structure: Introduction — [what to include]",
        "Suggested structure: Main Body — [what to include]",
        "Suggested structure: Conclusion — [what to include]",
        "Important point to include: [point]",
        "Common mistake to avoid: [mistake]"
    ],
    "actionItems": ["Outline your assignment before writing", "Cite all sources", "Proofread for clarity"]
}`
        } else if (outputType === "Detailed notes") {
            outputInstruction = `Create comprehensive, detailed notes with all important information. ${lengthInstruction}`
            jsonStructure = `{
    "title": "[Document topic] — Detailed Notes",
    "emoji": "📖",
    "summary": "Complete overview of all topics covered.",
    "keyPoints": [
        "## [Section 1 heading]: [detailed explanation]",
        "### [Subsection]: [explanation]",
        "Key fact: [important detail]",
        "Key fact: [important detail]",
        "Key fact: [important detail]",
        "## [Section 2 heading]: [detailed explanation]",
        "Key fact: [important detail]",
        "Key fact: [important detail]"
    ],
    "actionItems": ["Review section headings", "Create a mind map of connections", "Identify gaps in understanding"]
}`
        } else if (outputType === "Short notes") {
            outputInstruction = "Create a concise bullet-point quick reference. Maximum 8 key points, each under 15 words."
            jsonStructure = `{
    "title": "Quick Notes: [topic]",
    "emoji": "⚡",
    "summary": "Ultra-brief overview in 1 sentence.",
    "keyPoints": [
        "Point 1 (max 15 words)",
        "Point 2 (max 15 words)",
        "Point 3 (max 15 words)",
        "Point 4 (max 15 words)",
        "Point 5 (max 15 words)",
        "Point 6 (max 15 words)"
    ],
    "actionItems": ["Review before exam", "Expand on unclear points"]
}`
        } else if (outputType === "Flashcards layout") {
            outputInstruction = "Generate 10 flashcard pairs from the document content."
            jsonStructure = `{
    "title": "Flashcards: [topic]",
    "emoji": "🗂",
    "summary": "10 flashcard pairs covering the main concepts.",
    "keyPoints": [
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]",
        "FRONT: [term or question] | BACK: [definition or answer]"
    ],
    "actionItems": ["Study front side first", "Test yourself without looking at back"]
}`
        } else if (outputType === "Paragraph") {
            outputInstruction = `Write a flowing paragraph summary. ${lengthInstruction}`
            jsonStructure = `{
    "title": "[Topic] — Summary",
    "emoji": "📄",
    "summary": "[Write a full flowing paragraph summary here, not bullet points]",
    "keyPoints": ["Main argument: [point]", "Supporting evidence: [point]", "Conclusion: [point]"],
    "actionItems": ["Identify the main thesis", "Note supporting arguments"]
}`
        } else {
            // Default: Bullet points summary
            outputInstruction = `Summarize the document as clear bullet points. ${lengthInstruction}`
            jsonStructure = `{
    "title": "[Document topic] — Summary",
    "emoji": "📝",
    "summary": "2-3 sentence overview of the entire document.",
    "keyPoints": [
        "Key point 1",
        "Key point 2",
        "Key point 3",
        "Key point 4",
        "Key point 5"
    ],
    "actionItems": ["Action item 1", "Action item 2"]
}`
        }

        const prompt = `You are an expert academic assistant. ${outputInstruction}

TONE: ${toneInstruction}

Return ONLY valid JSON with NO markdown, NO code fences, NO explanation. Use exactly this structure:
${jsonStructure}

Replace all placeholder text in brackets with real content from the document.

Document Content:
${text.slice(0, 100000)}`

        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }]
        });

        const textResponse = result.choices[0]?.message?.content || "";
        const jsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const parsedData = JSON.parse(jsonString)
            return { success: true, data: parsedData, extractedText: text }
        } catch (e) {
            console.error("JSON Error", jsonString)
            return { error: "AI response format error." }
        }

    } catch (error: any) {
        console.error("Processing Error:", error)
        return { error: error.message || "Failed to process document" }
    }
}