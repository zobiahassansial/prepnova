import { NextRequest, NextResponse } from "next/server";
import { getGroqModel } from "@/lib/groq";

const PDFParser = require("pdf2json");

export async function POST(req: NextRequest) {
    try {
        console.log("Reached /api/scan endpoint");

        const body = await req.json();
        const { fileUrl, fileType } = body;

        if (!fileUrl) {
            console.log("No fileUrl provided");
            return NextResponse.json({ error: "No fileUrl provided" }, { status: 400 });
        }

        console.log(`Processing file: ${fileType} from ${fileUrl}`);

        // Fetch the file from the URL
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) {
            throw new Error(`Failed to fetch file from URL: ${fileRes.statusText}`);
        }
        
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let extractedText = "";

        if (fileType === "application/pdf") {
            console.log("Extracting text from PDF using pdf2json...");
            extractedText = await new Promise<string>((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1);
                pdfParser.on("pdfParser_dataError", (err: any) => reject(new Error(err.parserError)));
                pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
                pdfParser.parseBuffer(buffer);
            });
        } else if (fileType.startsWith("image/")) {
            console.log("Extracting text from image using Groq Vision API...");
            const base64Image = buffer.toString("base64");
            const dataUrl = `data:${fileType};base64,${base64Image}`;

            const groq = getGroqModel();
            
            const response = await groq.chat.completions.create({
                model: "llama-3.2-90b-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Please extract all the text from this image exactly as it appears. If there is no text, reply with 'No text found'. Do not add any formatting or conversational filler. Just the extracted text." },
                            { type: "image_url", image_url: { url: dataUrl } }
                        ]
                    }
                ],
            });

            extractedText = response.choices[0]?.message?.content || "";
        } else {
            console.log("Unsupported file type:", fileType);
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        console.log("Extraction successful, returning text of length", extractedText.length);
        return NextResponse.json({ extractedText });

    } catch (error: any) {
        console.error("Error in /api/scan:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
