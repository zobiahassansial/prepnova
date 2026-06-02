"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, CheckCircle2, LayoutDashboard } from "lucide-react"
import { Loader2 } from "lucide-react"

function SuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("order_id") || ""

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
                        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Payment Successful!</h1>
                            <p className="text-muted-foreground">
                                Your subscription has been activated. Your new plan limits are available immediately.
                            </p>
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
