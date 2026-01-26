"use client"

import { useState } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent } from "@/components/ui/card"

const localizer = momentLocalizer(moment)

interface StudyCalendarProps {
    tasks: any[]
    onSelectEvent?: (event: any) => void
    onSelectSlot?: (slotInfo: any) => void
}

export function StudyCalendar({ tasks, onSelectEvent, onSelectSlot }: StudyCalendarProps) {
    const [view, setView] = useState(Views.WEEK)

    const events = tasks.map(t => {
        let start = new Date(t.dueDate.toDate ? t.dueDate.toDate() : t.dueDate)
        let end = new Date(start.getTime() + (t.duration || 60) * 60000)

        return {
            id: t.id,
            title: t.title,
            start,
            end,
            resource: t
        }
    })

    const eventStyleGetter = (event: any) => {
        const priority = event.resource.priority
        let backgroundColor = "#3b82f6" // blue-500
        if (priority === "High") backgroundColor = "#ef4444" // red-500
        if (priority === "Low") backgroundColor = "#22c55e" // green-500

        if (event.resource.isCompleted) backgroundColor = "#9ca3af" // gray-400

        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 0.8,
                color: "white",
                border: "0px",
                display: "block"
            }
        }
    }

    return (
        <Card className="h-full border-none shadow-none">
            <CardContent className="h-[600px] p-0">
                <Calendar
                    localizer={localizer}
                    events={events} // Cast to any if type conflicts occur
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    view={view}
                    onView={(v: any) => setView(v)}
                    onSelectEvent={onSelectEvent}
                    onSelectSlot={onSelectSlot}
                    selectable
                    eventPropGetter={eventStyleGetter}
                    views={["month", "week", "day"]}
                />
            </CardContent>
        </Card>
    )
}
