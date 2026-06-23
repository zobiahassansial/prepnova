"use server"

import { auth } from "@/auth"
import { getGroqModel, GROQ_MODEL } from "@/lib/groq"
import { checkLimit, incrementUsage, decrementUsage } from "@/lib/limits"

export async function getLiveInterviewHelp(transcript: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Authentication required." }

    const quota = await checkLimit(session.user.id, "interviews")
    if (!quota.allowed) return { error: quota.error, upgradeRequired: true }

    if (!transcript?.trim()) return { error: "No text detected" }

    await incrementUsage(session.user.id, "interviews")
    try {
        const model = getGroqModel()
        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{
                role: "user",
                content: `You are helping a job candidate in a live interview. The interviewer just said:
"${transcript}"

Give a concise, confident, professional answer the candidate can speak immediately.
- 2-3 sentences max
- Start with the answer directly — no "Great question" or filler
- Sound natural, not robotic`
            }]
        })
        return { success: true, answer: result.choices[0]?.message?.content || "" }
    } catch {
        await decrementUsage(session.user.id, "interviews")
        return { error: "Failed to generate answer" }
    }
}

export async function generateInterviewResponse(
    messages: { role: string; content: string }[],
    interviewType: string = "behavioral"
) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Authentication required." }

    const quota = await checkLimit(session.user.id, "interviews")
    if (!quota.allowed) return { error: quota.error, upgradeRequired: true }

    try {
        const model = getGroqModel()

        const typeContext: Record<string, string> = {
            behavioral: "behavioral HR interview using the STAR method (Situation, Task, Action, Result). Ask about teamwork, leadership, conflict resolution, challenges overcome, and career goals.",
            technical: "technical interview. Ask about system design, data structures, algorithms, and relevant technical concepts. Probe the candidate's problem-solving approach.",
            product: "product management interview. Ask about product thinking, prioritization, metrics, and case studies.",
            general: "general job interview covering motivation, strengths/weaknesses, career goals, and work experience."
        }

        const context = typeContext[interviewType] || typeContext.behavioral
        const turnCount = messages.filter(m => m.role === "user").length

        const systemPrompt = `You are a professional interviewer conducting a ${context}

RULES:
- Ask ONE question at a time. Never ask multiple questions in one message.
- After the candidate answers, give brief (1 sentence) constructive feedback on their answer, then ask the next question.
- Use natural interview language — be professional but not robotic.
- Cover a variety of topics; don't repeat the same theme twice.
- After ${turnCount >= 6 ? "this question, wrap up the interview" : "each answer, ask the next question"}.
${turnCount >= 7 ? "- This is the LAST question. After the candidate answers, thank them and say the interview is complete." : ""}

Current turn: ${turnCount + 1}/7`

        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.map(m => ({
                    role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
                    content: m.content
                }))
            ]
        })

        await incrementUsage(session.user.id, "interviews")
        return { reply: result.choices[0]?.message?.content || "", turnCount }
    } catch (error: unknown) {
        console.error("Interview Error:", error)
        return { error: "Failed to generate interview response." }
    }
}

export async function generateInterviewFeedback(
    messages: { role: string; content: string }[],
    interviewType: string = "behavioral"
) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Authentication required." }

    // Feedback is part of the same interview session — no additional quota consumed.
    // Auth check is sufficient here.

    try {
        const model = getGroqModel()

        const conversation = messages
            .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
            .join("\n\n")

        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{
                role: "user",
                content: `You are an expert interview coach. Review this ${interviewType} interview and provide structured feedback.

INTERVIEW TRANSCRIPT:
${conversation}

Return a JSON object with this exact structure:
{
  "overallScore": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "communication": <number 1-10>,
  "relevance": <number 1-10>,
  "confidence": <number 1-10>,
  "tip": "<one actionable tip for the next interview>"
}`
            }],
            response_format: { type: "json_object" }
        })

        const feedback = JSON.parse(result.choices[0]?.message?.content || "{}") as Record<string, unknown>
        return { feedback }
    } catch (error: unknown) {
        console.error("Feedback Error:", error)
        return { error: "Failed to generate feedback" }
    }
}
