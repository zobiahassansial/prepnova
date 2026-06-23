"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Brain, CheckCircle2, Loader2, ShieldCheck, CreditCard,
    Smartphone, ExternalLink, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { httpsCallable } from "firebase/functions"
import { functions } from "@/lib/firebase"
import { PLAN_PRICES, formatPKR } from "@/lib/safepay"

const PLAN_INFO: Record<string, {
    label: string; monthly: number; yearly: number; yearlySaving: number; features: string[]; color: string
}> = {
    standard: {
        label: "Standard", monthly: PLAN_PRICES.standard.monthlyPKR, yearly: PLAN_PRICES.standard.yearlyPKR, yearlySaving: 3360, color: "text-blue-600",
        features: ["5 Resume Generations / month", "20 AI Summaries / month", "15 Flashcard Decks / month", "Full Study Planner", "Document Scanner (20 pages)", "5 AI Mock Interviews / month"],
    },
    pro: {
        label: "Pro", monthly: PLAN_PRICES.pro.monthlyPKR, yearly: PLAN_PRICES.pro.yearlyPKR, yearlySaving: 6720, color: "text-primary",
        features: ["15 Resume Generations / month", "50 AI Summaries / month", "40 Flashcard Decks / month", "Full Study Planner", "Document Scanner (100 pages)", "10 AI Mock Interviews + live support"],
    },
    max: {
        label: "Max", monthly: PLAN_PRICES.max.monthlyPKR, yearly: PLAN_PRICES.max.yearlyPKR, yearlySaving: 11200, color: "text-yellow-600",
        features: ["30 Resume Generations / month", "120 AI Summaries / month", "100 Flashcard Decks / month", "Full Study Planner", "Document Scanner (300 pages)", "20 AI Mock Interviews + Priority Support"],
    },
}

const PAYMENT_METHODS = [
    {
        key: "card",
        label: "Visa / Mastercard",
        desc: "Credit or debit card",
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true,
    },
    {
        key: "jazzcash",
        label: "JazzCash",
        desc: "Mobile wallet",
        icon: <Smartphone className="h-5 w-5 text-red-500" />,
        enabled: true,
    },
    {
        key: "easypaisa",
        label: "EasyPaisa",
        desc: "Mobile wallet",
        icon: <Smartphone className="h-5 w-5 text-green-600" />,
        enabled: true,
    },
] as const

type PaymentMethodKey = "card" | "jazzcash" | "easypaisa"

