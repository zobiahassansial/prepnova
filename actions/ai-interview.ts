"use server"

import { getGeminiModel } from "@/lib/gemini"

const model = getGeminiModel()

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

        const result = await model.generateContent(prompt)
        const answer = result.response.text()

        return { success: true, answer }
    } catch (error) {
        return { error: "Failed to generate answer" }
    }
}

// ... (Baaki Mock Interview code same rahega) ...
export async function generateInterviewResponse(messages: { role: string, content: string }[]) {
    try {
        const history = messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }))

        const systemInstruction = `
            You are a professional HR interviewer. Ask ONE question at a time.
        `

        const lastMessage = messages[messages.length - 1].content;
        const historyWithoutLast = history.slice(0, -1);

        const chatSession = model.startChat({
            history: historyWithoutLast,
            systemInstruction: { role: "system", parts: [{ text: systemInstruction }] } as any
        });

        const result = await chatSession.sendMessage(lastMessage);
        const reply = result.response.text();

        return { reply }

    } catch (error: any) {
        console.error("Interview Error:", error)
        return { error: "Failed to generate interview response." }
    }
}