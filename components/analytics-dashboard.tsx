"use client"

import { useMemo } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes, cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, TrendingDown, FolderKanban, CheckCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const CHART_COLORS = [
  "oklch(0.65 0.18 250)", // blue
  "oklch(0.7 0.18 145)", // green
  "oklch(0.65 0.18 300)", // purple
  "oklch(0.75 0.18 55)", // orange
  "oklch(0.7 0.18 350)", // pink
]

export function AnalyticsDashboard() {
  const { tasks, projects, timeEntries, getTotalTimeForProject } = useToolingTrackerStore()

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getUTCMonth()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const thisYear = now.getUTCFullYear()
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

    const thisMonthMinutes = timeEntries
      .filter((te) => {
        const d = new Date(te.date)
        return d.getUTCMonth() === thisMonth && d.getUTCFullYear() === thisYear
      })
      .reduce((acc, te) => acc + te.hours * 60 + te.minutes, 0)

    const lastMonthMinutes = timeEntries
      .filter((te) => {
        const d = new Date(te.date)
        return d.getUTCMonth() === lastMonth && d.getUTCFullYear() === lastMonthYear
      })
      .reduce((acc, te) => acc + te.hours * 60 + te.minutes, 0)

    const percentChange = lastMonthMinutes > 0 ? ((thisMonthMinutes - lastMonthMinutes) / lastMonthMinutes) * 100 : 0

    const completedTasks = tasks.filter((t) => t.status === "done").length
    const activeProjects = projects.length

    return {
      thisMonthMinutes,
      lastMonthMinutes,
      percentChange,
      completedTasks,
      activeProjects,
    }
  }, [tasks, projects, timeEntries])

  const dailyData = useMemo(() => {
    const data: { date: string; minutes: number }[] = []
    const now = new Date()
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    for (let i = 29; i >= 0; i--) {
      const date = new Date(todayUtc)
      date.setUTCDate(date.getUTCDate() - i)

      const dayMinutes = timeEntries
        .filter((te) => {
          const d = new Date(te.date)
          return (
            d.getUTCFullYear() === date.getUTCFullYear() &&
            d.getUTCMonth() === date.getUTCMonth() &&
            d.getUTCDate() === date.getUTCDate()
          )
        })
        .reduce((acc, te) => acc + te.hours * 60 + te.minutes, 0)

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        minutes: dayMinutes,
      })
    }

    return data
  }, [timeEntries])

  const projectData = useMemo(() => {
    return projects
      .map((project) => ({
        name: project.name,
        value: getTotalTimeForProject(project.id),
        color: project.color,
      }))
      .filter((p) => p.value > 0)
  }, [projects, getTotalTimeForProject])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Hours This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(stats.thisMonthMinutes)}</div>
            <div
              className={cn(
                "text-xs flex items-center gap-1 mt-1",
                stats.percentChange >= 0 ? "text-priority-low" : "text-priority-high",
              )}
            >
              {stats.percentChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(stats.percentChange).toFixed(0)}% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(stats.lastMonthMinutes)}</div>
            <div className="text-xs text-muted-foreground mt-1">Previous period</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <div className="text-xs text-muted-foreground mt-1">Total projects</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <div className="text-xs text-muted-foreground mt-1">All time</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Productivity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "oklch(0.65 0 0)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.65 0 0)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(value / 60)}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.01 260)",
                      border: "1px solid oklch(0.28 0.01 260)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "oklch(0.95 0 0)" }}
                    formatter={(value: number) => [formatMinutes(value), "Time"]}
                  />
                  <Line type="monotone" dataKey="minutes" stroke="oklch(0.75 0.15 175)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Time by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {projectData.length > 0 ? (
                <div className="flex items-center gap-8 w-full">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={projectData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {projectData.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.01 260)",
                          border: "1px solid oklch(0.28 0.01 260)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatMinutes(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {projectData.map((project, index) => (
                      <div key={project.name} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{project.name}</span>
                        <span className="font-medium ml-auto">{formatMinutes(project.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No time logged yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
