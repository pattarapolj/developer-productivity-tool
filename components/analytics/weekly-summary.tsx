"use client"

import { useMemo, useState } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Calendar, Clock, TrendingUp, Target } from "lucide-react"
import { formatMinutes } from "@/lib/utils"
import { ComparisonView } from "./comparison-view"
import type { TimeEntryType, ComparisonPeriod } from "@/lib/types"

type WeekRange = "this-week" | "last-week"

const TIME_ENTRY_TYPE_COLORS: Record<TimeEntryType, string> = {
  development: "oklch(0.75 0.15 175)", // Teal
  meeting: "oklch(0.7 0.19 28)", // Orange
  review: "oklch(0.75 0.15 270)", // Purple
  research: "oklch(0.75 0.15 220)", // Blue
  debugging: "oklch(0.7 0.18 0)", // Red
  other: "oklch(0.65 0.05 270)", // Gray
}

const TIME_ENTRY_TYPE_LABELS: Record<TimeEntryType, string> = {
  development: "Development",
  meeting: "Meetings",
  review: "Code Review",
  research: "Research",
  debugging: "Debugging",
  other: "Other",
}

export function WeeklySummary() {
  const { tasks, timeEntries, getTasksCompletedInRange, getTimeBreakdownByType, getProductivityTrend, getComparisonData } = useToolingTrackerStore()
  const [weekRange, setWeekRange] = useState<WeekRange>("this-week")
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('week-over-week')

  const weekData = useMemo(() => {
    const now = new Date()
    const currentDayOfWeek = now.getDay() // 0 (Sunday) to 6 (Saturday)
    
    let startDate: Date
    let endDate: Date
    
    if (weekRange === "this-week") {
      // This week: Start from Sunday
      startDate = new Date(now)
      startDate.setDate(now.getDate() - currentDayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Last week: Previous Sunday to Saturday
      startDate = new Date(now)
      startDate.setDate(now.getDate() - currentDayOfWeek - 7)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    }
    
    // Get completed tasks
    const completedTasks = getTasksCompletedInRange(startDate, endDate)
    
    // Get time breakdown by type
    const timeByType = getTimeBreakdownByType(startDate, endDate)
    
    // Get daily productivity trend
    const dailyTrend = getProductivityTrend(startDate, endDate)
    
    // Calculate total minutes
    const totalMinutes = Object.values(timeByType).reduce((sum, mins) => sum + mins, 0)
    
    // Calculate avg daily minutes (always divide by 7 for full week)
    const avgDailyMinutes = totalMinutes / 7
    
    // Find most productive day
    const mostProductiveDay = dailyTrend.length > 0
      ? dailyTrend.reduce((max, day) => day.minutes > max.minutes ? day : max, dailyTrend[0])
      : { day: 'N/A', minutes: 0 }
    
    // Format time breakdown for bar chart
    const timeBreakdownData = Object.entries(timeByType)
      .filter(([_, minutes]) => minutes > 0)
      .map(([type, minutes]) => ({
        type: TIME_ENTRY_TYPE_LABELS[type as TimeEntryType],
        minutes,
        hours: minutes / 60,
      }))
      .sort((a, b) => b.minutes - a.minutes)
    
    return {
      completedTasks: completedTasks.length,
      totalMinutes,
      avgDailyMinutes,
      mostProductiveDay,
      timeBreakdownData,
      dailyTrend,
      startDate,
      endDate,
    }
  }, [weekRange, tasks, timeEntries, getTasksCompletedInRange, getTimeBreakdownByType, getProductivityTrend])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{payload[0].payload.type || payload[0].payload.day}</p>
          <p className="text-primary text-sm">
            {formatMinutes(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  const comparisonData = useMemo(() => {
    if (!showComparison) return null
    return getComparisonData(comparisonPeriod)
  }, [showComparison, comparisonPeriod, getComparisonData])

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Weekly Summary
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {weekRange === "this-week" ? "This week" : "Last week"} performance overview
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={weekRange === "this-week" ? "default" : "outline"}
            onClick={() => setWeekRange("this-week")}
            className="h-7 text-xs"
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={weekRange === "last-week" ? "default" : "outline"}
            onClick={() => setWeekRange("last-week")}
            className="h-7 text-xs"
          >
            Last Week
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparison Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b">
          <div className="flex items-center space-x-2">
            <Switch
              id="weekly-comparison"
              checked={showComparison}
              onCheckedChange={setShowComparison}
            />
            <Label htmlFor="weekly-comparison">Show Period Comparison</Label>
          </div>
          {showComparison && (
            <div className="flex gap-2">
              <Button
                variant={comparisonPeriod === 'week-over-week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('week-over-week')}
              >
                Week-over-Week
              </Button>
              <Button
                variant={comparisonPeriod === 'month-over-month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('month-over-month')}
              >
                Month-over-Month
              </Button>
              <Button
                variant={comparisonPeriod === 'quarter-over-quarter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('quarter-over-quarter')}
              >
                Quarter-over-Quarter
              </Button>
            </div>
          )}
        </div>

        {/* Comparison View */}
        {showComparison && comparisonData && (
          <ComparisonView data={comparisonData} period={comparisonPeriod} />
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekData.completedTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(weekData.completedTasks / 7).toFixed(1)} per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Total Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMinutes(weekData.totalMinutes)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Logged this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Avg Daily Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMinutes(Math.round(weekData.avgDailyMinutes))}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Most Productive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekData.mostProductiveDay.day}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatMinutes(weekData.mostProductiveDay.minutes)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Breakdown by Type */}
          <div>
            <h3 className="text-sm font-medium mb-3">Time Breakdown by Type</h3>
            {weekData.timeBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weekData.timeBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" opacity={0.1} />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fill: 'oklch(0.6 0 0)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: 'oklch(0.6 0 0)', fontSize: 12 }}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'oklch(0.6 0 0)', fontSize: 11 } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="oklch(0.75 0.15 175)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                No time logged yet
              </div>
            )}
          </div>

          {/* Daily Productivity Trend */}
          <div>
            <h3 className="text-sm font-medium mb-3">Daily Productivity Trend</h3>
            {weekData.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weekData.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" opacity={0.1} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: 'oklch(0.6 0 0)', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'oklch(0.6 0 0)', fontSize: 12 }}
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: 'oklch(0.6 0 0)', fontSize: 11 } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="oklch(0.75 0.15 175)" 
                    strokeWidth={2}
                    dot={{ fill: 'oklch(0.75 0.15 175)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
