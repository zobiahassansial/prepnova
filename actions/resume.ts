"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

type ResumeInput = {
  fullName: string
  jobTitle: string
  summary?: string
  skills: string[]
  experience: string
  education: string
  resumeTone?: "professional" | "formal" | "minimal"
}

export async function generateResumeFromForm(data: ResumeInput) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return { error: "GEMINI_API_KEY not configured" }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    })

    const toneInstruction =
      data.resumeTone === "formal"
        ? "Use a very formal, corporate tone."
        : data.resumeTone === "minimal"
          ? "Use a concise, minimal, modern tone. Short sentences."
          : "Use a professional, clear, ATS-friendly tone."

    const prompt = `
You are a professional resume writer.
${toneInstruction}

Rules:
- Do NOT invent fake experience
- Do NOT add sections if data is missing
- Keep content realistic and ATS-friendly

Create a resume using the following information:

Full Name: ${data.fullName}
Target Job Title: ${data.jobTitle}

Professional Summary:
${data.summary || "Not provided"}

Skills:
${data.skills.join(", ")}

Work Experience:
${data.experience}

Education:
${data.education}

Output format (plain text only):

Name
Job Title

Professional Summary:
...

Skills:
- ...

Experience:
- ...

Education:
- ...
`

    const result = await model.generateContent(prompt)
    const resumeText = result.response.text()

    return { resume: resumeText }

  } catch (error: any) {
    console.error("Resume Generation Error:", error)
    return { error: error.message || "Failed to generate resume" }
  }
}
