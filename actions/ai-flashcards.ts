"use server"

import { getGeminiModel } from "@/lib/gemini"

export async function generateFlashcardsFromText(text: string) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in server environment")
    return { error: "AI Service Unavailable (Missing Configuration)" }
  }

  if (!text || text.length < 50) {
    return { error: "Not enough text content" }
  }

  try {
    const model = getGeminiModel()

    const truncatedText = text.slice(0, 15000)

    const prompt = `
Generate 10 flashcards from the following text.
Return a JSON array of objects with "front" and "back" keys.
Keep it concise.

Text:
${truncatedText}
`

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    if (!content) return { error: "No response from AI" }

    const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim()
    const flashcards = JSON.parse(jsonStr)

    return { flashcards }

  } catch (error: any) {
    console.error("AI Generation Error:", error)
    return { error: error.message || "Failed to generate flashcards" }
  }
}
