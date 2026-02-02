"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Play, Pause, CheckCircle2 } from "lucide-react"
import { logStudyActivity } from "@/actions/study-planner"

export default function StudyModePage() {
    const params = useParams()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const taskId = params.taskId as string

    const [task, setTask] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [timerActive, setTimerActive] = useState(false)
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
            } else {
                router.push("/auth")
            }
        })
        return () => unsubscribe()
    }, [router])

    useEffect(() => {
        if (!user) return

        const fetchTask = async () => {
            try {
                let ref = doc(db, "study_tasks", taskId)
                let snap = await getDoc(ref)

                if (snap.exists()) {
                    setTask({ id: snap.id, ...snap.data() })
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        fetchTask()
    }, [user, taskId])

    useEffect(() => {
        let interval: any
        if (timerActive) {
            interval = setInterval(() => {
                setSeconds(s => s + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [timerActive])

    const toggleTimer = async () => {
        if (!timerActive) {
            // Start
            setTimerActive(true)
            if (user) await logStudyActivity(user.uid, taskId, "started", "Study session started")
        } else {
            // Pause
            setTimerActive(false)
        }
    }

    const handleComplete = async () => {
        if (!user || !task) return
        await updateDoc(doc(db, "study_tasks", taskId), { status: "completed" })
        await logStudyActivity(user.uid, taskId, "completed", `Completed after ${Math.floor(seconds / 60)} minutes`)
        router.push("/dashboard/study-planner")
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
    if (!task) return <div className="p-8">Task not found</div>

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
        const s = (totalSeconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    return (
        <div className="container max-w-2xl mx-auto py-12 space-y-8">
            <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Planner
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-lg">
                        <div className="text-6xl font-mono font-bold tracking-widest mb-8">
                            {formatTime(seconds)}
                        </div>

                        <div className="flex gap-4">
                            <Button size="lg" className={timerActive ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"} onClick={toggleTimer}>
                                {timerActive ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Start Focus</>}
                            </Button>
                            <Button size="lg" variant="outline" onClick={handleComplete}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Finish
                            </Button>
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground text-center">
                        Subject: {task.subject} | Difficulty: {task.difficulty}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
