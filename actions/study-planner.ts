"use server"



import { adminDb } from "@/lib/firebase-admin"
import { StudyTask, StudyActivityLog, Priority, Difficulty } from "@/types/study-planner"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

// STRICT SCOPE: Only 'study_tasks' and 'study_schedule' are allowing writes.
const TASKS_COLLECTION = "study_tasks"
const SCHEDULE_COLLECTION = "study_schedule"
const LOG_COLLECTION = "study_activity_log"

/**
 * Creates a new unscheduled study task.
 */
export async function createStudyTask(userId: string, data: {
    title: string
    subject: string
    priority: Priority
    difficulty: Difficulty
    durationMinutes: number
    topic?: string
}) {
    if (data.durationMinutes > 90) {
        throw new Error("Task duration cannot exceed 90 minutes (Atomic Rule)")
    }

    const task: Omit<StudyTask, "id"> = {
        userId,
        title: data.title,
        subject: data.subject,
        topic: data.topic || "",
        priority: data.priority,
        difficulty: data.difficulty,
        durationMinutes: data.durationMinutes,
        status: "unscheduled", // Always starts unscheduled
        deadline: null,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
    }

    const docRef = await adminDb.collection(TASKS_COLLECTION).add(task)
    await logStudyActivity(userId, docRef.id, "created", `Task created: ${data.title}`)
    return docRef.id
}

/**
 * Schedules a task (Drag & Drop or AI).
 * Updates task status and creates/updates schedule entry.
 */
export async function scheduleStudyTask(userId: string, taskId: string, date: Date, time: string) {

    // ✅ REMOVE OLD SCHEDULE FIRST
    const existingQuery = adminDb.collection(SCHEDULE_COLLECTION)
        .where("userId", "==", userId)
        .where("taskId", "==", taskId)

    const existingSnap = await existingQuery.get()
    const batch = adminDb.batch()

    existingSnap.docs.forEach((doc) => {
        batch.delete(doc.ref)
    })

    // ✅ UPDATE TASK STATUS
    const taskRef = adminDb.collection(TASKS_COLLECTION).doc(taskId)
    batch.update(taskRef, {
        status: "scheduled",
        updatedAt: Timestamp.now() as any
    })

    // ✅ ADD NEW SCHEDULE
    const taskSnap = await taskRef.get()
    const taskData = taskSnap.data() as StudyTask
    const duration = taskData?.durationMinutes || 60

    const newScheduleRef = adminDb.collection(SCHEDULE_COLLECTION).doc()
    batch.set(newScheduleRef, {
        userId,
        taskId,
        scheduledDate: Timestamp.fromDate(date) as any,
        scheduledTime: time,
        durationMinutes: duration
    })

    await batch.commit()
}


/**
 * Logs activity strictly for the planner module.
 */
export async function logStudyActivity(
    userId: string,
    taskId: string,
    action: StudyActivityLog["action"],
    details?: string
) {
    // Fire and forget log, but await it to ensure it happens
    await adminDb.collection(LOG_COLLECTION).add({
        userId,
        taskId,
        action,
        timestamp: Timestamp.now(),
        details
    })
}

/**
 * Unschedules a task (removes from schedule, sets status to unscheduled).
 */
export async function unscheduleStudyTask(userId: string, scheduleId: string, taskId: string) {
    if (!scheduleId) return;

    const batch = adminDb.batch()

    // 1. Delete Schedule Doc
    const schedRef = adminDb.collection(SCHEDULE_COLLECTION).doc(scheduleId)
    batch.delete(schedRef)

    // 2. Update Task Status
    const taskRef = adminDb.collection(TASKS_COLLECTION).doc(taskId)
    batch.update(taskRef, {
        status: "unscheduled",
        updatedAt: Timestamp.now()
    })

    await batch.commit()
    await logStudyActivity(userId, taskId, "rescheduled", "Moved to unscheduled")
}

/**
 * Checks for scheduling conflicts.
 * Returns true if there is an overlap.
 */
