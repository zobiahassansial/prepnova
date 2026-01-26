"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function WelcomeBanner({ name, streak }: { name: string, streak: number }) {
    return (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            Welcome back, {name}! <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        </h2>
                        <p className="text-muted-foreground">
                            You're on a {streak}-day streak. Keep it up!
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button>
                            Continue Study Plan <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
