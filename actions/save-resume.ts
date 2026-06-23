"use server"

import { auth } from "@/auth"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { PLAN_LIMITS } from "@/lib/plan-config"
import type { ResumeData } from "@/types/resume"

function currentMonth(): string {
    return new Date().toISOString().slice(0, 7)
}

export async function saveResume(resumeData: ResumeData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Authentication required." }
    }
    const userId = session.user.id
    const month = currentMonth()

    const usageRef  = adminDb.collection("users").doc(userId).collection("usage").doc(month)
    const subRef    = adminDb.collection("users").doc(userId).collection("subscription").doc("info")
    const flagsRef  = adminDb.collection("users").doc(userId).collection("admin").doc("flags")
    const resumesRef = adminDb.collection("users").doc(userId).collection("resumes")

    try {
        const docId = await adminDb.runTransaction(async (tx) => {
            const [usageSnap, subSnap, flagsSnap] = await Promise.all([
                tx.get(usageRef),
                tx.get(subRef),
                tx.get(flagsRef),
            ])

            const flags = flagsSnap.data() ?? {}
            if (flags.blocked) {
                throw new Error("Account suspended. Contact support.")
            }
            if (Array.isArray(flags.blockedFeatures) && (flags.blockedFeatures as string[]).includes("resumes")) {
                throw new Error("Resume feature is not available on your account.")
            }

            const planRaw = subSnap.exists ? (subSnap.data()?.plan as string) : "free"
            const plan = (planRaw in PLAN_LIMITS) ? planRaw as keyof typeof PLAN_LIMITS : "free"
            const usageData = usageSnap.data() ?? {}
            const used = (usageData.resumes as number) || 0

            // Apply override if set by admin
            const overrides = flags.limitOverrides as Record<string, number> | undefined
            const limit = typeof overrides?.resumes === "number" && overrides.resumes >= 0
                ? overrides.resumes
                : PLAN_LIMITS[plan].resumes

            if (used >= limit) {
                throw new Error(
                    `You've used ${used}/${limit} resumes this month. Upgrade to create more.`
                )
            }

            const newDocRef = resumesRef.doc()
            tx.set(newDocRef, {
                ...(resumeData as object),
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            tx.set(usageRef, { resumes: FieldValue.increment(1) }, { merge: true })

            return newDocRef.id
        })

        return { success: true, id: docId }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to save resume."
        return { success: false, error: message }
    }
}
