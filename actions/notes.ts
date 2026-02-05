"use server"

import { getGeminiModel } from "@/lib/gemini"
const pdf = require("pdf-parse")

import mammoth from "mammoth"

export async function processAndSummarizeNote(fileUrl: string, fileType: string) {
    if (!fileUrl) return { error: "No file URL provided" }

    try {
        // 1. Download file from URL
        const response = await fetch(fileUrl)
        if (!response.ok) throw new Error("Failed to download file from storage")

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 2. Extract Text
        let text = ""

        if (fileType.includes("pdf")) {
            const data = await pdf(buffer)
            text = data.text
        } else if (fileType.includes("word") || fileType.includes("docx")) {
            const result = await mammoth.extractRawText({ buffer })
            text = result.value
        } else if (fileType.includes("text")) {
            text = buffer.toString("utf-8")
        } else {
            // Fallback generic extract or error? 
            // For images (PPT/PNG), we need OCR or Gemini Vision.
            // Prompt says: "If Image -> run OCR (optional)". "If PPT -> pptx-parser".
            // For now support PDF/DOCX/TXT.
            return { error: "Unsupported file type for text extraction. Please upload PDF or DOCX." }
        }

        if (!text || text.length < 50) return { error: "Could not extract enough text to summarize." }

        // 3. Summarize with Gemini
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return { error: "Server missing GEMINI_API_KEY" }

        const model = getGeminiModel()

        const prompt = `
            Summarize the following notes into a structured format with:
            - Title (inferred)
            - Key Takeaways (bullet points)
            - Detailed Summary
            
            Format using Markdown.
            
            Notes Content:
            ${text.slice(0, 30000)} 
        `
        // Truncate to avoid limit if huge

        const result = await model.generateContent(prompt)
        const summary = result.response.text()

        return { summary }

    } catch (error: any) {
        console.error("Processing Error:", error)
        return { error: error.message || "Failed to process document" }
    }
}
