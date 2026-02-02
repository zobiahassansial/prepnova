"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Mock Data Generator for Dev Mode / Fallback
function generateMockPlan(goal: string, days: number): any[] {
    const mockSubjects = ["Core Concepts", "Advanced Topics", "Practice", "Review"]
    const plan = []

    for (let i = 0; i < 5; i++) { // Generate 5 mock tasks
        plan.push({
            title: `Study ${goal} - Part ${i + 1} (Dev Mode)`,
            subject: mockSubjects[i % mockSubjects.length],
            topic: `Topic ${i + 1}`,
            priority: i % 3 === 0 ? "High" : "Medium",
            difficulty: "Medium",
            durationMinutes: 45,
            dayOffset: -1 // Unscheduled as per rule
        })
    }
    return plan
}

export async function generateStudyPlan(goal: string, hoursPerDay: number, days: number) {
    const apiKey = process.env.GEMINI_API_KEY

    // DEV MODE / MISSING KEY: Return Mock
    if (!apiKey) {
        console.warn("Dev Mode: Using Mock Study Plan (Missing GEMINI_API_KEY)")
        return {
            plan: generateMockPlan(goal, days),
            mode: "dev-mock"
        }
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
            You are a strict Study Planner AI.
            Goal: "${goal}"
            Duration: ${days} days
            Daily Limit: ${hoursPerDay} hours

            RULES:
            1. Atomic Tasks only: Max duration 90 minutes per task.
            2. Priority: "High", "Medium", or "Low".
            3. Difficulty: "Easy", "Medium", or "Hard".
            4. Output MUST be valid JSON array.
            5. All tasks must initially have "dayOffset": -1 (Unscheduled) as per strictly defined flow.
            6. Do not schedule them yet. User will drag and drop.

            Output Format (JSON Array only):
            [
              {
                "title": "Task Name",
                "subject": "Inferred Subject",
                "topic": "Specific Topic",
                "priority": "High",
                "difficulty": "Medium",
                "durationMinutes": 45,
                "dayOffset": -1
              }
            ]
        `

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        // precise JSON extraction
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error("No JSON found in response")

        const plan = JSON.parse(jsonMatch[0])

        if (!Array.isArray(plan)) throw new Error("Invalid format")

        return { plan, mode: "prod-gemini" }

    } catch (error: any) {
        console.error("AI Generation Error (Falling back to mock):", error)
        // Fallback to mock on error to prevent blocking user in dev
        return {
            plan: generateMockPlan(goal, days),
            mode: "dev-fallback",
            error: null // Clear error to allow flow to continue
        }
    }
}

export async function scheduleUserTasks(tasks: any[], hoursPerDay: number, currentSchedule: any[] = []) {
    const apiKey = process.env.GEMINI_API_KEY

    // STRICT: No Mock / Fallback
    if (!apiKey) {
        return { error: "AI service unavailable. Please configure Gemini API key." }
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Filter valid tasks
        const validTasks = tasks.map(t => ({
            id: t.id,
            title: t.title,
            subject: t.subject,
            priority: t.priority,
            duration: t.durationMinutes || 60,
            deadline: t.deadline
        }))

        const prompt = `
            You are a strict Study Planner AI Scheduler.
            Your ONLY job is to schedule EXISTING tasks.
            Do NOT create new tasks.
            Do NOT modify task titles.

            Input Tasks:
            ${JSON.stringify(validTasks)}

            Constraints:
            1. Daily Study Limit: ${hoursPerDay} hours max.
            2. Task Block: Max 90 minutes (if task is longer, it should be unscheduled or warned, but for now schedule as is if < 90).
            3. No overlapping tasks.
            4. Start Date: Tomorrow (${new Date(Date.now() + 86400000).toISOString().split('T')[0]}).
            5. Schedule "High" priority tasks first.

            Output Format (Strict JSON):
            {
              "scheduled_tasks": [
                {
                  "task_id": "original_task_id",
                  "scheduled_date": "YYYY-MM-DD",
                  "scheduled_time": "HH:MM",
                  "duration_minutes": 60
                }
              ],
              "unscheduled_tasks": [
                {
                  "task_id": "original_task_id",
                  "reason": "Limit exceeded / Conflict"
                }
              ]
            }
        `

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        // precise JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error("No JSON found in response")

        const scheduleData = JSON.parse(jsonMatch[0])

        if (!scheduleData.scheduled_tasks || !Array.isArray(scheduleData.scheduled_tasks)) {
            throw new Error("Invalid response structure")
        }

        return { schedule: scheduleData }

    } catch (error: any) {
        console.error("AI Scheduling Error:", error)
        return { error: error.message || "Failed to schedule tasks" }
    }
}
