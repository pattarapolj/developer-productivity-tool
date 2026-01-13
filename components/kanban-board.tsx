"use client"

import type React from "react"

import { useState, useEffect, useMemo, useSyncExternalStore } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { TaskCard } from "./task-card"
import { TaskDialog } from "./task-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import type { TaskStatus, Task } from "@/lib/types"

const columns: { id: TaskStatus; title: string }[] = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
]

interface KanbanBoardProps {
  selectionMode?: boolean
  selectedTasks?: Set<string>
  onToggleTask?: (taskId: string) => void
}

export function KanbanBoard({ 
  selectionMode = false, 
  selectedTasks = new Set(),
  onToggleTask 
}: KanbanBoardProps) {
  const { 
    tasks,  // Subscribe to tasks array directly to trigger re-renders
    getFilteredTasks, 
    selectedProjectId, 
    moveTask, 
    boardFilters,
    unarchiveTask,
    archiveTask,
  } = useToolingTrackerStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo")
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Recompute filtered tasks whenever tasks or filters change
  // Don't include getFilteredTasks in deps as it's a stable function reference
  const filteredTasks = useMemo(() => {
    return mounted ? getFilteredTasks() : []
  }, [mounted, tasks, boardFilters, selectedProjectId])

  const getTasksForColumn = (status: TaskStatus) => 
    filteredTasks.filter((t) => t.status === status)

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (selectionMode) {
      e.preventDefault()
      return
    }
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== status) {
      moveTask(draggedTask.id, status)
    }
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const openCreateDialog = (status: TaskStatus) => {
    setCreateStatus(status)
    setCreateDialogOpen(true)
  }

  const isViewingArchive = boardFilters.showArchived

  return (
    <>
      <div className="grid grid-cols-4 gap-4 h-full">
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column.id)
          const isDragOver = dragOverColumn === column.id

          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col bg-secondary/30 rounded-lg p-3 transition-colors",
                isDragOver && !isViewingArchive && "bg-secondary/60 ring-2 ring-primary/30",
                isViewingArchive && "opacity-80",
              )}
              onDragOver={(e) => !isViewingArchive && handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => !isViewingArchive && handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm text-foreground">
                    {isViewingArchive ? `Archived - ${column.title}` : column.title}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                {!isViewingArchive && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreateDialog(column.id)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={!selectionMode && !isViewingArchive}
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={cn(
                      "transition-opacity relative",
                      draggedTask?.id === task.id && "opacity-50",
                      selectionMode && "cursor-pointer",
                    )}
                    onClick={() => {
                      if (selectionMode && onToggleTask) {
                        onToggleTask(task.id)
                      }
                    }}
                  >
                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div 
                        className="absolute left-2 top-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedTasks.has(task.id)}
                          onCheckedChange={() => onToggleTask?.(task.id)}
                          className="bg-background"
                        />
                      </div>
                    )}

                    <TaskCard 
                      task={task} 
                      showProject={!selectedProjectId && !boardFilters.projectId}
                      showArchiveAction={!selectionMode}
                      isArchived={isViewingArchive}
                      onArchive={() => archiveTask(task.id)}
                      onUnarchive={() => unarchiveTask(task.id)}
                      className={cn(
                        selectionMode && selectedTasks.has(task.id) && "ring-2 ring-primary",
                        selectionMode && "pl-8",
                        isViewingArchive && "opacity-70",
                      )}
                    />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {isViewingArchive ? "No archived tasks" : "No tasks"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} defaultStatus={createStatus} />
    </>
  )
}
