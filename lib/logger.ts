import { db } from "@/lib/firebase"
import { addDoc, collection, Timestamp } from "firebase/firestore"

export type ActivityType = "study_session" | "task_complete" | "deck_created" | "resume_created" | "task_created"

export async function logActivity(userId: string, action: ActivityType, details: Record<string, any>, value: number = 0) {
    if (!userId) return

    try {
        await addDoc(collection(db, "activity_logs"), {
            userId,
            action,
            details,
            value,
            createdAt: Timestamp.now()
        })
    } catch (error) {
        console.error("Failed to log activity:", error)
        // Silent failure to not block user flow
    }
}
