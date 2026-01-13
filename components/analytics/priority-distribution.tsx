"use client"

import { useMemo, useState, useSyncExternalStore } from 'react'
import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"

const PRIORITY_COLORS = {
  high: "oklch(0.65 0.2 25)",
  medium: "oklch(0.75 0.15 85)",
  low: "oklch(0.7 0.15 145)",
}

const PRIORITY_ICONS = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: CheckCircle,
}

// Active shape is displayed via hover state in the legend instead

export function PriorityDistribution() {
  const { tasks, timeEntries } = useToolingTrackerStore()
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const priorityData = useMemo(() => {
    if (!mounted) {
      return []
    }
    const data: Record<string, { minutes: number; taskCount: number }> = {
      high: { minutes: 0, taskCount: 0 },
      medium: { minutes: 0, taskCount: 0 },
      low: { minutes: 0, taskCount: 0 },
    }

    tasks.forEach((task) => {
      const taskTime = timeEntries
        .filter((te) => te.taskId === task.id)
        .reduce((acc, te) => acc + te.hours * 60 + te.minutes, 0)

      if (taskTime > 0) {
        data[task.priority].minutes += taskTime
        data[task.priority].taskCount++
      }
    })

    const total = data.high.minutes + data.medium.minutes + data.low.minutes

    return [
      {
        name: "High",
        priority: "high" as const,
        value: data.high.minutes,
        taskCount: data.high.taskCount,
        percentage: total > 0 ? Math.round((data.high.minutes / total) * 100) : 0,
      },
      {
        name: "Medium",
        priority: "medium" as const,
        value: data.medium.minutes,
        taskCount: data.medium.taskCount,
        percentage: total > 0 ? Math.round((data.medium.minutes / total) * 100) : 0,
      },
      {
        name: "Low",
        priority: "low" as const,
        value: data.low.minutes,
        taskCount: data.low.taskCount,
        percentage: total > 0 ? Math.round((data.low.minutes / total) * 100) : 0,
      },
    ].filter((d) => d.value > 0)
  }, [mounted, tasks, timeEntries])

  const totalTime = priorityData.reduce((sum, d) => sum + d.value, 0)

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(undefined)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-priority-medium" />
          Time by Priority
        </CardTitle>
        <p className="text-xs text-muted-foreground">Where you spend your time</p>
      </CardHeader>
      <CardContent>
        {priorityData.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {priorityData.map((entry) => (
                      <Cell
                        key={`cell-${entry.priority}`}
                        fill={PRIORITY_COLORS[entry.priority]}
                        stroke="transparent"
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {(["high", "medium", "low"] as const).map((priority) => {
                const data = priorityData.find((d) => d.priority === priority)
                const Icon = PRIORITY_ICONS[priority]
                const isActive = activeIndex !== undefined && priorityData[activeIndex]?.priority === priority

                return (
                  <div
                    key={priority}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                      isActive ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                    onMouseEnter={() => {
                      const idx = priorityData.findIndex((d) => d.priority === priority)
                      if (idx !== -1) setActiveIndex(idx)
                    }}
                    onMouseLeave={onPieLeave}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                      />
                      <Icon className="w-4 h-4" style={{ color: PRIORITY_COLORS[priority] }} />
                      <span className="text-sm font-medium capitalize">{priority}</span>
                    </div>
                    <div className="text-right">
                      {data ? (
                        <>
                          <p className="text-sm font-medium">{formatMinutes(data.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.taskCount} tasks • {data.percentage}%
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No time logged</p>
                      )}
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{formatMinutes(totalTime)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
            No time logged yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}
