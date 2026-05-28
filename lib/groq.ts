import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY || "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";

export const groq = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";

export function getGroqModel() {
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set");
    }
    return groq;
}
