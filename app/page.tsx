"use client"

import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes, getProjectColorClass, cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function OverviewPage() {
  const { tasks, projects, getTimeForTask, getTotalTimeForProject } = useToolingTrackerStore()

  const upcomingTasks = tasks
    .filter((t) => t.status !== "done" && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  const inProgressTasks = tasks.filter((t) => t.status === "in-progress")
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const doneTasks = tasks.filter((t) => t.status === "done")

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-priority-medium" />
                To Do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todoTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{inProgressTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-priority-low" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{doneTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
              <Link href="/board" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId)
                    const timeLogged = getTimeForTask(task.id)
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          {project && (
                            <div className={cn("w-2 h-2 rounded-full", getProjectColorClass(project.color))} />
                          )}
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Due {new Date(task.dueDate!).toLocaleDateString()}
                            </p>
                            {(task.jiraKey || typeof task.storyPoints === "number") && (
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                {task.jiraKey && <span className="uppercase">{task.jiraKey}</span>}
                                {typeof task.storyPoints === "number" && <span>SP {task.storyPoints}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        {timeLogged > 0 && <span className="text-xs text-primary">{formatMinutes(timeLogged)}</span>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming tasks</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Link href="/analytics" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.map((project) => {
                  const projectTasks = tasks.filter((t) => t.projectId === project.id)
                  const completedCount = projectTasks.filter((t) => t.status === "done").length
                  const totalTime = getTotalTimeForProject(project.id)

                  return (
                    <div key={project.id} className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", getProjectColorClass(project.color))} />
                          <span className="font-medium text-sm">{project.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {completedCount}/{projectTasks.length} tasks
                        </span>
                      </div>
                      {totalTime > 0 && (
                        <p className="text-xs text-primary mt-2">{formatMinutes(totalTime)} logged</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
