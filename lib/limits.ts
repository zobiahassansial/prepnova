import "server-only"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { PLAN_LIMITS, type PlanKey, type FeatureKey, getUpgradePlan } from "@/lib/plan-config"

function currentMonth(): string {
    return new Date().toISOString().slice(0, 7) // "2026-06"
}

export async function getUserPlan(userId: string): Promise<PlanKey> {
    const snap = await adminDb
        .collection("users")
        .doc(userId)
        .collection("subscription")
        .doc("info")
        .get()
    const plan = snap.exists ? (snap.data()?.plan as PlanKey) : "free"
    return (plan in PLAN_LIMITS) ? plan : "free"
}

export async function getUsage(userId: string): Promise<Record<FeatureKey, number>> {
    const month = currentMonth()
    const snap = await adminDb
        .collection("users")
        .doc(userId)
        .collection("usage")
        .doc(month)
        .get()
    const d = snap.exists ? snap.data()! : {}
    return {
        resumes: d.resumes || 0,
        summaries: d.summaries || 0,
        flashcards: d.flashcards || 0,
        interviews: d.interviews || 0,
        scanPages: d.scanPages || 0,
    }
}

export async function checkLimit(
    userId: string,
    feature: FeatureKey,
    amount = 1
): Promise<{ allowed: boolean; used: number; limit: number; error?: string }> {
    const plan = await getUserPlan(userId)
    const limits = PLAN_LIMITS[plan]
    const limit = limits[feature] as number

    if (limit === 0) {
        return {
            allowed: false,
            used: 0,
            limit: 0,
            error: `${feature === "interviews" ? "Interview Prep" : feature === "scanPages" ? "Document Scanner" : feature} is not available on the ${plan === "free" ? "Free" : plan} plan. Upgrade to ${getUpgradePlan(plan)}.`,
        }
    }

    const usage = await getUsage(userId)
    const used = usage[feature]

    if (used + amount > limit) {
        return {
            allowed: false,
            used,
            limit,
            error: `You've used ${used}/${limit} ${feature} this month. Upgrade to ${getUpgradePlan(plan)} for more.`,
        }
    }

    return { allowed: true, used, limit }
}

export async function incrementUsage(userId: string, feature: FeatureKey, amount = 1): Promise<void> {
    const month = currentMonth()
    await adminDb
        .collection("users")
        .doc(userId)
        .collection("usage")
        .doc(month)
        .set({ [feature]: FieldValue.increment(amount) }, { merge: true })
}

export async function decrementUsage(userId: string, feature: FeatureKey, amount = 1): Promise<void> {
    const month = currentMonth()
    await adminDb
        .collection("users")
        .doc(userId)
        .collection("usage")
        .doc(month)
        .set({ [feature]: FieldValue.increment(-amount) }, { merge: true })
}

export { PLAN_LIMITS, getUpgradePlan }
export type { PlanKey, FeatureKey }
