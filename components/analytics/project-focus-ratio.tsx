"use client"

import { useMemo, useState, useSyncExternalStore } from 'react'
import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes, cn, getProjectColorClass } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Focus, Shuffle, Calendar, TrendingUp, TrendingDown } from "lucide-react"

type TimeRange = "1month" | "3months" | "6months"

interface DayFocus {
  date: Date
  projectCount: number
  totalMinutes: number
  projects: { name: string; color: string; minutes: number }[]
  focusScore: number // 0-100, higher = more focused
}

export function ProjectFocusRatio() {
  const { projects, tasks, timeEntries } = useToolingTrackerStore()
  const [timeRange, setTimeRange] = useState<TimeRange>("3months")
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const daysToShow = timeRange === "1month" ? 30 : timeRange === "3months" ? 90 : 180

  const { dailyFocus, stats } = useMemo(() => {
    if (!mounted) {
      return {
        dailyFocus: [],
        stats: { 
          avgFocusScore: 0, 
          avgProjectsPerDay: 0, 
          contextSwitchRate: 0,
          trend: 0
        }
      }
    }
    const now = new Date()
    const dailyData: DayFocus[] = []

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      // Get time entries for this day
      const dayEntries = timeEntries.filter((te) => {
        const entryDate = new Date(te.date)
        return entryDate >= date && entryDate <= dayEnd
      })

      // Group by project
      const projectMinutes: Record<string, number> = {}
      dayEntries.forEach((entry) => {
        const task = tasks.find((t) => t.id === entry.taskId)
        if (task) {
          const projectId = task.projectId
          projectMinutes[projectId] = (projectMinutes[projectId] || 0) + entry.hours * 60 + entry.minutes
        }
      })

      const projectDetails = Object.entries(projectMinutes).map(([projectId, minutes]) => {
        const project = projects.find((p) => p.id === projectId)
        return {
          name: project?.name || "Unknown",
          color: project?.color || "blue",
          minutes,
        }
      }).sort((a, b) => b.minutes - a.minutes)

      const totalMinutes = Object.values(projectMinutes).reduce((sum, m) => sum + m, 0)
      const projectCount = Object.keys(projectMinutes).length

      // Calculate focus score (100 = all time on one project, lower = more fragmented)
      let focusScore = 100
      if (projectCount > 1 && totalMinutes > 0) {
        // Use Herfindahl-Hirschman Index (HHI) normalized to 0-100
        const shares = Object.values(projectMinutes).map((m) => m / totalMinutes)
        const hhi = shares.reduce((sum, s) => sum + s * s, 0)
        focusScore = Math.round(hhi * 100)
      }

      dailyData.push({
        date,
        projectCount,
        totalMinutes,
        projects: projectDetails,
        focusScore: totalMinutes > 0 ? focusScore : -1,
      })
    }

    // Calculate aggregate stats
    const activeDays = dailyData.filter((d) => d.totalMinutes > 0)
    const avgFocusScore = activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.focusScore, 0) / activeDays.length)
      : 0
    const avgProjectsPerDay = activeDays.length > 0
      ? Math.round((activeDays.reduce((sum, d) => sum + d.projectCount, 0) / activeDays.length) * 10) / 10
      : 0
    const multiProjectDays = activeDays.filter((d) => d.projectCount > 1).length
    const contextSwitchRate = activeDays.length > 0
      ? Math.round((multiProjectDays / activeDays.length) * 100)
      : 0

    // Trend calculation
    const recentDays = activeDays.slice(-7)
    const previousDays = activeDays.slice(-14, -7)
    const recentAvg = recentDays.length > 0
      ? recentDays.reduce((sum, d) => sum + d.focusScore, 0) / recentDays.length
      : 0
    const previousAvg = previousDays.length > 0
      ? previousDays.reduce((sum, d) => sum + d.focusScore, 0) / previousDays.length
      : recentAvg
    const trend = recentAvg - previousAvg

    return {
      dailyFocus: dailyData,
      stats: {
        avgFocusScore,
        avgProjectsPerDay,
        contextSwitchRate,
        trend,
      },
    }
  }, [mounted, projects, tasks, timeEntries, daysToShow])

  const getFocusColor = (score: number) => {
    if (score < 0) return "bg-secondary/30"
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getFocusLabel = (score: number) => {
    if (score >= 80) return "Focused"
    if (score >= 50) return "Moderate"
    return "Fragmented"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Focus className="w-4 h-4 text-primary" />
            Focus Ratio
          </CardTitle>
          <p className="text-xs text-muted-foreground">Context switching analysis</p>
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
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold">{stats.avgFocusScore}</span>
              {stats.trend > 5 && <TrendingUp className="w-4 h-4 text-green-500" />}
              {stats.trend < -5 && <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-xs text-muted-foreground">Avg Focus Score</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold">{stats.avgProjectsPerDay}</div>
            <p className="text-xs text-muted-foreground">Projects/Day</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-center gap-1">
              <Shuffle className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.contextSwitchRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Multi-Project Days</p>
          </div>
        </div>

        {/* Focus Timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Daily Focus</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-green-500" />
                Focused
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-yellow-500" />
                Moderate
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-red-500" />
                Fragmented
              </span>
            </div>
          </div>

          <TooltipProvider>
            <div className="flex gap-0.5 overflow-x-auto pb-2 min-h-10">
              {dailyFocus.map((day, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-2 h-8 rounded-sm transition-all hover:ring-2 hover:ring-primary/50 cursor-pointer shrink-0",
                        getFocusColor(day.focusScore),
                        day.focusScore >= 0 && `opacity-${Math.min(100, Math.max(30, day.focusScore))}`
                      )}
                      style={{
                        opacity: day.focusScore < 0 ? 0.2 : Math.max(0.3, day.focusScore / 100),
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium">
                          {day.date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {day.totalMinutes > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span>Focus Score</span>
                            <span className={cn(
                              "font-medium",
                              day.focusScore >= 80 ? "text-green-500" :
                              day.focusScore >= 50 ? "text-yellow-500" : "text-red-500"
                            )}>
                              {day.focusScore} - {getFocusLabel(day.focusScore)}
                            </span>
                          </div>
                          <div className="text-xs">
                            <p className="text-muted-foreground mb-1">
                              {day.projectCount} project(s) • {formatMinutes(day.totalMinutes)}
                            </p>
                            <div className="space-y-1">
                              {day.projects.slice(0, 3).map((project, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={cn("w-2 h-2 rounded-full", getProjectColorClass(project.color))}
                                    />
                                    <span className="truncate max-w-[120px]">{project.name}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {formatMinutes(project.minutes)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No time logged</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Focus Score Explanation */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Focus className="w-3 h-3 mt-0.5 shrink-0" />
            <p>
              Focus score measures how concentrated your work is. 100 = all time on one project.
              Lower scores indicate more context switching between projects.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
