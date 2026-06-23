"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CalendarProps = React.InputHTMLAttributes<HTMLInputElement>

function Calendar({ className, ...props }: CalendarProps) {
    return (
        <div className={cn("p-1", className as string)}>
            <input
                type="date"
                className={cn(
                    "flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm",
                    "text-white placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
                    "[color-scheme:dark]",
                )}
                {...props}
            />
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
export type { CalendarProps }
