"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Plan {
    id: string
    name: string
    monthly: number
    yearly: number
    yearlyMonthly: number // effective per-month when billed yearly
    yearlySaving: number
    description: string
    features: { text: string; included: boolean }[]
    cta: string
    popular?: boolean
    accentClass: string
}

const plans: Plan[] = [
    {
        id: "free",
        name: "Free",
        monthly: 0,
        yearly: 0,
        yearlyMonthly: 0,
        yearlySaving: 0,
        description: "For casual learners to test the platform.",
        accentClass: "border-border/60",
        cta: "Start for Free",
        features: [
            { text: "1 Resume Generation", included: true },
            { text: "3 AI Note Summaries / month (max 1,000 words)", included: true },
            { text: "3 AI Flashcard Decks / month", included: true },
            { text: "Basic Study Planner", included: true },
            { text: "Interview Prep", included: false },
            { text: "Document Scanner", included: false },
        ],
    },
    {
        id: "standard",
        name: "Standard",
        monthly: 5.99,
        yearly: 59.99,
        yearlyMonthly: 4.99,
        yearlySaving: 12,
        description: "For regular coursework and basic organisation.",
        accentClass: "border-border/60",
        cta: "Upgrade to Standard",
        features: [
            { text: "5 Resume Generations / month", included: true },
            { text: "20 AI Note Summaries / month (max 4,000 words)", included: true },
            { text: "15 AI Flashcard Decks / month", included: true },
            { text: "Full Study Planner + Calendar", included: true },
            { text: "Document Scanner (20 pages / month)", included: true },
            { text: "Interview Prep — 5 AI Mock Interviews / month", included: true },
        ],
    },
    {
        id: "pro",
        name: "Pro",
        monthly: 11.99,
        yearly: 119.99,
        yearlyMonthly: 9.99,
        yearlySaving: 24,
        description: "For serious students and active job seekers.",
        accentClass: "border-primary",
        badgeBg: "",
        cta: "Upgrade to Pro",
        popular: true,
        features: [
            { text: "15 Resume Generations / month", included: true },
            { text: "50 AI Note Summaries / month (max 6,000 words)", included: true },
            { text: "40 AI Flashcard Decks / month", included: true },
            { text: "Full Study Planner", included: true },
            { text: "Document Scanner (100 pages / month)", included: true },
            { text: "Interview Prep — 10 AI Mock Interviews + live support", included: true },
        ],
    },
    {
        id: "max",
        name: "Max",
        monthly: 19.99,
        yearly: 199.99,
        yearlyMonthly: 16.66,
        yearlySaving: 40,
        description: "For heavy users needing maximum AI power.",
        accentClass: "border-border/60",
        cta: "Upgrade to Max",
        features: [
            { text: "30 Resume Generations / month", included: true },
            { text: "120 AI Note Summaries / month (max 10,000 words)", included: true },
            { text: "100 AI Flashcard Decks / month", included: true },
            { text: "Full Study Planner", included: true },
            { text: "Document Scanner (300 pages / month)", included: true },
            { text: "Interview Prep — 20 AI Mock Interviews + Priority Support", included: true },
        ],
    },
]

