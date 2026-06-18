import OpenAI from "openai";

if (!process.env.GROQ_API_KEY) {
    console.error("[groq] GROQ_API_KEY environment variable is not set — AI features will fail")
}

export const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "",
    baseURL: "https://api.groq.com/openai/v1",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";

export function getGroqModel() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured")
    }
    return groq;
}
