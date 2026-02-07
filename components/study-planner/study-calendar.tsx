"use client"

import { useState, useEffect } from "react"
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
    const [date, setDate] = useState(new Date())

    // Auto-navigate to the first event's date if available
    useEffect(() => {
        if (events && events.length > 0) {
            // Sort events by start time to find the earliest one
            const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            const firstEventDate = new Date(sortedEvents[0].start)
            setDate(firstEventDate)
        }
    }, [events.length]) // Only run when event count changes to avoid jumping during drag/drop

    const eventStyleGetter = (event: any) => {
        const priority = event.resource?.priority
        const subject = event.resource?.subject || ""
        let backgroundColor = "#eab308" // Default/Low (Yellow)

        // Priority Logic
        if (priority === "Medium") backgroundColor = "#f97316" // Orange
        if (priority === "High") backgroundColor = "#ef4444" // Red

        // Subject Logic (Fallback if no Priority, or specific subject overrides)
        // (Optional: Simple hash for subject color if needed, but priority is cleaner)
        if (subject === "Math") backgroundColor = "#3b82f6" // Blue for Math (Example)

        if (event.resource?.status === "completed") backgroundColor = "#22c55e" // Green

        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 1,
                color: "#ffffff",
                border: "1px solid rgba(0,0,0,0.1)",
                padding: "2px 4px",
                fontSize: "0.75rem",
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                zIndex: 1,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                display: "block"
            }
        }
    }

    const slotPropGetter = () => ({
        style: {
            backgroundColor: "transparent",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }
    })

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardContent className="h-[700px] p-0">
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    onView={(v: any) => setView(v)}
                    date={date}
                    onNavigate={(d: any) => setDate(d)}
                    selectable
                    draggableAccessor={() => true}

                    timeslots={1}
                    onSelectEvent={onSelectEvent}
                    onSelectSlot={onSelectSlot}
                    onEventDrop={onEventDrop}
                    onDropFromOutside={onDropFromOutside}
                    dragFromOutsideItem={() => ({ style: { zIndex: 99 } })}
                    resizable={true}
                    // Custom Toolbar to remove Back/Next/Today but keep visibility
                    components={{
                        toolbar: (props: any) => (
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-lg font-semibold text-white">
                                    {props.label}
                                </span>
                                <div className="flex bg-[#11111a] rounded-md p-1 border border-white/5">
                                    {['month', 'week', 'day'].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => props.onView(v)}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${props.view === v
                                                ? "bg-[#3b82f6] text-white"
                                                : "text-gray-500 hover:text-gray-300"
                                                }`}
                                        >
                                            {v.charAt(0).toUpperCase() + v.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    }}
                    views={["month", "week", "day"]}
                    eventPropGetter={eventStyleGetter}
                    slotPropGetter={slotPropGetter}
                    style={{ height: "100%" }}
                />
            </CardContent>

            <style jsx global>{`
                /* DARK THEME VISIBILITY FIXES */
                .rbc-calendar {
                    color: #cbd5e1;
                }

                .rbc-time-view, .rbc-month-view {
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    background-color: #020617; /* Deep dark background */
                    border-radius: 8px;
                }

                /* Fixed overlapping event widths in Day/Week view */
                .rbc-event {
                    width: 100%;
                }

                .rbc-header {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: #94a3b8 !important;
                    padding: 8px 0 !important;
                    font-size: 0.75rem;
                    background-color: #0f172a;
                }

                .rbc-time-gutter .rbc-timeslot-group {
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                }

                .rbc-timeslot-group {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    min-height: 50px !important;
                }

                .rbc-day-slot .rbc-time-slot {
                    border-top: 1px solid rgba(255, 255, 255, 0.02);
                }

                /* Remove the white "Today" highlight that was making it unreadable */
                .rbc-today {
                    background-color: rgba(59, 130, 246, 0.05) !important;
                }

                /* Text visibility on the time gutter */
                .rbc-label {
                    color: #64748b !important;
                    font-size: 0.7rem;
                }

                .rbc-current-time-indicator {
                    background-color: #ef4444;
                }

                .rbc-allday-cell {
                    display: none;
                }
            `}</style>
        </Card>
    )
}