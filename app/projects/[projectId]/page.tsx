"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Clock, ExternalLink, MoreHorizontal, Plus, Tag } from "lucide-react"

import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes, cn, getPriorityColorClass, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskDialog } from "@/components/task-dialog"
import { Input } from "@/components/ui/input"
import { TimeEntryDialog } from "@/components/time-entry-dialog"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task } from "@/lib/types"

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const router = useRouter()
  const { projectId } = params

  const {
    projects,
    tasks,
    getTimeForTask,
    getTotalTimeForProject,
    setSelectedProject,
    addSubcategoryToProject,
    deleteTask,
  } = useToolingTrackerStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [subcategoryValue, setSubcategoryValue] = useState("")
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [timeDialogTaskId, setTimeDialogTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId)
    }
  }, [projectId, setSelectedProject])

  const project = projects.find((p) => p.id === projectId)

  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === projectId), [tasks, projectId])
  const completedTasks = projectTasks.filter((task) => task.status === "done")
  const totalMinutes = project ? getTotalTimeForProject(project.id) : 0
  const progress = projectTasks.length ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0
  const totalStoryPoints = projectTasks.reduce((acc, current) => acc + (current.storyPoints ?? 0), 0)

  const handleAddSubcategory = () => {
    if (!project) return
    const label = subcategoryValue.trim()
    if (!label) return
    addSubcategoryToProject(project.id, label)
    setSubcategoryValue("")
  }

  const openEditDialog = (task: Task) => {
    setTaskBeingEdited(task)
    setEditDialogOpen(true)
  }

  const handleEditDialogChange = (open: boolean) => {
    setEditDialogOpen(open)
    if (!open) {
      setTaskBeingEdited(null)
    }
  }

  const handleTimeDialogChange = (open: boolean) => {
    if (!open) {
      setTimeDialogTaskId(null)
    }
  }

  if (!project) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Button variant="ghost" className="w-fit" onClick={() => router.push("/projects")}>Return to projects</Button>
          <Card>
            <CardHeader>
              <CardTitle>Project not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Select a project from the sidebar or create a new one to get started.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Back to projects</span>
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Project</p>
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              {project.jiraKey && <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.jiraKey}</p>}
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{projectTasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-project-green">{completedTasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Time Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatMinutes(totalMinutes)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Story Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalStoryPoints}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Subcategories
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Add new"
                value={subcategoryValue}
                onChange={(e) => setSubcategoryValue(e.target.value)}
                className="h-9 w-40"
              />
              <Button size="sm" onClick={handleAddSubcategory}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {project.subcategories && project.subcategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.subcategories.map((sub) => (
                  <Badge key={sub} variant="secondary" className="text-xs">
                    {sub}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subcategories yet.</p>
            )}
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
          <div className="space-y-3">
            {projectTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">No tasks yet. Create one to get started.</CardContent>
              </Card>
            ) : (
              projectTasks.map((task) => {
                const timeTracked = getTimeForTask(task.id)
                return (
                  <Card 
                    key={task.id} 
                    className="border-muted/50 cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={(e) => {
                      // Don't navigate if clicking on dropdown
                      if ((e.target as HTMLElement).closest('button')) return
                      router.push(`/tasks/${task.id}`)
                    }}
                  >
                    <CardContent className="py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <CheckCircle
                              className={cn("w-4 h-4", task.status === "done" ? "text-project-green" : "text-muted-foreground")}
                            />
                            <span className="font-medium text-foreground">{task.title}</span>
                          </div>
                          {task.description && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <MarkdownRenderer content={task.description} className="line-clamp-2 text-sm" />
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <Badge variant="outline" className={cn("uppercase", getPriorityColorClass(task.priority))}>
                              {task.priority}
                            </Badge>
                            {task.jiraKey && (
                              <Badge variant="outline" className="text-[11px] uppercase">
                                {task.jiraKey}
                              </Badge>
                            )}
                            {task.subcategory && (
                              <Badge variant="secondary" className="text-[11px]">
                                {task.subcategory}
                              </Badge>
                            )}
                            {typeof task.storyPoints === "number" && (
                              <span className="font-medium text-foreground">SP {task.storyPoints}</span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                            {timeTracked > 0 && <span>{formatMinutes(timeTracked)}</span>}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="sr-only">Task actions</span>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                              <Link href={`/tasks/${task.id}`}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault()
                                openEditDialog(task)
                              }}
                            >
                              Quick Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault()
                                setTimeDialogTaskId(task.id)
                              }}
                            >
                              Log time
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(event) => {
                                event.preventDefault()
                                deleteTask(task.id)
                              }}
                            >
                              Delete task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </section>
      </div>
      <TaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      {taskBeingEdited && (
        <TaskDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          task={taskBeingEdited}
          defaultStatus={taskBeingEdited.status}
        />
      )}
      {timeDialogTaskId && (
        <TimeEntryDialog open={Boolean(timeDialogTaskId)} onOpenChange={handleTimeDialogChange} taskId={timeDialogTaskId} />
      )}
    </div>
  )
}
