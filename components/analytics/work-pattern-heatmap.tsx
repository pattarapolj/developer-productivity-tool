"use client"

import { useState, useSyncExternalStore } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes, cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CalendarDays, Flame, TrendingUp } from "lucide-react"

type ViewMode = "1month" | "3months" | "6months"

interface DayData {
  date: Date
  minutes: number
  entries: number
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function WorkPatternHeatmap() {
  const { timeEntries } = useToolingTrackerStore()
  const [viewMode, setViewMode] = useState<ViewMode>("3months")
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const weeksToShow = viewMode === "1month" ? 5 : viewMode === "3months" ? 13 : 26

  const now = mounted ? new Date() : new Date(0)
  const endDate = new Date(now)
  endDate.setHours(23, 59, 59, 999)

  // Get start date (beginning of week, weeksToShow weeks ago)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - weeksToShow * 7)
  // Adjust to Monday
  const dayOfWeek = startDate.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(startDate.getDate() - diff)
  startDate.setHours(0, 0, 0, 0)

  // Build day map
  const dayMap = new Map<string, DayData>()
  
  // Initialize all days
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const key = currentDate.toISOString().split("T")[0]
    dayMap.set(key, {
      date: new Date(currentDate),
      minutes: 0,
      entries: 0,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Fill in time entries
  timeEntries.forEach((entry) => {
    const entryDate = new Date(entry.date)
    const key = entryDate.toISOString().split("T")[0]
    const existing = dayMap.get(key)
    if (existing) {
      existing.minutes += entry.hours * 60 + entry.minutes
      existing.entries++
    }
  })

  // Convert to weeks array
  const weeks: DayData[][] = []
  let currentWeek: DayData[] = []
  
  dayMap.forEach((dayData) => {
    const dayOfWeek = dayData.date.getDay()
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
    
    if (currentWeek.length === 0 && adjustedDay > 0) {
      // Pad beginning of first week
      for (let i = 0; i < adjustedDay; i++) {
        currentWeek.push({ date: new Date(0), minutes: -1, entries: 0 })
      }
    }
    
    currentWeek.push(dayData)
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(0), minutes: -1, entries: 0 })
    }
    weeks.push(currentWeek)
  }

  // Calculate stats
  const validDays = Array.from(dayMap.values()).filter((d) => d.minutes > 0)
  const totalMinutes = validDays.reduce((sum, d) => sum + d.minutes, 0)
  const avgMinutes = validDays.length > 0 ? totalMinutes / validDays.length : 0
  const maxMinutes = Math.max(...validDays.map((d) => d.minutes), 0)
  const currentStreak = calculateStreak(dayMap, now)
  const activeDays = validDays.length

  const heatmapData = weeks
  const stats = {
    totalMinutes,
    avgMinutes,
    maxMinutes,
    currentStreak,
    activeDays,
  }

  function calculateStreak(dayMap: Map<string, DayData>, now: Date): number {
    let streak = 0
    const currentDate = new Date(now)
    currentDate.setHours(0, 0, 0, 0)

    // Check if today has entries, if not start from yesterday
    const todayKey = currentDate.toISOString().split("T")[0]
    const todayData = dayMap.get(todayKey)
    if (!todayData || todayData.minutes === 0) {
      currentDate.setDate(currentDate.getDate() - 1)
    }

    while (true) {
      const key = currentDate.toISOString().split("T")[0]
      const dayData = dayMap.get(key)
      
      // Skip weekends in streak calculation
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() - 1)
        continue
      }

      if (!dayData || dayData.minutes === 0) break
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }

  const getIntensityClass = (minutes: number) => {
    if (minutes < 0) return "bg-transparent"
    if (minutes === 0) return "bg-secondary/30"
    if (minutes < 60) return "bg-primary/20"
    if (minutes < 180) return "bg-primary/40"
    if (minutes < 360) return "bg-primary/60"
    return "bg-primary/90"
  }

  const getMonthLabels = () => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1

    heatmapData.forEach((week, weekIndex) => {
      const validDay = week.find((d) => d.minutes >= 0)
      if (validDay) {
        const month = validDay.date.getMonth()
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex })
          lastMonth = month
        }
      }
    })

    return labels
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Work Pattern
          </CardTitle>
          <p className="text-xs text-muted-foreground">Daily activity heatmap</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold">{stats.currentStreak}</span>
              <span className="text-muted-foreground text-xs">day streak</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-bold">{formatMinutes(Math.round(stats.avgMinutes))}</span>
              <span className="text-muted-foreground text-xs">/day avg</span>
            </div>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-2 min-h-[140px]">
          {/* Month labels */}
          <div className="flex ml-8 overflow-hidden">
            {getMonthLabels().map(({ month, weekIndex }) => (
              <div
                key={`${month}-${weekIndex}`}
                className="text-xs text-muted-foreground"
                style={{
                  marginLeft: weekIndex === 0 ? 0 : `${(weekIndex - (getMonthLabels()[getMonthLabels().findIndex((l) => l.month === month && l.weekIndex === weekIndex) - 1]?.weekIndex || 0)) * 14 - 14}px`,
                }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pr-1 shrink-0">
              {DAYS.map((day, i) => (
                <div key={day} className="h-3 flex items-center">
                  {i % 2 === 0 ? day : ""}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-[3px]">
              <TooltipProvider>
                {heatmapData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px] shrink-0">
                    {week.map((day, dayIndex) => (
                      <Tooltip key={`${weekIndex}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-primary/50",
                              getIntensityClass(day.minutes)
                            )}
                          />
                        </TooltipTrigger>
                        {day.minutes >= 0 && (
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">
                              {day.date.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            {day.minutes > 0 ? (
                              <p>
                                {formatMinutes(day.minutes)} • {day.entries} entries
                              </p>
                            ) : (
                              <p className="text-muted-foreground">No time logged</p>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {stats.activeDays} active days • {formatMinutes(stats.totalMinutes)} total
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-secondary/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              <div className="w-3 h-3 rounded-sm bg-primary/60" />
              <div className="w-3 h-3 rounded-sm bg-primary/90" />
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
