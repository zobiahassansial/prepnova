"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, CheckCircle2, LayoutDashboard, Loader2, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { doc, onSnapshot } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { db, functions } from "@/lib/firebase"

const PLAN_LABELS: Record<string, string> = {
    standard: "Standard",
    pro: "Pro",
    max: "Max",
}

function SuccessContent() {
    const searchParams = useSearchParams()
    const { user } = useAuth()

    const orderId          = searchParams.get("order_id") || ""
    const trackerToken     = searchParams.get("token")    || searchParams.get("tracker") || ""
    const safepaySignature = searchParams.get("sig")      || ""

    const [billingPaid, setBillingPaid] = useState(false)
    const [subscriptionActive, setSubscriptionActive] = useState(false)
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [timedOut, setTimedOut] = useState(false)
    const [retrying, setRetrying] = useState(false)

    const confirmedRef = useRef(false)

    const knownPlans = ["standard", "pro", "max"]
    const parts = orderId.split("_")
    const planIndex = parts.findIndex(part => knownPlans.includes(part))
    const expectedPlan = planIndex !== -1 ? parts[planIndex] : ""
    const isConfirming = !!(user && orderId) && !subscriptionActive && !timedOut

    useEffect(() => {
        if (!user || !orderId) return

        let stopped = false
        let retryTimer: ReturnType<typeof setTimeout> | null = null

        async function runVerify() {
            if (stopped || confirmedRef.current) return
            try {
                const verifyFn = httpsCallable(functions, "verifyPayment")
                await verifyFn({ orderId, trackerToken, safepaySignature })
            } catch {
                // Firestore listeners remain the source of truth for UI state.
            }
            if (!stopped && !confirmedRef.current) {
                retryTimer = setTimeout(runVerify, 5_000)
            }
        }

        runVerify()

        const unsubscribeSubscription = onSnapshot(
            doc(db, "users", user.uid, "subscription", "info"),
            (snap) => {
                if (stopped) return
                const data = snap.data()
                if (data?.status === "active" && data?.plan && data.plan !== "free") {
                    confirmedRef.current = true
                    if (retryTimer) clearTimeout(retryTimer)
                    setActivePlan(data.plan)
                    setSubscriptionActive(true)
                }
            }
        )

        const unsubscribeBilling = onSnapshot(
            doc(db, "users", user.uid, "billing", orderId),
            (snap) => {
                if (stopped) return
                const data = snap.data()
                if (data?.status === "paid") {
                    setBillingPaid(true)
                }
            }
        )

        const timeout = setTimeout(() => {
            if (!confirmedRef.current) setTimedOut(true)
        }, 120_000)

        return () => {
            stopped = true
            if (retryTimer) clearTimeout(retryTimer)
            clearTimeout(timeout)
            unsubscribeSubscription()
            unsubscribeBilling()
        }
    }, [user, orderId, trackerToken, safepaySignature])

    async function handleManualRetry() {
        if (!user || !orderId) return
        setRetrying(true)
        setTimedOut(false)
        try {
            const verifyFn = httpsCallable(functions, "verifyPayment")
            await verifyFn({ orderId, trackerToken, safepaySignature })
        } catch {
            // ignore — Firestore listener will pick up any update
        } finally {
            setRetrying(false)
            // Give the listener 3 s to pick up a Firestore update before re-arming timeout
            setTimeout(() => {
                if (!confirmedRef.current) setTimedOut(true)
            }, 3_000)
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="flex justify-center">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <div className="rounded-lg bg-primary/10 p-1.5"><Brain className="h-5 w-5 text-primary" /></div>
                        PrepNova
                    </Link>
                </div>

                <Card>
                    <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
                        {subscriptionActive ? (
                            <>
                                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold">Payment confirmed</h1>
                                    <p className="text-muted-foreground">
                                        Your <strong>{PLAN_LABELS[activePlan || ""] || activePlan} Plan</strong> is now active.
                                        New limits are available immediately.
                                    </p>
                                </div>
                            </>
                        ) : isConfirming ? (
                            <>
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold">
                                        {billingPaid ? "Activating your plan" : "Confirming payment"}
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Please wait — your{" "}
                                        {expectedPlan
                                            ? <strong>{PLAN_LABELS[expectedPlan] || expectedPlan} Plan</strong>
                                            : "plan"}{" "}
                                        will activate automatically.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold">Taking longer than expected</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Your payment may still be processing. Click below to check again,
                                        or go to your dashboard — your plan will appear there once confirmed.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleManualRetry}
                                    disabled={retrying}
                                    className="w-full gap-2"
                                >
                                    {retrying
                                        ? <><Loader2 className="h-4 w-4 animate-spin" />Checking...</>
                                        : <><RefreshCw className="h-4 w-4" />Check payment status</>}
                                </Button>
                            </>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                            <Link href="/dashboard" className="flex-1">
                                <Button className="w-full gap-2" variant={subscriptionActive ? "default" : "outline"}>
                                    <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
                                </Button>
                            </Link>
                            <Link href="/dashboard/settings" className="flex-1">
                                <Button variant="outline" className="w-full">View Plan Details</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    Questions? Email us at{" "}
                    <a href="mailto:support@prepnova.online" className="text-primary hover:underline">
                        support@prepnova.online
                    </a>
                </p>
            </div>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