function CheckoutContent() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const plan = searchParams.get("plan") || ""
    const initialBilling = (searchParams.get("billing") || "monthly") as "monthly" | "yearly"

    const [billing, setBilling] = useState<"monthly" | "yearly">(initialBilling)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodKey>("card")
    const [loading, setLoading] = useState(false)
    const [paymentPending, setPaymentPending] = useState(false)
    const [popupClosedWithoutResult, setPopupClosedWithoutResult] = useState(false)
    const [verifying, setVerifying] = useState(false)

    const popupRef = useRef<Window | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const trackerTokenRef = useRef<string>("")
    const orderIdRef = useRef<string>("")

    const info = PLAN_INFO[plan]

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?callbackUrl=/checkout?plan=${plan}&billing=${billing}`)
        }
    }, [user, authLoading, plan, billing, router])

    // Listen for postMessage from the callback page (opened in popup)
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin) return
            if (event.data?.type !== "SAFEPAY_CALLBACK") return
            closePending()
            if (event.data.success) {
                const token   = event.data.token   || trackerTokenRef.current
                const sig     = event.data.sig     || ""
                const tracker = event.data.tracker || token
                const qs = new URLSearchParams({ order_id: event.data.orderId || orderIdRef.current, token })
                if (sig)     qs.set("sig",     sig)
                if (tracker) qs.set("tracker", tracker)
                router.push(`/checkout/success?${qs.toString()}`)
            } else {
                toast.error("Payment was cancelled. You have not been charged.")
            }
        }
        window.addEventListener("message", handleMessage)
        return () => window.removeEventListener("message", handleMessage)
    }, [router])

    function closePending() {
        if (pollRef.current) clearInterval(pollRef.current)
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
        popupRef.current = null
        setPaymentPending(false)
        setPopupClosedWithoutResult(false)
    }

    async function handleCheckout() {
        if (!user) return
        setLoading(true)
        setPopupClosedWithoutResult(false)
        try {
            const createPaymentSession = httpsCallable<
                { plan: string; billing: string; paymentMethod: string; appUrl: string },
                { checkoutUrl: string; orderId: string; trackerToken: string }
            >(functions, "createPaymentSession")

            const result = await createPaymentSession({
                plan,
                billing,
                paymentMethod,
                appUrl: window.location.origin,
            })
            const data = result.data

            trackerTokenRef.current = data.trackerToken || ""
            orderIdRef.current = data.orderId || ""

            const popup = window.open(
                data.checkoutUrl,
                "safepay_checkout",
                "width=520,height=740,scrollbars=yes,resizable=yes,left=200,top=100"
            )

            if (!popup) {
                toast.error("Popup was blocked — please allow popups for this site and try again.")
                return
            }

            popupRef.current = popup
            setPaymentPending(true)

            // Detect when popup is closed by the user (without postMessage)
            pollRef.current = setInterval(() => {
                if (popupRef.current?.closed) {
                    if (pollRef.current) clearInterval(pollRef.current)
                    popupRef.current = null
                    setPaymentPending(false)
                    setPopupClosedWithoutResult(true)
                }
            }, 600)
        } catch (err: any) {
            toast.error(err.message || "Could not start checkout. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyPayment() {
        if (!user) return
        setVerifying(true)
        try {
            const verifyPayment = httpsCallable<
                { orderId: string; trackerToken: string },
                { paid: boolean; plan?: string; billing?: string; state?: string }
            >(functions, "verifyPayment")

            await verifyPayment({
                orderId:      orderIdRef.current,
                trackerToken: trackerTokenRef.current,
            })
            router.push(`/checkout/success?order_id=${encodeURIComponent(orderIdRef.current)}&token=${encodeURIComponent(trackerTokenRef.current)}`)
        } catch {
            router.push(`/checkout/success?order_id=${encodeURIComponent(orderIdRef.current)}&token=${encodeURIComponent(trackerTokenRef.current)}`)
        } finally {
            setVerifying(false)
        }
    }

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!info) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 gap-4">
                <p className="text-muted-foreground">Invalid plan selected.</p>
                <Link href="/#pricing"><Button>View Plans</Button></Link>
            </div>
        )
    }

    const price = billing === "yearly" ? info.yearly : info.monthly
    const monthlyEquiv = billing === "yearly" ? Math.round(info.yearly / 12) : info.monthly

    return (
        <>
            {/* Waiting overlay while SafePay popup is open */}
            {paymentPending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <Card className="w-full max-w-sm">
                        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-semibold text-lg">Complete your payment</h3>
                                <p className="text-sm text-muted-foreground">
                                    A SafePay window has opened. Complete your payment there to activate your plan.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full">
                                <Button variant="outline" className="gap-2" onClick={() => popupRef.current?.focus()}>
                                    <ExternalLink className="h-4 w-4" /> Switch to payment window
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={closePending}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Popup was closed without us receiving a success — let user verify manually */}
            {popupClosedWithoutResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <Card className="w-full max-w-sm">
                        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
                            <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-semibold text-lg">Did you complete payment?</h3>
                                <p className="text-sm text-muted-foreground">
                                    The payment window was closed. Click below to check if your payment went through.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full">
                                <Button onClick={handleVerifyPayment} disabled={verifying}>
                                    {verifying
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</>
                                        : "Yes, I completed payment"}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground"
                                    onClick={() => setPopupClosedWithoutResult(false)}>
                                    No, go back
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
                <div className="w-full max-w-lg space-y-4">

                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                            <div className="rounded-lg bg-primary/10 p-1.5"><Brain className="h-5 w-5 text-primary" /></div>
                            PrepNova
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Complete your upgrade</CardTitle>
                            <CardDescription>
                                Upgrading to <span className={cn("font-semibold", info.color)}>{info.label} Plan</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Billing toggle */}
                            <div className="flex rounded-lg border overflow-hidden text-sm font-medium">
                                <button
                                    onClick={() => setBilling("monthly")}
                                    className={cn("flex-1 py-2.5 transition-colors", billing === "monthly" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50")}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBilling("yearly")}
                                    className={cn("flex-1 py-2.5 transition-colors flex items-center justify-center gap-2", billing === "yearly" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50")}
                                >
                                    Yearly
                                    <span className={cn("text-xs rounded-full px-2 py-0.5 font-semibold", billing === "yearly" ? "bg-white/20 text-white" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400")}>
                                        Save {formatPKR(info.yearlySaving)}
                                    </span>
                                </button>
                            </div>

                            {/* Price */}
                            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold">{formatPKR(price)}</span>
                                    <span className="text-muted-foreground pb-1">{billing === "yearly" ? "/ year" : "/ month"}</span>
                                </div>
                                {billing === "yearly" && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        That&apos;s {formatPKR(monthlyEquiv)}/mo. Save {formatPKR(info.yearlySaving)} compared to monthly
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-2">
                                {info.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Payment method selector */}
                            <div className="space-y-3">
                                <p className="text-sm font-medium">Payment Method</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {PAYMENT_METHODS.map(({ key, label, desc, icon, enabled }) => (
                                        <button
                                            key={key}
                                            onClick={() => enabled && setPaymentMethod(key as PaymentMethodKey)}
                                            disabled={!enabled}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                                                !enabled && "opacity-50 cursor-not-allowed",
                                                enabled && paymentMethod === key
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : enabled
                                                    ? "border-border hover:border-primary/40 hover:bg-muted/30"
                                                    : "border-border bg-muted/20"
                                            )}
                                        >
                                            <div className="shrink-0">{icon}</div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium leading-none">{label}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                                            </div>
                                            {enabled && paymentMethod === key && (
                                                <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <Button
                                className="w-full h-12 text-base"
                                onClick={handleCheckout}
                                disabled={loading || paymentPending}
                            >
                                {loading
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening payment window...</>
                                    : `Pay with ${PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}`}
                            </Button>

                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Secured by SafePay · Payment opens in a secure window
                            </div>

                            <p className="text-xs text-center text-muted-foreground">
                                By completing payment you agree to our{" "}
                                <Link href="/terms-of-service" className="underline hover:text-foreground">Terms of Service</Link>.
                                Cancel any time from your dashboard.
                            </p>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-muted-foreground">
                        <Link href="/#pricing" className="hover:text-foreground underline">Back to pricing</Link>
                    </p>
                </div>
            </div>
        </>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    )
}
