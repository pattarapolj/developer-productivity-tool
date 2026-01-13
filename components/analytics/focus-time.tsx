"use client"

import { useMemo, useState } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Clock, Target, Zap } from "lucide-react"

type ViewMode = "1month" | "3months" | "6months"

const TIME_ENTRY_TYPE_COLORS: Record<string, string> = {
  development: "oklch(0.65 0.18 230)", // Blue
  meeting: "oklch(0.65 0.18 290)", // Purple
  review: "oklch(0.65 0.18 145)", // Green
  research: "oklch(0.75 0.15 85)", // Yellow
  debugging: "oklch(0.65 0.2 25)", // Red
  other: "oklch(0.55 0.05 260)", // Gray
}

const TIME_ENTRY_TYPE_LABELS: Record<string, string> = {
  development: "Development",
  meeting: "Meetings",
  review: "Code Review",
  research: "Research",
  debugging: "Debugging",
  other: "Other",
}

export function FocusTime() {
  const { getTimeByEntryType, getDeepWorkSessions } = useToolingTrackerStore()
  const [viewMode, setViewMode] = useState<ViewMode>("3months")
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const dateRange = useMemo(() => {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setHours(23, 59, 59, 999)

    const startDate = new Date(endDate)
    if (viewMode === "1month") {
      startDate.setMonth(startDate.getMonth() - 1)
    } else if (viewMode === "3months") {
      startDate.setMonth(startDate.getMonth() - 3)
    } else {
      startDate.setMonth(startDate.getMonth() - 6)
    }
    startDate.setHours(0, 0, 0, 0)

    return { startDate, endDate }
  }, [viewMode])

  const timeByType = useMemo(() => {
    return getTimeByEntryType(dateRange.startDate, dateRange.endDate)
  }, [getTimeByEntryType, dateRange])

  const deepWorkSessions = useMemo(() => {
    // Get all deep work sessions, then filter by date range
    const allSessions = getDeepWorkSessions(2)
    return allSessions.filter((session) => {
      const sessionDate = new Date(session.date)
      return sessionDate >= dateRange.startDate && sessionDate <= dateRange.endDate
    })
  }, [getDeepWorkSessions, dateRange])

  const metrics = useMemo(() => {
    const totalMinutes = timeByType.reduce((sum, item) => sum + item.minutes, 0)
    const developmentMinutes = timeByType.find((item) => item.type === "development")?.minutes || 0
    const meetingMinutes = timeByType.find((item) => item.type === "meeting")?.minutes || 0

    const meetingVsDevRatio =
      developmentMinutes > 0
        ? Math.round((developmentMinutes / (developmentMinutes + meetingMinutes)) * 100)
        : 0

    return {
      totalMinutes,
      developmentMinutes,
      meetingMinutes,
      meetingVsDevRatio,
      deepWorkSessionCount: deepWorkSessions.length,
      totalDeepWorkMinutes: deepWorkSessions.reduce((sum, s) => sum + s.duration, 0),
    }
  }, [timeByType, deepWorkSessions])

  const chartData = timeByType.map((item) => ({
    name: TIME_ENTRY_TYPE_LABELS[item.type],
    type: item.type,
    value: item.minutes,
    percentage: item.percentage,
  }))

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(undefined)
  }

  return (
    <div className="space-y-4">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Focus Time Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            How you spend your time across different activities
          </p>
        </div>
        <div className="flex gap-1">
          {(["1month", "3months", "6months"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode(mode)}
            >
              {mode === "1month" ? "1M" : mode === "3months" ? "3M" : "6M"}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Dev vs Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.developmentMinutes + metrics.meetingMinutes > 0 ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metrics.meetingVsDevRatio}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatMinutes(metrics.developmentMinutes)} dev /{" "}
                  {formatMinutes(metrics.meetingMinutes)} meetings
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Deep Work Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.deepWorkSessionCount > 0 ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metrics.deepWorkSessionCount}</div>
                <p className="text-xs text-muted-foreground">
                  {formatMinutes(metrics.totalDeepWorkMinutes)} total (2+ hour blocks)
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sessions yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.totalMinutes > 0 ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{formatMinutes(metrics.totalMinutes)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {timeByType.length} categories
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No time logged yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Breakdown Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Time Breakdown by Type
          </CardTitle>
          <p className="text-xs text-muted-foreground">Distribution of time across activities</p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={`cell-${entry.type}`}
                          fill={TIME_ENTRY_TYPE_COLORS[entry.type]}
                          stroke="transparent"
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-3">
                {chartData.map((item, index) => {
                  const isActive = activeIndex === index

                  return (
                    <div
                      key={item.type}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                        isActive ? "bg-secondary" : "hover:bg-secondary/50"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={onPieLeave}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: TIME_ENTRY_TYPE_COLORS[item.type] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatMinutes(item.value)}</p>
                        <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">{formatMinutes(metrics.totalMinutes)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No time logged in this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