export function PricingCards() {
    const [yearly, setYearly] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const getCardTransform = (index: number): React.CSSProperties => {
        const isHovered = hoveredIndex === index
        const isOther = hoveredIndex !== null && hoveredIndex !== index
        return {
            transform: isHovered
                ? "scale(1.05) translateY(-10px) translateZ(40px)"
                : isOther
                ? "scale(0.96) translateY(4px) translateZ(-20px)"
                : "scale(1) translateY(0) translateZ(0)",
            boxShadow: isHovered
                ? "0 24px 60px rgba(99,102,241,0.30), 0 8px 24px rgba(0,0,0,0.10)"
                : "0 4px 16px rgba(0,0,0,0.06)",
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, opacity 0.35s ease",
            opacity: isOther ? 0.85 : 1,
            willChange: "transform",
        }
    }

    return (
        <div className="flex flex-col items-center gap-10">

            {/* Billing toggle */}
            <div className="flex items-center gap-3 rounded-full border bg-muted/40 px-4 py-2 text-sm">
                <button
                    onClick={() => setYearly(false)}
                    className={cn(
                        "rounded-full px-4 py-1.5 font-medium transition-all",
                        !yearly ? "bg-background shadow text-foreground" : "text-muted-foreground"
                    )}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setYearly(true)}
                    className={cn(
                        "rounded-full px-4 py-1.5 font-medium transition-all flex items-center gap-2",
                        yearly ? "bg-background shadow text-foreground" : "text-muted-foreground"
                    )}
                >
                    Yearly
                    <span className="rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 font-semibold">
                        Save ~2 months
                    </span>
                </button>
            </div>

            {/* Cards */}
            <div
                style={{ perspective: "1200px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full mx-auto items-stretch"
            >
                {plans.map((plan, index) => {
                    const price = yearly && plan.monthly > 0 ? plan.yearlyMonthly : plan.monthly
                    const period = yearly && plan.monthly > 0 ? "/mo, billed yearly" : "/month"

                    return (
                        <div
                            key={plan.id}
                            style={getCardTransform(index)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="relative"
                        >
                            {/* POPULAR badge */}
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-full shadow-lg shadow-primary/30 tracking-wide whitespace-nowrap">
                                    <Zap className="h-3 w-3 fill-primary-foreground" />
                                    MOST POPULAR
                                </div>
                            )}

                            <div className={cn(
                                "flex flex-col h-full rounded-xl border-2 bg-background",
                                plan.accentClass,
                                plan.popular && "shadow-2xl shadow-primary/10",
                            )}>
                                {/* Header */}
                                <div className="p-6 pb-4">
                                    <h3 className={cn(
                                        "text-xl font-bold",
                                        plan.popular ? "text-primary" : "text-foreground"
                                    )}>
                                        {plan.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                                    <div className="mt-4 flex items-end gap-1">
                                        <span className="text-4xl font-bold text-foreground">
                                            {price === 0 ? "$0" : `$${price.toFixed(2)}`}
                                        </span>
                                        <span className="text-sm text-muted-foreground mb-1">{period}</span>
                                    </div>
                                    {yearly && plan.monthly > 0 && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                            Save ~${plan.yearlySaving}/year · ${plan.yearly}/yr total
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <div className="px-6 pb-4 flex-1">
                                    <ul className="space-y-2.5">
                                        {plan.features.map((f) => (
                                            <li key={f.text} className="flex items-start gap-2.5 text-sm">
                                                {f.included ? (
                                                    <CheckCircle2 className={cn(
                                                        "h-4 w-4 mt-0.5 shrink-0",
                                                        plan.popular ? "text-primary" : "text-green-500"
                                                    )} />
                                                ) : (
                                                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                                                )}
                                                <span className={cn(
                                                    f.included ? (plan.popular ? "font-medium" : "text-foreground/80") : "text-muted-foreground/50 line-through"
                                                )}>
                                                    {f.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA */}
                                <div className="p-6 pt-4 mt-auto">
                                    {plan.id === "free" ? (
                                        <Link href="/signup" className="block">
                                            <Button variant="outline" className="w-full rounded-full">
                                                {plan.cta}
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/checkout?plan=${plan.id}&billing=${yearly ? "yearly" : "monthly"}`}
                                            className="block"
                                        >
                                            {plan.id === "standard" && (
                                                <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700">
                                                    {plan.cta}
                                                </Button>
                                            )}
                                            {plan.id === "pro" && (
                                                <Button className="w-full rounded-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95">
                                                    {plan.cta}
                                                </Button>
                                            )}
                                            {plan.id === "max" && (
                                                <Button variant="outline" className="w-full rounded-full border-yellow-500/50 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                                                    {plan.cta}
                                                </Button>
                                            )}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
