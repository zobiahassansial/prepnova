"use client"

import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export const WelcomeBanner = memo(function WelcomeBanner({ name, photoURL, streak }: { name: string, photoURL?: string, streak: number }) {
    return (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {photoURL ? (
                            <img src={photoURL} alt="Avatar" className="h-12 w-12 rounded-full object-cover shrink-0 border-2 border-primary/20" />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg uppercase shrink-0">
                                {name ? name.substring(0, 2) : "JD"}
                            </div>
                        )}
                        <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                                Welcome back, {name}! <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            </h2>
                            <p className="text-sm md:text-base text-muted-foreground">
                                You're on a {streak}-day streak. Keep it up!
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button className="w-full md:w-auto">
                            Continue Study Plan <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
})
