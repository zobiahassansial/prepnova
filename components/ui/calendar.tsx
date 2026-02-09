// @ts-nocheck
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// We replace the complex DayPicker props with standard Input props
export interface CalendarProps extends React.InputHTMLAttributes<HTMLInputElement> { }

function Calendar({ className, ...props }: CalendarProps) {
    return (
        <div className={cn("p-1", className)}>
            <input
                type="date"
                className={cn(
                    // Base styles for a clean input box
                    "flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                    // Text styling
                    "text-white placeholder:text-slate-400",
                    // Focus states
                    "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
                    // This forces the native browser picker to be Dark Mode so it looks good
                    "[color-scheme:dark]",
                    className
                )}
                {...props}
            />
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }