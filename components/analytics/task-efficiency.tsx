'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToolingTrackerStore } from '@/lib/store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Clock, Target, TrendingUp, Activity } from 'lucide-react'
import { formatMinutes } from '@/lib/utils'

export function TaskEfficiency() {
  const getTaskEfficiencyMetrics = useToolingTrackerStore((state) => state.getTaskEfficiencyMetrics)

  const metrics = useMemo(() => {
    return getTaskEfficiencyMetrics()
  }, [getTaskEfficiencyMetrics])

  const hasData = metrics.byPriority.length > 0 || metrics.byProject.length > 0

  // Format data for charts
  const priorityChartData = useMemo(() => {
    return metrics.byPriority.map((item) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      'Cycle Time (days)': Math.round(item.avgCycleTimeDays * 10) / 10,
      'Time Spent (hours)': Math.round((item.avgTimeSpentMinutes / 60) * 10) / 10,
      taskCount: item.taskCount,
    }))
  }, [metrics.byPriority])

  const projectChartData = useMemo(() => {
    return metrics.byProject.map((item) => ({
      name: item.category.length > 15 ? item.category.substring(0, 15) + '...' : item.category,
      fullName: item.category,
      'Cycle Time (days)': Math.round(item.avgCycleTimeDays * 10) / 10,
      'Time Spent (hours)': Math.round((item.avgTimeSpentMinutes / 60) * 10) / 10,
      taskCount: item.taskCount,
    }))
  }, [metrics.byProject])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Task Efficiency Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Compare completion time and effort across priority levels and projects
        </p>
      </div>

      {hasData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Cycle Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.overallAvgCycleTime * 10) / 10}
                </div>
                <p className="text-xs text-muted-foreground">days on average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Time Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMinutes(Math.round(metrics.overallAvgTimeSpent))}
                </div>
                <p className="text-xs text-muted-foreground">per task</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Priority Levels</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.byPriority.length}</div>
                <p className="text-xs text-muted-foreground">with completed tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.byProject.length}</div>
                <p className="text-xs text-muted-foreground">with completed tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficiency by Priority */}
            {priorityChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Efficiency by Priority</CardTitle>
                  <CardDescription>
                    Compare cycle time and effort across priority levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'Time Spent (hours)') {
                            return [`${value}h`, name]
                          }
                          return [`${value} days`, name]
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="Cycle Time (days)" 
                        fill="oklch(0.65 0.18 250)" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="Time Spent (hours)" 
                        fill="oklch(0.7 0.18 145)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Task Count Summary */}
                  <div className="mt-4 space-y-2">
                    {metrics.byPriority.map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{item.category}</span>
                        <span className="font-medium">{item.taskCount} tasks</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Efficiency by Project */}
            {projectChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Efficiency by Project</CardTitle>
                  <CardDescription>
                    Compare cycle time and effort across projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number, name: string, props: any) => {
                          // Show full project name in tooltip
                          const fullName = props.payload.fullName
                          if (name === 'Time Spent (hours)') {
                            return [`${value}h`, name]
                          }
                          return [`${value} days`, name]
                        }}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            return payload[0].payload.fullName
                          }
                          return label
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="Cycle Time (days)" 
                        fill="oklch(0.65 0.18 300)" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="Time Spent (hours)" 
                        fill="oklch(0.75 0.18 55)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Task Count Summary */}
                  <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                    {metrics.byProject.map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]" title={item.category}>
                          {item.category}
                        </span>
                        <span className="font-medium">{item.taskCount} tasks</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.byPriority.length > 0 && (
                <>
                  {(() => {
                    const fastest = metrics.byPriority.reduce((min, item) => 
                      item.avgCycleTimeDays < min.avgCycleTimeDays ? item : min
                    )
                    const slowest = metrics.byPriority.reduce((max, item) => 
                      item.avgCycleTimeDays > max.avgCycleTimeDays ? item : max
                    )
                    return (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <p className="text-sm">
                            <span className="font-medium capitalize">{fastest.category}</span> priority tasks are 
                            completed fastest, averaging <span className="font-medium">{Math.round(fastest.avgCycleTimeDays * 10) / 10} days</span>.
                          </p>
                        </div>
                        {fastest.category !== slowest.category && (
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
                            <p className="text-sm">
                              <span className="font-medium capitalize">{slowest.category}</span> priority tasks take 
                              longer, averaging <span className="font-medium">{Math.round(slowest.avgCycleTimeDays * 10) / 10} days</span>.
                            </p>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
              
              {metrics.byProject.length > 1 && (
                <>
                  {(() => {
                    const mostEffort = metrics.byProject.reduce((max, item) => 
                      item.avgTimeSpentMinutes > max.avgTimeSpentMinutes ? item : max
                    )
                    return (
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        <p className="text-sm">
                          <span className="font-medium">{mostEffort.category}</span> requires the most effort 
                          per task, averaging <span className="font-medium">{formatMinutes(Math.round(mostEffort.avgTimeSpentMinutes))}</span>.
                        </p>
                      </div>
                    )
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Efficiency Data Available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Complete some tasks and log time to see efficiency metrics by priority and project.
              This helps identify bottlenecks and optimize workflows.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
