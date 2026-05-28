"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Clock, BookOpen, CheckCircle2, Loader2, Sparkles, Filter, Play, Trash2, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StudyCalendar } from "@/components/study-planner/study-calendar"
import { Calendar } from "@/components/ui/calendar"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { generateStudyPlan, scheduleUserTasks } from "@/actions/ai-planner"
import { createStudyTask, logStudyActivity, scheduleStudyTask, unscheduleStudyTask, checkScheduleConflict, checkDailyLimit, deleteStudyTask, deleteAllScheduledTasks, deleteAllUnscheduledTasks, updateTaskOrder } from "@/actions/study-planner"
import { checkLimit, incrementUsage, getUserSubscription } from "@/lib/limits"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, Timestamp, getDoc } from "firebase/firestore"
import { logActivity } from "@/lib/logger"
import { StudyTask, StudySchedule, Priority, Difficulty, TaskStatus } from "@/types/study-planner"
import { onAuthStateChanged } from "firebase/auth"

const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const date = new Date()
    date.setHours(h, m)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

const formatTimeRange = (time: string, durationMinutes: number) => {
    const [h, m] = time.split(":").map(Number)
    const start = new Date()
    start.setHours(h, m, 0, 0)
    const end = new Date(start.getTime() + durationMinutes * 60000)
    const format = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    return `${format(start)} - ${format(end)}`
}

