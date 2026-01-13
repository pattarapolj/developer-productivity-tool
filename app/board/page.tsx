"use client"

import { useState, useCallback, useEffect } from "react"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskDialog } from "@/components/task-dialog"
import { BoardFilters } from "@/components/board-filters"
import { BulkEditDialog } from "@/components/bulk-edit-dialog"
import { QuickActionsMenu } from "@/components/quick-actions-menu"
import { Button } from "@/components/ui/button"
import { useToolingTrackerStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { getGlobalShortcutManager } from "@/lib/keyboard-shortcuts"
import { Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function BoardPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  
  const { bulkArchiveTasks, bulkDeleteTasks, boardFilters } = useToolingTrackerStore()
  const { toast } = useToast()

  const handleToggleTask = useCallback((taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedTasks(new Set())
  }, [])

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev)
    setSelectedTasks(new Set())
  }, [])

  const handleBulkArchive = useCallback(() => {
    const count = selectedTasks.size
    bulkArchiveTasks(Array.from(selectedTasks))
    setSelectedTasks(new Set())
    setSelectionMode(false)
    toast({
      title: "Tasks archived",
      description: `${count} task${count > 1 ? "s" : ""} have been archived.`,
    })
  }, [selectedTasks, bulkArchiveTasks, toast])

  const handleBulkDelete = useCallback(() => {
    setDeleteDialogOpen(true)
  }, [])

  const confirmBulkDelete = useCallback(() => {
    const count = selectedTasks.size
    bulkDeleteTasks(Array.from(selectedTasks))
    setSelectedTasks(new Set())
    setSelectionMode(false)
    setDeleteDialogOpen(false)
    toast({
      title: "Tasks deleted",
      description: `${count} task${count > 1 ? "s" : ""} have been permanently deleted.`,
      variant: "destructive",
    })
  }, [selectedTasks, bulkDeleteTasks, toast])

  const handleOpenBulkEdit = useCallback(() => {
    if (selectedTasks.size > 0) {
      setBulkEditOpen(true)
    }
  }, [selectedTasks])

  const handleBulkEditComplete = useCallback(() => {
    setSelectedTasks(new Set())
    setSelectionMode(false)
  }, [])

  // Register keyboard shortcuts
  useEffect(() => {
    const manager = getGlobalShortcutManager()

    // New task shortcut
    manager.register('board-new-task', {
      key: 'n',
      description: 'Create new task',
      action: () => {
        if (!boardFilters.showArchived) {
          setCreateOpen(true)
        }
      },
      category: 'Board',
    })

    // Bulk edit shortcut
    manager.register('board-bulk-edit', {
      key: 'e',
      modifiers: { ctrl: true },
      description: 'Bulk edit selected tasks',
      action: () => {
        if (selectedTasks.size > 0) {
          setBulkEditOpen(true)
        }
      },
      category: 'Board',
    })

    // Toggle selection mode
    manager.register('board-toggle-selection', {
      key: 's',
      modifiers: { ctrl: true },
      description: 'Toggle selection mode',
      action: () => {
        if (!boardFilters.showArchived) {
          handleToggleSelectionMode()
        }
      },
      category: 'Board',
    })

    manager.startListening()

    return () => {
      manager.unregister('board-new-task')
      manager.unregister('board-bulk-edit')
      manager.unregister('board-toggle-selection')
    }
  }, [selectedTasks, boardFilters.showArchived, handleToggleSelectionMode])

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {boardFilters.showArchived ? "Archived Tasks" : "Task Board"}
          </h1>
          <p className="text-muted-foreground">
            {boardFilters.showArchived 
              ? "View and restore archived tasks" 
              : "Drag and drop to organize tasks"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedTasks.size > 0 && (
            <>
              <QuickActionsMenu
                selectedTaskIds={Array.from(selectedTasks)}
                onClearSelection={handleClearSelection}
              />
              <Button variant="outline" onClick={handleOpenBulkEdit}>
                Bulk Edit ({selectedTasks.size})
              </Button>
            </>
          )}
          {!boardFilters.showArchived && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <BoardFilters
          selectedCount={selectedTasks.size}
          onBulkArchive={handleBulkArchive}
          onBulkDelete={handleBulkDelete}
          onClearSelection={handleClearSelection}
          selectionMode={selectionMode}
          onToggleSelectionMode={handleToggleSelectionMode}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          selectionMode={selectionMode}
          selectedTasks={selectedTasks}
          onToggleTask={handleToggleTask}
        />
      </div>

      <TaskDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedTaskIds={Array.from(selectedTasks)}
        onComplete={handleBulkEditComplete}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTasks.size} task{selectedTasks.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected tasks and their time entries will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
