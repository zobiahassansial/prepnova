"use server"

import { getGeminiModel } from "@/lib/gemini"

/* -------------------------------------------------
   Generate Study Tasks (AI Generate)
   Uses user goal ONLY to create UNSCHEDULED tasks
--------------------------------------------------*/
export async function generateStudyPlan(
    goal: string,
    hoursPerDay: number,
    days: number
) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
        return { error: "GEMINI_API_KEY not configured" }
    }

    try {
        const model = getGeminiModel()

        const prompt = `
You are a strict Study Planner AI.

Goal: "${goal}"
Duration: ${days} days
Daily Limit: ${hoursPerDay} hours

RULES:
- Generate ATOMIC study tasks only
- Max 90 minutes per task
- Priority must be: "High", "Medium", or "Low"
- Difficulty must be: "Easy", "Medium", or "Hard"
- Do NOT schedule tasks
- All tasks MUST be UNSCHEDULED initially
- Output VALID JSON ARRAY ONLY

Output format:
[
  {
    "title": "Task title",
    "subject": "Subject",
    "topic": "Specific topic",
    "priority": "High",
    "difficulty": "Medium",
    "durationMinutes": 60,
    "dayOffset": -1
  }
]
`

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            throw new Error("Invalid AI response: JSON array not found")
        }

        const plan = JSON.parse(jsonMatch[0])

        if (!Array.isArray(plan)) {
            throw new Error("AI response is not an array")
        }

        return { plan }

    } catch (error: any) {
        console.error("Study Plan Generation Error:", error)
        return { error: error.message || "Failed to generate study plan" }
    }
}

/* -------------------------------------------------
   Schedule EXISTING User Tasks
--------------------------------------------------*/
export async function scheduleUserTasks(
    tasks: {
        id: string
        title: string
        subject: string
        priority: "High" | "Medium" | "Low"
        durationMinutes: number
        deadline?: string
    }[],
    hoursPerDay: number
) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
        return { error: "GEMINI_API_KEY not configured" }
    }

    if (!tasks || tasks.length === 0) {
        return { error: "No tasks available to schedule" }
    }

    try {
        const model = getGeminiModel()

        const prompt = `
You are a strict Study Planner AI Scheduler.

GOAL: create an optimal study schedule for the user based on their specific tasks.

RULES:
- You will receive a list of tasks. Some might already be scheduled, some unscheduled.
- You must RE-EVALUATE the entire schedule for the provided tasks.
- Schedule ONLY the tasks provided.
- Do NOT create new tasks.
- Do NOT rename tasks.
- Max 20 study hours per day.
- Max 90 minutes per task.
- No overlapping tasks.
- Start scheduling from TOMORROW.
- Higher priority tasks ("High") should be scheduled earlier or on sooner days.
- Tasks that do not fit the constraints must be listed in "unscheduled_tasks".

Input Tasks:
${JSON.stringify(tasks, null, 2)}

Output STRICT JSON ONLY:
{
  "scheduled_tasks": [
    {
      "task_id": "exact_task_id_from_input",
      "scheduled_date": "YYYY-MM-DD",
      "scheduled_time": "HH:MM",
      "duration_minutes": 60
    }
  ],
  "unscheduled_tasks": [
    {
      "task_id": "exact_task_id_from_input"
    }
  ]
}
`

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("Invalid AI response: JSON object not found")
        }

        const schedule = JSON.parse(jsonMatch[0])

        if (!Array.isArray(schedule.scheduled_tasks)) {
            throw new Error("Invalid scheduling format")
        }

        return { schedule }

    } catch (error: any) {
        console.error("Task Scheduling Error:", error)
        return { error: error.message || "Failed to schedule tasks" }
    }
}
