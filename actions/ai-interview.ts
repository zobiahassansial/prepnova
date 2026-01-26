"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

export async function generateInterviewResponse(history: any[]) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return { error: "GEMINI_API_KEY not configured" }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    })

    const systemPrompt = `
You are a professional hiring manager conducting a behavioral interview.
Be professional but encouraging. Ask one question at a time.
After the user answers, acknowledge their answer briefly and ask a follow-up or a new question.
Keep responses concise (max 2-3 sentences).
`

    const conversation = history
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n")

    const prompt = `
${systemPrompt}

Conversation so far:
${conversation}

Respond with the next interviewer message only.
`

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    return { reply: content }

  } catch (error: any) {
    console.error("AI Interview Error:", error)
    return { error: error.message || "Failed to generate response" }
  }
}