export function StudyPlanner() {

    const [user, setUser] = useState<any>(null)
    const [tasks, setTasks] = useState<StudyTask[]>([])
    const [schedule, setSchedule] = useState<StudySchedule[]>([])
    const [draggedTask, setDraggedTask] = useState<StudyTask | null>(null)
    const [activeTab, setActiveTab] = useState<string>(new Date().toDateString())
    const [showCalendar, setShowCalendar] = useState(false)
    const [aiOpen, setAiOpen] = useState(false)
    const [newTaskOpen, setNewTaskOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<StudyTask | null>(null)
    const [dropIndicator, setDropIndicator] = useState<{ id: string, position: 'top' | 'bottom' } | null>(null)
    const [timerOpen, setTimerOpen] = useState(false)

    // --- Auth & Data Fetching ---
    useEffect(() => {
        return onAuthStateChanged(auth, setUser)
    }, [])

    useEffect(() => {
        if (!user) {
            setTasks([])
            setSchedule([])
            return
        }

        const tasksQuery = query(collection(db, "study_tasks"), where("userId", "==", user.uid))
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StudyTask[]
            setTasks(fetched)
        }, (err) => console.error("Tasks Snapshot Error:", err))

        const scheduleQuery = query(collection(db, "study_schedule"), where("userId", "==", user.uid))
        const unsubscribeSchedule = onSnapshot(scheduleQuery, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StudySchedule[]
            setSchedule(fetched)
        }, (err) => console.error("Schedule Snapshot Error:", err))

        return () => {
            unsubscribeTasks()
            unsubscribeSchedule()
        }
    }, [user])

    const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
        try {
            const scheduleRef = doc(db, "study_schedule", event.id)
            const hours = start.getHours().toString().padStart(2, '0')
            const minutes = start.getMinutes().toString().padStart(2, '0')
            const time = `${hours}:${minutes}`
            const duration = event.resource.durationMinutes || 60

            const hasConflict = await checkScheduleConflict(user?.uid, start, time, duration, event.id)
            if (hasConflict) {
                toast.error("Schedule conflict detected!")
                return
            }

            await updateDoc(scheduleRef, {
                scheduledDate: Timestamp.fromDate(start),
                scheduledTime: time
            })

            await logStudyActivity(user?.uid, event.taskId, "rescheduled", `Rescheduled to ${start.toLocaleString()}`)
            toast.success("Task rescheduled")
        } catch (e) {
            console.error(e)
            toast.error("Failed to reschedule task")
        }
    }, [user])

    const onDropFromOutside = useCallback(async ({ start, end, allDay }: any) => {
        if (!draggedTask || !user) return

        try {
            const hours = start.getHours().toString().padStart(2, '0')
            const minutes = start.getMinutes().toString().padStart(2, '0')
            const time = `${hours}:${minutes}`

            const duration = draggedTask.durationMinutes || 60
            const scheduleId = (draggedTask as any).scheduleId

            if (scheduleId) {
                const hasConflict = await checkScheduleConflict(user.uid, start, time, duration, scheduleId)
                if (hasConflict) {
                    toast.error("Schedule conflict detected!")
                    setDraggedTask(null)
                    return
                }

                const scheduleRef = doc(db, "study_schedule", scheduleId)
                await updateDoc(scheduleRef, {
                    scheduledDate: Timestamp.fromDate(start),
                    scheduledTime: time
                })

                await logStudyActivity(user.uid, draggedTask.id, "rescheduled", `Rescheduled to ${start.toLocaleString()}`)
                toast.success("Task rescheduled")
            } else {
                const isLimitExceeded = await checkDailyLimit(user.uid, start, duration)
                if (isLimitExceeded) {
                    toast.error("Daily study limit (6h) exceeded!")
                    setDraggedTask(null)
                    return
                }

                const hasConflict = await checkScheduleConflict(user.uid, start, time, duration)
                if (hasConflict) {
                    toast.error("Schedule conflict detected!")
                    setDraggedTask(null)
                    return
                }

                await scheduleStudyTask(user.uid, draggedTask.id, start, time)
                toast.success(`Scheduled: ${draggedTask.title}`)
            }

            setDraggedTask(null)
        } catch (e) {
            console.error(e)
            toast.error("Failed to update task")
        }
    }, [draggedTask, user])

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

    const handleCreateTask = useCallback(async () => {
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

            if (newTaskData.scheduledDate && newTaskData.scheduledTime) {
                await scheduleStudyTask(user.uid, taskId, newTaskData.scheduledDate, newTaskData.scheduledTime)
                toast.success("Task created and scheduled")
            } else if (newTaskData.scheduledDate) {
                await scheduleStudyTask(user.uid, taskId, newTaskData.scheduledDate, "09:00")
                toast.success("Task scheduled for morning")
            } else {
                toast.success("Task created")
            }

            if (newTaskData.scheduledDate) {
                setActiveTab(newTaskData.scheduledDate.toDateString())
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
    }, [user, newTaskData])

    const handleSelectSlot = useCallback((slotInfo: any) => {
        const start = slotInfo.start as Date
        const time = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`

        setNewTaskData(prev => ({
            ...prev,
            scheduledDate: start,
            scheduledTime: time
        }))
        setNewTaskOpen(true)
        if (start) setActiveTab(start.toDateString())
    }, [])

    const handleSelectEvent = useCallback((event: any) => {
        setSelectedTask(event.resource)
        setDetailOpen(true)
    }, [])

    const handleCompleteTask = useCallback(async () => {
        if (!selectedTask || !user) return
        try {
            const taskRef = doc(db, "study_tasks", selectedTask.id)
            await updateDoc(taskRef, { status: "completed" })
            await logStudyActivity(user.uid, selectedTask.id, "completed", `Task completed: ${selectedTask.title}`)
            // Log to activityLog for dashboard feed
            await logActivity(user.uid, "task_complete", `Completed: "${selectedTask.title}"`)
            toast.success("Task completed!")
            setDetailOpen(false)
        } catch (e) {
            toast.error("Failed to complete task")
        }
    }, [selectedTask, user])
    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Study Planner</h1>
                    <p className="text-muted-foreground">Drag and drop tasks to organize your schedule.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={showCalendar ? "secondary" : "outline"}
                        onClick={() => setShowCalendar(!showCalendar)}
                        title="Toggle Calendar/List View"
                    >
                        {showCalendar ? <Filter className="h-4 w-4 mr-2" /> : <CalendarIcon className="h-4 w-4 mr-2" />}
                        {showCalendar ? "List View" : "Calendar View"}
                    </Button>
                    <Button
                        onClick={() => setTimerOpen(true)}
                        className="hidden md:flex"
                        variant="outline"
                    >
                        <Play className="mr-2 h-4 w-4 text-green-600" />
                        Study Timer
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Select Date</label>
                                    <Calendar
                                        value={(newTaskData.scheduledDate || (activeTab ? new Date(activeTab) : new Date())).toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const date = e.target.valueAsDate
                                            if (date) {
                                                const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
                                                setNewTaskData({ ...newTaskData, scheduledDate: adjustedDate })
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Duration (min)</label>
                                        <Input type="number" value={newTaskData.duration} onChange={e => setNewTaskData({ ...newTaskData, duration: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Priority</label>
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
                            </div>
                            <Button onClick={handleCreateTask} disabled={createLoading} className="mt-6">{createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Task</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <TimerDialog open={timerOpen} onOpenChange={setTimerOpen} />
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
                        existingTasks={tasks.filter((t: StudyTask) => t.status === "unscheduled")}
                        targetDate={activeTab}
                    />

                </DialogContent>
            </Dialog>


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
                <div className="lg:col-span-3 h-full overflow-y-auto">
                    {/* Main Content Area: Calendar OR List */}
                    {showCalendar ? (
                        schedule.length > 0 ? (
                            <StudyCalendar
                                events={useMemo(() => schedule.map((s: StudySchedule) => {
                                    const task = tasks.find((t: StudyTask) => t.id === s.taskId)
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
                                }).filter(Boolean), [schedule, tasks]) as any}
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

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold tracking-tight">Scheduled Tasks</h2>
                            </div>

                            {/* Always render Tabs, defaulting to activeTab even if no schedule */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                {/* Browser-like Tab Bar */}
                                <div className="w-full overflow-x-auto bg-muted/20 pt-2 px-2 rounded-t-lg border-b border-border [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-center">
                                    <TabsList className="w-full justify-start h-auto bg-transparent p-0 space-x-1 flex-1">
                                        {useMemo(() => {
                                            const dates = Array.from(new Set([...schedule.map((s: StudySchedule) => {
                                                const d = s.scheduledDate.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
                                                return d.toDateString()
                                            }), activeTab]))
                                            return dates.sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
                                        }, [schedule, activeTab])
                                            .map(dateStr => (
                                                <TabsTrigger
                                                    key={dateStr}
                                                    value={dateStr}
                                                    className="rounded-t-md rounded-b-none border border-transparent data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none px-4 py-2 text-sm font-medium transition-all relative top-px"
                                                >
                                                    {new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </TabsTrigger>
                                            ))}
                                    </TabsList>
                                </div>

                                <TabsContent value={activeTab} className="mt-4 space-y-4">
                                    <div
                                        className="space-y-2 min-h-[100px]"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={async (e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setDropIndicator(null)
                                            const data = e.dataTransfer.getData("application/json")
                                            if (!data) return
                                            const draggedItem = JSON.parse(data)
                                            if (!user) return

                                            const dateObj = new Date(activeTab)
                                            let newTime = "09:00"

                                            // Filter for current activeTab tasks only
                                            const currentDayItems = schedule.filter((s: StudySchedule) => {
                                                const d = s.scheduledDate.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
                                                return d.toDateString() === activeTab
                                            }).sort((a: StudySchedule, b: StudySchedule) => (a.orderIndex || 0) - (b.orderIndex || 0))

                                            if (currentDayItems.length > 0) {
                                                const lastItem = currentDayItems[currentDayItems.length - 1]
                                                const tTask = tasks.find(t => t.id === lastItem.taskId)
                                                const [lh, lm] = lastItem.scheduledTime.split(":").map(Number)
                                                const lDate = new Date(dateObj)
                                                lDate.setHours(lh, lm + (tTask?.durationMinutes || 60), 0, 0)
                                                newTime = `${lDate.getHours().toString().padStart(2, '0')}:${lDate.getMinutes().toString().padStart(2, '0')}`
                                            }

                                            // Schedule/Reschedule logic (Use activeTab date)
                                            if (draggedItem.scheduleId) {
                                                // Rescheduling: remove from old schedule then add to new
                                                await unscheduleStudyTask(user.uid, draggedItem.scheduleId, draggedItem.id) // First unschedule
                                                await scheduleStudyTask(user.uid, draggedItem.id, dateObj, newTime)
                                                toast.success(`Moved to ${activeTab}`)
                                            } else {
                                                // New Schedule
                                                await scheduleStudyTask(user.uid, draggedItem.id, dateObj, newTime)
                                                toast.success(`Scheduled for ${activeTab}`)
                                            }
                                        }}
                                    >
                                        <AnimatePresence>
                                            {useMemo(() => schedule.filter((s: StudySchedule) => {
                                                const d = s.scheduledDate.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
                                                return d.toDateString() === activeTab
                                            })
                                                .sort((a: StudySchedule, b: StudySchedule) => {
                                                    const taskA = tasks.find((t: StudyTask) => t.id === a.taskId)
                                                    const taskB = tasks.find((t: StudyTask) => t.id === b.taskId)
                                                    // Completed at bottom
                                                    if (taskA?.status === 'completed' && taskB?.status !== 'completed') return 1
                                                    if (taskA?.status !== 'completed' && taskB?.status === 'completed') return -1
                                                    return (a.orderIndex || 0) - (b.orderIndex || 0)
                                                }), [schedule, tasks, activeTab])
                                                .map((s: StudySchedule, index: number) => {
                                                    const task = tasks.find((t: StudyTask) => t.id === s.taskId)
                                                    if (!task) return null
                                                    const isCompleted = task.status === "completed"

                                                    return (
                                                        <motion.div
                                                            layout
                                                            key={s.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className={`relative flex items-center justify-between p-4 border rounded-lg transition-all ${isCompleted
                                                                ? "bg-white/5 border-white/10 shadow-inner"
                                                                : "bg-card hover:bg-accent/50 cursor-grab shadow-sm"
                                                                }`}
                                                            draggable={!isCompleted}
                                                            onDragStart={(e: any) => {
                                                                e.dataTransfer.setData("application/json", JSON.stringify({ ...task, scheduleId: s.id }))
                                                                setDraggedTask(task)
                                                            }}
                                                            onDragEnd={() => setDraggedTask(null)}
                                                            onDragOver={(e: any) => {
                                                                e.preventDefault()
                                                                const rect = e.currentTarget.getBoundingClientRect()
                                                                const y = e.clientY - rect.top
                                                                const position = y < rect.height / 2 ? 'top' : 'bottom'
                                                                setDropIndicator({ id: s.id, position })
                                                            }}
                                                        >
                                                            {dropIndicator?.id === s.id && dropIndicator.position === 'top' && (
                                                                <div className="absolute -top-3 left-0 right-0 h-0.5 bg-primary z-10" />
                                                            )}

                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className={`w-1 h-12 rounded-full ${task.priority === 'High' ? 'bg-red-500' :
                                                                    task.priority === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'
                                                                    }`} />
                                                                <div>
                                                                    <div className={`font-medium text-base ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                                                                            {formatTimeRange(s.scheduledTime, task.durationMinutes || 60)}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>{task.durationMinutes}m</span>
                                                                        <span>•</span>
                                                                        <span>{task.subject}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {!isCompleted && (
                                                                    <>
                                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.location.href = `/study/mode/${task.id}`} title="Start">
                                                                            <Play className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={async () => {
                                                                            if (!user) return
                                                                            await unscheduleStudyTask(user.uid, s.id, task.id)
                                                                            toast.success("Unscheduled")
                                                                        }} title="Unschedule"><Filter className="h-4 w-4 rotate-180" /></Button>
                                                                        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                                                                            if (!user) return
                                                                            await updateDoc(doc(db, "study_tasks", task.id), { status: "completed" })
                                                                            await logStudyActivity(user.uid, task.id, "completed", "Task completed via list")
                                                                            toast.success("Completed!")
                                                                        }} title="Complete"><CheckCircle2 className="h-4 w-4" /></Button>
                                                                    </>
                                                                )}
                                                                <Button size="sm" variant="destructive" className="h-8 px-2" onClick={async () => {
                                                                    if (!user) return
                                                                    if (confirm("Delete?")) {
                                                                        await deleteStudyTask(user.uid, task.id)
                                                                        toast.success("Deleted")
                                                                    }
                                                                }} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                                                            </div>

                                                            {/* POST-SPACER */}
                                                            {
                                                                dropIndicator?.id === s.id && dropIndicator.position === 'bottom' && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 60, opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="mt-2 border-2 border-dashed border-primary/40 rounded-lg bg-primary/5 w-full"
                                                                    />
                                                                )
                                                            }
                                                        </motion.div>
                                                    )
                                                })}
                                        </AnimatePresence>
                                    </div>
                                </TabsContent>
                            </Tabs>
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
                            {tasks.filter((t: StudyTask) => t.status === "unscheduled").length > 0 ? (
                                tasks
                                    .filter((t: StudyTask) => t.status === "unscheduled")
                                    .sort((a: StudyTask, b: StudyTask) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                    .map((task: StudyTask, index: number, array: StudyTask[]) => (
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

const TimerDialog = memo(({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
        let timer: any
        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        } else if (timeLeft === 0) {
            setIsRunning(false)
            if (isRunning) toast.success("Timer completed! Take a break.")
        }
        return () => clearInterval(timer)
    }, [isRunning, timeLeft])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">Study Timer</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-7xl font-mono font-bold mb-8 tracking-tighter text-slate-800">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            variant={isRunning ? "destructive" : "default"} 
                            size="lg" 
                            className="w-32"
                            onClick={() => setIsRunning(!isRunning)}
                        >
                            {isRunning ? "Pause" : "Start"}
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => { setIsRunning(false); setTimeLeft(25 * 60) }}
                        >
                            Reset
                        </Button>
                    </div>
                    <div className="flex gap-2 mt-8">
                        <Button variant="ghost" size="sm" onClick={() => { setIsRunning(false); setTimeLeft(15 * 60) }}>15m</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setIsRunning(false); setTimeLeft(25 * 60) }}>25m</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setIsRunning(false); setTimeLeft(45 * 60) }}>45m</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setIsRunning(false); setTimeLeft(60 * 60) }}>60m</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
})

