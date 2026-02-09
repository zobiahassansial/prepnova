"use client"

import { memo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

export const OverviewChart = memo(function OverviewChart({ data }: { data?: { name: string, total: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
                No activity yet
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                />
                <Bar
                    dataKey="total"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                />
            </BarChart>
        </ResponsiveContainer>
    )
})
