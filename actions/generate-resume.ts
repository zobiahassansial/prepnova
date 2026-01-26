"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { ResumeData } from "@/types/resume"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateResumeContent(currentData: ResumeData): Promise<Partial<ResumeData>> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
    You are an expert resume writer.
    Improve this resume to match the job description (if provided) or general industry standards.
    Optimize for ATS, clarity, and impact.
    Preserve structure and sections.
    
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

export async function optimizeCoverLetter(coverLetter: string, resumeData: ResumeData): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
    You are a professional career assistant.
    Optimize content to match the job description (if implied).
    Highlight relevant skills and experience.
    Rephrase bullets for ATS optimization.
    Keep formatting unchanged.

    Resume Context:
    ${JSON.stringify({
        summary: resumeData.summary,
        experience: resumeData.experience,
        skills: resumeData.skills
    })}

    Current Cover Letter:
    ${coverLetter}

    Return ONLY the improved cover letter text. Do not include any explanations or markdown formatting.
    `

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
    } catch (error) {
        console.error("Cover Letter Optimization Failed:", error)
        throw new Error("Failed to optimize cover letter")
    }
}

export async function generateCoverLetter(resumeData: ResumeData): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
    Write a professional cover letter from scratch.
    Tone: confident, concise, tailored.
    Length: one page maximum.
    Do not repeat resume content verbatim.
    
    Use the resume details below:
    ${JSON.stringify({
        summary: resumeData.summary,
        experience: resumeData.experience,
        skills: resumeData.skills,
        education: resumeData.education
    })}

    Return ONLY the cover letter text. No markdown.
    `

    try {
        const result = await model.generateContent(prompt)
        return result.response.text()
    } catch (error) {
        console.error("Generate Cover Letter Failed:", error)
        throw new Error("Failed to generate cover letter")
    }
}

export async function matchCoverLetterToJob(coverLetter: string, jobDescription: string, resumeData: ResumeData): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
    Rewrite this cover letter to closely match the following job description.
    Use keywords naturally.
    Do not fabricate experience.
    Tone: confident, tailored, concise.
    One page maximum.
    
    Job Description:
    ${jobDescription}

    Current Cover Letter:
    ${coverLetter}

    Resume Context (for reference):
    ${JSON.stringify({
        experience: resumeData.experience,
        skills: resumeData.skills
    })}

    Return ONLY the rewritten cover letter text. No markdown.
    `

    try {
        const result = await model.generateContent(prompt)
        return result.response.text()
    } catch (error) {
        console.error("Match Cover Letter Failed:", error)
        throw new Error("Failed to match cover letter")
    }
}
