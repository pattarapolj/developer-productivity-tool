"use client"

import { useState, useSyncExternalStore } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { cn, formatMinutes, getProjectColorClass } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Clock, AlertTriangle, Calendar, Timer, ExternalLink } from "lucide-react"
import Link from "next/link"

interface AgingTask {
  id: string
  title: string
  projectId: string
  projectName: string
  projectColor: string
  daysInProgress: number
  createdAt: Date
  timeLogged: number
  priority: string
  dueDate: Date | null
  isOverdue: boolean
}

type SortBy = "age" | "time" | "priority"

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export function TaskAging() {
  const { tasks, projects, getTimeForTask } = useToolingTrackerStore()
  const [sortBy, setSortBy] = useState<SortBy>("age")
  const [showAll, setShowAll] = useState(false)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const now = mounted ? new Date() : new Date(0)

  const inProgressTasks = tasks
    .filter((task) => task.status === "in-progress")
    .map((task) => {
      const project = projects.find((p) => p.id === task.projectId)
      const createdAt = new Date(task.createdAt)
      const daysInProgress = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      const timeLogged = getTimeForTask(task.id)
      const isOverdue = task.dueDate ? new Date(task.dueDate) < now : false

      return {
        id: task.id,
        title: task.title,
        projectId: task.projectId,
        projectName: project?.name || "Unknown",
        projectColor: project?.color || "blue",
        daysInProgress,
        createdAt,
        timeLogged,
        priority: task.priority,
        dueDate: task.dueDate,
        isOverdue,
      } as AgingTask
    })

  // Sort based on selected criteria
  const agingTasks = inProgressTasks.sort((a, b) => {
    switch (sortBy) {
      case "age":
        return b.daysInProgress - a.daysInProgress
      case "time":
        return b.timeLogged - a.timeLogged
      case "priority":
        return (
          PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] -
          PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER]
        )
      default:
        return 0
    }
  })

  const staleTasks = agingTasks.filter((t) => t.daysInProgress >= 7)
  const displayTasks = showAll ? agingTasks : agingTasks.slice(0, 5)

  const getAgeBadgeVariant = (days: number) => {
    if (days >= 14) return "destructive"
    if (days >= 7) return "secondary"
    return "outline"
  }

  const getAgeColor = (days: number) => {
    if (days >= 14) return "text-red-500"
    if (days >= 7) return "text-yellow-500"
    return "text-muted-foreground"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Timer className="w-4 h-4 text-yellow-500" />
            Task Aging
            {staleTasks.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {staleTasks.length} stale
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            In-progress tasks • {agingTasks.length} active
          </p>
        </div>
        <div className="flex gap-1">
          {(["age", "time", "priority"] as SortBy[]).map((sort) => (
            <Button
              key={sort}
              variant={sortBy === sort ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setSortBy(sort)}
            >
              {sort}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {agingTasks.length > 0 ? (
          <div className="space-y-2">
            {displayTasks.map((task) => (
              <TooltipProvider key={task.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/tasks/${task.id}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-all",
                        "hover:bg-secondary/80 cursor-pointer group",
                        task.daysInProgress >= 7 && "bg-yellow-500/5 border border-yellow-500/20",
                        task.daysInProgress >= 14 && "bg-red-500/5 border border-red-500/20"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            getProjectColorClass(task.projectColor)
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{task.projectName}</span>
                            {task.isOverdue && (
                              <span className="text-red-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {task.timeLogged > 0 && (
                          <span className="text-xs text-primary">
                            {formatMinutes(task.timeLogged)}
                          </span>
                        )}
                        <Badge variant={getAgeBadgeVariant(task.daysInProgress)} className="text-xs">
                          <Clock className={cn("w-3 h-3 mr-1", getAgeColor(task.daysInProgress))} />
                          {task.daysInProgress}d
                        </Badge>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Started {task.createdAt.toLocaleDateString()}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs capitalize">Priority: {task.priority}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {agingTasks.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs mt-2"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : `Show ${agingTasks.length - 5} more`}
              </Button>
            )}
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No tasks in progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
