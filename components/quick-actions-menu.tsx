'use client'

import { useState } from 'react'
import { useToolingTrackerStore } from '@/lib/store'
import { applyBulkOperation, createBulkArchive, createBulkDelete, createBulkUpdate } from '@/lib/bulk-operations'
import type { Task } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MoreVertical,
  CheckCircle,
  Archive,
  Trash2,
  ArrowRight,
  AlertCircle,
  Flag,
} from 'lucide-react'
import { formatShortcut } from '@/lib/keyboard-shortcuts'
import { useToast } from '@/hooks/use-toast'
import { getPriorityColorClass } from '@/lib/utils'

interface QuickActionsMenuProps {
  selectedTaskIds: string[]
  onClearSelection?: () => void
}

type DestructiveAction = 'archive' | 'delete' | null

export function QuickActionsMenu({
  selectedTaskIds,
  onClearSelection,
}: QuickActionsMenuProps) {
  const { tasks, updateTask, archiveTask, deleteTask } = useToolingTrackerStore()
  const { toast } = useToast()
  const [confirmAction, setConfirmAction] = useState<DestructiveAction>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedCount = selectedTaskIds.length

  const handleMarkDone = async () => {
    setIsProcessing(true)
    try {
      const operation = createBulkUpdate(selectedTaskIds, { status: 'done' })
      const result = applyBulkOperation(tasks, operation, updateTask, () => {}, () => {})

      if (result.success) {
        toast({
          title: 'Tasks completed',
          description: `Marked ${result.processedCount} task${result.processedCount !== 1 ? 's' : ''} as done`,
        })
        onClearSelection?.()
      } else {
        toast({
          title: 'Partial success',
          description: `Updated ${result.processedCount}, failed ${result.failedCount}`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMoveToStatus = async (status: 'backlog' | 'todo' | 'in-progress') => {
    setIsProcessing(true)
    try {
      const operation = createBulkUpdate(selectedTaskIds, { status })
      const result = applyBulkOperation(tasks, operation, updateTask, () => {}, () => {})

      if (result.success) {
        toast({
          title: 'Tasks moved',
          description: `Moved ${result.processedCount} task${result.processedCount !== 1 ? 's' : ''} to ${status}`,
        })
        onClearSelection?.()
      } else {
        toast({
          title: 'Partial success',
          description: `Moved ${result.processedCount}, failed ${result.failedCount}`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSetPriority = async (priority: 'low' | 'medium' | 'high') => {
    setIsProcessing(true)
    try {
      const operation = createBulkUpdate(selectedTaskIds, { priority })
      const result = applyBulkOperation(tasks, operation, updateTask, () => {}, () => {})

      if (result.success) {
        toast({
          title: 'Priority updated',
          description: `Set ${result.processedCount} task${result.processedCount !== 1 ? 's' : ''} to ${priority} priority`,
        })
        onClearSelection?.()
      } else {
        toast({
          title: 'Partial success',
          description: `Updated ${result.processedCount}, failed ${result.failedCount}`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleArchive = async () => {
    setIsProcessing(true)
    try {
      const operation = createBulkArchive(selectedTaskIds)
      const result = applyBulkOperation(tasks, operation, () => {}, archiveTask, () => {})

      if (result.success) {
        toast({
          title: 'Tasks archived',
          description: `Archived ${result.processedCount} task${result.processedCount !== 1 ? 's' : ''}`,
        })
        onClearSelection?.()
      } else {
        toast({
          title: 'Partial success',
          description: `Archived ${result.processedCount}, failed ${result.failedCount}`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
      setConfirmAction(null)
    }
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    try {
      const operation = createBulkDelete(selectedTaskIds)
      const result = applyBulkOperation(tasks, operation, () => {}, () => {}, deleteTask)

      if (result.success) {
        toast({
          title: 'Tasks deleted',
          description: `Deleted ${result.processedCount} task${result.processedCount !== 1 ? 's' : ''}`,
        })
        onClearSelection?.()
      } else {
        toast({
          title: 'Partial success',
          description: `Deleted ${result.processedCount}, failed ${result.failedCount}`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
      setConfirmAction(null)
    }
  }

  const handleConfirmDestructive = () => {
    if (confirmAction === 'archive') {
      handleArchive()
    } else if (confirmAction === 'delete') {
      handleDelete()
    }
  }

  if (selectedCount === 0) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isProcessing}>
            <MoreVertical className="h-4 w-4 mr-2" />
            Actions ({selectedCount})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleMarkDone} disabled={isProcessing}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Done
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
              {formatShortcut({
                key: 'd',
                description: 'Mark done',
                action: () => {},
              })}
            </kbd>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRight className="mr-2 h-4 w-4" />
              Move to Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMoveToStatus('backlog')} disabled={isProcessing}>
                Backlog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMoveToStatus('todo')} disabled={isProcessing}>
                To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMoveToStatus('in-progress')} disabled={isProcessing}>
                In Progress
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Flag className="mr-2 h-4 w-4" />
              Set Priority
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleSetPriority('high')} disabled={isProcessing}>
                <Badge className={getPriorityColorClass('high')}>High</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetPriority('medium')} disabled={isProcessing}>
                <Badge className={getPriorityColorClass('medium')}>Medium</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetPriority('low')} disabled={isProcessing}>
                <Badge className={getPriorityColorClass('low')}>Low</Badge>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setConfirmAction('archive')}
            disabled={isProcessing}
            className="text-amber-600 dark:text-amber-400"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive Selected
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
              {formatShortcut({
                key: 'a',
                description: 'Archive',
                action: () => {},
              })}
            </kbd>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setConfirmAction('delete')}
            disabled={isProcessing}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              {confirmAction === 'archive' ? 'Archive Tasks?' : 'Delete Tasks?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'archive' ? (
                <>
                  Are you sure you want to archive <strong>{selectedCount}</strong> task
                  {selectedCount !== 1 ? 's' : ''}? Archived tasks can be restored later.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <strong>{selectedCount}</strong> task
                  {selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDestructive}
              disabled={isProcessing}
              className={confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isProcessing ? 'Processing...' : confirmAction === 'archive' ? 'Archive' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
