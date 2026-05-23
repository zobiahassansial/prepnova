"use client"

import { useUserPlan } from "@/hooks/useUserPlan"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Code, Zap, Loader2 } from "lucide-react"
import Link from "next/link"

export default function InterviewPrepPage() {
    const { plan, limits, loading } = useUserPlan()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Gate: Free and Standard users cannot access Interview Prep
    if (!limits.interviewPrep) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <UpgradeModal
                    feature="Interview Prep"
                    description="Interview Prep is exclusively available on the Pro and Lifetime plans. Practice behavioral and technical questions with AI-powered feedback."
                    requiredPlan="pro"
                    inline
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Interview Preparation</h1>
                <p className="text-muted-foreground mt-1">Master your interview skills with AI-powered tools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Mock Interview */}
                <Card className="hover:bg-muted/50 transition-all hover:shadow-md border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mic className="h-5 w-5 text-blue-500" /> Mock Interview
                        </CardTitle>
                        <CardDescription>Practice behavioral questions with an AI interviewer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/interview-prep/practice/behavioral">
                            <Button className="w-full" variant="outline">Start Practice</Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 2. Interview Copilot */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-yellow-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg text-black">
                        LIVE ASSIST
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-400">
                            <Zap className="h-5 w-5 fill-yellow-400" /> Interview Copilot
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                            Get real-time AI answers during a live interview.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/interview-prep/copilot">
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold border-none">
                                Launch Copilot
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 3. Technical Coding (Coming Soon) */}
                <Card className="hover:bg-muted/50 transition-colors opacity-60 border-2 border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5" /> Technical Coding
                        </CardTitle>
                        <CardDescription>Solve algorithmic problems with AI guidance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" disabled variant="secondary">Coming Soon</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}