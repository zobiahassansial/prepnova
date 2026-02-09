"use server"

import { getGeminiModel } from "@/lib/gemini"

// ✅ FIX: Use 'require' to bypass TypeScript errors
const PDFParser = require("pdf2json");
const mammoth = require("mammoth");

export async function processAndSummarizeNote(fileUrl: string, fileType: string) {
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

        const model = getGeminiModel()

        const prompt = `
            You are an elite academic assistant. Analyze the following document content and provide a highly structured summary.
            
            Return the response in valid JSON format ONLY. Structure it exactly like this:
            {
                "title": "A short, catchy title",
                "emoji": "A relevant emoji",
                "summary": "A 2-3 sentence overview.",
                "keyPoints": ["Point 1", "Point 2", "Point 3"],
                "actionItems": ["Action 1", "Action 2"]
            }
            Do NOT use Markdown. Return raw JSON string.

            Document Content:
            ${text.slice(0, 100000)}
        `

        const result = await model.generateContent(prompt)

        const aiResponse = await result.response
        const jsonString = aiResponse.text().replace(/```json/g, "").replace(/```/g, "").trim()

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