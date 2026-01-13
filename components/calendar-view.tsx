"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useToolingTrackerStore } from "@/lib/store"
import { cn, getProjectColorClass, formatMinutes } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function CalendarView() {
  const { tasks, projects, timeEntries, selectedProjectId } = useToolingTrackerStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"due" | "log">("due")

  const filteredTasks = selectedProjectId ? tasks.filter((t) => t.projectId === selectedProjectId) : tasks
  const taskIds = useMemo(() => filteredTasks.map((task) => task.id), [filteredTasks])
  const filteredEntries = useMemo(() => timeEntries.filter((entry) => taskIds.includes(entry.taskId)), [taskIds, timeEntries])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (Date | null)[] = []

    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }, [year, month])

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return (
        dueDate.getFullYear() === date.getFullYear() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getDate() === date.getDate()
      )
    })
  }

  const getTimeForDate = (date: Date) => {
    return filteredEntries
      .filter((te) => {
        const entryDate = new Date(te.date)
        return (
          entryDate.getFullYear() === date.getFullYear() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getDate() === date.getDate()
        )
      })
      .reduce((acc, te) => acc + te.hours * 60 + te.minutes, 0)
  }

  const getEntriesForDate = (date: Date) => {
    return filteredEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return (
        entryDate.getFullYear() === date.getFullYear() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getDate() === date.getDate()
      )
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const isToday = (date: Date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant={viewMode === "due" ? "default" : "outline"} size="sm" onClick={() => setViewMode("due")}>
            Due Dates
          </Button>
          <Button variant={viewMode === "log" ? "default" : "outline"} size="sm" onClick={() => setViewMode("log")}>
            Time Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden flex-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-secondary p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="bg-background/50 p-2 min-h-24" />
          }

          const dayTasks = getTasksForDate(date)
          const dayEntries = getEntriesForDate(date)
          const dayTime = getTimeForDate(date)

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "bg-background p-2 min-h-24 flex flex-col",
                isToday(date) && "ring-2 ring-inset ring-primary",
              )}
            >
              <span
                className={cn(
                  "text-sm w-6 h-6 flex items-center justify-center rounded-full",
                  isToday(date) && "bg-primary text-primary-foreground",
                )}
              >
                {date.getDate()}
              </span>

              {viewMode === "log" && dayTime > 0 && (
                <div className="text-xs text-primary font-medium mt-1">{formatMinutes(dayTime)}</div>
              )}

              <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                {viewMode === "due"
                  ? dayTasks.slice(0, 3).map((task) => {
                      const project = projects.find((p) => p.id === task.projectId)
                      return (
                        <Link
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className="text-xs p-1 rounded bg-secondary truncate flex items-center gap-1 hover:bg-secondary/80"
                        >
                          {project && (
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getProjectColorClass(project.color))} />
                          )}
                          <span className="truncate">{task.title}</span>
                        </Link>
                      )
                    })
                  : dayEntries.slice(0, 3).map((entry) => {
                      const task = tasks.find((t) => t.id === entry.taskId)
                      if (!task) return null
                      return (
                        <Link
                          key={entry.id}
                          href={`/tasks/${entry.taskId}`}
                          className="text-xs p-1 rounded bg-secondary flex items-center justify-between gap-2 hover:bg-secondary/80"
                        >
                          <span className="truncate">{task.title}</span>
                          <span className="text-muted-foreground">{formatMinutes(entry.hours * 60 + entry.minutes)}</span>
                        </Link>
                      )
                    })}
                {viewMode === "due" && dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{dayTasks.length - 3} more</div>
                )}
                {viewMode === "log" && dayEntries.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{dayEntries.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
