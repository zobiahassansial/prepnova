"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, getDoc } from "firebase/firestore"
import { PlanType, PlanLimits, UsageData, Subscription } from "@/types"

// Plan limits matching lib/plan-config.ts — kept here for client-side use
const PLAN_LIMITS: Record<string, PlanLimits> = {
    free: {
        resumes: 1,
        summaries: 3,
        flashcards: 3,
        studyPlanner: "basic",
        interviewPrep: false,
        storage: 500 * 1024 * 1024,
    },
    standard: {
        resumes: 5,
        summaries: 20,
        flashcards: 15,
        studyPlanner: "full",
        interviewPrep: true,
        storage: 1 * 1024 * 1024 * 1024,
    },
    pro: {
        resumes: 15,
        summaries: 50,
        flashcards: 40,
        studyPlanner: "full",
        interviewPrep: true,
        storage: 3 * 1024 * 1024 * 1024,
    },
    max: {
        resumes: 30,
        summaries: 120,
        flashcards: 100,
        studyPlanner: "full",
        interviewPrep: true,
        storage: 3 * 1024 * 1024 * 1024,
    },
    lifetime: {
        resumes: 999999,
        summaries: 999999,
        flashcards: 999999,
        studyPlanner: "full",
        interviewPrep: true,
        storage: 3 * 1024 * 1024 * 1024,
    },
}

const FREE_LIMITS = PLAN_LIMITS.free

interface UserPlanState {
    plan: PlanType
    limits: PlanLimits
    usage: UsageData
    subscription: Subscription | null
    loading: boolean
    canAccess: (feature: keyof PlanLimits) => boolean
    isAtLimit: (feature: "resumes" | "summaries" | "flashcards") => boolean
    upgradeRequired: (feature: keyof PlanLimits) => boolean
    subscriptionStatus?: string
    isPremium?: boolean
    isPro?: boolean
    canUseAI?: boolean
}

export function useUserPlan(): UserPlanState {
    const { user } = useAuth()
    const [plan, setPlan] = useState<PlanType>("free")
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [usage, setUsage] = useState<UsageData>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        // Listen to subscription in real-time
        const subUnsub = onSnapshot(
            doc(db, "users", user.uid, "subscription", "info"),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data() as Subscription
                    setPlan((data.plan as PlanType) || "free")
                    setSubscription(data)
                } else {
                    setPlan("free")
                    setSubscription(null)
                }
            },
            () => {
                setPlan("free")
                setSubscription(null)
            }
        )

        // Read monthly usage from users/{uid}/usage/{YYYY-MM}
        const fetchUsage = async () => {
            try {
                const month = new Date().toISOString().slice(0, 7)
                const usageSnap = await getDoc(doc(db, "users", user.uid, "usage", month))
                if (usageSnap.exists()) {
                    const d = usageSnap.data()
                    setUsage({
                        resumes: d.resumes || 0,
                        summaries: d.summaries || 0,
                        flashcards: d.flashcards || 0,
                    })
                } else {
                    setUsage({ resumes: 0, summaries: 0, flashcards: 0 })
                }
            } catch {
                setUsage({ resumes: 0, summaries: 0, flashcards: 0 })
            } finally {
                setLoading(false)
            }
        }

        fetchUsage()

        return () => subUnsub()
    }, [user])

    const currentLimits: PlanLimits = PLAN_LIMITS[plan] ?? FREE_LIMITS

    const canAccess = (feature: keyof PlanLimits): boolean => {
        const val = currentLimits[feature]
        if (typeof val === "boolean") return val
        if (typeof val === "number") return val > 0
        return val === "full"
    }

    const isAtLimit = (feature: "resumes" | "summaries" | "flashcards"): boolean => {
        const used = usage[feature] ?? 0
        const limit = currentLimits[feature] as number
        return used >= limit
    }

    const upgradeRequired = (feature: keyof PlanLimits): boolean => !canAccess(feature)

    const isPremium = plan !== "free"
    const isPro = plan === "pro" || plan === "max" || plan === "lifetime"

    return {
        plan,
        limits: currentLimits,
        usage,
        subscription,
        loading,
        canAccess,
        isAtLimit,
        upgradeRequired,
        isPremium,
        isPro,
        canUseAI: isPro,
        subscriptionStatus: subscription?.status,
    }
}
