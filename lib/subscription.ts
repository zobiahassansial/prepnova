import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore"

export const PLANS = {
    free: {
        name: "Free",
        resumeLimit: 3,
        summaryLimit: 5,
        flashcardLimit: 3,
        studyPlanner: "basic"
    },
    standard: {
        name: "Standard",
        resumeLimit: 10,
        summaryLimit: 15,
        flashcardLimit: 1000, // Effectively unlimited or high
        studyPlanner: "full"
    },
    pro: {
        name: "Pro",
        resumeLimit: 20,
        summaryLimit: 25,
        flashcardLimit: 10000,
        studyPlanner: "full"
    },
    lifetime: {
        name: "Lifetime",
        resumeLimit: 999999,
        summaryLimit: 999999,
        flashcardLimit: 999999,
        studyPlanner: "full"
    }
}

export type PlanType = keyof typeof PLANS

export async function getUserSubscription(userId: string) {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) return null
    return userDoc.data()
}

export async function checkAndResetUsage(userId: string) {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) return null

    const data = userDoc.data()
    const now = new Date()
    const resetDate = data.monthlyResetAt ? data.monthlyResetAt.toDate() : null

    // If no date or date passed, reset
    if (!resetDate || now > resetDate) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        
        await updateDoc(userRef, {
            resumeCount: 0,
            summaryCount: 0,
            flashcardCount: 0,
            monthlyResetAt: nextMonth
        })
        return { ...data, resumeCount: 0, summaryCount: 0, flashcardCount: 0 }
    }
    
    return data
}

export async function checkQuota(userId: string, feature: "resume" | "summary" | "flashcard") {
    // Check and reset if needed
    const user = await checkAndResetUsage(userId)
    if (!user) return false

    const plan = (user.plan as PlanType) || "free"
    const limits = PLANS[plan]

    if (!limits) return false // Fallback safety

    let currentUsage = 0
    let limit = 0

    if (feature === "resume") {
        currentUsage = user.resumeCount || 0
        limit = limits.resumeLimit
    } else if (feature === "summary") {
        currentUsage = user.summaryCount || 0
        limit = limits.summaryLimit
    } else if (feature === "flashcard") {
        currentUsage = user.flashcardCount || 0
        limit = limits.flashcardLimit
    }

    return currentUsage < limit
}

export async function incrementQuota(userId: string, feature: "resume" | "summary" | "flashcard") {
    const userRef = doc(db, "users", userId)

    if (feature === "resume") {
        await updateDoc(userRef, { resumeCount: increment(1) })
    } else if (feature === "summary") {
        await updateDoc(userRef, { summaryCount: increment(1) })
    } else if (feature === "flashcard") {
        await updateDoc(userRef, { flashcardCount: increment(1) })
    }
}
