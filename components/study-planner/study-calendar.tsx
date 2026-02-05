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

export function StudyCalendar({
    events,
    onSelectEvent,
    onSelectSlot,
    onDropFromOutside,
    onEventDrop,
    resizable
}: StudyCalendarProps) {
    const [view, setView] = useState(Views.WEEK)

    /* -------------------------------
       TASK VISUAL PRIORITY (FIXED)
    --------------------------------*/
    const eventStyleGetter = (event: any) => {
        const priority = event.resource?.priority
        let backgroundColor = "#eab308" // Low → Yellow

        if (priority === "Medium") backgroundColor = "#f97316" // Orange
        if (priority === "High") backgroundColor = "#ef4444" // Red
        if (event.resource?.status === "completed") backgroundColor = "#22c55e" // Green

        return {
            style: {
                backgroundColor,
                borderRadius: "8px",
                opacity: 1,
                color: "#ffffff",
                border: "none",
                padding: "6px 8px",
                fontWeight: 600,
                boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                zIndex: 5
            }
        }
    }

    /* -------------------------------
       TODAY COLUMN (STRONGER)
    --------------------------------*/
    const dayPropGetter = (date: Date) => {
        const today = new Date()
        const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()

        if (isToday) {
            return {
                style: {
                    backgroundColor: "rgba(59,130,246,0.15)", // stronger blue tint
                    borderLeft: "2px solid #60a5fa",
                    borderRight: "2px solid #60a5fa"
                }
            }
        }
        return {}
    }

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardContent className="h-[650px] p-0">
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    onView={(v: any) => setView(v)}
                    selectable
                    onSelectEvent={onSelectEvent}
                    onSelectSlot={onSelectSlot}
                    onEventDrop={onEventDrop}
                    onDropFromOutside={onDropFromOutside}
                    resizable={resizable}
                    views={["month", "week", "day"]}
                    eventPropGetter={eventStyleGetter}
                    dayPropGetter={dayPropGetter}
                    style={{ height: "100%" }}
                />
            </CardContent>

            {/* GLOBAL CALENDAR VISIBILITY FIX */}
            <style jsx global>{`
        .rbc-time-view {
          border: none;
        }

        .rbc-time-header {
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }

        .rbc-time-slot {
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .rbc-timeslot-group {
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .rbc-time-gutter {
          color: rgba(255,255,255,0.75);
          font-weight: 500;
          width: 70px;
        }

        .rbc-header {
          color: #ffffff;
          font-weight: 600;
          padding: 8px 0;
        }

        .rbc-current-time-indicator {
          background-color: #22c55e;
          height: 2px;
        }
      `}</style>
        </Card>
    )
}
