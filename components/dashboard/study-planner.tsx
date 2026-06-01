"use client"

import React, { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Clock, BookOpen, CheckCircle2, Loader2, Sparkles, Filter, Play, Trash2, MoreVertical, X } from "lucide-react"
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
import { createStudyTask, logStudyActivity, scheduleStudyTask, unscheduleStudyTask, checkScheduleConflict, checkDailyLimit, deleteStudyTask, deleteAllScheduledTasks, deleteAllUnscheduledTasks, updateTaskOrder, clearDayTasks } from "@/actions/study-planner"
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
    const [draggedScheduleId, setDraggedScheduleId] = useState<string | undefined>(undefined)
    const [dragOverZoneId, setDragOverZoneId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>(new Date().toDateString())
    const [showCalendar, setShowCalendar] = useState(false)
    const [aiOpen, setAiOpen] = useState(false)
    const [newTaskOpen, setNewTaskOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<StudyTask | null>(null)
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

    // Pre-compute values that were previously inside JSX useMemo calls (hook rule violation fix)
    const calendarEvents = useMemo(() => schedule.map((s: StudySchedule) => {
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
    }).filter(Boolean), [schedule, tasks])

    const tabDates = useMemo(() => {
        const datesSet = new Set<string>()
        // Only include dates that actually have schedule entries
        schedule.forEach((s: StudySchedule) => {
            const d = s.scheduledDate.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
            datesSet.add(d.toDateString())
        })
        // Always keep today so user always has a "home" tab
        datesSet.add(new Date().toDateString())
        return Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    }, [schedule])

    // Auto-switch activeTab when its date no longer has any schedule entries
    useEffect(() => {
        if (tabDates.length > 0 && !tabDates.includes(activeTab)) {
            // Prefer today, otherwise pick the latest available date
            const today = new Date().toDateString()
            setActiveTab(tabDates.includes(today) ? today : tabDates[tabDates.length - 1])
        }
    }, [tabDates, activeTab])

    const scheduledTasksForDay = useMemo(() => schedule.filter((s: StudySchedule) => {
        const d = s.scheduledDate.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
        return d.toDateString() === activeTab
    })
        .sort((a: StudySchedule, b: StudySchedule) => {
            // Sort by time first, then orderIndex as tiebreaker
            const [ah, am] = a.scheduledTime.split(":").map(Number)
            const [bh, bm] = b.scheduledTime.split(":").map(Number)
            const timeDiff = ah * 60 + am - (bh * 60 + bm)
            if (timeDiff !== 0) return timeDiff
            return (a.orderIndex || 0) - (b.orderIndex || 0)
        }), [schedule, tasks, activeTab])

    // Compute a scheduled time for inserting a task at `insertIndex` in `sortedItems`
    const computeTimeAtIndex = useCallback((insertIndex: number, sortedItems: StudySchedule[]): string => {
        if (sortedItems.length === 0) return "08:00"
        if (insertIndex === 0) {
            // Before first item — 5 min before, minimum 08:00
            const [h, m] = sortedItems[0].scheduledTime.split(":").map(Number)
            const mins = Math.max(8 * 60, h * 60 + m - 5)
            return `${Math.floor(mins / 60).toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}`
        }
        // After item at insertIndex - 1
        const prev = sortedItems[insertIndex - 1]
        const prevTask = tasks.find((t: StudyTask) => t.id === prev.taskId)
        const [h, m] = prev.scheduledTime.split(":").map(Number)
        const endMins = h * 60 + m + (prevTask?.durationMinutes || 60)
        return `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`
    }, [tasks])

    // Handle a drop onto a specific insertion index in the scheduled list
    const handleDropAtIndex = useCallback(async (insertIndex: number) => {
        if (!draggedTask || !user) return
        const dateObj = new Date(activeTab)
        const sortedItems = scheduledTasksForDay.filter(s => s.id !== draggedScheduleId)
        const newTime = computeTimeAtIndex(insertIndex, sortedItems)

        try {
            if (draggedScheduleId) {
                // Rescheduling an already-scheduled item (reorder or cross-day move)
                const scheduleRef = doc(db, "study_schedule", draggedScheduleId)
                await updateDoc(scheduleRef, {
                    scheduledDate: Timestamp.fromDate(dateObj),
                    scheduledTime: newTime,
                    orderIndex: insertIndex
                })
                toast.success("Task moved")
            } else {
                // Scheduling an unscheduled task
                const hasConflict = await checkScheduleConflict(user.uid, dateObj, newTime, draggedTask.durationMinutes || 60)
                if (hasConflict) { toast.error("Schedule conflict detected!"); return }
                await scheduleStudyTask(user.uid, draggedTask.id, dateObj, newTime)
                toast.success(`Scheduled: ${draggedTask.title}`)
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to schedule task")
        } finally {
            setDraggedTask(null)
            setDraggedScheduleId(undefined)
            setDragOverZoneId(null)
        }
    }, [draggedTask, draggedScheduleId, user, activeTab, scheduledTasksForDay, computeTimeAtIndex])

    // Per-day completion status
    const dayTaskStatuses = useMemo(() => {
        return scheduledTasksForDay.map(s => tasks.find(t => t.id === s.taskId)?.status)
    }, [scheduledTasksForDay, tasks])

    const allDayDone = scheduledTasksForDay.length > 0 && dayTaskStatuses.every(s => s === "completed")
    const someDayDone = dayTaskStatuses.some(s => s === "completed")

    const handleClearDay = useCallback(async (dateStr: string, confirm_msg: string) => {
        if (!user) return
        if (!confirm(confirm_msg)) return
        try {
            // Build YYYY-MM-DD from toDateString()
            const d = new Date(dateStr)
            const y = d.getFullYear()
            const mo = String(d.getMonth() + 1).padStart(2, "0")
            const dy = String(d.getDate()).padStart(2, "0")
            await clearDayTasks(user.uid, `${y}-${mo}-${dy}`)
            toast.success("Day cleared")
        } catch (e) {
            toast.error("Failed to clear day")
        }
    }, [user])

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
                        existingSchedule={schedule}
                        allTasks={tasks}
                    />

                </DialogContent>
            </Dialog>


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
                <div className="lg:col-span-3 h-full overflow-y-auto">
                    {/* Main Content Area: Calendar OR List */}
                    {showCalendar ? (
                        schedule.length > 0 ? (
                            <StudyCalendar
                                events={calendarEvents as any}
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

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                {/* Browser-like Tab Bar */}
                                <div className="w-full overflow-x-auto bg-muted/20 pt-2 px-2 rounded-t-lg border-b border-border [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-center">
                                    <TabsList className="w-full justify-start h-auto bg-transparent p-0 space-x-1 flex-1">
                                        {tabDates.map(dateStr => {
                                            const dayEntries = schedule.filter((s: StudySchedule) => {
                                                const sd = s.scheduledDate?.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
                                                return sd.toDateString() === dateStr
                                            })
                                            const dayStatuses = dayEntries.map(s => tasks.find(t => t.id === s.taskId)?.status)
                                            const tabAllDone = dayEntries.length > 0 && dayStatuses.every(s => s === "completed")
                                            const isToday = dateStr === new Date().toDateString()
                                            return (
                                                <div key={dateStr} className="relative flex items-center group/tab">
                                                    <TabsTrigger
                                                        value={dateStr}
                                                        className="rounded-t-md rounded-b-none border border-transparent data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none px-3 py-2 pr-7 text-sm font-medium transition-all relative top-px"
                                                    >
                                                        {tabAllDone && <span className="mr-1.5 text-green-500 text-xs">✓</span>}
                                                        {new Date(dateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                                        {isToday && <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">Today</span>}
                                                    </TabsTrigger>
                                                    {/* Close / clear button — visible on hover or when all done */}
                                                    {!isToday && (
                                                        <button
                                                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted z-10 ${tabAllDone ? "opacity-100 text-green-600 hover:text-red-500" : "opacity-0 group-hover/tab:opacity-100"}`}
                                                            title={tabAllDone ? "Clear completed day" : "Clear this day"}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleClearDay(dateStr, tabAllDone
                                                                    ? "All tasks are done! Remove this day from your planner?"
                                                                    : "Clear all tasks for this day? Completed tasks will be deleted, incomplete tasks will be moved back to unscheduled.")
                                                            }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </TabsList>
                                </div>

                                <TabsContent value={activeTab} className="mt-4 space-y-0">
                                    {/* All-done banner */}
                                    {allDayDone && (
                                        <div className="flex items-center justify-between p-3 mb-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                                            <span className="font-medium">🎉 All tasks completed for this day!</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 h-7 text-xs"
                                                onClick={() => handleClearDay(activeTab, "Remove this completed day from your planner?")}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" /> Clear Day
                                            </Button>
                                        </div>
                                    )}

                                    {/* Partial-done banner when some (not all) tasks done and day is not today */}
                                    {!allDayDone && someDayDone && activeTab !== new Date().toDateString() && scheduledTasksForDay.length > 0 && (
                                        <div className="flex items-center justify-between p-3 mb-3 rounded-lg bg-muted/40 border border-border text-muted-foreground text-sm">
                                            <span>{dayTaskStatuses.filter(s => s === "completed").length}/{scheduledTasksForDay.length} tasks done</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                onClick={() => handleClearDay(activeTab, "Clear all tasks for this day? Completed tasks are deleted, incomplete ones go back to unscheduled.")}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" /> Clear Day
                                            </Button>
                                        </div>
                                    )}

                                    {/* Empty-state drop zone when no tasks for the day */}
                                    {scheduledTasksForDay.length === 0 && (
                                        <div
                                            className={`min-h-[120px] rounded-lg border-2 border-dashed flex items-center justify-center text-sm text-muted-foreground transition-colors ${dragOverZoneId === "zone-0" ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/20"}`}
                                            onDragOver={(e) => { e.preventDefault(); setDragOverZoneId("zone-0") }}
                                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZoneId(null) }}
                                            onDrop={(e) => { e.preventDefault(); handleDropAtIndex(0) }}
                                        >
                                            {dragOverZoneId === "zone-0" ? "Drop here to schedule" : "Drag tasks here to schedule them"}
                                        </div>
                                    )}

                                    {/* Render items with drop zones BETWEEN them */}
                                    <AnimatePresence>
                                        {scheduledTasksForDay.map((s: StudySchedule, index: number) => {
                                            const task = tasks.find((t: StudyTask) => t.id === s.taskId)
                                            if (!task) return null
                                            const isCompleted = task.status === "completed"
                                            const isDraggingThis = draggedScheduleId === s.id
                                            const zoneId = `zone-${index}`

                                            return (
                                                <React.Fragment key={s.id}>
                                                    {/* Drop zone BEFORE this item */}
                                                    <div
                                                        className={`transition-all duration-150 rounded-md overflow-hidden ${dragOverZoneId === zoneId && !isDraggingThis ? "h-12 border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center text-xs text-primary mb-1" : "h-1"}`}
                                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDraggingThis) setDragOverZoneId(zoneId) }}
                                                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZoneId(null) }}
                                                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropAtIndex(index) }}
                                                    >
                                                        {dragOverZoneId === zoneId && !isDraggingThis && "Drop here"}
                                                    </div>

                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: isDraggingThis ? 0.4 : 1, y: 0 }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className={`flex items-center justify-between p-4 border rounded-lg mb-1 transition-all select-none ${isCompleted
                                                            ? "bg-muted/30 border-muted text-muted-foreground"
                                                            : "bg-card hover:bg-accent/50 shadow-sm"
                                                            } ${!isCompleted ? "cursor-grab active:cursor-grabbing" : ""}`}
                                                        draggable={!isCompleted}
                                                        onDragStart={(e: any) => {
                                                            e.dataTransfer.effectAllowed = "move"
                                                            e.dataTransfer.setData("application/json", JSON.stringify({ ...task, scheduleId: s.id }))
                                                            setDraggedTask(task)
                                                            setDraggedScheduleId(s.id)
                                                        }}
                                                        onDragEnd={() => {
                                                            setDraggedTask(null)
                                                            setDraggedScheduleId(undefined)
                                                            setDragOverZoneId(null)
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className={`w-1 h-12 rounded-full flex-shrink-0 ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                                                            <div className="min-w-0">
                                                                <div className={`font-medium text-base truncate ${isCompleted ? "line-through" : ""}`}>{task.title}</div>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                                                                        {formatTimeRange(s.scheduledTime, task.durationMinutes || 60)}
                                                                    </span>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <span className="hidden sm:inline">{task.durationMinutes}m</span>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <span className="hidden sm:inline truncate">{task.subject}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 flex-shrink-0 ml-2">
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
                                                                    <Button size="sm" className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                                                                        if (!user) return
                                                                        await updateDoc(doc(db, "study_tasks", task.id), { status: "completed" })
                                                                        await logStudyActivity(user.uid, task.id, "completed", "Task completed via list")
                                                                        toast.success("Completed!")
                                                                    }} title="Complete"><CheckCircle2 className="h-4 w-4" /></Button>
                                                                </>
                                                            )}
                                                            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={async () => {
                                                                if (!user) return
                                                                if (confirm("Delete?")) {
                                                                    await deleteStudyTask(user.uid, task.id)
                                                                    toast.success("Deleted")
                                                                }
                                                            }} title="Delete"><Trash2 className="h-3 w-3" /></Button>
                                                        </div>
                                                    </motion.div>
                                                </React.Fragment>
                                            )
                                        })}
                                    </AnimatePresence>

                                    {/* Drop zone AFTER all items (append to end) */}
                                    {scheduledTasksForDay.length > 0 && (
                                        <div
                                            className={`transition-all duration-150 rounded-md overflow-hidden ${dragOverZoneId === "zone-end" ? "h-12 border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center text-xs text-primary" : "h-2"}`}
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverZoneId("zone-end") }}
                                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZoneId(null) }}
                                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropAtIndex(scheduledTasksForDay.filter(s => s.id !== draggedScheduleId).length) }}
                                        >
                                            {dragOverZoneId === "zone-end" && "Drop here to add at end"}
                                        </div>
                                    )}
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
                            className="flex-1 overflow-y-auto p-2"
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZoneId(null) }}
                            onDrop={async (e) => {
                                e.preventDefault()
                                setDragOverZoneId(null)
                                try {
                                    const raw = e.dataTransfer.getData("application/json")
                                    if (!raw || !user) return
                                    const item = JSON.parse(raw)
                                    if (item.scheduleId) {
                                        await unscheduleStudyTask(user.uid, item.scheduleId, item.id, Date.now())
                                        toast.success("Task unscheduled")
                                        setDraggedTask(null)
                                        setDraggedScheduleId(undefined)
                                    }
                                } catch { }
                            }}
                        >
                            {(() => {
                                const unscheduled = tasks
                                    .filter((t: StudyTask) => t.status === "unscheduled")
                                    .sort((a: StudyTask, b: StudyTask) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

                                if (unscheduled.length === 0) return (
                                    <div className={`flex flex-col items-center justify-center h-full min-h-[80px] text-center text-muted-foreground p-4 gap-2 rounded-lg border-2 border-dashed transition-colors ${dragOverZoneId === "unscheduled-panel" ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/20 opacity-50"}`}>
                                        <Filter className="h-6 w-6" />
                                        <p className="text-xs">Drag tasks here to unschedule</p>
                                    </div>
                                )

                                return (
                                    <div className="space-y-0">
                                        {unscheduled.map((task: StudyTask, index: number) => {
                                            const zoneId = `unscheduled-zone-${index}`
                                            const isDraggingThis = draggedTask?.id === task.id && !draggedScheduleId
                                            return (
                                                <React.Fragment key={task.id}>
                                                    {/* Drop zone before each item */}
                                                    <div
                                                        className={`transition-all duration-150 rounded overflow-hidden ${dragOverZoneId === zoneId ? "h-8 border-2 border-dashed border-primary bg-primary/5 mb-1" : "h-1"}`}
                                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverZoneId(zoneId) }}
                                                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZoneId(null) }}
                                                        onDrop={async (e) => {
                                                            e.preventDefault(); e.stopPropagation()
                                                            const raw = e.dataTransfer.getData("application/json")
                                                            if (!raw || !user) return
                                                            const item = JSON.parse(raw)
                                                            if (item.id === task.id) return
                                                            const newOrder = index === 0 ? (unscheduled[0]?.orderIndex ?? 0) - 1000 : ((unscheduled[index - 1]?.orderIndex ?? 0) + (task.orderIndex ?? index * 1000)) / 2
                                                            if (item.scheduleId) {
                                                                await unscheduleStudyTask(user.uid, item.scheduleId, item.id, newOrder)
                                                                toast.success("Task unscheduled")
                                                            } else {
                                                                await updateTaskOrder(user.uid, item.id, "study_tasks", newOrder)
                                                            }
                                                            setDraggedTask(null); setDraggedScheduleId(undefined); setDragOverZoneId(null)
                                                        }}
                                                    />
                                                    <div
                                                        className={`p-2 border rounded-md bg-card text-sm cursor-grab active:cursor-grabbing hover:bg-accent/50 relative group mb-1 select-none transition-opacity ${isDraggingThis ? "opacity-40" : ""}`}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.effectAllowed = "move"
                                                            e.dataTransfer.setData("application/json", JSON.stringify(task))
                                                            setDraggedTask(task)
                                                            setDraggedScheduleId(undefined)
                                                        }}
                                                        onDragEnd={() => { setDraggedTask(null); setDraggedScheduleId(undefined); setDragOverZoneId(null) }}
                                                    >
                                                        <div className="font-medium truncate pr-6">{task.title}</div>
                                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                            <span>{task.durationMinutes}m · {task.subject}</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : task.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>{task.priority}</span>
                                                        </div>
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={async (e) => {
                                                                e.stopPropagation()
                                                                if (!user) return
                                                                if (confirm("Delete this task?")) { await deleteStudyTask(user.uid, task.id); toast.success("Task deleted") }
                                                            }}><Trash2 className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            )
                                        })}
                                        {/* Drop zone at the end */}
                                        <div
                                            className={`transition-all duration-150 rounded overflow-hidden ${dragOverZoneId === "unscheduled-zone-end" ? "h-8 border-2 border-dashed border-primary bg-primary/5" : "h-1"}`}
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverZoneId("unscheduled-zone-end") }}
                                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZoneId(null) }}
                                            onDrop={async (e) => {
                                                e.preventDefault(); e.stopPropagation()
                                                const raw = e.dataTransfer.getData("application/json")
                                                if (!raw || !user) return
                                                const item = JSON.parse(raw)
                                                const newOrder = (unscheduled[unscheduled.length - 1]?.orderIndex ?? 0) + 1000
                                                if (item.scheduleId) {
                                                    await unscheduleStudyTask(user.uid, item.scheduleId, item.id, newOrder)
                                                    toast.success("Task unscheduled")
                                                } else if (item.id !== unscheduled[unscheduled.length - 1]?.id) {
                                                    await updateTaskOrder(user.uid, item.id, "study_tasks", newOrder)
                                                }
                                                setDraggedTask(null); setDraggedScheduleId(undefined); setDragOverZoneId(null)
                                            }}
                                        />
                                    </div>
                                )
                            })()}
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

