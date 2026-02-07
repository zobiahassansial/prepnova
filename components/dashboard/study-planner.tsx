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
import { createStudyTask, logStudyActivity, scheduleStudyTask, unscheduleStudyTask, checkScheduleConflict, checkDailyLimit, deleteStudyTask, deleteAllScheduledTasks, deleteAllUnscheduledTasks, updateTaskOrder } from "@/actions/study-planner"
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
    // ... existing state definitions ...

    // ADD THIS FUNCTION
    const formatTimeRange = (time: string, durationMinutes: number) => {
        const [h, m] = time.split(":").map(Number)

        // Calculate Start
        const start = new Date()
        start.setHours(h, m, 0, 0)

        // Calculate End
        const end = new Date(start.getTime() + durationMinutes * 60000)

        // Format both
        const format = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

        return `${format(start)} - ${format(end)}`
    }

    // ... useEffect ...

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
        difficulty: "Medium" as Difficulty,
        // Optional scheduling fields
        scheduledDate: undefined as Date | undefined,
        scheduledTime: undefined as string | undefined
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
            const taskId = await createStudyTask(user.uid, {
                title: newTaskData.title.trim(),
                subject: newTaskData.subject.trim(),
                priority: newTaskData.priority,
                difficulty: newTaskData.difficulty,
                durationMinutes: Number(newTaskData.duration)
            })

            // If scheduledDate/Time are present (from drag-and-drop creation), schedule it immediately
            if (newTaskData.scheduledDate && newTaskData.scheduledTime) {
                await scheduleStudyTask(user.uid, taskId, newTaskData.scheduledDate, newTaskData.scheduledTime)
                toast.success("Task created and scheduled")
            } else {
                toast.success("Task created")
            }

            setNewTaskOpen(false)
            setNewTaskData({
                title: "",
                subject: "",
                duration: "60",
                priority: "Medium",
                difficulty: "Medium",
                scheduledDate: undefined,
                scheduledTime: undefined
            })
        } catch (e: any) {
            console.error(e)
            toast.error(e?.message || "Failed to create task")
        } finally {
            setCreateLoading(false)
        }
    }

    const handleSelectSlot = (slotInfo: any) => {
        // slotInfo.start is the Date object where the user clicked/dragged
        const start = slotInfo.start as Date
        const time = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`

        setNewTaskData(prev => ({
            ...prev,
            scheduledDate: start,
            scheduledTime: time
        }))
        setNewTaskOpen(true)
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
    console.log("SCHEDULE STATE:", schedule)
    console.log("TASKS STATE:", tasks)
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
                                <label>Date (Optional)</label>
                                <Input
                                    type="date"
                                    value={newTaskData.scheduledDate ? newTaskData.scheduledDate.toISOString().split('T')[0] : ''}
                                    onChange={e => setNewTaskData({ ...newTaskData, scheduledDate: e.target.value ? new Date(e.target.value) : undefined })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label>Time (Optional)</label>
                                <Input
                                    type="time"
                                    value={newTaskData.scheduledTime || ''}
                                    onChange={e => setNewTaskData({ ...newTaskData, scheduledTime: e.target.value || undefined })}
                                />
                            </div>
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
                        existingTasks={tasks.filter(t => t.status === "unscheduled")}
                    />

                </DialogContent>
            </Dialog>


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
                <div className="lg:col-span-3 h-full overflow-y-auto">
                    {/* Main Content Area: Calendar OR List */}
                    {showCalendar ? (
                        schedule.length > 0 ? (
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
                                onSelectSlot={handleSelectSlot}
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
                        // SCHEDULED TASKS LIST VIEW (MANUAL SORT)
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight">Scheduled Tasks</h2>
                            <div
                                className="space-y-2 min-h-[200px]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    e.preventDefault()
                                    try {
                                        const data = e.dataTransfer.getData("application/json")
                                        if (!data) return
                                        const item = JSON.parse(data) // The task being dragged

                                        // 1. Determine Drop Index & Surrounding Tasks
                                        // We need to know WHERE in the list it was dropped.
                                        // This is tricky with standard HTML5 DnD without individual drop targets.
                                        // Simple approach: Use e.target to find closest row?
                                        // Better approach: Since we can't easily get precise index in a container drop,
                                        // we let the user drop ONTO a task to insert before/after.
                                        // BUT for container drop (append), we handle here.

                                        // FALLBACK: If dropped on container (not specific item), append to end.
                                        // We will add specific drop handlers to items below.

                                    } catch (err) { }
                                }}
                            >
                                {schedule.length > 0 ? (
                                    schedule
                                        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                        .map((s, index, array) => {
                                            const task = tasks.find(t => t.id === s.taskId)
                                            if (!task) return null
                                            const isCompleted = task.status === "completed"

                                            return (
                                                <div
                                                    key={s.id}
                                                    draggable={!isCompleted}
                                                    onDragStart={(e) => {
                                                        if (isCompleted) {
                                                            e.preventDefault()
                                                            return
                                                        }
                                                        const dragData = { ...task, scheduleId: s.id, type: 'scheduled', originalIndex: index }
                                                        e.dataTransfer.setData("application/json", JSON.stringify(dragData))
                                                    }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={async (e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        const data = e.dataTransfer.getData("application/json")
                                                        if (!data) return
                                                        const draggedItem = JSON.parse(data)

                                                        if (draggedItem.id === task.id) return // Dropped on self

                                                        // Logic: Insert BEFORE this item
                                                        // New Order Index = (Prev.Order + This.Order) / 2
                                                        // What is Prev? array[index - 1]

                                                        const prevItem = index > 0 ? array[index - 1] : null
                                                        const nextItem = s // We are dropping ON 's', so 's' becomes next

                                                        // Calculate Order Index
                                                        const prevOrder = prevItem?.orderIndex || 0
                                                        const nextOrder = nextItem.orderIndex || Date.now()
                                                        const newOrderIndex = index === 0 ? nextOrder - 1000 : (prevOrder + nextOrder) / 2

                                                        // Calculate Time
                                                        // Rule: "Compute time ONLY from surrounding tasks"
                                                        // If we have a prevItem, use its end time.
                                                        // If not, use nextItem's start time - duration? Or just default.

                                                        let newTime = "09:00"
                                                        let newDate = new Date()

                                                        if (prevItem) {
                                                            const pTask = tasks.find(t => t.id === prevItem.taskId)
                                                            const pDate = prevItem.scheduledDate.toDate ? prevItem.scheduledDate.toDate() : new Date(prevItem.scheduledDate as any)
                                                            const [ph, pm] = prevItem.scheduledTime.split(":").map(Number)
                                                            pDate.setHours(ph, pm + (pTask?.durationMinutes || 60), 0, 0) // End Time

                                                            newTime = `${pDate.getHours().toString().padStart(2, '0')}:${pDate.getMinutes().toString().padStart(2, '0')}`
                                                            newDate = pDate
                                                        } else {
                                                            // No prev item, trying to be first.
                                                            // Take next item's time minus duration? Or just keep same day?
                                                            const nDate = nextItem.scheduledDate.toDate ? nextItem.scheduledDate.toDate() : new Date(nextItem.scheduledDate as any)
                                                            newDate = nDate
                                                            // Keep 9:00 or current? Let's use 09:00 as start of day anchor if first.
                                                            // Or if draggedItem has a time, use it?
                                                            // Requirement: "Update scheduledDate + scheduledTime from drop position"
                                                            // If becoming first, maybe 15 mins before next?
                                                            const [nh, nm] = nextItem.scheduledTime.split(":").map(Number)
                                                            const nextStart = new Date(nDate)
                                                            nextStart.setHours(nh, nm, 0, 0)
                                                            nextStart.setMinutes(nextStart.getMinutes() - (draggedItem.durationMinutes || 60))
                                                            newTime = `${nextStart.getHours().toString().padStart(2, '0')}:${nextStart.getMinutes().toString().padStart(2, '0')}`
                                                        }

                                                        if (!user) return

                                                        if (draggedItem.scheduleId) {
                                                            // Scheduled -> Scheduled (Reorder)
                                                            await scheduleStudyTask(user.uid, draggedItem.id, newDate, newTime)
                                                            toast.success("Task reordered")
                                                        } else {
                                                            // Unscheduled -> Scheduled (Schedule it)
                                                            await scheduleStudyTask(user.uid, draggedItem.id, newDate, newTime)
                                                            toast.success("Task scheduled")
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors group ${isCompleted
                                                        ? "bg-green-60/50 border-green-100 opacity-50"
                                                        : "bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-1 h-12 rounded-full ${isCompleted ? "bg-green-500" :
                                                            task.priority === 'High' ? 'bg-red-500' :
                                                                task.priority === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'
                                                            }`} />
                                                        <div>
                                                            <div className={`font-medium text-base ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                {/* UPDATED: Shows "9:00 AM - 10:00 AM" */}
                                                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                                                                    {formatTimeRange(s.scheduledTime, task.durationMinutes || 60)}
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
                                                                    <Filter className="h-4 w-4 rotate-180" />
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
                                    <div
                                        className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground"
                                        onDrop={async (e) => {
                                            // Handle dropping into empty list
                                            e.preventDefault()
                                            const data = e.dataTransfer.getData("application/json")
                                            if (!data) return
                                            const draggedItem = JSON.parse(data)
                                            if (!user) return

                                            // Default for first item
                                            const now = new Date()
                                            now.setHours(9, 0, 0, 0)
                                            if (now < new Date()) now.setHours(new Date().getHours() + 1, 0, 0, 0)
                                            const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

                                            await scheduleStudyTask(user.uid, draggedItem.id, now, time)
                                            toast.success("Task scheduled")
                                        }}
                                        onDragOver={e => e.preventDefault()}
                                    >
                                        <p>No scheduled tasks.</p>
                                        <p className="text-sm mt-1">Drag tasks from the right sidebar to schedule them.</p>
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
                                e.preventDefault()
                                try {
                                    const data = e.dataTransfer.getData("application/json")
                                    if (data) {
                                        const item = JSON.parse(data)
                                        if (item.scheduleId) {
                                            if (!user) return
                                            // Scheduled -> Unscheduled (Drop on container = Append)
                                            await unscheduleStudyTask(user.uid, item.scheduleId, item.id, Date.now())
                                            toast.success("Task unscheduled")
                                        }
                                    }
                                } catch (err) { }
                            }}
                        >
                            {tasks.filter(t => t.status === "unscheduled").length > 0 ? (
                                tasks
                                    .filter(t => t.status === "unscheduled")
                                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                    .map((task, index, array) => (
                                        <div
                                            key={task.id}
                                            className="p-2 border rounded-md bg-card text-sm cursor-grab active:cursor-grabbing hover:bg-accent/50 relative group"
                                            draggable
                                            onDragStart={(e) => {
                                                setDraggedTask(task)
                                                const dragData = { ...task, type: 'unscheduled', originalIndex: index }
                                                e.dataTransfer.setData("application/json", JSON.stringify(dragData))
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={async (e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                const data = e.dataTransfer.getData("application/json")
                                                if (!data) return
                                                const draggedItem = JSON.parse(data)

                                                if (draggedItem.id === task.id) return

                                                // Insert BEFORE this item
                                                const prevItem = index > 0 ? array[index - 1] : null
                                                const nextItem = task

                                                const prevOrder = prevItem?.orderIndex || 0
                                                const nextOrder = nextItem.orderIndex || Date.now()
                                                const newOrderIndex = index === 0 ? nextOrder - 1000 : (prevOrder + nextOrder) / 2

                                                if (!user) return

                                                if (draggedItem.scheduleId) {
                                                    // Scheduled -> Unscheduled (Insert specific pos)
                                                    await unscheduleStudyTask(user.uid, draggedItem.scheduleId, draggedItem.id, newOrderIndex)
                                                    toast.success("Task unscheduled")
                                                } else {
                                                    // Unscheduled -> Unscheduled (Reorder)
                                                    await updateTaskOrder(user.uid, draggedItem.id, "study_tasks", newOrderIndex)
                                                    // Optimistic update?
                                                }
                                            }}
                                        >
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
    const [preferences, setPreferences] = useState("")
    const [days, setDays] = useState(1)
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
            const tasksForAI = existingTasks
                .filter(t => t.status === "unscheduled")
                .map(t => ({
                    id: t.id,
                    title: t.title,
                    subject: t.subject,
                    priority: t.priority,
                    durationMinutes: t.durationMinutes,
                    deadline: t.deadline ? (typeof t.deadline.toDate === 'function' ? t.deadline.toDate().toISOString() : new Date(t.deadline as any).toISOString()) : undefined
                }))

            // Pass preferences and days to the action
            const result = await scheduleUserTasks(tasksForAI, hours, preferences, days)

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

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label>Schedule Duration</Label>
                    <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Next Day Only</SelectItem>
                            <SelectItem value="3">Next 3 Days</SelectItem>
                            <SelectItem value="7">Next Week</SelectItem>
                            <SelectItem value="30">Next Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Daily Study Limit (Hours)</Label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="12"
                            step="0.5"
                            value={hours}
                            onChange={(e) => setHours(parseFloat(e.target.value))}
                            className="flex-1"
                        />
                        <span className="w-12 text-center font-mono">{hours}h</span>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>Specific Requests (Optional)</Label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder='e.g. "Focus on Math", "No breaks on Tuesday", "Finish Biology first"'
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                    />
                </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full mt-4">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</> : <><Sparkles className="mr-2 h-4 w-4" /> Schedule My Tasks</>}
            </Button>
        </div>
    )
}
