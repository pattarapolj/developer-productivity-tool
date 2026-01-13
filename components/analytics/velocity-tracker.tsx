'use client'

import { useState, useMemo, useSyncExternalStore } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToolingTrackerStore } from '@/lib/store'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Target, Clock, Activity } from 'lucide-react'
import { ComparisonView } from './comparison-view'
import { TrendIndicator } from './trend-indicator'
import { calculateTrendLine, getTrendLineCoordinates } from '@/lib/analytics-utils'
import type { VelocityWeekData, ComparisonPeriod } from '@/lib/types'

type TimeRange = '4W' | '8W' | '12W'

export function VelocityTracker() {
  const [timeRange, setTimeRange] = useState<TimeRange>('8W')
  const [showComparison, setShowComparison] = useState(false)
  const [showTrendLine, setShowTrendLine] = useState(true)
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('week-over-week')
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const getVelocityData = useToolingTrackerStore((state) => state.getVelocityData)
  const getAverageCycleTime = useToolingTrackerStore((state) => state.getAverageCycleTime)
  const getComparisonData = useToolingTrackerStore((state) => state.getComparisonData)

  const weeksCount = useMemo(() => {
    switch (timeRange) {
      case '4W': return 4
      case '8W': return 8
      case '12W': return 12
    }
  }, [timeRange])

  const velocityData = useMemo(() => {
    if (!mounted) return []
    return getVelocityData(weeksCount)
  }, [mounted, getVelocityData, weeksCount])

  const metrics = useMemo(() => {
    if (!mounted || velocityData.length === 0) {
      return {
        avgVelocity: 0,
        avgCycleTime: 0,
        trend: 'stable' as const,
        recentVelocity: 0,
        previousVelocity: 0,
      }
    }

    // Calculate average velocity (tasks completed per week)
    const totalCompleted = velocityData.reduce((sum, week) => sum + week.completed, 0)
    const avgVelocity = totalCompleted / velocityData.length

    // Get overall average cycle time
    const avgCycleTime = getAverageCycleTime()

    // Calculate trend: compare recent half vs previous half
    const halfPoint = Math.floor(velocityData.length / 2)
    const recentHalf = velocityData.slice(halfPoint)
    const previousHalf = velocityData.slice(0, halfPoint)

    const recentVelocity = recentHalf.reduce((sum, w) => sum + w.completed, 0) / recentHalf.length
    const previousVelocity = previousHalf.length > 0 
      ? previousHalf.reduce((sum, w) => sum + w.completed, 0) / previousHalf.length 
      : recentVelocity

    const velocityChange = recentVelocity - previousVelocity
    const trend = Math.abs(velocityChange) < 0.5 ? 'stable' : velocityChange > 0 ? 'up' : 'down'

    return {
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      avgCycleTime: Math.round(avgCycleTime * 10) / 10,
      trend,
      recentVelocity: Math.round(recentVelocity * 10) / 10,
      previousVelocity: Math.round(previousVelocity * 10) / 10,
    }
  }, [mounted, velocityData, getAverageCycleTime])

  const getTrendIcon = () => {
    switch (metrics.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'stable': return <Minus className="w-4 h-4 text-yellow-500" />
    }
  }

  const getTrendColor = () => {
    switch (metrics.trend) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      case 'stable': return 'text-yellow-500'
    }
  }

  const hasData = velocityData.some(week => week.completed > 0)

  const comparisonData = useMemo(() => {
    if (!showComparison) return null
    return getComparisonData(comparisonPeriod)
  }, [showComparison, comparisonPeriod, getComparisonData])

  // Calculate trend for velocity data
  const velocityTrend = useMemo(() => {
    if (velocityData.length === 0) return null
    const completedValues = velocityData.map(w => w.completed)
    return calculateTrendLine(completedValues)
  }, [velocityData])

  // Get trend line coordinates for chart overlay
  const velocityTrendLineData = useMemo(() => {
    if (!showTrendLine || velocityData.length === 0) return []
    
    const completedValues = velocityData.map(w => w.completed)
    const trendCoords = getTrendLineCoordinates(completedValues)
    
    return velocityData.map((week, index) => ({
      ...week,
      trend: trendCoords[index]?.y || null,
    }))
  }, [velocityData, showTrendLine])

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Velocity Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Track task completion velocity and cycle time for sprint planning
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '4W' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('4W')}
          >
            4 Weeks
          </Button>
          <Button
            variant={timeRange === '8W' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('8W')}
          >
            8 Weeks
          </Button>
          <Button
            variant={timeRange === '12W' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('12W')}
          >
            12 Weeks
          </Button>
        </div>
      </div>

      {/* Comparison Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-comparison"
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
              <Label htmlFor="show-comparison">Show Period Comparison</Label>
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
        </CardContent>
      </Card>

      {/* Comparison View */}
      {showComparison && comparisonData && (
        <ComparisonView data={comparisonData} period={comparisonPeriod} />
      )}

      {/* Trend Line Toggle */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Label htmlFor="trend-line-toggle" className="text-sm font-medium">
          Show Trend Line
        </Label>
        <Switch
          id="trend-line-toggle"
          checked={showTrendLine}
          onCheckedChange={setShowTrendLine}
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Velocity</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgVelocity}</div>
            <p className="text-xs text-muted-foreground">tasks completed per week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cycle Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgCycleTime}</div>
            <p className="text-xs text-muted-foreground">days from created to completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Velocity Trend</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {velocityTrend && (
                <TrendIndicator 
                  direction={velocityTrend.direction} 
                  percentage={velocityTrend.percentage}
                  size="lg"
                />
              )}
              {!velocityTrend && (
                <span className="text-2xl font-bold text-muted-foreground">No Data</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.recentVelocity} vs {metrics.previousVelocity} tasks/week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Velocity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks Completed Per Week</CardTitle>
              <CardDescription>Number of tasks marked as done each week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={showTrendLine ? velocityTrendLineData : velocityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'Trend Line') {
                        return [value?.toFixed(1) || 'N/A', name]
                      }
                      return [value, name]
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Tasks Completed"
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {showTrendLine && velocityTrend && (
                    <Line 
                      type="monotone" 
                      dataKey="trend" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Trend Line"
                      dot={false}
                      activeDot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cycle Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Average Cycle Time Trend</CardTitle>
              <CardDescription>Average days from task creation to completion</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={velocityData}>
                  <defs>
                    <linearGradient id="cycleTimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    label={{ 
                      value: 'Days', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--foreground))' }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value.toFixed(1)} days`, 'Avg Cycle Time']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgCycleTime" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#cycleTimeGradient)"
                    name="Avg Cycle Time"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Velocity Data Available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Complete some tasks to start tracking your velocity and cycle time metrics.
              These insights help with sprint planning and capacity estimation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
