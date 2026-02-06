
import { Timestamp } from "firebase/firestore"

export type Priority = "High" | "Medium" | "Low"
export type Difficulty = "Easy" | "Medium" | "Hard"
export type TaskStatus = "unscheduled" | "scheduled" | "completed" | "missed"

export interface StudyTask {
    id: string
    userId: string
    title: string
    subject: string
    topic?: string
    priority: Priority
    difficulty: Difficulty
    durationMinutes: number
    status: TaskStatus
    deadline?: Timestamp | null
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface StudySchedule {
    id: string
    userId: string
    taskId: string
    scheduledDate: Timestamp // YYYY-MM-DD (at midnight or generic)
    scheduledTime: string // HH:MM
    durationMinutes: number
}

export interface StudyActivityLog {
    id: string
    userId: string
    taskId: string
    action: "created" | "scheduled" | "completed" | "missed" | "rescheduled" | "started" | "deleted"
    timestamp: Timestamp
    details?: string
}
