"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts"
import { CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react"

type TimeRange = "1month" | "3months" | "6months"

interface MonthData {
  month: string
  monthStart: Date
  monthEnd: Date
  completed: number
  started: number
  tasks: string[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MonthData
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-primary">
            <span className="font-medium">{data.completed}</span> tasks completed
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">{data.started}</span> tasks started
          </p>
        </div>
        {data.tasks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Completed:</p>
            <ul className="text-xs space-y-0.5">
              {data.tasks.slice(0, 3).map((title, i) => (
                <li key={i} className="truncate max-w-[200px]">
                  • {title}
                </li>
              ))}
              {data.tasks.length > 3 && (
                <li className="text-muted-foreground">+{data.tasks.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function ThroughputChart() {
  const { tasks } = useToolingTrackerStore()
  const [timeRange, setTimeRange] = useState<TimeRange>("3months")
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const monthCount = timeRange === "1month" ? 1 : timeRange === "3months" ? 3 : 6

  const monthlyData = useMemo(() => {
    if (!mounted) {
      return []
    }
    const data: MonthData[] = []
    const now = new Date()

    for (let i = monthCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)

      // Count tasks completed this month (using updatedAt as proxy for completion)
      const completedTasks = tasks.filter((task) => {
        if (task.status !== "done") return false
        const updatedAt = new Date(task.updatedAt)
        return updatedAt >= monthStart && updatedAt <= monthEnd
      })

      // Count tasks started this month (created and moved to in-progress)
      const startedTasks = tasks.filter((task) => {
        const createdAt = new Date(task.createdAt)
        return (
          createdAt >= monthStart &&
          createdAt <= monthEnd &&
          (task.status === "in-progress" || task.status === "done")
        )
      })

      const monthLabel = monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })

      data.push({
        month: monthLabel,
        monthStart,
        monthEnd,
        completed: completedTasks.length,
        started: startedTasks.length,
        tasks: completedTasks.map((t) => t.title),
      })
    }

    return data
  }, [mounted, tasks, monthCount])

  const stats = useMemo(() => {
    if (monthlyData.length < 1) return { avg: 0, trend: 0, trendDirection: "stable" as const }

    const total = monthlyData.reduce((sum, m) => sum + m.completed, 0)
    const avg = total / monthlyData.length

    // Compare current month vs previous month
    const currentMonth = monthlyData[monthlyData.length - 1]?.completed || 0
    const previousMonth = monthlyData[monthlyData.length - 2]?.completed || currentMonth

    const trend = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0
    const trendDirection = trend > 5 ? "up" : trend < -5 ? "down" : "stable"

    return { avg: Math.round(avg * 10) / 10, trend: Math.round(trend), trendDirection }
  }, [monthlyData])

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Task Throughput
          </CardTitle>
          <p className="text-xs text-muted-foreground">Tasks completed per month</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm mr-4">
            <span className="text-muted-foreground">Avg:</span>
            <span className="font-bold">{stats.avg}</span>
            <span className="text-muted-foreground">/month</span>
            {stats.trendDirection === "up" && (
              <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
            )}
            {stats.trendDirection === "down" && (
              <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
            )}
            {stats.trendDirection === "stable" && (
              <Minus className="w-4 h-4 text-muted-foreground ml-1" />
            )}
          </div>
          <div className="flex gap-1">
            {(["1month", "3months", "6months"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setTimeRange(range)}
              >
                {range === "1month" ? "1M" : range === "3months" ? "3M" : "6M"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barCategoryGap="20%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "oklch(0.65 0 0)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.65 0 0)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(0.3 0.01 260 / 0.3)" }} />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === monthlyData.length - 1
                        ? "oklch(0.75 0.15 175)"
                        : "oklch(0.65 0.12 175)"
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey="started"
                name="Started"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                fill="oklch(0.6 0.1 260)"
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
