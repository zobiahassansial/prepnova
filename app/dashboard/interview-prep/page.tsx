"use client"

import { useUserPlan } from "@/hooks/useUserPlan"
import { UpgradeModal } from "@/components/pricing/upgrade-modal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Code, Zap, Loader2, Briefcase, Star, Users } from "lucide-react"
import Link from "next/link"

const MOCK_TYPES = [
    { id: "behavioral", label: "Behavioral",   icon: Users,    color: "blue",   desc: "STAR method — teamwork, leadership, challenges" },
    { id: "technical",  label: "Technical",    icon: Code,     color: "purple", desc: "System design, algorithms, problem-solving" },
    { id: "product",    label: "Product",      icon: Star,     color: "orange", desc: "Product thinking, metrics, case studies" },
    { id: "general",    label: "General",      icon: Briefcase,color: "green",  desc: "Motivation, strengths/weaknesses, career goals" },
]

const colorMap: Record<string, string> = {
    blue:   "border-l-blue-500 text-blue-500",
    purple: "border-l-purple-500 text-purple-500",
    orange: "border-l-orange-500 text-orange-500",
    green:  "border-l-green-500 text-green-500",
}

export default function InterviewPrepPage() {
    const { limits, loading } = useUserPlan()

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    if (!limits.interviewPrep) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <UpgradeModal
                feature="Interview Prep"
                description="Interview Prep is exclusively available on the Pro and Lifetime plans."
                requiredPlan="pro"
                inline
            />
        </div>
    )

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Interview Preparation</h1>
                <p className="text-muted-foreground mt-1">Master your interview skills with AI-powered tools.</p>
            </div>

            {/* Mock Interview Types */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Mock Interviews</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {MOCK_TYPES.map(({ id, label, icon: Icon, color, desc }) => (
                        <Card key={id} className={`hover:bg-muted/50 transition-all hover:shadow-md border-l-4 ${colorMap[color].split(" ")[0]}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className={`flex items-center gap-2 text-base ${colorMap[color].split(" ")[1]}`}>
                                    <Icon className="h-4 w-4" /> {label}
                                </CardTitle>
                                <CardDescription className="text-xs">{desc}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={`/dashboard/interview-prep/practice/${id}`}>
                                    <Button className="w-full" variant="outline" size="sm">Start Practice</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Interview Copilot */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Live Tools</h2>
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl relative overflow-hidden max-w-sm">
                    <div className="absolute top-0 right-0 bg-yellow-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg text-black">
                        LIVE ASSIST
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-400">
                            <Zap className="h-5 w-5 fill-yellow-400" /> Interview Copilot
                        </CardTitle>
                        <CardDescription className="text-slate-300 text-sm">
                            Get real-time AI answers during a live interview via speech recognition.
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
            </div>
        </div>
    )
}