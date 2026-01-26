import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, increment, updateDoc } from "firebase/firestore"

export const PLAN_LIMITS = {
    free: {
        resumes: 3,
        summaries: 5,
        flashcards: 3,
        studyPlanner: "basic",
        interviewPrep: false
    },
    standard: {
        resumes: 10,
        summaries: 15,
        flashcards: 50, // "Flashcards AI generation" implied access + reasonable limit
        studyPlanner: "full",
        interviewPrep: false
    },
    pro: {
        resumes: 20,
        summaries: 25,
        flashcards: 9999,
        studyPlanner: "full",
        interviewPrep: true
    },
    lifetime: {
        resumes: 999999,
        summaries: 999999,
        flashcards: 999999,
        studyPlanner: "full",
        interviewPrep: true
    }
}

export async function getUserSubscription(userId: string) {
    const subRef = doc(db, "users", userId, "subscription", "info")
    const snap = await getDoc(subRef)

    if (snap.exists()) {
        return snap.data() // { plan: 'free', ... }
    } else {
        // Default to free
        return { plan: "free" }
    }
}

export async function checkLimit(userId: string, feature: "resumes" | "summaries" | "flashcards") {
    const sub = await getUserSubscription(userId)
    const plan = sub.plan || "free"
    const limit = (PLAN_LIMITS as any)[plan]?.[feature] || 0

    // Get current usage
    const usageRef = doc(db, "users", userId, "usage", feature)
    const usageSnap = await getDoc(usageRef)
    const used = usageSnap.exists() ? usageSnap.data().count : 0

    if (used >= limit) {
        return { allowed: false, error: `Upgrade to ${plan === 'free' ? 'Standard' : 'Pro'} to get more ${feature}.` }
    }

    return { allowed: true, remaining: limit - used }
}

export async function incrementUsage(userId: string, feature: "resumes" | "summaries" | "flashcards") {
    const usageRef = doc(db, "users", userId, "usage", feature)
    // Use setDoc with merge to handle creation if missing
    await setDoc(usageRef, { count: increment(1) }, { merge: true })
}
