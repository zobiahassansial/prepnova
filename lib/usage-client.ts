import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, increment } from "firebase/firestore"
import { PLAN_LIMITS, type PlanKey, type FeatureKey } from "@/lib/plan-config"

function currentMonth(): string {
    return new Date().toISOString().slice(0, 7)
}

export async function getUserPlanClient(userId: string): Promise<PlanKey> {
    const snap = await getDoc(doc(db, "users", userId, "subscription", "info"))
    const plan = snap.exists() ? (snap.data()?.plan as PlanKey) : "free"
    return (plan in PLAN_LIMITS) ? plan : "free"
}

export async function checkClientQuota(
    userId: string,
    feature: FeatureKey,
    amount = 1
): Promise<{ allowed: boolean; used: number; limit: number }> {
    const plan = await getUserPlanClient(userId)
    const limit = PLAN_LIMITS[plan][feature] as number

    if (limit === 0) return { allowed: false, used: 0, limit: 0 }

    const month = currentMonth()
    const snap = await getDoc(doc(db, "users", userId, "usage", month))
    const used = snap.exists() ? (snap.data()?.[feature] || 0) : 0

    return { allowed: used + amount <= limit, used, limit }
}

export async function incrementClientUsage(userId: string, feature: FeatureKey, amount = 1): Promise<void> {
    const month = currentMonth()
    await setDoc(doc(db, "users", userId, "usage", month), { [feature]: increment(amount) }, { merge: true })
}
