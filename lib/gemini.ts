import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY || ""

// Strict singleton-like instance for the SDK
export const genAI = new GoogleGenerativeAI(apiKey)

// Unified Model Identifier
export const GEMINI_MODEL = "gemini-2.0-flash"

// Helper to get the strictly configured model instance
export function getGeminiModel() {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set")
    }
    return genAI.getGenerativeModel({ model: GEMINI_MODEL })
}
