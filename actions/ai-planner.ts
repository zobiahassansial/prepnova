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
- Schedule tasks sequentially in the SAME DAY where possible
- Use start times that follow the previous task + break
- Do NOT leave large idle gaps (>45 minutes) unless moving to next day
- NEVER include "(Dev Mode)" or any environment/debug text in task titles


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

Your goal is to intelligently schedule the user's existing study tasks
while PREVENTING burnout and overloading.

CORE RULES (MANDATORY):
- Do NOT create new tasks.
- Do NOT rename tasks.
- Use ONLY the tasks provided.
- Respect user-defined priority strictly:
  1) High priority tasks FIRST
  2) Medium priority tasks NEXT
  3) Low priority tasks LAST
- Maximum daily study limit = 20 hours.
- Maximum task duration = 90 minutes.
- NEVER schedule tasks back-to-back.
- Insert mandatory breaks:
  - Minimum 10 minutes after every task
  - 30 minutes break after 3 continuous hours
- No overlapping tasks.
- Scheduling must start from TOMORROW.
- If a task does not fit due to limits or conflicts, keep it UNSCHEDULED.

ANTI-BURNOUT LOGIC:
- Distribute tasks across days evenly.
- Avoid filling a single day aggressively if future days are available.
- Prefer shorter sessions earlier in the day for high priority tasks.

INPUT TASKS:
${JSON.stringify(tasks, null, 2)}

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "scheduled_tasks": [
    {
      "task_id": "exact_task_id",
      "scheduled_date": "YYYY-MM-DD",
      "scheduled_time": "HH:MM",
      "duration_minutes": 60
    }
  ],
  "unscheduled_tasks": [
    {
      "task_id": "exact_task_id",
      "reason": "daily limit / conflict / spacing rule"
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
