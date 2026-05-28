"use server"

import { getGroqModel, GROQ_MODEL } from "@/lib/groq"

const model = getGroqModel()

export async function getLiveInterviewHelp(transcript: string) {
    if (!transcript) return { error: "No text detected" }

    try {
        const prompt = `
            You are a helpful assistant assisting a candidate during a live interview.
            The interviewer just said: "${transcript}"
            
            Provide a concise, professional, and impressive answer that the candidate can speak immediately.
            - Keep it short (2-3 sentences max).
            - Direct answer only. No intro/outro.
        `

        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }]
        });
        const answer = result.choices[0]?.message?.content || "";

        return { success: true, answer }
    } catch (error) {
        return { error: "Failed to generate answer" }
    }
}

// ... (Baaki Mock Interview code same rahega) ...
export async function generateInterviewResponse(messages: { role: string, content: string }[]) {
    try {
        const systemInstruction = `
            You are a professional HR interviewer. Ask ONE question at a time.
        `

        const groqMessages = [
            { role: "system", content: systemInstruction },
            ...messages.map(m => ({
                role: m.role === "model" ? "assistant" : m.role,
                content: m.content
            }))
        ];

        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: groqMessages as any
        });
        const reply = result.choices[0]?.message?.content || "";

        return { reply }

    } catch (error: any) {
        console.error("Interview Error:", error)
        return { error: "Failed to generate interview response." }
    }
}