"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import type { ComparisonData, ComparisonPeriod } from "@/lib/types"

interface ComparisonViewProps {
  data: ComparisonData
  period: ComparisonPeriod
}

function formatPeriodLabel(period: ComparisonPeriod): { current: string; previous: string } {
  switch (period) {
    case "week-over-week":
      return { current: "This Week", previous: "Last Week" }
    case "month-over-month":
      return { current: "This Month", previous: "Last Month" }
    case "quarter-over-quarter":
      return { current: "This Quarter", previous: "Last Quarter" }
  }
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

interface DeltaIndicatorProps {
  value: number
  percent: number
  showArrow?: boolean
  invertColors?: boolean // For metrics where lower is better (like completion time)
}

function DeltaIndicator({ value, percent, showArrow = true, invertColors = false }: DeltaIndicatorProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  // Determine color based on sign and whether colors are inverted
  let colorClass = "text-muted-foreground"
  if (!isNeutral) {
    if (invertColors) {
      colorClass = isPositive ? "text-red-500" : "text-green-500"
    } else {
      colorClass = isPositive ? "text-green-500" : "text-red-500"
    }
  }

  const Icon = isPositive ? ArrowUpIcon : isNegative ? ArrowDownIcon : MinusIcon

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      {showArrow && <Icon className="h-4 w-4" />}
      <span className="font-medium">
        {value > 0 ? "+" : ""}
        {value} ({percent > 0 ? "+" : ""}
        {percent}%)
      </span>
    </div>
  )
}

interface MetricCardProps {
  label: string
  currentValue: number | string
  previousValue: number | string
  deltaValue: number
  deltaPercent: number
  invertColors?: boolean
}

function MetricCard({ label, currentValue, previousValue, deltaValue, deltaPercent, invertColors = false }: MetricCardProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{currentValue}</span>
        <span className="text-lg text-muted-foreground">vs {previousValue}</span>
      </div>
      <DeltaIndicator value={deltaValue} percent={deltaPercent} invertColors={invertColors} />
    </div>
  )
}

export function ComparisonView({ data, period }: ComparisonViewProps) {
  const labels = formatPeriodLabel(period)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Period Comparison</CardTitle>
        <CardDescription>
          Comparing {labels.current} to {labels.previous}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Tasks Completed"
            currentValue={data.current.tasksCompleted}
            previousValue={data.previous.tasksCompleted}
            deltaValue={data.delta.tasksCompleted}
            deltaPercent={data.delta.tasksCompletedPercent}
          />
          <MetricCard
            label="Tasks Created"
            currentValue={data.current.tasksCreated}
            previousValue={data.previous.tasksCreated}
            deltaValue={data.delta.tasksCreated}
            deltaPercent={data.delta.tasksCreatedPercent}
          />
          <MetricCard
            label="Time Logged"
            currentValue={formatTime(data.current.totalTime)}
            previousValue={formatTime(data.previous.totalTime)}
            deltaValue={data.delta.totalTime}
            deltaPercent={data.delta.totalTimePercent}
          />
          <MetricCard
            label="Avg Completion Time"
            currentValue={data.current.avgCompletionTime === 0 ? "N/A" : `${data.current.avgCompletionTime}d`}
            previousValue={data.previous.avgCompletionTime === 0 ? "N/A" : `${data.previous.avgCompletionTime}d`}
            deltaValue={data.delta.avgCompletionTime}
            deltaPercent={data.delta.avgCompletionTimePercent}
            invertColors={true} // Lower completion time is better
          />
        </div>
      </CardContent>
    </Card>
  )
}
