"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes, getProjectColorClass } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, AlertCircle } from "lucide-react"

export function DailyStandup() {
  const { tasks, projects, getTimeForTask, getTasksCompletedInRange, getBlockedTasks } = useToolingTrackerStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const standupData = useMemo(() => {
    if (!mounted) {
      // Return empty data during SSR to avoid hydration mismatch
      return {
        yesterday: [],
        today: [],
        blockers: [],
      }
    }

    const now = new Date()
    
    // Calculate yesterday's date range (00:00:00 to 23:59:59.999)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)

    // Get tasks completed yesterday
    const yesterdayTasks = getTasksCompletedInRange(yesterdayStart, yesterdayEnd)

    // Get tasks in progress today (current snapshot)
    const todayTasks = tasks.filter((task) => task.status === 'in-progress' && !task.isArchived)

    // Get blocked tasks (tasks with blockedBy dependencies)
    const blockedTasks = getBlockedTasks().filter((task) => !task.isArchived)

    return {
      yesterday: yesterdayTasks,
      today: todayTasks,
      blockers: blockedTasks,
    }
  }, [mounted, tasks, getTasksCompletedInRange, getBlockedTasks])

  const getProjectForTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return null
    return projects.find((p) => p.id === task.projectId)
  }

  const renderTaskList = (taskList: typeof tasks, showTime = false) => {
    if (taskList.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-4">No tasks</p>
      )
    }

    return (
      <div className="space-y-2">
        {taskList.map((task) => {
          const project = getProjectForTask(task.id)
          const timeLogged = showTime ? getTimeForTask(task.id) : 0

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {project && (
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 ${getProjectColorClass(project.color)}`}
                  title={project.name}
                />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-sm font-medium hover:underline line-clamp-2"
                >
                  {task.title}
                </Link>
                {showTime && timeLogged > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatMinutes(timeLogged)}</span>
                  </div>
                )}
                {task.blockedBy && task.blockedBy.length > 0 && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Blocked by {task.blockedBy.length} {task.blockedBy.length === 1 ? 'task' : 'tasks'}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Daily Standup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yesterday Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Yesterday
            <Badge variant="secondary" className="text-xs">
              {standupData.yesterday.length}
            </Badge>
          </h3>
          {renderTaskList(standupData.yesterday, true)}
        </div>

        {/* Today Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Today
            <Badge variant="secondary" className="text-xs">
              {standupData.today.length}
            </Badge>
          </h3>
          {renderTaskList(standupData.today, false)}
        </div>

        {/* Blockers Section */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Blockers
            <Badge variant="secondary" className="text-xs">
              {standupData.blockers.length}
            </Badge>
          </h3>
          {renderTaskList(standupData.blockers, false)}
        </div>
      </CardContent>
    </Card>
  )
}
