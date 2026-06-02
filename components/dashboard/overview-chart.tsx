"use client"

import { memo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface OverviewChartProps {
    data?: { name: string; total: number }[]
    loading?: boolean
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-sm text-primary">{payload[0].value}h studied</p>
            </div>
        )
    }
    return null
}

// Skeleton bars for loading state
function ChartSkeleton() {
    return (
        <div className="flex items-end gap-3 h-[350px] px-6 pb-6 pt-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                        className="w-full rounded-t-sm bg-muted animate-pulse"
                        style={{ height: `${[40, 70, 50, 90, 60, 30, 45][i]}px` }}
                    />
                    <span className="text-xs text-muted-foreground">{day}</span>
                </div>
            ))}
        </div>
    )
}

export const OverviewChart = memo(function OverviewChart({ data, loading }: OverviewChartProps) {
    if (loading) return <ChartSkeleton />

    if (!data || data.length === 0 || data.every(d => d.total === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground gap-3">
                <p className="text-sm">No activity yet this week.</p>
                <p className="text-xs">Log a study session to see your chart!</p>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", radius: 4 }} />
                <Bar
                    dataKey="total"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                />
            </BarChart>
        </ResponsiveContainer>
    )
})
