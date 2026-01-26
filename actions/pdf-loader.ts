"use server"

const pdf = require("pdf-parse")

export async function extractTextFromPDF(formData: FormData): Promise<{ text?: string, error?: string }> {
    const file = formData.get("file") as File

    if (!file) {
        return { error: "No file provided" }
    }

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdf(buffer)

        return { text: data.text }
    } catch (error) {
        console.error("PDF Parse Error:", error)
        return { error: "Failed to parse PDF" }
    }
}