type ScheduledPreviewItem = {
    task_id: string
    scheduled_date: string
    scheduled_time: string
    duration_minutes: number
    title: string
    subject: string
    priority: string
}

const AIPlanGenerator = memo(({ user, onClose, existingTasks, targetDate, existingSchedule, allTasks }: {
    user: any
    onClose: () => void
    existingTasks: StudyTask[]
    targetDate: string
    existingSchedule?: StudySchedule[]
    allTasks?: StudyTask[]
}) => {
    const [hours, setHours] = useState(2)
    const [preferences, setPreferences] = useState("")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [preview, setPreview] = useState<ScheduledPreviewItem[] | null>(null)
    const [skipped, setSkipped] = useState<{ task_id: string; reason: string }[]>([])

    const handleGenerate = async () => {
        if (!user || existingTasks.length === 0) return
        setLoading(true)
        setPreview(null)
        setSkipped([])

        try {
            const tasksForAI = existingTasks.map(t => ({
                id: t.id,
                title: t.title,
                subject: t.subject,
                priority: t.priority,
                durationMinutes: t.durationMinutes,
                deadline: t.deadline
                    ? (typeof (t.deadline as any).toDate === "function"
                        ? (t.deadline as any).toDate().toISOString()
                        : new Date(t.deadline as any).toISOString())
                    : undefined
            }))

            // Build local date string without timezone shift
            const target = new Date(targetDate)
            const y = target.getFullYear()
            const mo = String(target.getMonth() + 1).padStart(2, "0")
            const d = String(target.getDate()).padStart(2, "0")
            const startDateStr = `${y}-${mo}-${d}`

            // Collect already-scheduled blocks for the target day so times don't overlap
            const dayExisting = (existingSchedule || [])
                .filter(s => {
                    const sd = s.scheduledDate?.toDate ? s.scheduledDate.toDate() : new Date(s.scheduledDate as any)
                    return sd.toDateString() === target.toDateString()
                })
                .map(s => {
                    const task = allTasks?.find(t => t.id === s.taskId)
                    return {
                        scheduledTime: s.scheduledTime,
                        durationMinutes: task?.durationMinutes || 60,
                        scheduledDate: startDateStr
                    }
                })

            const result = await scheduleUserTasks(tasksForAI, hours, preferences, 1, startDateStr, dayExisting)

            if (result.error) { toast.error(result.error); return }

            const { scheduled_tasks = [], unscheduled_tasks = [] } = result.schedule as any

            // Enrich preview with task details
            const enriched: ScheduledPreviewItem[] = scheduled_tasks.map((item: any) => {
                const task = existingTasks.find(t => t.id === item.task_id)
                return {
                    ...item,
                    title: task?.title || item.task_id,
                    subject: task?.subject || "",
                    priority: task?.priority || "Medium"
                }
            }).sort((a: any, b: any) => a.scheduled_time.localeCompare(b.scheduled_time))

            setPreview(enriched)
            setSkipped(unscheduled_tasks)

        } catch (e: any) {
            toast.error(e.message || "Failed to generate schedule")
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!preview || !user) return
        setSaving(true)
        try {
            // Schedule sequentially to keep proper ordering
            for (const item of preview) {
                await scheduleStudyTask(
                    user.uid,
                    item.task_id,
                    new Date(`${item.scheduled_date}T00:00:00`),
                    item.scheduled_time
                )
            }
            toast.success(`Scheduled ${preview.length} task${preview.length !== 1 ? "s" : ""} successfully!`)
            onClose()
        } catch (e: any) {
            toast.error(e.message || "Failed to save schedule")
        } finally {
            setSaving(false)
        }
    }

    if (existingTasks.length === 0) return (
        <div className="space-y-4 py-4">
            <div className="text-center p-6 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground mb-2">No unscheduled tasks found.</p>
                <p className="text-sm text-muted-foreground">Add tasks first using the "Add Task" button, then use AI to schedule them.</p>
            </div>
            <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
        </div>
    )

    // ── Preview screen ────────────────────────────────────────────────────────
    if (preview) return (
        <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{preview.length} task{preview.length !== 1 ? "s" : ""} scheduled — review before saving</p>
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)} className="text-xs">← Edit</Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {preview.map((item, i) => (
                    <div key={item.task_id} className="flex items-center gap-3 p-3 border rounded-lg bg-card text-sm">
                        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${item.priority === "High" ? "bg-red-500" : item.priority === "Medium" ? "bg-orange-500" : "bg-yellow-500"}`} />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.subject}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="font-mono text-xs font-semibold">{item.scheduled_time}</div>
                            <div className="text-xs text-muted-foreground">{item.duration_minutes}m</div>
                        </div>
                    </div>
                ))}
            </div>

            {skipped.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    <strong>{skipped.length} task{skipped.length !== 1 ? "s" : ""} couldn't fit</strong> within the {hours}h daily limit and will remain unscheduled.
                </div>
            )}

            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPreview(null)} disabled={saving}>Regenerate</Button>
                <Button className="flex-1" onClick={handleConfirm} disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <>Confirm & Save</>}
                </Button>
            </div>
        </div>
    )

    // ── Setup screen ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/20 rounded-lg text-sm">
                <p className="font-medium">{existingTasks.length} unscheduled task{existingTasks.length !== 1 ? "s" : ""} will be arranged for <strong>{new Date(targetDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</strong>.</p>
                <p className="text-xs text-muted-foreground mt-1">High priority tasks go first. Breaks are inserted automatically.</p>
            </div>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label className="text-sm">Daily Study Limit</Label>
                    <div className="flex items-center gap-4">
                        <input type="range" min="1" max="12" step="0.5" value={hours}
                            onChange={(e) => setHours(parseFloat(e.target.value))} className="flex-1 accent-primary" />
                        <span className="w-16 text-center font-mono text-sm font-semibold">{hours}h</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{Math.floor(hours * 60 / 60)}h {(hours * 60) % 60 > 0 ? `${(hours * 60) % 60}m` : ""} · up to {Math.floor(hours * 60 / 70)} tasks (with breaks)</p>
                </div>

                <div className="grid gap-2">
                    <Label className="text-sm">Your Preferences <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <textarea
                        className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder='e.g. "Focus on Math first", "Short sessions only", "Prioritize Biology before Physics"'
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                    />
                </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating schedule...</>
                    : <><Sparkles className="mr-2 h-4 w-4" />Generate Schedule</>}
            </Button>
        </div>
    )
})

AIPlanGenerator.displayName = "AIPlanGenerator"
