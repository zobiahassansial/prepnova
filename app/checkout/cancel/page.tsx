"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, XCircle, Loader2 } from "lucide-react"

function CancelContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("order_id") || ""

    // Parse plan from order_id: {userId}_{plan}_{billing}_{timestamp}
    const parts = orderId.split("_")
    const PLANS = ["standard", "pro", "max"]
    const planIndex = parts.findIndex(p => PLANS.includes(p))
    const plan = planIndex !== -1 ? parts[planIndex] : ""
    const billing = planIndex !== -1 ? parts[planIndex + 1] : "monthly"

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
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Payment Cancelled</h1>
                            <p className="text-muted-foreground">
                                Your payment was cancelled and you have not been charged. Your current plan remains unchanged.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                            {plan && (
                                <Link href={`/checkout?plan=${plan}&billing=${billing}`} className="flex-1">
                                    <Button className="w-full">Try Again</Button>
                                </Link>
                            )}
                            <Link href="/#pricing" className="flex-1">
                                <Button variant="outline" className="w-full">View Plans</Button>
                            </Link>
                        </div>
                        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground underline">
                            Return to Dashboard
                        </Link>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    Need help?{" "}
                    <a href="mailto:support@prepnova.online" className="text-primary hover:underline">
                        support@prepnova.online
                    </a>
                </p>
            </div>
        </div>
    )
}

export default function CancelPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CancelContent />
        </Suspense>
    )
}
