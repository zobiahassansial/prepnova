"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { BookOpen, CheckCircle, Clock, Sparkles, Pencil, Check, X } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
    doc, onSnapshot, collection, query, where, orderBy, limit,
    setDoc, getDoc, Timestamp
} from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"

// Activity icon map
const activityIconMap: Record<string, string> = {
    study_session: "📚",
    task_complete: "✅",
    task_created: "📝",
    deck_created: "🃏",
    deck_reviewed: "🔄",
    resume_created: "📄",
    resume_saved: "💾",
    summary_generated: "✨",
    doc_scanned: "🔍",
    interview_practice: "🎤",
}

// Progress bar color based on threshold
function getProgressColor(pct: number) {
    if (pct >= 85) return "bg-green-500"
    if (pct >= 50) return "bg-yellow-500"
    return "bg-blue-500"
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [userName, setUserName] = useState("Student")
    const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined)
    const [isLoadingStats, setIsLoadingStats] = useState(true)

    // Stats
    const [studyHours, setStudyHours] = useState(0)
    const [tasksCompleted, setTasksCompleted] = useState(0)
    const [streak, setStreak] = useState(0)
    const [flashcardDecks, setFlashcardDecks] = useState(0)
    const [resumesCreated, setResumesCreated] = useState(0)
    const [chartData, setChartData] = useState<{ name: string; total: number }[]>([])
    const [recentActivity, setRecentActivity] = useState<any[]>([])

    // Study target — editable
    const [studyTarget, setStudyTarget] = useState(40)
    const [isEditingTarget, setIsEditingTarget] = useState(false)
    const [editTargetValue, setEditTargetValue] = useState(40)
    const targetInputRef = useRef<HTMLInputElement>(null)

    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ""

    // Get start of current week (Monday)
    const getStartOfWeek = () => {
        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(now.setDate(diff))
        monday.setHours(0, 0, 0, 0)
        return monday
    }

    const startTargetEdit = () => {
        setEditTargetValue(studyTarget)
        setIsEditingTarget(true)
        setTimeout(() => targetInputRef.current?.focus(), 0)
    }

    const saveTarget = async (uid: string) => {
        const val = Math.max(1, Math.min(200, editTargetValue))
        setStudyTarget(val)
        setIsEditingTarget(false)
        try {
            await setDoc(doc(db, "users", uid, "settings", "studyTarget"), { value: val })
        } catch {
            // silently handle
        }
    }

    const cancelTargetEdit = () => {
        setIsEditingTarget(false)
    }

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login")
                return
            }

            setUser(currentUser)
            const uid = currentUser.uid

            // ── 1. User Profile (name, streak) ─────────────────────────────────
            const unsubProfile = onSnapshot(doc(db, "users", uid), (snap) => {
                if (snap.exists()) {
                    const data = snap.data()
                    let display = "Student"
                    if (data.name) display = capitalize(data.name)
                    if (data.role) display += ` (${data.role})`
                    setUserName(display)
                    if (data.photoURL) setUserPhoto(data.photoURL)
                    if (data.streak !== undefined) setStreak(data.streak)
                } else if (currentUser.displayName) {
                    setUserName(capitalize(currentUser.displayName) + " (Student)")
                    if (currentUser.photoURL) setUserPhoto(currentUser.photoURL)
                }
            })

            // ── 2. Study Target (editable) ──────────────────────────────────────
            const unsubTarget = onSnapshot(doc(db, "users", uid, "settings", "studyTarget"), (snap) => {
                if (snap.exists()) {
                    const val = snap.data()?.value
                    if (typeof val === "number") {
                        setStudyTarget(val)
                        setEditTargetValue(val)
                    }
                }
            })

            // ── 3. Tasks Completed count ────────────────────────────────────────
            const unsubTasks = onSnapshot(
                query(collection(db, "users", uid, "tasks"), where("completed", "==", true)),
                (snap) => setTasksCompleted(snap.size)
            )

            // ── 4. Flashcard Decks count ────────────────────────────────────────
            const unsubDecks = onSnapshot(
                collection(db, "users", uid, "flashcardDecks"),
                (snap) => setFlashcardDecks(snap.size)
            )

            // ── 5. Resumes count ────────────────────────────────────────────────
            const unsubResumes = onSnapshot(
                collection(db, "users", uid, "resumes"),
                (snap) => setResumesCreated(snap.size)
            )

            // ── 6. Study sessions (weekly chart + hours) ───────────────────────
            const weekStart = getStartOfWeek()
            const unsubSessions = onSnapshot(
                query(
                    collection(db, "users", uid, "studySessions"),
                    where("timestamp", ">=", Timestamp.fromDate(weekStart))
                ),
                (snap) => {
                    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    const map = new Map<string, number>()
                    days.forEach(d => map.set(d, 0))

                    let totalMinutes = 0
                    snap.docs.forEach(doc => {
                        const data = doc.data()
                        const ts: Date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
                        const dayIndex = ts.getDay()
                        // Convert JS day (0=Sun) to Mon-indexed
                        const dayKey = days[(dayIndex + 6) % 7]
                        const mins = data.durationMinutes || 0
                        map.set(dayKey, (map.get(dayKey) || 0) + mins)
                        totalMinutes += mins
                    })

                    setStudyHours(Math.round((totalMinutes / 60) * 10) / 10)
                    setChartData(days.map(d => ({ name: d, total: Math.round(((map.get(d) || 0) / 60) * 10) / 10 })))
                    setIsLoadingStats(false)
                },
                (error) => {
                    console.error("Error fetching study sessions:", error)
                    setIsLoadingStats(false)
                }
            )

            // ── 7. Recent Activity Feed (live) ─────────────────────────────────
            const unsubActivity = onSnapshot(
                query(
                    collection(db, "users", uid, "activityLog"),
                    orderBy("timestamp", "desc"),
                    limit(10)
                ),
                (snap) => {
                    setRecentActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })))
                    // If no study sessions loaded yet, clear loading
                    setIsLoadingStats(false)
                },
                (error) => {
                    console.error("Error fetching recent activity:", error)
                    setIsLoadingStats(false)
                }
            )

            return () => {
                unsubProfile()
                unsubTarget()
                unsubTasks()
                unsubDecks()
                unsubResumes()
                unsubSessions()
                unsubActivity()
            }
        })

        return () => unsubscribeAuth()
    }, [router])

    const targetPct = Math.min(100, Math.round((studyHours / studyTarget) * 100))

    if (!user) return <DashboardSkeleton />

    return (
        <div className="flex flex-col gap-6">
            <WelcomeBanner name={userName} photoURL={userPhoto} streak={streak} />

            {/* ── Stats Grid ──────────────────────────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Study Hours Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{studyHours}h</div>

                        {/* Editable Target */}
                        <div className="flex items-center gap-1 mt-1 group/target">
                            {isEditingTarget ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">Target:</span>
                                    <input
                                        ref={targetInputRef}
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={editTargetValue}
                                        onChange={e => setEditTargetValue(Number(e.target.value))}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") saveTarget(user.uid)
                                            if (e.key === "Escape") cancelTargetEdit()
                                        }}
                                        onBlur={() => saveTarget(user.uid)}
                                        className="w-14 h-5 text-xs border rounded px-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <span className="text-xs text-muted-foreground">h</span>
                                    <button onClick={() => saveTarget(user.uid)} className="text-green-500 hover:text-green-700">
                                        <Check className="h-3 w-3" />
                                    </button>
                                    <button onClick={cancelTargetEdit} className="text-red-400 hover:text-red-600">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={startTargetEdit}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <span>Target: {studyTarget}h</span>
                                    <Pencil className="h-3 w-3 opacity-0 group-hover/target:opacity-100 transition-opacity" />
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(targetPct)}`}
                                style={{ width: `${targetPct}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{targetPct}% of weekly goal</p>
                    </CardContent>
                </Card>

                {/* Tasks Completed */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasksCompleted}</div>
                        <p className="text-xs text-muted-foreground">
                            {streak} day streak 🔥
                        </p>
                    </CardContent>
                </Card>

                {/* Flashcard Decks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Flashcard Decks</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{flashcardDecks}</div>
                        <p className="text-xs text-muted-foreground">Active Decks</p>
                    </CardContent>
                </Card>

                {/* Resumes Built */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Resumes Built</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resumesCreated}</div>
                        <p className="text-xs text-muted-foreground">Ready for applications</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Bottom Row ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                {/* Weekly Activity Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <CardDescription>Your study time over the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart data={chartData} loading={isLoadingStats} />
                    </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your latest actions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Start studying to see your progress here!</p>
                                </div>
                            ) : (
                                recentActivity.map((log: any, i) => {
                                    const ts = log.timestamp?.toDate ? log.timestamp.toDate() : new Date()
                                    const icon = log.icon || activityIconMap[log.type] || "📌"
                                    return (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200"
                                            style={{ animationDelay: `${i * 30}ms` }}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-tight truncate">
                                                    {log.description || log.type}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDistanceToNow(ts, { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
