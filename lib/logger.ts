import { db } from "@/lib/firebase"
import { addDoc, collection, Timestamp } from "firebase/firestore"

export type ActivityType = "study_session" | "task_complete" | "deck_created" | "deck_reviewed" | "resume_created" | "resume_saved" | "summary_generated" | "doc_scanned" | "task_created" | "interview_practice"

export async function logActivity(userId: string, type: ActivityType, description: string, extraData: Record<string, any> = {}) {
    if (!userId) return

    try {
        await addDoc(collection(db, "users", userId, "activityLog"), {
            type,
            description,
            ...extraData,
            timestamp: Timestamp.now()
        })
    } catch (error) {
        console.error("Failed to log activity:", error)
        // Silent failure to not block user flow
    }
}
