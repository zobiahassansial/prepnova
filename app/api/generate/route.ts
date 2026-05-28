import { NextRequest, NextResponse } from "next/server";
import { getGroqModel, GROQ_MODEL } from "@/lib/groq";

const PDFParser = require("pdf2json");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on("pdfParser_dataError", (err: any) => reject(err.parserError));
        pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
        pdfParser.parseBuffer(buffer);
    });

    // --- DYNAMIC LOGIC FIXED ---
    const contentLength = text.length;
    // 1 card per 1000 characters (Denser)
    let targetCardCount = Math.ceil(contentLength / 1000);

    // Strict Limits
    if (targetCardCount < 5) targetCardCount = 5;   // Min 5
    if (targetCardCount > 50) targetCardCount = 50; // Max 50 (Client requirement)

    console.log(`Generating ${targetCardCount} cards for length ${contentLength}`);

    const model = getGroqModel();
    
    const prompt = `
      You are a strict teacher. I need exactly ${targetCardCount} flashcards from this text.
      Cover every single chapter/topic. Do not summarize, go into details.
      
      Return RAW JSON array: [{"front": "Question", "back": "Answer"}]
      No markdown.
      
      Text: ${text.slice(0, 100000)}
    `;

    const result = await model.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    const textResponse = result.choices[0]?.message?.content || "";
    const cleanedText = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json({ flashcards: JSON.parse(cleanedText) });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}