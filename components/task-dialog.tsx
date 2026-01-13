"use client"

import { useState, useEffect } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task, TaskStatus, Priority } from "@/lib/types"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
  defaultStatus?: TaskStatus
}

export function TaskDialog({ open, onOpenChange, task, defaultStatus = "todo" }: TaskDialogProps) {
  const { projects, selectedProjectId, addTask, updateTask, addSubcategoryToProject } = useToolingTrackerStore()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<Priority>("medium")
  const [projectId, setProjectId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [jiraKey, setJiraKey] = useState("")
  const [storyPoints, setStoryPoints] = useState("")

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
      setPriority(task.priority)
      setProjectId(task.projectId)
      setSubcategory(task.subcategory ?? "")
      setJiraKey(task.jiraKey ?? "")
      setStoryPoints(task.storyPoints !== null && task.storyPoints !== undefined ? String(task.storyPoints) : "")
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    } else {
      setTitle("")
      setDescription("")
      setStatus(defaultStatus)
      setPriority("medium")
      setProjectId(selectedProjectId || projects[0]?.id || "")
      setSubcategory("")
      setJiraKey("")
      setStoryPoints("")
      setDueDate("")
    }
  }, [task, open, defaultStatus, selectedProjectId, projects])

  const handleSubmit = () => {
    if (!title.trim() || !projectId) return

    const normalizedSubcategory = subcategory.trim()
    const normalizedJiraKey = jiraKey.trim()
    const parsedStoryPoints = storyPoints.trim() ? Number(storyPoints) : null
    if (parsedStoryPoints !== null && Number.isNaN(parsedStoryPoints)) {
      return
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      projectId,
      subcategory: normalizedSubcategory || null,
      jiraKey: normalizedJiraKey || null,
      storyPoints: parsedStoryPoints,
      dueDate: dueDate ? new Date(dueDate) : null,
    }

    if (task) {
      updateTask(task.id, taskData)
    } else {
      addTask(taskData)
    }

    if (normalizedSubcategory) {
      addSubcategoryToProject(projectId, normalizedSubcategory)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="max-h-32 overflow-y-auto resize-none field-sizing-fixed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jira Key</label>
              <Input placeholder="e.g. ENG-123" value={jiraKey} onChange={(e) => setJiraKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Story Points</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 3"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subcategory</label>
            <div className="space-y-1">
              <Input
                list="task-subcategory-options"
                placeholder="Optional subcategory (e.g. Design, Backend)"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
              />
              <datalist id="task-subcategory-options">
                {(projects.find((p) => p.id === projectId)?.subcategories ?? []).map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">Pick an existing label or type a new one per project.</p>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
