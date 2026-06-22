"use server"

import { auth } from "@/auth"
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
  const session = await auth()
  if (!session?.user?.id) return { error: "Authentication required." }

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
   Strategy: AI handles priority ordering & day assignment.
   Server computes actual times deterministically (no LLM arithmetic).
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
  startDate?: string,
  existingSchedule?: { scheduledTime: string; durationMinutes: number; scheduledDate: string }[]
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Authentication required." }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { error: "GROQ_API_KEY not configured" }
  if (!tasks || tasks.length === 0) return { error: "No tasks available to schedule" }

  try {
    const model = getGroqModel()

    const baseDate = startDate ? new Date(startDate + "T00:00:00") : (() => {
      const d = new Date(); d.setDate(d.getDate() + 1); return d
    })()
    const startDateStr = baseDate.toISOString().split("T")[0]

    // Build a list of already-occupied minutes per day so the AI can see how loaded each day is
    const dayCapacityMinutes = hoursPerDay * 60
    const taskList = tasks.map(t => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      priority: t.priority,
      duration_minutes: t.durationMinutes,
      deadline: t.deadline || null
    }))

    const prompt = `You are a Study Schedule Planner.
Your job is to ASSIGN and ORDER study tasks across days — NOT to calculate clock times.
The server computes actual start times automatically.

SCHEDULE WINDOW:
- Start date: ${startDateStr}
- Days available: ${daysToSchedule}
- Daily capacity: ${dayCapacityMinutes} minutes per day

TASKS TO SCHEDULE (use EXACT ids):
${JSON.stringify(taskList, null, 2)}

ORDERING RULES:
1. High priority tasks → earlier in the day / earlier days
2. Medium priority → after High
3. Low priority → last
4. Group same-subject tasks on the same day when possible
5. Spread tasks across days if total minutes exceed daily capacity
6. Respect deadlines — tasks with closer deadlines go earlier

USER PREFERENCES: "${preferences || "none"}"
Apply preferences where sensible (e.g. "focus on math" = put Math tasks first; "short sessions first" = sort by duration ascending).

OUTPUT — strict JSON, use only ids from the input list:
{
  "ordered_tasks": [
    { "task_id": "EXACT_ID_FROM_INPUT", "day_offset": 0 }
  ],
  "unscheduled_tasks": [
    { "task_id": "EXACT_ID_FROM_INPUT", "reason": "exceeds daily capacity" }
  ]
}
day_offset 0 = first day (${startDateStr}), 1 = second day, etc.
Only use task_ids that appear in the input. Do not invent new ids.`

    const result = await model.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })

    const aiOutput = JSON.parse(result.choices[0]?.message?.content || "{}")

    if (!Array.isArray(aiOutput.ordered_tasks)) {
      throw new Error("AI returned invalid ordering format")
    }

    // Validate task ids — drop any the AI hallucinated
    const validIds = new Set(tasks.map(t => t.id))
    const validOrdered = (aiOutput.ordered_tasks as { task_id: string; day_offset: number }[])
      .filter(item => validIds.has(item.task_id))

    // Compute actual times deterministically — guaranteed no overlaps
    const scheduled_tasks = computeScheduleTimes(validOrdered, tasks, hoursPerDay, baseDate, existingSchedule)

    // Any tasks not placed go to unscheduled
    const scheduledIds = new Set(scheduled_tasks.map(t => t.task_id))
    const unscheduled_tasks = [
      ...(aiOutput.unscheduled_tasks || []).filter((u: any) => validIds.has(u.task_id)),
      ...tasks
        .filter(t => !scheduledIds.has(t.id) && !validOrdered.find(o => o.task_id === t.id))
        .map(t => ({ task_id: t.id, reason: "not assigned by AI" }))
    ]

    return { schedule: { scheduled_tasks, unscheduled_tasks } }

  } catch (error: any) {
    console.error("Task Scheduling Error:", error)
    return { error: error.message || "Failed to schedule tasks" }
  }
}

/**
 * Deterministically assigns clock times to ordered tasks.
 * Guarantees no two tasks overlap and respects daily hour limits.
 */
function computeScheduleTimes(
  orderedTasks: { task_id: string; day_offset: number }[],
  tasks: { id: string; durationMinutes: number }[],
  hoursPerDay: number,
  baseDate: Date,
  existingSchedule?: { scheduledTime: string; durationMinutes: number; scheduledDate: string }[]
): { task_id: string; scheduled_date: string; scheduled_time: string; duration_minutes: number }[] {

  const maxDailyMins = hoursPerDay * 60
  // Track the current "cursor" minute for each day (key = day_offset)
  const cursors: Record<number, number> = {}
  // Track total scheduled minutes per day for the daily cap
  const dailyUsed: Record<number, number> = {}

  // Seed cursors with already-scheduled tasks on the same dates
  if (existingSchedule && existingSchedule.length > 0) {
    for (const existing of existingSchedule) {
      // Only worry about day_offset 0 for now (the target day)
      const existingDate = existing.scheduledDate
      const targetDate = new Date(baseDate).toISOString().split("T")[0]
      if (existingDate !== targetDate) continue

      const [h, m] = existing.scheduledTime.split(":").map(Number)
      const endMin = h * 60 + m + (existing.durationMinutes || 60) + 10
      cursors[0] = Math.max(cursors[0] ?? 8 * 60, endMin)
      dailyUsed[0] = (dailyUsed[0] ?? 0) + (existing.durationMinutes || 60)
    }
  }

  const result: { task_id: string; scheduled_date: string; scheduled_time: string; duration_minutes: number }[] = []

  // Group by day_offset preserving order
  const byDay: Record<number, string[]> = {}
  for (const item of orderedTasks) {
    const d = item.day_offset ?? 0
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(item.task_id)
  }

  for (const dayOffset of Object.keys(byDay).map(Number).sort()) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + dayOffset)
    const dateStr = date.toISOString().split("T")[0]

    let cursor = cursors[dayOffset] ?? 8 * 60   // start at 08:00
    let used = dailyUsed[dayOffset] ?? 0
    let consecutiveMins = 0

    for (const taskId of byDay[dayOffset]) {
      const task = tasks.find(t => t.id === taskId)
      if (!task) continue

      const dur = Math.min(task.durationMinutes || 60, 90)

      // Enforce daily cap
      if (used + dur > maxDailyMins) continue

      // 30-min long break after 3 consecutive hours of study
      if (consecutiveMins >= 180) {
        cursor += 30
        consecutiveMins = 0
      }

      // Don't schedule past 22:00
      if (cursor + dur > 22 * 60) continue

      const h = Math.floor(cursor / 60)
      const m = cursor % 60
      result.push({
        task_id: taskId,
        scheduled_date: dateStr,
        scheduled_time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
        duration_minutes: dur
      })

      // 10-min break between tasks
      cursor += dur + 10
      used += dur
      consecutiveMins += dur + 10
    }
  }

  return result
}