export async function checkScheduleConflict(userId: string, date: Date, time: string, durationMinutes: number, excludeScheduleId?: string) {
    // 1. Calculate Start/End of new task
    const [hours, mins] = time.split(":").map(Number)
    const newStart = new Date(date)
    newStart.setHours(hours, mins, 0, 0)
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000)

    // 2. Query existing schedule for the day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const q = adminDb.collection(SCHEDULE_COLLECTION)
        .where("userId", "==", userId)
        .where("scheduledDate", ">=", Timestamp.fromDate(startOfDay))
        .where("scheduledDate", "<=", Timestamp.fromDate(endOfDay))

    const snapshot = await q.get()

    for (const docSnap of snapshot.docs) {
        if (excludeScheduleId && docSnap.id === excludeScheduleId) continue

        const data = docSnap.data()
        let existingDuration = data.durationMinutes
        if (!existingDuration) {
            const taskSnap = await adminDb.collection(TASKS_COLLECTION).doc(data.taskId).get()
            if (taskSnap.exists) existingDuration = taskSnap.data()?.durationMinutes
        }

        const existingTime = data.scheduledTime
        const [h, m] = existingTime.split(":").map(Number)
        // Check if it's a Firestore Timestamp or Date
        const scheduledDateRaw = data.scheduledDate
        const existingStart = scheduledDateRaw.toDate ? scheduledDateRaw.toDate() : new Date(scheduledDateRaw)
        existingStart.setHours(h, m, 0, 0)
        const existingEnd = new Date(existingStart.getTime() + (existingDuration || 60) * 60000)

        // Check Overlap
        if (newStart < existingEnd && newEnd > existingStart) {
            return true // Conflict
        }
    }

    return false
}

/**
 * Checks if daily study limit (6 hours) is exceeded.
 */
export async function checkDailyLimit(userId: string, date: Date, addedDurationMinutes: number) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const q = adminDb.collection(SCHEDULE_COLLECTION)
        .where("userId", "==", userId)
        .where("scheduledDate", ">=", Timestamp.fromDate(startOfDay))
        .where("scheduledDate", "<=", Timestamp.fromDate(endOfDay))

    const snapshot = await q.get()
    let totalMinutes = 0

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        let duration = data.durationMinutes
        if (!duration) {
            const taskSnap = await adminDb.collection(TASKS_COLLECTION).doc(data.taskId).get()
            if (taskSnap.exists) duration = taskSnap.data()?.durationMinutes
        }
        totalMinutes += (duration || 0)
    }

    return (totalMinutes + addedDurationMinutes) > (6 * 60)
}

/**
 * Deletes a single task and its schedule entry if exists.
 */
export async function deleteStudyTask(userId: string, taskId: string) {
    // 1. Check/Delete Schedule
    const schedQuery = adminDb.collection(SCHEDULE_COLLECTION)
        .where("userId", "==", userId)
        .where("taskId", "==", taskId)

    const schedSnap = await schedQuery.get()
    const batch = adminDb.batch()

    schedSnap.docs.forEach(d => batch.delete(d.ref))

    // 2. Delete Task
    const taskRef = adminDb.collection(TASKS_COLLECTION).doc(taskId)
    batch.delete(taskRef)

    await batch.commit()
    await logStudyActivity(userId, taskId, "deleted", "Task deleted permanently")
}

/**
 * Deletes ALL scheduled tasks PERMANENTLY.
 * Removes tasks with status='scheduled' AND their schedule entries.
 */
export async function deleteAllScheduledTasks(userId: string) {
    const batch = adminDb.batch()

    // 1. Delete all schedule docs
    const schedQuery = adminDb.collection(SCHEDULE_COLLECTION).where("userId", "==", userId)
    const schedSnap = await schedQuery.get()
    schedSnap.docs.forEach(d => batch.delete(d.ref))

    // 2. Delete all tasks with status='scheduled'
    const taskQuery = adminDb.collection(TASKS_COLLECTION)
        .where("userId", "==", userId)
        .where("status", "==", "scheduled")

    const taskSnap = await taskQuery.get()
    taskSnap.docs.forEach(d => batch.delete(d.ref))

    await batch.commit()
    await logStudyActivity(userId, "BATCH", "deleted", "Deleted all scheduled tasks permanently")
}

/**
 * Deletes ALL unscheduled tasks PERMANENTLY.
 * Removes tasks with status='unscheduled'.
 */
export async function deleteAllUnscheduledTasks(userId: string) {
    const batch = adminDb.batch()

    // 1. Delete all tasks with status='unscheduled'
    const taskQuery = adminDb.collection(TASKS_COLLECTION)
        .where("userId", "==", userId)
        .where("status", "==", "unscheduled")

    const taskSnap = await taskQuery.get()
    taskSnap.docs.forEach(d => batch.delete(d.ref))

    await batch.commit()
    await logStudyActivity(userId, "BATCH", "deleted", "Deleted all unscheduled tasks")
}
