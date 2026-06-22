"use server"

import { auth } from "@/auth"
import { getGroqModel, GROQ_MODEL } from "@/lib/groq"

export async function generateFlashcardsFromText(text: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Authentication required." }
    }

    if (!process.env.GROQ_API_KEY) {
        return { error: "AI service is not configured. Please contact support." }
    }

    if (!text || text.trim().length < 50) {
        return { error: "Not enough text content to generate flashcards. Please provide more detailed notes." }
    }

    try {
        const model = getGroqModel()

        // Scale card count with text length — more content = more cards, capped at 30
        const charCount = text.trim().length
        const cardCount =
            charCount < 1500 ? 8 :
            charCount < 4000 ? 12 :
            charCount < 8000 ? 18 :
            charCount < 14000 ? 24 : 30

        const truncatedText = text.slice(0, 15000)

        const prompt = `You are an expert study assistant that creates high-quality flashcards for students.

Analyze the following study material and generate exactly ${cardCount} flashcards that cover the most important concepts.

RULES:
- Each "front" must be a clear, specific question or concept prompt
- Each "back" must be a concise, accurate answer (1–3 sentences max)
- Cover key facts, definitions, formulas, processes, and relationships
- Test genuine understanding — avoid trivial or overly obvious questions
- Do NOT duplicate cards or ask the same thing in two different ways
- Use precise terminology from the source material

Return a JSON object with this exact structure and nothing else:
{
  "flashcards": [
    { "front": "question or concept", "back": "concise answer or explanation" }
  ]
}

Study Material:
${truncatedText}`

        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        })

        const content = result.choices[0]?.message?.content
        if (!content) return { error: "No response from AI. Please try again." }

        let parsed: any
        try {
            parsed = JSON.parse(content)
        } catch {
            return { error: "AI returned an unexpected format. Please try again." }
        }

        if (!Array.isArray(parsed?.flashcards)) {
            return { error: "AI returned an unexpected format. Please try again." }
        }

        // Validate and clean each card — drop any with empty front or back
        const flashcards: { front: string; back: string }[] = parsed.flashcards
            .filter((card: any) =>
                card &&
                typeof card.front === "string" && card.front.trim().length > 0 &&
                typeof card.back === "string" && card.back.trim().length > 0
            )
            .map((card: any) => ({
                front: card.front.trim(),
                back: card.back.trim(),
            }))

        if (flashcards.length === 0) {
            return { error: "Could not generate valid flashcards from this content. Try uploading more detailed study material." }
        }

        return { flashcards }

    } catch (error: any) {
        console.error("Flashcard Generation Error:", error)
        return { error: error.message || "Failed to generate flashcards. Please try again." }
    }
}
