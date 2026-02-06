"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Clock, BookOpen, CheckCircle2, Loader2, Sparkles, Filter, Play, Trash2, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StudyCalendar } from "@/components/study-planner/study-calendar"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { generateStudyPlan, scheduleUserTasks } from "@/actions/ai-planner"
import { createStudyTask, logStudyActivity, scheduleStudyTask, unscheduleStudyTask, checkScheduleConflict, checkDailyLimit, deleteStudyTask, deleteAllScheduledTasks, deleteAllUnscheduledTasks } from "@/actions/study-planner"
import { checkLimit, incrementUsage, getUserSubscription } from "@/lib/limits"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, Timestamp, getDoc } from "firebase/firestore"
import { logActivity } from "@/lib/logger"
import { StudyTask, StudySchedule, Priority, Difficulty, TaskStatus } from "@/types/study-planner"
import { onAuthStateChanged } from "firebase/auth"

export function StudyPlanner() {
    const [createLoading, setCreateLoading] = useState(false)
    const [tasks, setTasks] = useState<StudyTask[]>([])
    const [schedule, setSchedule] = useState<StudySchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [detailOpen, setDetailOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [newTaskOpen, setNewTaskOpen] = useState(false)
    const [aiOpen, setAiOpen] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [selectedTask, setSelectedTask] = useState<StudyTask | null>(null)
    const [draggedTask, setDraggedTask] = useState<StudyTask | null>(null)
    const [user, setUser] = useState<any>(null)
    const formatTime = (time: string) => {
        const [h, m] = time.split(":").map(Number)
        const date = new Date()
        date.setHours(h, m)
        return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    }

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)

                // Fetch Tasks
                const tasksQuery = query(collection(db, "study_tasks"), where("userId", "==", currentUser.uid))
                const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
                    const fetched = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as StudyTask[]
                    setTasks(fetched)
                })

                // Fetch Schedule
                const scheduleQuery = query(collection(db, "study_schedule"), where("userId", "==", currentUser.uid))
                const unsubscribeSchedule = onSnapshot(scheduleQuery, (snapshot) => {
                    const fetched = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as StudySchedule[]
                    setSchedule(fetched)
                })

                return () => {
                    unsubscribeTasks()
                    unsubscribeSchedule()
                }
            } else {
                setTasks([])
                setSchedule([])
            }
        })
        return () => unsubscribeAuth()
    }, [])

    const handleEventDrop = async ({ event, start, end }: any) => {
        try {
            // event.id is the schedule ID
            // We update the schedule doc
            const scheduleRef = doc(db, "study_schedule", event.id)

            // Format time HH:MM
            const hours = start.getHours().toString().padStart(2, '0')
            const minutes = start.getMinutes().toString().padStart(2, '0')
            const time = `${hours}:${minutes}`

            // Validation: Check Conflict (Exclude current schedule ID)
            // We need duration. event.resource.durationMinutes SHOULD be present if we mapped it correctly.
            // In StudyCalendar mapping: resource has { ...task, ...s }. s has durationMinutes (now that we save it).
            // Or task has it.
            const duration = event.resource.durationMinutes || 60

            const hasConflict = await checkScheduleConflict(user.uid, start, time, duration, event.id)
            if (hasConflict) {
                toast.error("Schedule conflict detected!")
                return
            }

            await updateDoc(scheduleRef, {
                scheduledDate: Timestamp.fromDate(start),
                scheduledTime: time
            })

            await logStudyActivity(user.uid, event.taskId, "rescheduled", `Rescheduled to ${start.toLocaleString()}`)

            toast.success("Task rescheduled")
        } catch (e) {
            console.error(e)
            toast.error("Failed to reschedule task")
        }
    }

    const onDropFromOutside = async ({ start, end, allDay }: any) => {
        if (!draggedTask) return

        try {
            // Schedule the task
            // Format time HH:MM
            const hours = start.getHours().toString().padStart(2, '0')
            const minutes = start.getMinutes().toString().padStart(2, '0')
            const time = `${hours}:${minutes}`

            // Validation: Check Daily Limit (6h)
            // Duration is in draggedTask.durationMinutes
            const isLimitExceeded = await checkDailyLimit(user.uid, start, draggedTask.durationMinutes)
            if (isLimitExceeded) {
                toast.error("Daily study limit (6h) exceeded!")
                setDraggedTask(null)
                return
            }

            // Validation: Check Conflict
            const hasConflict = await checkScheduleConflict(user.uid, start, time, draggedTask.durationMinutes)
            if (hasConflict) {
                toast.error("Schedule conflict detected!")
                setDraggedTask(null)
                return
            }

            await scheduleStudyTask(user.uid, draggedTask.id, start, time)

            toast.success(`Scheduled: ${draggedTask.title}`)
            setDraggedTask(null)
        } catch (e) {
            console.error(e)
            toast.error("Failed to schedule task")
        }
    }

    const [newTaskData, setNewTaskData] = useState({
        title: "",
        subject: "",
        duration: "60",
        priority: "Medium" as Priority,
        difficulty: "Medium" as Difficulty
    })

    const handleCreateTask = async () => {
        if (!user) {
            toast.error("User not authenticated")
            return
        }

        if (!newTaskData.title.trim() || !newTaskData.subject.trim()) {
            toast.error("Title and subject are required")
            return
        }

        setCreateLoading(true)

        try {
            await createStudyTask(user.uid, {
                title: newTaskData.title.trim(),
                subject: newTaskData.subject.trim(),
                priority: newTaskData.priority,
                difficulty: newTaskData.difficulty,
                durationMinutes: Number(newTaskData.duration)
            })

            toast.success("Task created")
            setNewTaskOpen(false)
            setNewTaskData({
                title: "",
                subject: "",
                duration: "60",
                priority: "Medium",
                difficulty: "Medium"
            })
        } catch (e: any) {
            console.error(e)
            toast.error(e?.message || "Failed to create task")
        } finally {
            setCreateLoading(false)
        }
    }




    const handleSelectEvent = (event: any) => {
        // Event resource is the task object
        setSelectedTask(event.resource)
        setDetailOpen(true)
    }

    const handleCompleteTask = async () => {
        if (!selectedTask || !user) return
        try {
            const taskRef = doc(db, "study_tasks", selectedTask.id)
            await updateDoc(taskRef, { status: "completed" })

            // Log Activity
            await logStudyActivity(user.uid, selectedTask.id, "completed", `Task completed: ${selectedTask.title}`)

            toast.success("Task completed!")
            setDetailOpen(false)
        } catch (e) {
            toast.error("Failed to complete task")
        }
    }

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Study Planner</h1>
                    <p className="text-muted-foreground">Drag and drop tasks to organize your schedule.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={showCalendar ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setShowCalendar(!showCalendar)}
                        title="Toggle Calendar View"
                    >
                        {showCalendar ? <Filter className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </Button>
                    <Button
                        onClick={() => setAiOpen(true)}
                        className="hidden md:flex"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Generate
                    </Button>


                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage Tasks</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setNewTaskOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={async () => {
                                    if (confirm("Delete ALL scheduled tasks permanently? This cannot be undone.")) {
                                        if (!user) return
                                        await deleteAllScheduledTasks(user.uid)
                                        toast.success("Scheduled tasks deleted")
                                    }
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete All Scheduled Tasks
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={async () => {
                                    if (confirm("Delete ALL unscheduled tasks permanently? This cannot be undone.")) {
                                        if (!user) return
                                        await deleteAllUnscheduledTasks(user.uid)
                                        toast.success("Unscheduled tasks deleted")
                                    }
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete All Unscheduled Tasks
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Study Task</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label>Task Title</label>
                            <Input value={newTaskData.title} onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })} placeholder="e.g. Read Chapter 4" />
                        </div>
                        <div className="grid gap-2">
                            <label>Subject</label>
                            <Input value={newTaskData.subject} onChange={e => setNewTaskData({ ...newTaskData, subject: e.target.value })} placeholder="e.g. Biology" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label>Duration (min)</label>
                                <Input type="number" value={newTaskData.duration} onChange={e => setNewTaskData({ ...newTaskData, duration: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <label>Priority</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={newTaskData.priority}
                                    onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value as any })}
                                >
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                </select>
                            </div>
                        </div>
                        <Button onClick={handleCreateTask} disabled={createLoading}>{createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Task</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>AI Study Planner (Scheduler)</DialogTitle>
                        <DialogDescription>
                            Auto-schedule your existing tasks using AI.
                        </DialogDescription>
                    </DialogHeader>

                    <AIPlanGenerator
                        user={user}
                        onClose={() => setAiOpen(false)}
                        existingTasks={tasks}
                    />
                </DialogContent>
            </Dialog>


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
                <div className="lg:col-span-3 h-full overflow-y-auto">
                    {/* Main Content Area: Calendar OR List */}
                    {showCalendar ? (
                        tasks.length > 0 ? (
                            <StudyCalendar
                                events={schedule.map(s => {
                                    const task = tasks.find(t => t.id === s.taskId)
                                    if (!task) return null
                                    const start = s.scheduledDate.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
                                    const [hours, mins] = s.scheduledTime.split(":").map(Number)
                                    start.setHours(hours, mins, 0, 0)
                                    const end = new Date(start.getTime() + (task.durationMinutes || 60) * 60000)
                                    return {
                                        id: s.id,
                                        taskId: task.id,
                                        title: task.title,
                                        start,
                                        end,
                                        resource: { ...task, scheduleId: s.id }
                                    }
                                }).filter(Boolean)}
                                // @ts-ignore
                                onEventDrop={handleEventDrop}
                                onSelectEvent={handleSelectEvent}
                                resizable
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center border rounded-lg bg-muted/10 p-8 text-center">
                                <BookOpen className="h-8 w-8 text-primary mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No Study Plan Yet</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">
                                    Your schedule is empty. Add tasks manually or use AI to generate a personalized plan.
                                </p>
                                <Button onClick={() => setNewTaskOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add First Task
                                </Button>
                            </div>
                        )
                    ) : (
                        // SCHEDULED TASKS LIST VIEW
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight">Scheduled Tasks</h2>
                            <div
                                className="space-y-2 min-h-[200px]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    try {
                                        const data = e.dataTransfer.getData("application/json")
                                        if (data) {
                                            const item = JSON.parse(data)
                                            // 1. Sidebar (Unscheduled) -> List (Schedule it)
                                            if (!item.scheduleId) {
                                                if (!user) return
                                                // Default: Schedule for Today at next hour (e.g., Now + 1h, rounded)
                                                const now = new Date()
                                                now.setHours(now.getHours() + 1, 0, 0, 0)
                                                // Check bounds? Limit? Conflict?
                                                // We'll just try to schedule.
                                                const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

                                                await scheduleStudyTask(user.uid, item.id, now, time)
                                                toast.success(`Scheduled ${item.title} for ${time}`)
                                            }
                                        }
                                    } catch (err) {
                                        // ignore
                                    }
                                }}
                            >
                                {schedule.length > 0 ? (
                                    schedule
                                        .sort((a, b) => {
                                            const taskA = tasks.find(t => t.id === a.taskId)
                                            const taskB = tasks.find(t => t.id === b.taskId)

                                            // 1. Completion Sort (Active First, Completed Last)
                                            const aDone = taskA?.status === "completed" ? 1 : 0
                                            const bDone = taskB?.status === "completed" ? 1 : 0
                                            if (aDone !== bDone) return aDone - bDone

                                            // 2. Priority Sort (High > Medium > Low) - ONLY for Active
                                            if (!aDone) {
                                                const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 }
                                                // @ts-ignore
                                                const pA = priorityOrder[taskA?.priority || "Low"] || 1
                                                // @ts-ignore
                                                const pB = priorityOrder[taskB?.priority || "Low"] || 1
                                                if (pA !== pB) return pB - pA
                                            }

                                            // 3. Date/Time Sort
                                            const da = a.scheduledDate.toDate ? a.scheduledDate.toDate() : new Date(a.scheduledDate as any)
                                            const db = b.scheduledDate.toDate ? b.scheduledDate.toDate() : new Date(b.scheduledDate as any)
                                            if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime()
                                            return a.scheduledTime.localeCompare(b.scheduledTime)
                                        })
                                        .map(s => {
                                            const task = tasks.find(t => t.id === s.taskId)
                                            if (!task) return null
                                            const isCompleted = task.status === "completed"

                                            return (
                                                <div
                                                    key={s.id}
                                                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors group ${isCompleted
                                                        ? "bg-green-60/50 border-green-100 opacity-50"
                                                        : "bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing"
                                                        }`}
                                                    draggable={!isCompleted}
                                                    onDragStart={(e) => {
                                                        if (isCompleted) {
                                                            e.preventDefault()
                                                            return
                                                        }
                                                        // Dragging FROM Scheduled List
                                                        // We pass the task AND scheduleId
                                                        const dragData = { ...task, scheduleId: s.id }
                                                        e.dataTransfer.setData("application/json", JSON.stringify(dragData))
                                                    }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-1 h-12 rounded-full ${isCompleted ? "bg-green-500" :
                                                            task.priority === 'High' ? 'bg-red-500' :
                                                                task.priority === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'
                                                            }`} />
                                                        <div>
                                                            <div className={`font-medium text-base ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                                                                    {formatTime(s.scheduledTime)}
                                                                </span>

                                                                <span>{new Date(s.scheduledDate.toDate ? s.scheduledDate.toDate() : s.scheduledDate as any).toLocaleDateString()}</span>
                                                                <span>•</span>
                                                                <span>{task.durationMinutes}m</span>
                                                                <span>•</span>
                                                                <span>{task.subject}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!isCompleted && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0"
                                                                    onClick={() => window.location.href = `/study/mode/${task.id}`}
                                                                    title="Start Session"
                                                                >
                                                                    <Play className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                    onClick={async () => {
                                                                        if (!user) return
                                                                        await unscheduleStudyTask(user.uid, s.id, task.id)
                                                                        toast.success("Task unscheduled")
                                                                    }}
                                                                    title="Unschedule Task"
                                                                >
                                                                    <Filter className="h-4 w-4 rotate-180" /> {/* Or Minus/X icon */}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => {
                                                                        const doComplete = async () => {
                                                                            if (!user) return
                                                                            await updateDoc(doc(db, "study_tasks", task.id), { status: "completed" })
                                                                            await logStudyActivity(user.uid, task.id, "completed", "Task completed via list")
                                                                            toast.success("Task completed!")
                                                                        }
                                                                        doComplete()
                                                                    }}
                                                                    title="Complete Task"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {isCompleted && (
                                                            <Button size="sm" variant="ghost" disabled>
                                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 px-2"
                                                            onClick={async () => {
                                                                if (!user) return
                                                                if (confirm("Delete this task?")) {
                                                                    await deleteStudyTask(user.uid, task.id)
                                                                    toast.success("Task removed")
                                                                }
                                                            }}
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                ) : (
                                    <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                                        <p>No scheduled tasks.</p>
                                        <p className="text-sm mt-1">Drag tasks from the right sidebar to schedule them, or add new ones from Manage Tasks.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Task Details</DialogTitle>
                        </DialogHeader>
                        {selectedTask && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedTask.subject}</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Duration: {selectedTask.durationMinutes}m</span>
                                    <span>Priority: {selectedTask.priority}</span>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    {(selectedTask as any).scheduleId && (
                                        <Button
                                            variant="destructive"
                                            onClick={async () => {
                                                if (!user) return
                                                await unscheduleStudyTask(user.uid, (selectedTask as any).scheduleId, selectedTask.id)
                                                toast.success("Task unscheduled")
                                                setDetailOpen(false)
                                            }}
                                        >
                                            Unschedule
                                        </Button>
                                    )}

                                    {selectedTask.status !== "completed" ? (
                                        <div className="flex w-full gap-2">
                                            <Button onClick={() => window.location.href = `/study/mode/${selectedTask.id}`} className="flex-1" variant="secondary">
                                                <Play className="mr-2 h-4 w-4" /> Start Session
                                            </Button>
                                            <Button onClick={handleCompleteTask} className="flex-1 bg-green-600 hover:bg-green-700">
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button variant="outline" className="w-full" disabled>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Completed
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <div className="lg:col-span-1 flex flex-col gap-4 h-full">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Unscheduled Tasks</CardTitle>
                        </CardHeader>
                        <CardContent
                            className="flex-1 overflow-y-auto space-y-2 p-2"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                                // Logic to unschedule if dropped here
                                // We can get data from event probably, or use draggedTask state if available
                                // The dragging logic sets 'draggedTask'.

                                // But wait, 'draggedTask' is usually set when dragging FROM here. 
                                // Only if we drag FROM calendar/list do we need to unset.
                                // React-Big-Calendar drag doesn't easily expose the raw item via local 'draggedTask' state unless we hooked it.
                                // However, we can try to rely on JSON parse?
                                try {
                                    const data = e.dataTransfer.getData("application/json")
                                    if (data) {
                                        const item = JSON.parse(data)
                                        // If it has a scheduleId, it's scheduled. Unschedule it.
                                        if (item.scheduleId) {
                                            if (!user) return
                                            await unscheduleStudyTask(user.uid, item.scheduleId, item.id)
                                            toast.success("Task unscheduled")
                                        }
                                    }
                                } catch (err) {
                                    // Ignore JSON errors
                                }
                            }}
                        >
                            {tasks.filter(t => t.status === "unscheduled").length > 0 ? (
                                tasks.filter(t => t.status === "unscheduled").map(task => (
                                    <div key={task.id} className="p-2 border rounded-md bg-card text-sm cursor-grab active:cursor-grabbing hover:bg-accent/50 relative group" draggable onDragStart={(e) => {
                                        setDraggedTask(task)
                                        e.dataTransfer.setData("application/json", JSON.stringify(task))
                                    }}>
                                        <div className="font-medium truncate pr-6">{task.title}</div>
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>{task.durationMinutes}m</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                task.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                }`}>{task.priority}</span>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                                onClick={async (e) => {
                                                    e.stopPropagation()
                                                    if (!user) return
                                                    if (confirm("Delete this task?")) {
                                                        await deleteStudyTask(user.uid, task.id)
                                                        toast.success("Task deleted")
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 gap-2 opacity-50">
                                    <Filter className="h-8 w-8" />
                                    <p className="text-sm">Drag tasks here to unschedule them.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    )
}

// getDoc moved to top imports

function AIPlanGenerator({ user, onClose, existingTasks }: { user: any, onClose: () => void, existingTasks: StudyTask[] }) {
    const [hours, setHours] = useState(2)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // No explicit mode state needed, logic directly checks existingTasks.length
    }, [existingTasks])

    const handleGenerate = async () => {
        if (!user) return
        setLoading(true)

        try {
            // STRICT AI SCHEDULER LOGIC
            // Case A: No tasks -> Prompt user to add tasks manually
            if (existingTasks.length === 0) {
                toast.error("You don't have any study tasks yet. Please add tasks first so I can create a study plan.")
                setLoading(false)
                return
            }

            // Case B: Tasks exist -> Schedule them
            // We use the new scheduleUserTasks action
            const tasksForAI = existingTasks.map(t => ({
                id: t.id,
                title: t.title,
                subject: t.subject,
                priority: t.priority,
                durationMinutes: t.durationMinutes,
                deadline: t.deadline ? (typeof t.deadline.toDate === 'function' ? t.deadline.toDate().toISOString() : new Date(t.deadline as any).toISOString()) : undefined
            }))

            const result = await scheduleUserTasks(tasksForAI, hours)

            if (result.error) {
                toast.error(result.error)
                return
            }

            // Process Schedule Results
            const scheduleData = result.schedule
            const promises = []

            // 1. Update Scheduled Tasks
            if (scheduleData.scheduled_tasks) {
                for (const item of scheduleData.scheduled_tasks) {
                    promises.push(scheduleStudyTask(user.uid, item.task_id, new Date(`${item.scheduled_date}T${item.scheduled_time}`), item.scheduled_time))
                }
            }

            // 2. Log Unscheduled Reasons? (Optional, maybe just toast summary)

            await Promise.all(promises)

            toast.success(`Scheduled ${scheduleData.scheduled_tasks?.length || 0} tasks!`)
            onClose()

        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    // Render logic based on Case A/B
    if (existingTasks.length === 0) {
        return (
            <div className="space-y-4 py-4">
                <div className="text-center p-6 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground mb-4">You don't have any study tasks yet.</p>
                    <p className="text-sm">Please close this and add tasks manually using the "Add Task" button first.</p>
                </div>
                <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
            </div>
        )
    }

    return (
        <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/20 rounded-lg mb-4">
                <p className="font-medium text-sm mb-2">You have {existingTasks.length} total tasks.</p>
                <p className="text-xs text-muted-foreground">The AI will attempt to reschedule ALL your tasks into an optimal plan, respecting your daily limits.</p>
            </div>

            <div className="space-y-2">
                <Label>Daily Study Limit (Hours)</Label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="20" // Max 20h limit
                        step="0.5"
                        value={hours}
                        onChange={(e) => setHours(parseFloat(e.target.value))}
                        className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">{hours}h</span>
                </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</> : <><Sparkles className="mr-2 h-4 w-4" /> Schedule My Tasks</>}
            </Button>
        </div>
    )
}
