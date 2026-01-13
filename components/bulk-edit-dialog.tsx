'use client'

import { useState } from 'react'
import { useToolingTrackerStore } from '@/lib/store'
import { applyBulkOperation, createBulkUpdate, estimateProcessingTime } from '@/lib/bulk-operations'
import type { Task, TaskStatus, Priority } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { getPriorityColorClass, getStatusColorClass } from '@/lib/utils'

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTaskIds: string[]
  onComplete?: () => void
}

interface FieldUpdates {
  status?: TaskStatus
  priority?: Priority
  projectId?: string
  dueDate?: string
  subcategory?: string
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedTaskIds,
  onComplete,
}: BulkEditDialogProps) {
  const { tasks, projects, updateTask } = useToolingTrackerStore()
  const [updates, setUpdates] = useState<FieldUpdates>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    processed: number
    failed: number
    errors: Array<{ taskId: string; error: string }>
  } | null>(null)

  const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id))
  const estimatedTime = estimateProcessingTime(selectedTaskIds.length)

  const handleUpdateChange = (field: keyof FieldUpdates, value: string | undefined) => {
    if (value === '__clear__') {
      const newUpdates = { ...updates }
      delete newUpdates[field]
      setUpdates(newUpdates)
    } else if (value) {
      setUpdates({ ...updates, [field]: value })
    }
  }

  const handleApply = async () => {
    if (Object.keys(updates).length === 0) return

    setIsProcessing(true)
    setResult(null)

    try {
      const operation = createBulkUpdate(selectedTaskIds, updates as any)
      const opResult = applyBulkOperation(
        tasks,
        operation,
        updateTask,
        () => {}, // archiveTask - not used for update operations
        () => {}  // deleteTask - not used for update operations
      )

      setResult({
        success: opResult.success,
        processed: opResult.processedCount,
        failed: opResult.failedCount,
        errors: opResult.errors,
      })

      if (opResult.success) {
        setTimeout(() => {
          onComplete?.()
          onOpenChange(false)
          setUpdates({})
          setResult(null)
        }, 1500)
      }
    } catch (error) {
      setResult({
        success: false,
        processed: 0,
        failed: selectedTaskIds.length,
        errors: [{ taskId: 'all', error: String(error) }],
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    if (!isProcessing) {
      onOpenChange(false)
      setUpdates({})
      setResult(null)
    }
  }

  const hasUpdates = Object.keys(updates).length > 0
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))

  // Get unique subcategories from selected project
  const selectedProject = updates.projectId
    ? projects.find((p) => p.id === updates.projectId)
    : null
  const subcategoryOptions = selectedProject?.subcategories || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Tasks</DialogTitle>
          <DialogDescription>
            Edit {selectedTaskIds.length} selected task{selectedTaskIds.length !== 1 ? 's' : ''}
            {estimatedTime > 0 && ` (estimated time: ${Math.ceil(estimatedTime / 1000)}s)`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Selected Tasks Preview */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Selected Tasks</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-md border border-border p-3">
                {selectedTasks.slice(0, 10).map((task) => (
                  <Badge key={task.id} variant="secondary" className="text-xs">
                    {task.title.slice(0, 30)}
                    {task.title.length > 30 ? '...' : ''}
                  </Badge>
                ))}
                {selectedTasks.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedTasks.length - 10} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Field Updates */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={updates.status || '__unchanged__'}
                  onValueChange={(value) => handleUpdateChange('status', value === '__unchanged__' ? undefined : value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Keep unchanged" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unchanged__">Keep unchanged</SelectItem>
                    <SelectItem value="backlog">
                      <Badge className={getStatusColorClass('backlog')}>Backlog</Badge>
                    </SelectItem>
                    <SelectItem value="todo">
                      <Badge className={getStatusColorClass('todo')}>To Do</Badge>
                    </SelectItem>
                    <SelectItem value="in-progress">
                      <Badge className={getStatusColorClass('in-progress')}>In Progress</Badge>
                    </SelectItem>
                    <SelectItem value="done">
                      <Badge className={getStatusColorClass('done')}>Done</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={updates.priority || '__unchanged__'}
                  onValueChange={(value) => handleUpdateChange('priority', value === '__unchanged__' ? undefined : value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Keep unchanged" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unchanged__">Keep unchanged</SelectItem>
                    <SelectItem value="low">
                      <Badge className={getPriorityColorClass('low')}>Low</Badge>
                    </SelectItem>
                    <SelectItem value="medium">
                      <Badge className={getPriorityColorClass('medium')}>Medium</Badge>
                    </SelectItem>
                    <SelectItem value="high">
                      <Badge className={getPriorityColorClass('high')}>High</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project">Project</Label>
                <Select
                  value={updates.projectId || '__unchanged__'}
                  onValueChange={(value) => {
                    handleUpdateChange('projectId', value === '__unchanged__' ? undefined : value)
                    // Clear subcategory when project changes
                    if (value !== updates.projectId && updates.subcategory) {
                      const newUpdates = { ...updates }
                      delete newUpdates.subcategory
                      setUpdates(newUpdates)
                    }
                  }}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Keep unchanged" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unchanged__">Keep unchanged</SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject && subcategoryOptions.length > 0 && (
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select
                    value={updates.subcategory || '__unchanged__'}
                    onValueChange={(value) => handleUpdateChange('subcategory', value === '__unchanged__' ? undefined : value)}
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Keep unchanged" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unchanged__">Keep unchanged</SelectItem>
                      <SelectItem value="__clear__">Clear subcategory</SelectItem>
                      {subcategoryOptions.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={updates.dueDate || ''}
                  onChange={(e) => handleUpdateChange('dueDate', e.target.value || '__clear__')}
                  className="w-full"
                />
                {updates.dueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdateChange('dueDate', '__clear__')}
                    className="mt-1 text-xs"
                  >
                    Clear due date
                  </Button>
                )}
              </div>
            </div>

            {/* Updates Summary */}
            {hasUpdates && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Changes to apply:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    {updates.status && <li>• Status → {updates.status}</li>}
                    {updates.priority && <li>• Priority → {updates.priority}</li>}
                    {updates.projectId && (
                      <li>
                        • Project → {projects.find((p) => p.id === updates.projectId)?.name}
                      </li>
                    )}
                    {updates.subcategory && <li>• Subcategory → {updates.subcategory}</li>}
                    {updates.dueDate && <li>• Due Date → {updates.dueDate}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Result Display */}
            {result && (
              <Alert variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.success ? (
                    <span>
                      Successfully updated {result.processed} task{result.processed !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <div>
                      <p className="font-medium">
                        Failed to update {result.failed} task{result.failed !== 1 ? 's' : ''}
                      </p>
                      {result.errors.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs">
                          {result.errors.slice(0, 3).map((err, idx) => (
                            <li key={idx}>
                              {err.taskId}: {err.error}
                            </li>
                          ))}
                          {result.errors.length > 3 && (
                            <li>... and {result.errors.length - 3} more</li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!hasUpdates || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Applying...' : `Apply to ${selectedTaskIds.length} Tasks`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
