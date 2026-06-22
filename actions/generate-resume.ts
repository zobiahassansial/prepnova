"use server"

import { auth } from "@/auth"
import { getGroqModel, GROQ_MODEL } from "@/lib/groq"
import { ResumeData } from "@/types/resume"

export async function generateResumeContent(currentData: ResumeData, tone?: string, jobDescription?: string): Promise<Partial<ResumeData>> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Authentication required.")

    const model = getGroqModel()

    const hasExperience = currentData.experience.length > 0
    const hasEducation = currentData.education.length > 0
    const hasSkills = currentData.skills.length > 0
    const hasSummary = currentData.summary?.trim().length > 0

    const prompt = `You are an elite professional resume writer with 20+ years of experience helping candidates land jobs at top companies. Your task is to generate a COMPLETE, RICH, PROFESSIONAL resume based on whatever information the user has provided — even if it is minimal or sparse.

TONE: ${tone || "professional"}
${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : ""}

INSTRUCTIONS:
1. PROFESSIONAL SUMMARY: Write a compelling 3-4 sentence summary that highlights the candidate's value proposition, years of experience, key strengths, and career goals. If the user's summary is short or missing, generate one based on their experience and skills.

2. EXPERIENCE: For EACH experience entry, generate 4-6 detailed bullet points using strong action verbs (Led, Developed, Implemented, Increased, Reduced, Managed, Delivered, Architected, etc.). Each bullet must be specific, quantified where possible (add realistic metrics like "20% increase", "50+ users", "$100K savings"), and demonstrate real business impact. If the user wrote a vague description, EXPAND it into professional bullet points. Do NOT leave descriptions as vague paragraphs.

3. SKILLS: If skills are missing or sparse, generate 10-15 relevant professional skills based on the experience and job description. Include both technical and soft skills appropriate for the role.

4. EDUCATION: Preserve education as-is. If field of study or description is missing, leave them empty.

5. PROJECTS: If projects exist, enhance their descriptions. If none exist, do NOT invent projects.

6. IMPORTANT: You MUST generate rich, full-length content. Do not return short or generic content. Every section must read like it was written by a professional resume writer.

${jobDescription ? "7. Tailor ALL content to match keywords and requirements from the target job description for ATS optimization." : ""}

USER INPUT DATA:
${JSON.stringify({
        personalInfo: currentData.personalInfo,
        summary: currentData.summary,
        experience: currentData.experience,
        education: currentData.education,
        skills: currentData.skills,
        projects: currentData.projects,
        customSections: currentData.customSections
    }, null, 2)}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, no \`\`\`json):
{
  "summary": "string — a compelling 3-4 sentence professional summary",
  "experience": [
    {
      "id": "string",
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string",
      "current": boolean,
      "location": "string",
      "description": "string — 4-6 bullet points, each on a new line starting with •, using strong action verbs and metrics"
    }
  ],
  "education": [
    {
      "id": "string",
      "school": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "location": "string"
    }
  ],
  "skills": ["skill1", "skill2", "...10-15 skills"],
  "projects": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "link": "string or empty",
      "technologies": ["string"]
    }
  ]
}`

    try {
        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert resume writer. Always return valid JSON only. Never return markdown code blocks. Never add explanations outside the JSON."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });
        const text = result.choices[0]?.message?.content || "";

        const jsonStr = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim()

        const data = JSON.parse(jsonStr)

        // Merge IDs back from original data to avoid ID mismatches
        if (data.experience && currentData.experience.length > 0) {
            data.experience = data.experience.map((exp: any, i: number) => ({
                ...exp,
                id: currentData.experience[i]?.id || exp.id || Date.now().toString() + i,
            }))
        }
        if (data.education && currentData.education.length > 0) {
            data.education = data.education.map((edu: any, i: number) => ({
                ...edu,
                id: currentData.education[i]?.id || edu.id || Date.now().toString() + i,
            }))
        }
        if (data.projects && currentData.projects.length > 0) {
            data.projects = data.projects.map((proj: any, i: number) => ({
                ...proj,
                id: currentData.projects[i]?.id || proj.id || Date.now().toString() + i,
            }))
        }

        return data
    } catch (error) {
        console.error("AI Resume Generation Failed:", error)
        throw new Error("Failed to generate resume content")
    }
}

