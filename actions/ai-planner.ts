"use server"

import OpenAI from "openai"

// Removed unused db import that caused build error

export async function generateStudyPlan(goal: string, hoursPerDay: number, days: number) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        console.error("Missing OPENAI_API_KEY in server environment")
        return { error: "AI Service Unavailable (Missing Configuration)" }
    }

    const openai = new OpenAI({ apiKey })

    try {
        const prompt = `
            Create a study plan for learning: "${goal}".
            Duration: ${days} days.
            Daily effort: ${hoursPerDay} hours.
            
            Return a JSON array of tasks. Each task object should have:
            - title (string)
            - subject (string, inferred from goal)
            - duration (number, in minutes, max 60 per task)
            - dayOffset (number, 0 to ${days - 1})
            
            Example: [{"title": "Intro to Algo", "subject": "CS", "duration": 45, "dayOffset": 0}]
            JSON ONLY. No markdown.
        `

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful study planner assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        })

        const content = response.choices[0].message.content
        if (!content) return { error: "No response from AI" }

        // Clean markdown if present
        const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim()
        const plan = JSON.parse(jsonStr)

        return { plan }
    } catch (error: any) {
        console.error("AI Generation Error:", error)
        return { error: error.message || "Failed to generate plan" }
    }
}
