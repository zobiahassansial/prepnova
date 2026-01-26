"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

type ResumeInput = {
  fullName: string
  jobTitle: string
  summary?: string
  skills: string[]
  experience: string
  education: string
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

    const prompt = `
You are a professional resume writer.

Create a clean, ATS-friendly resume using the following information.

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

Output format:

Name
Job Title

Professional Summary:
...

Skills:
- ...
- ...

Experience:
- ...

Education:
- ...

Do not add markdown. Plain text only.
`

    const result = await model.generateContent(prompt)
    const resumeText = result.response.text()

    return { resume: resumeText }

  } catch (error: any) {
    console.error("Resume Generation Error:", error)
    return { error: error.message || "Failed to generate resume" }
  }
}