export async function optimizeCoverLetter(coverLetter: string, resumeData: ResumeData, tone?: string): Promise<string> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Authentication required.")

    const model = getGroqModel()

    const prompt = `You are a professional career coach specializing in cover letters. Optimize and improve the following cover letter to make it more compelling, impactful, and professional.

TONE: ${tone || "professional and confident"}

IMPROVEMENTS TO MAKE:
- Strengthen the opening hook (avoid clichés like "I am writing to apply...")
- Add specific quantified achievements where possible
- Use more powerful action-oriented language
- Improve flow and readability
- Ensure each paragraph has a clear purpose
- Make the closing stronger with a confident call-to-action
- Optimize for ATS keywords based on the resume context

RESUME CONTEXT:
Summary: ${resumeData.summary}
Key Skills: ${resumeData.skills.slice(0, 10).join(", ")}
Top Experience: ${resumeData.experience.slice(0, 2).map(e => `${e.position} at ${e.company}`).join(", ")}

CURRENT COVER LETTER:
${coverLetter}

Return ONLY the improved cover letter text. No markdown. No extra commentary.`

    try {
        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: "You are a professional cover letter optimizer. Return only the improved cover letter text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });
        return result.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Cover Letter Optimization Failed:", error)
        throw new Error("Failed to optimize cover letter")
    }
}

export async function generateCoverLetter(resumeData: ResumeData, tone?: string): Promise<string> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Authentication required.")

    const model = getGroqModel()

    const latestRole = resumeData.experience[0]
    const hiringManager = "Hiring Manager"

    const prompt = `You are an expert career coach and professional cover letter writer. Write a compelling, full-length cover letter for this candidate.

TONE: ${tone || "confident, professional, and personable"}
CANDIDATE NAME: ${resumeData.personalInfo.fullName || "the candidate"}
CURRENT/MOST RECENT ROLE: ${latestRole ? `${latestRole.position} at ${latestRole.company}` : "professional"}

REQUIREMENTS:
- Write a proper 4-paragraph cover letter (opening hook, relevant experience, value proposition, closing call-to-action)
- Start with a strong opening that grabs attention — NOT "I am writing to apply for..."
- Reference specific achievements and skills from the resume
- Show enthusiasm and cultural fit
- End with a confident call-to-action
- Length: 300-400 words
- Include proper salutation (Dear ${hiringManager},) and closing (Sincerely, [Name])

RESUME DETAILS:
Name: ${resumeData.personalInfo.fullName}
Email: ${resumeData.personalInfo.email}
Summary: ${resumeData.summary}
Experience: ${JSON.stringify(resumeData.experience.slice(0, 3).map(e => ({ company: e.company, position: e.position, description: e.description.substring(0, 200) })))}
Skills: ${resumeData.skills.slice(0, 10).join(", ")}
Education: ${JSON.stringify(resumeData.education.map(e => ({ school: e.school, degree: e.degree })))}

Return ONLY the cover letter text. No markdown. No extra commentary.`

    try {
        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: "You are a professional cover letter writer. Return only the cover letter text with no extra commentary or markdown." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 1000,
        });
        return result.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Generate Cover Letter Failed:", error)
        throw new Error("Failed to generate cover letter")
    }
}

export async function matchCoverLetterToJob(coverLetter: string, jobDescription: string, resumeData: ResumeData, tone?: string): Promise<string> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Authentication required.")

    const model = getGroqModel()

    const prompt = `You are an expert career coach. Rewrite the following cover letter to be perfectly tailored for the target job description.

TONE: ${tone || "confident, tailored, and professional"}

REQUIREMENTS:
- Naturally incorporate key terms and requirements from the job description (for ATS optimization)
- Highlight the candidate's most relevant experience and skills that match the role
- Keep the same structure (salutation, 4 paragraphs, sign-off) but rewrite the content
- Make the opening sentence compelling and specific to this role
- Show genuine enthusiasm for this specific company/role
- Length: 300-400 words
- Do NOT fabricate experience or qualifications the candidate doesn't have

JOB DESCRIPTION:
${jobDescription}

CURRENT COVER LETTER:
${coverLetter || "(None — generate from scratch using resume data)"}

RESUME CONTEXT:
Name: ${resumeData.personalInfo.fullName}
Summary: ${resumeData.summary}
Key Skills: ${resumeData.skills.slice(0, 12).join(", ")}
Experience: ${resumeData.experience.slice(0, 2).map(e => `${e.position} at ${e.company}`).join(", ")}

Return ONLY the rewritten cover letter text. No markdown. No extra commentary.`

    try {
        const result = await model.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: "You are a professional cover letter writer. Return only the cover letter text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });
        return result.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Match Cover Letter Failed:", error)
        throw new Error("Failed to match cover letter")
    }
}
