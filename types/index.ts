import { Timestamp } from "firebase/firestore"

// ─── User ─────────────────────────────────────────────────────────────────────
export interface UserProfile {
    uid: string
    name: string
    email: string
    role: "Student" | "Professional" | "Lifelong Learner"
    photoURL?: string
    streak: number
    createdAt?: Timestamp
    updatedAt?: Timestamp
    emailNotifs?: boolean
    pushNotifs?: boolean
    weeklyReport?: boolean
    taskReminders?: boolean
    featureAnnouncements?: boolean
    studyTarget?: number // weekly hours
    language?: string
    theme?: "dark" | "light" | "system"
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export type PlanType = "free" | "standard" | "pro" | "max" | "lifetime"

export interface Subscription {
    plan: PlanType
    status?: "active" | "canceled" | "past_due"
    currentPeriodEnd?: Timestamp
    cancelAtPeriodEnd?: boolean
}

export interface PlanLimits {
    resumes: number
    summaries: number
    flashcards: number
    studyPlanner: "basic" | "full"
    interviewPrep: boolean
    storage: number // bytes
}

export interface UsageData {
    resumes?: number
    summaries?: number
    flashcards?: number
    storageBytes?: number
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export type ActivityType =
    | "study_session"
    | "task_complete"
    | "deck_created"
    | "deck_reviewed"
    | "resume_created"
    | "resume_saved"
    | "summary_generated"
    | "doc_scanned"

export interface ActivityLog {
    id?: string
    type: ActivityType
    description: string
    icon?: string
    timestamp: Timestamp
    userId: string
    metadata?: Record<string, any>
}

// ─── Study ─────────────────────────────────────────────────────────────────────
export interface StudySession {
    id?: string
    userId: string
    durationMinutes: number
    subject?: string
    timestamp: Timestamp
}

export interface StudyTarget {
    value: number // hours per week
}

// ─── Tasks ─────────────────────────────────────────────────────────────────────
export type TaskPriority = "high" | "medium" | "low"

export interface Task {
    id?: string
    userId: string
    title: string
    description?: string
    completed: boolean
    completedAt?: Timestamp
    dueDate?: Timestamp
    priority: TaskPriority
    subject?: string
    createdAt: Timestamp
}

// ─── Flashcards ───────────────────────────────────────────────────────────────
export interface FlashcardItem {
    id: string
    front: string
    back: string
    interval: number
    repetition: number
    easeFactor: number
    nextReviewDate: Date | Timestamp
    status: "learning" | "reviewing" | "mastered"
}

export interface FlashcardDeck {
    id?: string
    userId?: string
    title: string
    sourceFileId?: string
    cards: FlashcardItem[]
    createdAt: Timestamp
    lastStudied?: Timestamp | null
}

// ─── Summaries ────────────────────────────────────────────────────────────────
export interface Summary {
    id?: string
    userId: string
    fileName: string
    fileUrl: string
    fileType: string
    title: string
    emoji?: string
    summary: string
    keyPoints: string[]
    actionItems?: string[]
    extractedText?: string
    createdAt: Timestamp
}

// ─── Resumes ──────────────────────────────────────────────────────────────────
export interface ResumeMetadata {
    id?: string
    userId: string
    title: string
    template: string
    createdAt: Timestamp
    updatedAt?: Timestamp
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export interface BillingRecord {
    id?: string
    amount: number
    currency: string
    plan: PlanType
    date: Timestamp
    status: "paid" | "refunded" | "failed"
}

// ─── Chart Data ───────────────────────────────────────────────────────────────
export interface ChartDataPoint {
    name: string
    total: number
}
