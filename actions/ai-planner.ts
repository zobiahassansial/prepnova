"use server"

import { getGroqModel, GROQ_MODEL } from "@/lib/groq"

/* -------------------------------------------------
   Generate Study Tasks (AI Generate)
   Uses user goal ONLY to create UNSCHEDULED tasks
--------------------------------------------------*/
export async function generateStudyPlan(
  goal: string,
  hoursPerDay: number,
  days: number
) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return { error: "GROQ_API_KEY not configured" }
  }

  try {
    const model = getGroqModel()

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
- Output VALID JSON OBJECT ONLY with a "plan" array

Output format:
{
  "plan": [
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
}
`
    const result = await model.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    const text = result.choices[0]?.message?.content || "{}";

    const data = JSON.parse(text)
    const plan = data.plan

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
  daysToSchedule: number = 1,
  startDate?: string
) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return { error: "GROQ_API_KEY not configured" }
  }

  if (!tasks || tasks.length === 0) {
    return { error: "No tasks available to schedule" }
  }

  try {
    const model = getGroqModel()

    // Calculate Date Range
    let startDateStr: string
    let rangeStart: Date

    if (startDate) {
      startDateStr = startDate
      rangeStart = new Date(startDate)
    } else {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      startDateStr = tomorrow.toISOString().split('T')[0] // Format: YYYY-MM-DD
      rangeStart = tomorrow
    }

    // Calculate End Date
    const endDate = new Date(rangeStart)
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

    const result = await model.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    const text = result.choices[0]?.message?.content || "{}";

    const schedule = JSON.parse(text)

    if (!Array.isArray(schedule.scheduled_tasks)) {
      throw new Error("Invalid scheduling format")
    }

    return { schedule }

  } catch (error: any) {
    console.error("Task Scheduling Error:", error)
    return { error: error.message || "Failed to schedule tasks" }
  }
}