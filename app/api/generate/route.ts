import { NextRequest, NextResponse } from "next/server";
import { getGroqModel, GROQ_MODEL } from "@/lib/groq";

const PDFParser = require("pdf2json");

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
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const difficulty = (formData.get("difficulty") as string) || "medium";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on("pdfParser_dataError", (err: any) => reject(err.parserError));
      pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
      pdfParser.parseBuffer(buffer);
    });

    // Clean up PDF extraction artifacts
    const text = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[^\x20-\x7E\n]/g, " ")
      .trim();

    if (text.length < 100) {
      return NextResponse.json({ error: "Could not extract readable text from this PDF. Make sure it is not a scanned image PDF." }, { status: 400 });
    }

    // Scale card count to content size
    const contentLength = text.length;
    let targetCardCount = Math.ceil(contentLength / 800);
    targetCardCount = Math.max(5, Math.min(50, targetCardCount));

    const difficultyNote = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.medium;

    const model = getGroqModel();

    const prompt = `You are an expert educator creating flashcards STRICTLY from the provided document.

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
${text.slice(0, 28000)}`;

    const result = await model.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(result.choices[0]?.message?.content || "{}");
    const flashcards = parsed.flashcards;

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json({ error: "AI returned no flashcards. Try again." }, { status: 500 });
    }

    // Validate each card has non-empty front and back
    const valid = flashcards.filter(
      (c: any) => typeof c.front === "string" && c.front.trim() && typeof c.back === "string" && c.back.trim()
    );

    return NextResponse.json({ flashcards: valid });

  } catch (error: any) {
    console.error("Flashcard generation error:", error);
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}