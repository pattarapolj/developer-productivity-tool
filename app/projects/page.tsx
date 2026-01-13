"use client"

import { useState } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { cn, getProjectColorClass, formatMinutes } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Pencil, Trash2, CheckCircle2, Clock, ListTodo } from "lucide-react"
import type { Project, ProjectColor } from "@/lib/types"

const projectColors: { value: ProjectColor; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
]

export default function ProjectsPage() {
  const { projects, tasks, addProject, updateProject, deleteProject, getTotalTimeForProject } = useToolingTrackerStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState<ProjectColor>("blue")
  const [newProjectKey, setNewProjectKey] = useState("")

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), newProjectColor, newProjectKey.trim() || null)
      setNewProjectName("")
      setNewProjectColor("blue")
      setNewProjectKey("")
      setCreateDialogOpen(false)
    }
  }

  const handleEditProject = () => {
    if (editingProject && newProjectName.trim()) {
      updateProject(editingProject.id, {
        name: newProjectName.trim(),
        color: newProjectColor,
        jiraKey: newProjectKey.trim() || null,
      })
      setEditingProject(null)
      setNewProjectName("")
      setNewProjectColor("blue")
      setNewProjectKey("")
      setEditDialogOpen(false)
    }
  }

  const openEditDialog = (project: Project) => {
    setEditingProject(project)
    setNewProjectName(project.name)
    setNewProjectColor(project.color)
    setNewProjectKey(project.jiraKey ?? "")
    setEditDialogOpen(true)
  }

  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId)
    const todoCount = projectTasks.filter((t) => t.status === "todo").length
    const inProgressCount = projectTasks.filter((t) => t.status === "in-progress").length
    const doneCount = projectTasks.filter((t) => t.status === "done").length
    const totalTime = getTotalTimeForProject(projectId)
    return { todoCount, inProgressCount, doneCount, totalTasks: projectTasks.length, totalTime }
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and organize your projects</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jira Key (optional)</label>
                  <Input
                    placeholder="e.g. ENG"
                    value={newProjectKey}
                    onChange={(e) => setNewProjectKey(e.target.value)}
                  />
                </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <Select value={newProjectColor} onValueChange={(v) => setNewProjectColor(v as ProjectColor)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", getProjectColorClass(color.value))} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateProject} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <ListTodo className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No projects yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first project to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const stats = getProjectStats(project.id)
            const progressPercent = stats.totalTasks > 0 ? Math.round((stats.doneCount / stats.totalTasks) * 100) : 0

            return (
              <Card key={project.id} className="group relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", getProjectColorClass(project.color))} />
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{project.name}</span>
                        {project.jiraKey && (
                          <span className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                            {project.jiraKey}
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(project)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteProject(project.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ListTodo className="w-4 h-4" />
                      <span>{stats.totalTasks} tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatMinutes(stats.totalTime)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                      <span className="text-muted-foreground">{stats.todoCount} todo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{stats.inProgressCount} in progress</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-project-green" />
                      <span className="text-muted-foreground">{stats.doneCount} done</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jira Key (optional)</label>
              <Input
                placeholder="e.g. ENG"
                value={newProjectKey}
                onChange={(e) => setNewProjectKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Select value={newProjectColor} onValueChange={(v) => setNewProjectColor(v as ProjectColor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getProjectColorClass(color.value))} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditProject} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
