"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CheckCircle2, Zap, Loader2 } from "lucide-react"
import { useUserPlan } from "@/hooks/useUserPlan"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PLAN_PRICES, formatPKR } from "@/lib/safepay"

const PLANS = [
    {
        key: "free",
        label: "Free",
        desc: "Essential basics",
        monthlyPKR: null as number | null,
        features: [
            "1 Resume Generation / month",
            "3 AI Summaries / month",
            "3 Flashcard Decks",
            "Basic Study Planner",
        ],
        cardClass: "border-muted",
        titleClass: "",
        iconClass: "text-green-500",
        highlight: false,
    },
    {
        key: "standard",
        label: "Standard",
        desc: "For serious students",
        monthlyPKR: PLAN_PRICES.standard.monthlyPKR,
        features: [
            "5 Resume Generations / month",
            "20 AI Summaries / month",
            "15 Flashcard Decks / month",
            "Full Study Planner",
            "Document Scanner (20 pages)",
            "5 AI Mock Interviews / month",
        ],
        cardClass: "border-blue-200 dark:border-blue-800 hover:border-blue-500/50",
        titleClass: "text-blue-600 dark:text-blue-400",
        iconClass: "text-blue-500",
        highlight: false,
    },
    {
        key: "pro",
        label: "Pro",
        desc: "Maximum potential",
        monthlyPKR: PLAN_PRICES.pro.monthlyPKR,
        features: [
            "15 Resume Generations / month",
            "50 AI Summaries / month",
            "40 Flashcard Decks / month",
            "Full Study Planner",
            "Document Scanner (100 pages)",
            "10 AI Mock Interviews + live support",
        ],
        cardClass: "border-primary shadow-lg",
        titleClass: "",
        iconClass: "text-primary",
        highlight: true,
    },
    {
        key: "max",
        label: "Max",
        desc: "Unlimited power",
        monthlyPKR: PLAN_PRICES.max.monthlyPKR,
        features: [
            "30 Resume Generations / month",
            "120 AI Summaries / month",
            "100 Flashcard Decks / month",
            "Full Study Planner",
            "Document Scanner (300 pages)",
            "20 AI Mock Interviews + Priority Support",
        ],
        cardClass: "border-yellow-500/50",
        titleClass: "text-yellow-600 dark:text-yellow-400",
        iconClass: "text-yellow-500",
        highlight: false,
    },
] as const

const PLAN_ORDER = ["free", "standard", "pro", "max", "lifetime"] as const

export default function SubscriptionPage() {
    const { plan: currentPlan, loading } = useUserPlan()
    const router = useRouter()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const currentIndex = PLAN_ORDER.indexOf(currentPlan as typeof PLAN_ORDER[number])

    return (
        <div className="container max-w-6xl py-10 space-y-10">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Choose Your Success Path</h1>
                <p className="text-xl text-muted-foreground">
                    Unlock the full potential of your study, career, and interview prep.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 group">
                {PLANS.map((p) => {
                    const planIndex = PLAN_ORDER.indexOf(p.key)
                    const isCurrent = currentPlan === p.key
                    const isBelow = planIndex < currentIndex
                    const isAbove = planIndex > currentIndex

                    return (
                        <Card
                            key={p.key}
                            className={cn(
                                "flex flex-col relative transition-all duration-300 ease-in-out",
                                p.cardClass,
                                p.highlight
                                    ? "transform scale-105 z-10 group-hover:!scale-95 group-hover:opacity-60 hover:!scale-110 hover:!opacity-100 hover:!z-50 hover:shadow-2xl"
                                    : "group-hover:scale-95 group-hover:opacity-60 hover:!scale-105 hover:!opacity-100 hover:!z-50 hover:shadow-2xl"
                            )}
                        >
                            {p.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                                        MOST POPULAR
                                    </Badge>
                                </div>
                            )}
                            {isCurrent && (
                                <div className="absolute top-3 right-3">
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className={cn("text-xl flex items-center gap-2", p.titleClass)}>
                                    {p.label}
                                    {p.highlight && (
                                        <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    )}
                                </CardTitle>
                                <CardDescription>{p.desc}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">
                                        {p.monthlyPKR != null ? formatPKR(p.monthlyPKR) : "PKR 0"}
                                    </span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <ul className="space-y-3 text-sm">
                                    {p.features.map(f => (
                                        <li key={f} className="flex items-start gap-2">
                                            {p.highlight
                                                ? <CheckCircle2 className={cn("h-4 w-4 shrink-0 mt-px", p.iconClass)} />
                                                : <Check className={cn("h-4 w-4 shrink-0 mt-px", p.iconClass)} />
                                            }
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                {isCurrent ? (
                                    <Button className="w-full" variant="outline" disabled>
                                        Current Plan
                                    </Button>
                                ) : isBelow || p.key === "free" ? (
                                    <Button className="w-full" variant="outline" disabled>
                                        Downgrade
                                    </Button>
                                ) : (
                                    <Button
                                        className={cn(
                                            "w-full",
                                            p.key === "standard" && "bg-blue-600 hover:bg-blue-700",
                                            p.key === "max" && "bg-yellow-600 hover:bg-yellow-700 text-white"
                                        )}
                                        size={p.highlight ? "lg" : "default"}
                                        onClick={() =>
                                            router.push(`/checkout?plan=${p.key}&billing=monthly`)
                                        }
                                    >
                                        {`Upgrade to ${p.label}`}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            <div className="bg-muted p-8 rounded-lg text-center max-w-3xl mx-auto space-y-4">
                <h3 className="font-semibold">Enterprise or Institution?</h3>
                <p className="text-sm text-muted-foreground">
                    Get custom pricing for your university or organization.
                </p>
                <Button variant="outline" asChild>
                    <a href="mailto:support@prepnova.online">Contact Sales</a>
                </Button>
            </div>
        </div>
    )
}
