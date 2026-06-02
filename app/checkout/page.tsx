"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle2, Loader2, ShieldCheck, CreditCard, Smartphone } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PLAN_INFO: Record<string, {
    label: string
    monthly: number
    yearly: number
    yearlySaving: number
    features: string[]
    color: string
}> = {
    standard: {
        label: "Standard",
        monthly: 5.99,
        yearly: 59.99,
        yearlySaving: 12,
        color: "text-blue-600",
        features: ["5 Resume Generations / month", "20 AI Summaries / month", "15 Flashcard Decks / month", "Full Study Planner", "Document Scanner (20 pages)", "5 AI Mock Interviews / month"],
    },
    pro: {
        label: "Pro",
        monthly: 11.99,
        yearly: 119.99,
        yearlySaving: 24,
        color: "text-primary",
        features: ["15 Resume Generations / month", "50 AI Summaries / month", "40 Flashcard Decks / month", "Full Study Planner", "Document Scanner (100 pages)", "10 AI Mock Interviews + live support"],
    },
    max: {
        label: "Max",
        monthly: 19.99,
        yearly: 199.99,
        yearlySaving: 40,
        color: "text-yellow-600",
        features: ["30 Resume Generations / month", "120 AI Summaries / month", "100 Flashcard Decks / month", "Full Study Planner", "Document Scanner (300 pages)", "20 AI Mock Interviews + Priority Support"],
    },
}

function CheckoutContent() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const plan = searchParams.get("plan") || ""
    const initialBilling = (searchParams.get("billing") || "monthly") as "monthly" | "yearly"

    const [billing, setBilling] = useState<"monthly" | "yearly">(initialBilling)
    const [loading, setLoading] = useState(false)

    const info = PLAN_INFO[plan]

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?callbackUrl=/checkout?plan=${plan}&billing=${billing}`)
        }
    }, [user, authLoading, plan, billing, router])

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
    const monthlyEquiv = billing === "yearly" ? (info.yearly / 12).toFixed(2) : info.monthly.toFixed(2)

    async function handleCheckout() {
        if (!user) return
        setLoading(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/checkout/create", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ plan, billing }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Checkout failed")
            // Redirect to SafePay hosted checkout
            window.location.href = data.checkoutUrl
        } catch (err: any) {
            toast.error(err.message || "Could not start checkout. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <div className="rounded-lg bg-primary/10 p-1.5"><Brain className="h-5 w-5 text-primary" /></div>
                        PrepNova
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Complete your upgrade</CardTitle>
                        <CardDescription>You're upgrading to <span className={cn("font-semibold", info.color)}>{info.label} Plan</span></CardDescription>
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
                                    Save ${info.yearlySaving}
                                </span>
                            </button>
                        </div>

                        {/* Price */}
                        <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold">${price.toFixed(2)}</span>
                                <span className="text-muted-foreground pb-1">{billing === "yearly" ? "/ year" : "/ month"}</span>
                            </div>
                            {billing === "yearly" && (
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    That's ${monthlyEquiv}/mo — save ${info.yearlySaving} compared to monthly
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

                        {/* Payment methods info */}
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accepted Payment Methods</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Smartphone className="h-3.5 w-3.5" /> JazzCash
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Smartphone className="h-3.5 w-3.5" /> EasyPaisa
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CreditCard className="h-3.5 w-3.5" /> Visa / Mastercard
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CreditCard className="h-3.5 w-3.5" /> Bank Transfer
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <Button className="w-full h-12 text-base" onClick={handleCheckout} disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting to SafePay...</> : "Pay with SafePay"}
                        </Button>

                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Secured by SafePay · Payments processed on SafePay's servers
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
