"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { BookOpen, CheckCircle, Clock, Sparkles } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { getDashboardStats } from "@/actions/dashboard"

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [userName, setUserName] = useState("Student")
    const [stats, setStats] = useState({
        studyHours: 0,
        tasksCompleted: 0,
        streak: 0,
        flashcardsMastered: 0,
        resumesCreated: 0,
        recentActivity: [] as any[],
        chartData: [] as any[]
    })

    // Capitalize helper
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ""

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser)

                // 1. Listen to User Profile (Name, Streak) - Realtime
                const unsubProfile = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
                    if (doc.exists()) {
                        const data = doc.data()
                        let display = "Student"
                        if (data.name) display = capitalize(data.name)
                        if (data.role) display += ` (${data.role})`
                        setUserName(display)

                        if (data.streak !== undefined) {
                            setStats(prev => ({ ...prev, streak: data.streak }))
                        }
                    } else if (currentUser.displayName) {
                        setUserName(capitalize(currentUser.displayName) + " (Student)")
                    }
                })

                // 2. Fetch Dashboard Stats (Batched) - One-time on mount
                try {
                    const data = await getDashboardStats(currentUser.uid)
                    if (data) {
                        setStats(prev => ({
                            ...prev,
                            studyHours: data.studyHours,
                            tasksCompleted: data.tasksCompleted,
                            flashcardsMastered: data.flashcardsMastered,
                            resumesCreated: data.resumesCreated,
                            recentActivity: data.recentActivity,
                            chartData: data.chartData
                        }))
                    }
                } catch (err) {
                    console.error("Failed to load dashboard stats", err)
                }

                return () => unsubProfile()
            } else {
                router.push("/login")
            }
        })

        return () => unsubscribeAuth()
    }, [router])

    return (
        <div className="flex flex-col gap-6">
            <WelcomeBanner name={userName} streak={stats.streak} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.studyHours}</div>
                        <p className="text-xs text-muted-foreground">
                            Target: 40h
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.streak} day streak 🔥
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Flashcards Decks</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.flashcardsMastered}</div>
                        <p className="text-xs text-muted-foreground">
                            Active Decks
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Resumes Built</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resumesCreated}</div>
                        <p className="text-xs text-muted-foreground">
                            Ready for applications
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <CardDescription>Your study time over the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart data={stats.chartData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your latest actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                            ) : (
                                stats.recentActivity.map((log: any) => (
                                    <div key={log.id} className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-sky-500" />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {formatAction(log.action)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {log.details?.title || "Activity logged"}
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatTimeAgo(log.createdAt)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function formatAction(action: string) {
    switch (action) {
        case "study_session": return "Studied"
        case "task_complete": return "Completed Task"
        case "deck_created": return "Created Flashcards"
        case "resume_created": return "Created Resume"
        default: return "Activity"
    }
}

function formatTimeAgo(date: string | Date) {
    if (!date) return ""
    const d = new Date(date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}
