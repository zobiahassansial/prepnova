"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { ResumeData } from "@/types/resume"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateResumeContent(currentData: ResumeData): Promise<Partial<ResumeData>> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
    You are an expert resume writer. I will provide you with a raw resume JSON object.
    Your task is to:
    1. Improve the Professional Summary to be impactful and concise.
    2. Rewrite Experience descriptions to use strong action verbs and match professional standards.
    3. Optimize Skills list.
    4. Fix any grammar or casing issues.
    
    Do NOT invent facts. Only polish the existing content.
    Return strictly a valid JSON object matching the 'ResumeData' structure (partial updates allowed).
    Do NOT return markdown formatting (no \`\`\`json). Just the raw JSON string.

    Input Data:
    ${JSON.stringify({
        summary: currentData.summary,
        experience: currentData.experience,
        skills: currentData.skills,
        education: currentData.education
    })}
    `

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean markdown if present
        const jsonStr = text.replace(/^```json\s*/, "").replace(/\s*```$/, "")

        const data = JSON.parse(jsonStr)
        return data
    } catch (error) {
        console.error("AI Resume Generation Failed:", error)
        throw new Error("Failed to generate resume content")
    }
}
