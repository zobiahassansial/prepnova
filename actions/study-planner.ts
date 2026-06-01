"use server"

import { adminDb } from "@/lib/firebase-admin"
import { StudyTask, StudyActivityLog, Priority, Difficulty } from "@/types/study-planner"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

// STRICT SCOPE: Only 'study_tasks' and 'study_schedule' are allowing writes.
const TASKS_COLLECTION = "study_tasks"
const SCHEDULE_COLLECTION = "study_schedule"
const LOG_COLLECTION = "study_activity_log"

//Creates a new unscheduled study task.
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

    const task: Omit<StudyTask, "id"> & { orderIndex: number } = {
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
        updatedAt: Timestamp.now() as any,
        orderIndex: Date.now() // Simple default ordering
    }

    const docRef = await adminDb.collection(TASKS_COLLECTION).add(task)
    await logStudyActivity(userId, docRef.id, "created", `Task created: ${data.title}`)
    return docRef.id
}

/**
 * Schedules a task (Drag & Drop or AI).
 * Updates task status and creates/updates schedule entry.
 */
export async function scheduleStudyTask(userId: string, taskId: string, date: Date, time: string, orderIndex?: number) {

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
        durationMinutes: duration,
        orderIndex: orderIndex !== undefined ? orderIndex : Date.now()
    })

    await batch.commit()
}
//Logs activity strictly for the planner module.

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
export async function unscheduleStudyTask(userId: string, scheduleId: string, taskId: string, orderIndex?: number) {
    if (!scheduleId) return;

    const batch = adminDb.batch()

    // 1. Delete Schedule Doc
    const schedRef = adminDb.collection(SCHEDULE_COLLECTION).doc(scheduleId)
    batch.delete(schedRef)

    // 2. Update Task Status
    const taskRef = adminDb.collection(TASKS_COLLECTION).doc(taskId)
    const updateData: any = {
        status: "unscheduled",
        updatedAt: Timestamp.now()
    }
    if (orderIndex !== undefined) {
        updateData.orderIndex = orderIndex
    }

    batch.update(taskRef, updateData)

    await batch.commit()
    await logStudyActivity(userId, taskId, "rescheduled", "Moved to unscheduled")
}

/**
 * Updates the orderIndex of a task or schedule (without changing other fields).
 */
export async function updateTaskOrder(userId: string, id: string, collection: "study_tasks" | "study_schedule", orderIndex: number) {
    await adminDb.collection(collection).doc(id).update({
        orderIndex
    })
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
    // OPTIMIZATION: Query ALL user schedules and filter in memory to avoid "Composite Index" requirements on dev environments.
    // In production with thousands of records, we would add the index. For now, this is safer.

    const q = adminDb.collection(SCHEDULE_COLLECTION)
        .where("userId", "==", userId)

    const snapshot = await q.get()

    // Filter for the specific day in memory
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    for (const docSnap of snapshot.docs) {
        if (excludeScheduleId && docSnap.id === excludeScheduleId) continue

        const data = docSnap.data()

        // Date Check (Memory)
        const scheduledDateRaw = data.scheduledDate
        const sDate = scheduledDateRaw.toDate ? scheduledDateRaw.toDate() : new Date(scheduledDateRaw)
        if (sDate < startOfDay || sDate > endOfDay) continue

        let existingDuration = data.durationMinutes

        // OPTIMIZATION: If durationMinutes is missing (legacy), fetch from task only if needed.
        if (existingDuration === undefined) {
            const taskSnap = await adminDb.collection(TASKS_COLLECTION).doc(data.taskId).get()
            existingDuration = taskSnap.exists ? taskSnap.data()?.durationMinutes : 60
        }

        const existingTime = data.scheduledTime
        const [h, m] = existingTime.split(":").map(Number)

        const existingStart = new Date(sDate)
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

    const snapshot = await q.get()
    let totalMinutes = 0

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data()

        // Date Check (Memory)
        const scheduledDateRaw = data.scheduledDate
        const sDate = scheduledDateRaw.toDate ? scheduledDateRaw.toDate() : new Date(scheduledDateRaw)
        if (sDate < startOfDay || sDate > endOfDay) continue

        let duration = data.durationMinutes
        if (duration === undefined) {
            const taskSnap = await adminDb.collection(TASKS_COLLECTION).doc(data.taskId).get()
            duration = taskSnap.exists ? taskSnap.data()?.durationMinutes : 60
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
 * Clears all tasks for a specific day.
 * Completed tasks → permanently deleted.
 * Incomplete tasks → unscheduled (moved back to the unscheduled pool).
 */
export async function clearDayTasks(userId: string, dateStr: string) {
    const startOfDay = new Date(dateStr + "T00:00:00")
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(dateStr + "T00:00:00")
    endOfDay.setHours(23, 59, 59, 999)

    const schedSnap = await adminDb.collection(SCHEDULE_COLLECTION)
        .where("userId", "==", userId)
        .get()

    const dayDocs = schedSnap.docs.filter(d => {
        const raw = d.data().scheduledDate
        const sd = raw?.toDate ? raw.toDate() : new Date(raw)
        return sd >= startOfDay && sd <= endOfDay
    })

    if (dayDocs.length === 0) return

    const batch = adminDb.batch()

    for (const schedDoc of dayDocs) {
        const { taskId } = schedDoc.data()
        // Always remove the schedule entry
        batch.delete(schedDoc.ref)

        if (taskId) {
            const taskSnap = await adminDb.collection(TASKS_COLLECTION).doc(taskId).get()
            if (taskSnap.exists) {
                const status = taskSnap.data()?.status
                if (status === "completed") {
                    // Permanently delete completed tasks
                    batch.delete(taskSnap.ref)
                } else {
                    // Unschedule incomplete tasks
                    batch.update(taskSnap.ref, { status: "unscheduled", updatedAt: Timestamp.now() })
                }
            }
        }
    }

    await batch.commit()
    await logStudyActivity(userId, "BATCH", "deleted", `Cleared all tasks for ${dateStr}`)
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
