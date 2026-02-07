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
  hoursPerDay: number,
  preferences?: string,
  daysToSchedule: number = 1
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

    // Calculate Date Range
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startDateStr = tomorrow.toISOString().split('T')[0] // Format: YYYY-MM-DD

    // Calculate End Date
    const endDate = new Date(tomorrow)
    endDate.setDate(endDate.getDate() + (daysToSchedule - 1)) // If 1 day, end = start
    const endDateStr = endDate.toISOString().split('T')[0]

    const prompt = `
You are a strict Study Planner AI Scheduler.

Your goal is to intelligently schedule the user's existing study tasks
while PREVENTING burnout and overloading.

CURRENT CONTEXT:
- Start Scheduling From: ${startDateStr} (YYYY-MM-DD)
- End Scheduling Date: ${endDateStr} (YYYY-MM-DD)
- Duration: ${daysToSchedule} day(s)
- Daily Limit: ${hoursPerDay} hours
- USER PREFERENCES: "${preferences || "None"}"

CORE RULES (MANDATORY):
- Do NOT create new tasks.
- Do NOT rename tasks.
- Use ONLY the tasks provided.
- Respect user-defined priority strictly:
  1) High priority tasks FIRST
  2) Medium priority tasks NEXT
  3) Low priority tasks LAST
- Maximum task duration = 90 minutes.
- NEVER schedule tasks back-to-back.
- Insert mandatory breaks:
  - Minimum 10 minutes after every task
  - 30 minutes break after 3 continuous hours
- Distribute tasks evenly across the available days if possible, or prioritize earlier days for high priority.
- If "USER PREFERENCES" conflict with rules, try to accommodate preferences within safety limits (e.g., "No breaks" is unsafe, ignore; "Focus on Math" -> prioritize Math).

CRITICAL OVERLAP PREVENTION:
- You MUST calculate time sequentially.
- Start Time of Task B = End Time of Task A + Break.
- NO TWO TASKS CAN HAVE THE SAME START TIME.
- If Task A is 09:00 - 10:00, Task B MUST start at 10:10 or later.
- CRITICAL: You must keep a running counter of time. If Task A is 9:00-10:00, Task B CANNOT start at 9:00. It MUST start at 10:10. Verify every single start time against previous end times.

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
      "reason": "daily limit / conflict / spacing rule / preferences"
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