"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, getCountFromServer, query, where } from "firebase/firestore"
import { PlanType, PlanLimits, UsageData, Subscription } from "@/types"

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        resumes: 3,
        summaries: 5,
        flashcards: 3,
        studyPlanner: "basic",
        interviewPrep: false,
        storage: 500 * 1024 * 1024, // 500 MB
    },
    standard: {
        resumes: 10,
        summaries: 15,
        flashcards: 50,
        studyPlanner: "full",
        interviewPrep: false,
        storage: 1 * 1024 * 1024 * 1024, // 1 GB
    },
    pro: {
        resumes: 20,
        summaries: 25,
        flashcards: 9999,
        studyPlanner: "full",
        interviewPrep: true,
        storage: 3 * 1024 * 1024 * 1024, // 3 GB
    },
    lifetime: {
        resumes: 999999,
        summaries: 999999,
        flashcards: 999999,
        studyPlanner: "full",
        interviewPrep: true,
        storage: 3 * 1024 * 1024 * 1024, // 3 GB
    },
}

interface UserPlanState {
    plan: PlanType
    limits: PlanLimits
    usage: UsageData
    subscription: Subscription | null
    loading: boolean
    canAccess: (feature: keyof PlanLimits) => boolean
    isAtLimit: (feature: "resumes" | "summaries" | "flashcards") => boolean
    upgradeRequired: (feature: keyof PlanLimits) => boolean
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

        // Listen to subscription
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

        // Fetch usage counts
        const fetchUsage = async () => {
            try {
                const [resumesSnap, summariesSnap, decksSnap] = await Promise.all([
                    getCountFromServer(query(collection(db, "users", user.uid, "resumes"))),
                    getCountFromServer(query(collection(db, "users", user.uid, "usage", "summaries" as any))),
                    getCountFromServer(query(collection(db, "users", user.uid, "flashcardDecks"))),
                ])

                // Summaries usage stored as doc count in summaries collection
                const summariesCount = await getCountFromServer(
                    query(collection(db, "users", user.uid, "summaries"))
                )

                setUsage({
                    resumes: resumesSnap.data().count,
                    summaries: summariesCount.data().count,
                    flashcards: decksSnap.data().count,
                })
            } catch {
                // Silently handle — usage is non-critical
            } finally {
                setLoading(false)
            }
        }

        fetchUsage()

        return () => {
            subUnsub()
        }
    }, [user])

    const limits = PLAN_LIMITS[plan]

    const canAccess = (feature: keyof PlanLimits): boolean => {
        const val = limits[feature]
        if (typeof val === "boolean") return val
        if (typeof val === "number") return val > 0
        return val === "full"
    }

    const isAtLimit = (feature: "resumes" | "summaries" | "flashcards"): boolean => {
        const used = usage[feature] ?? 0
        const limit = limits[feature] as number
        return used >= limit
    }

    const upgradeRequired = (feature: keyof PlanLimits): boolean => {
        return !canAccess(feature)
    }

    return {
        plan,
        limits,
        usage,
        subscription,
        loading,
        canAccess,
        isAtLimit,
        upgradeRequired,
    }
}
