"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// ✅ FIX: Use 'require' to bypass TypeScript errors
const PDFParser = require("pdf2json");
const mammoth = require("mammoth");

export async function processAndSummarizeNote(fileUrl: string, fileType: string) {
    if (!fileUrl) return { error: "No file URL provided" }

    // DEBUG LOGS START
    console.log("🚀 START: Processing started for", fileType);

    try {
        // --- 1. Download File ---
        console.log("📥 Step 1: Downloading file...");
        const fileResponse = await fetch(fileUrl) // Renamed variable
        if (!fileResponse.ok) throw new Error("Failed to download file from storage")

        const arrayBuffer = await fileResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log("✅ File Downloaded. Size:", buffer.length);

        // --- 2. Extract Text ---
        console.log("🔍 Step 2: Parsing Text...");
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
            console.error("❌ Error: Text extracted is too short.");
            return { error: "Could not read text. Is this a scanned PDF? Please use text-based files." }
        }
        console.log("✅ Text Parsed. Length:", text.length);

        // --- 3. Gemini AI ---
        console.log("🤖 Step 3: Sending to Gemini AI...");
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return { error: "Server Error: Missing API Key" }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
        
        // Renamed variable to avoid conflict
        const aiResponse = await result.response 
        const jsonString = aiResponse.text().replace(/```json/g, "").replace(/```/g, "").trim()

        console.log("✨ Step 4: AI Response Received");

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