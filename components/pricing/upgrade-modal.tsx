"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Crown, X, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface UpgradeModalProps {
    feature: string
    description?: string
    requiredPlan?: "standard" | "pro" | "max"
    onClose?: () => void
    inline?: boolean
}

const planFeatures: Record<string, string[]> = {
    standard: ["5 Resume Generations / month", "20 AI Summaries / month", "15 Flashcard Decks / month", "Full Study Planner", "Document Scanner (20 pages)", "5 AI Mock Interviews / month"],
    pro:      ["15 Resume Generations / month", "50 AI Summaries / month", "40 Flashcard Decks / month", "Full Study Planner", "Document Scanner (100 pages)", "10 AI Mock Interviews + live support"],
    max:      ["30 Resume Generations / month", "120 AI Summaries / month", "100 Flashcard Decks / month", "Full Study Planner", "Document Scanner (300 pages)", "20 AI Mock Interviews + Priority Support"],
}

const planPrices: Record<string, string> = {
    standard: "$5.99/mo",
    pro:      "$11.99/mo",
    max:      "$19.99/mo",
}

const planColors: Record<string, string> = {
    standard: "text-blue-600",
    pro:      "text-primary",
    max:      "text-yellow-600",
}

export function UpgradeModal({ feature, description, requiredPlan = "pro", onClose, inline = false }: UpgradeModalProps) {
    const content = (
        <div className={inline ? "" : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"}>
            <Card className={`w-full max-w-md shadow-2xl border-primary/20 ${!inline ? "animate-in zoom-in-95 duration-200" : ""}`}>
                <CardHeader className="relative">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Crown className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Upgrade Required</CardTitle>
                            <CardDescription>Unlock {feature}</CardDescription>
                        </div>
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`font-bold text-lg capitalize ${planColors[requiredPlan]}`}>
                                {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} Plan
                            </h3>
                            <span className="text-sm font-medium text-muted-foreground">{planPrices[requiredPlan]}</span>
                        </div>
                        <ul className="space-y-2">
                            {(planFeatures[requiredPlan] ?? []).map(f => (
                                <li key={f} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <Link href={`/checkout?plan=${requiredPlan}&billing=monthly`} className="flex-1">
                            <Button className="w-full gap-2">
                                Upgrade Now <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        {onClose && (
                            <Button variant="outline" onClick={onClose}>
                                Maybe Later
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    return content
}
