"use client"

import { useState } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import { Card, CardContent } from "@/components/ui/card"

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar) as any

interface StudyCalendarProps {
    events: any[]
    onSelectEvent?: (event: any) => void
    onSelectSlot?: (slotInfo: any) => void
    onDropFromOutside?: (item: any) => void
    onEventDrop?: (args: any) => void
    resizable?: boolean
}

export function StudyCalendar({ events, onSelectEvent, onSelectSlot, onDropFromOutside, onEventDrop, resizable }: StudyCalendarProps) {
    const [view, setView] = useState(Views.WEEK)

    // Events are now passed in formatted


    const eventStyleGetter = (event: any) => {
        const priority = event.resource.priority
        let backgroundColor = "#3b82f6" // blue-500
        if (priority === "High") backgroundColor = "#ef4444" // red-500
        if (priority === "Low") backgroundColor = "#22c55e" // green-500

        if (event.resource.status === 'completed') backgroundColor = "#9ca3af" // gray-400

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
                <DnDCalendar
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
                    onEventDrop={onEventDrop}
                    onDropFromOutside={onDropFromOutside}
                    resizable={resizable}
                />
            </CardContent>
        </Card>
    )
}
