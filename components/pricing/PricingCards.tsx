"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Star } from "lucide-react"

interface PricingPlan {
    id: string
    name: string
    price: string
    period: string
    description: string
    features: string[]
    cta: string
    ctaHref: string
    highlight?: boolean
    badge?: string
    badgeColor?: string
    cardBorder?: string
    cardBg?: string
    nameColor?: string
    ctaVariant?: "default" | "outline" | "blue" | "yellow"
    checkColor?: string
}

const plans: PricingPlan[] = [
    {
        id: "free",
        name: "Free",
        price: "$0",
        period: "/mo",
        description: "For casual learners",
        features: [
            "3 Resume Generations",
            "5 AI Summaries / month",
            "3 Flashcard Decks",
            "Basic Study Planner",
        ],
        cta: "Start for Free",
        ctaHref: "/signup",
        ctaVariant: "outline",
        cardBorder: "border-border/60",
        checkColor: "text-green-500",
    },
    {
        id: "standard",
        name: "Standard",
        price: "$7",
        period: "/mo",
        description: "For serious students",
        features: [
            "10 Resume Generations",
            "15 AI Summaries / month",
            "Full Study Planner",
            "Flashcards AI Generation",
        ],
        cta: "Upgrade to Standard",
        ctaHref: "/signup",
        ctaVariant: "blue",
        cardBorder: "border-blue-200 dark:border-blue-800",
        nameColor: "text-blue-600 dark:text-blue-400",
        checkColor: "text-blue-500",
    },
    {
        id: "pro",
        name: "Pro",
        price: "$15",
        period: "/mo",
        description: "Unlock full power",
        features: [
            "20 Resume Generations",
            "25 AI Summaries / month",
            "Interview Prep Access",
            "All AI features",
            "Priority Support",
        ],
        cta: "Upgrade to Pro",
        ctaHref: "/signup",
        ctaVariant: "default",
        highlight: true,
        badge: "POPULAR",
        cardBorder: "border-primary",
        nameColor: "text-primary",
        checkColor: "text-primary",
    },
    {
        id: "lifetime",
        name: "Lifetime",
        price: "$199",
        period: "/once",
        description: "Pay once, own forever",
        features: [
            "Unlimited Resumes",
            "Unlimited Summaries",
            "Unlimited Flashcards",
            "Unlimited Study Planner",
            "Unlimited Interview Prep",
            "Future Updates",
        ],
        cta: "Get Lifetime Access",
        ctaHref: "/signup",
        ctaVariant: "yellow",
        cardBorder: "border-yellow-400/30",
        cardBg: "bg-yellow-50/30 dark:bg-yellow-900/10",
        nameColor: "text-foreground",
        checkColor: "text-yellow-600",
    },
]

export function PricingCards() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const getCardTransform = (index: number): React.CSSProperties => {
        const isHovered = hoveredIndex === index
        const isOther = hoveredIndex !== null && hoveredIndex !== index

        return {
            transform: isHovered
                ? "scale(1.05) translateY(-10px) translateZ(40px)"
                : isOther
                ? "scale(0.96) translateY(4px) translateZ(-20px)"
                : "scale(1) translateY(0px) translateZ(0px)",
            boxShadow: isHovered
                ? "0 24px 60px rgba(99, 102, 241, 0.35), 0 8px 24px rgba(0,0,0,0.12)"
                : isOther
                ? "0 2px 8px rgba(0,0,0,0.04)"
                : "0 4px 16px rgba(0,0,0,0.06)",
            transition:
                "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, opacity 0.35s ease",
            opacity: isOther ? 0.85 : 1,
            overflow: "visible",
            willChange: "transform",
        }
    }

    return (
        <div
            style={{ perspective: "1200px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-stretch"
        >
            {plans.map((plan, index) => (
                <div
                    key={plan.id}
                    style={getCardTransform(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="relative"
                >
                    {/* POPULAR badge — rendered outside card to avoid clipping */}
                    {plan.badge && (
                        <div className="absolute -top-3 right-4 z-20 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-full shadow-lg shadow-primary/30 tracking-wide">
                            {plan.badge}
                        </div>
                    )}

                    {/* Card */}
                    <div
                        className={`
                            flex flex-col h-full rounded-xl border-2 bg-background
                            ${plan.cardBorder || "border-border/60"}
                            ${plan.cardBg || ""}
                            ${plan.highlight ? "shadow-2xl" : "shadow-sm"}
                        `}
                    >
                        {/* Header */}
                        <div className="p-6 pb-4">
                            <h3 className={`text-xl font-bold flex items-center gap-2 ${plan.nameColor || "text-foreground"}`}>
                                {plan.name}
                                {plan.id === "lifetime" && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                            </div>
                        </div>

                        {/* Features — flex-1 pushes CTA to bottom */}
                        <div className="px-6 pb-4 flex-1">
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm">
                                        <CheckCircle2
                                            className={`h-4 w-4 shrink-0 ${plan.checkColor || "text-green-500"} ${
                                                plan.highlight ? "fill-primary/10" : ""
                                            }`}
                                        />
                                        <span className={plan.highlight ? "font-medium" : "text-muted-foreground"}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA — always at bottom via mt-auto */}
                        <div className="p-6 pt-4 mt-auto">
                            <Link href={plan.ctaHref} className="block">
                                {plan.ctaVariant === "blue" && (
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-full transition-all">
                                        {plan.cta}
                                    </Button>
                                )}
                                {plan.ctaVariant === "yellow" && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-yellow-500/50 text-yellow-700 hover:bg-yellow-100 rounded-full transition-all"
                                    >
                                        {plan.cta}
                                    </Button>
                                )}
                                {plan.ctaVariant === "default" && (
                                    <Button className="w-full rounded-full text-base h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
                                        {plan.cta}
                                    </Button>
                                )}
                                {plan.ctaVariant === "outline" && (
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-full hover:bg-muted/80 transition-all"
                                    >
                                        {plan.cta}
                                    </Button>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