// getDoc moved to top imports

const AIPlanGenerator = memo(({ user, onClose, existingTasks, targetDate }: { user: any, onClose: () => void, existingTasks: StudyTask[], targetDate: string }) => {
    const [hours, setHours] = useState(2)
    const [preferences, setPreferences] = useState("")
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        if (!user) return
        setLoading(true)

        try {
            if (existingTasks.length === 0) {
                toast.error("You don't have any study tasks yet. Please add tasks first so I can create a study plan.")
                setLoading(false)
                return
            }

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

            const target = new Date(targetDate)
            const offset = target.getTimezoneOffset()
            const localDate = new Date(target.getTime() - (offset * 60 * 1000))
            const startDateStr = localDate.toISOString().split('T')[0]

            const result = await scheduleUserTasks(tasksForAI, hours, preferences, 1, startDateStr)

            if (result.error) {
                toast.error(result.error)
                return
            }

            const scheduleData = result.schedule
            const promises = []

            if (scheduleData.scheduled_tasks) {
                for (const item of scheduleData.scheduled_tasks) {
                    promises.push(scheduleStudyTask(user.uid, item.task_id, new Date(`${item.scheduled_date}T${item.scheduled_time}`), item.scheduled_time))
                }
            }

            await Promise.all(promises)
            toast.success(`Scheduled ${scheduleData.scheduled_tasks?.length || 0} tasks for ${targetDate}!`)
            onClose()

        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

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
                <p className="text-xs text-muted-foreground">The AI will scale tasks into <strong>{targetDate}</strong>.</p>
            </div>

            <div className="space-y-4">
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
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</> : <><Sparkles className="mr-2 h-4 w-4" /> Schedule for {targetDate}</>}
            </Button>
        </div>
    )
})

AIPlanGenerator.displayName = "AIPlanGenerator"
