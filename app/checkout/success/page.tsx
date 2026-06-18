"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, CheckCircle2, LayoutDashboard, Loader2 } from "lucide-react"
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

    const orderId = searchParams.get("order_id") || ""
    const trackerToken = searchParams.get("token") || ""

    const [activating, setActivating] = useState(true)
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [timedOut, setTimedOut] = useState(false)

    // Parse expected plan from orderId: {userId}_{plan}_{billing}_{timestamp}
    const KNOWN_PLANS = ["standard", "pro", "max"]
    const parts = orderId.split("_")
    const planIndex = parts.findIndex(p => KNOWN_PLANS.includes(p))
    const expectedPlan = planIndex !== -1 ? parts[planIndex] : ""

    useEffect(() => {
        if (!user || !orderId) {
            setActivating(false)
            return
        }

        // 1. First try the verify Cloud Function (updates Firestore if webhook hasn't fired yet)
        async function runVerify() {
            try {
                const verifyPayment = httpsCallable(functions, "verifyPayment")
                await verifyPayment({ orderId, trackerToken })
            } catch {
                // ignore — Firestore listener below will still catch any update
            }
        }
        runVerify()

        // 2. Listen for subscription update in Firestore (set by webhook or verify endpoint)
        const unsubscribe = onSnapshot(
            doc(db, "users", user.uid, "subscription", "info"),
            (snap) => {
                const data = snap.data()
                if (data?.status === "active" && data?.plan && data.plan !== "free") {
                    setActivePlan(data.plan)
                    setActivating(false)
                }
            }
        )

        // 3. After 30 seconds, stop waiting even if plan hasn't updated
        const timeout = setTimeout(() => {
            setActivating(false)
            setTimedOut(true)
        }, 30_000)

        return () => {
            unsubscribe()
            clearTimeout(timeout)
        }
    }, [user, orderId, trackerToken])

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
                        {activating ? (
                            <>
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold">Activating your plan…</h1>
                                    <p className="text-muted-foreground">
                                        Payment received. Please wait a moment while we activate your{" "}
                                        {expectedPlan ? <strong>{PLAN_LABELS[expectedPlan] || expectedPlan} Plan</strong> : "plan"}.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold">Payment Successful!</h1>
                                    {activePlan ? (
                                        <p className="text-muted-foreground">
                                            Your <strong>{PLAN_LABELS[activePlan] || activePlan} Plan</strong> is now active.
                                            New limits are available immediately.
                                        </p>
                                    ) : timedOut ? (
                                        <p className="text-muted-foreground">
                                            Your payment was received. Your plan will activate within a few minutes.
                                            If it doesn't, contact{" "}
                                            <a href="mailto:support@prepnova.online" className="text-primary underline">
                                                support@prepnova.online
                                            </a>.
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground">
                                            Your subscription has been activated.
                                        </p>
                                    )}
                                </div>

                                {orderId && (
                                    <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md break-all">
                                        Order: {orderId}
                                    </p>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                                    <Link href="/dashboard" className="flex-1">
                                        <Button className="w-full gap-2">
                                            <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/settings" className="flex-1">
                                        <Button variant="outline" className="w-full">View Plan Details</Button>
                                    </Link>
                                </div>
                            </>
                        )}
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
