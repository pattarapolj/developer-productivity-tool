import type { Task, TaskStatus, Priority } from './types'

export interface BulkOperation {
  type: 'update' | 'archive' | 'delete' | 'move'
  taskIds: string[]
  changes?: Partial<Pick<Task, 'status' | 'priority' | 'projectId' | 'dueDate' | 'subcategory'>>
}

export interface BulkOperationResult {
  success: boolean
  processedCount: number
  failedCount: number
  errors: Array<{ taskId: string; error: string }>
}

/**
 * Validate bulk operation before execution
 */
export function validateBulkOperation(operation: BulkOperation): { valid: boolean; error?: string } {
  if (!operation.taskIds || operation.taskIds.length === 0) {
    return { valid: false, error: 'No tasks selected' }
  }

  if (operation.taskIds.length > 100) {
    return { valid: false, error: 'Cannot process more than 100 tasks at once' }
  }

  if (operation.type === 'update' && !operation.changes) {
    return { valid: false, error: 'No changes specified for update operation' }
  }

  if (operation.type === 'update' && operation.changes) {
    const hasChanges = Object.keys(operation.changes).length > 0
    if (!hasChanges) {
      return { valid: false, error: 'No changes specified for update operation' }
    }
  }

  return { valid: true }
}

/**
 * Apply bulk operation to tasks
 */
export function applyBulkOperation(
  tasks: Task[],
  operation: BulkOperation,
  updateTask: (id: string, changes: Partial<Task>) => void,
  archiveTask: (id: string) => void,
  deleteTask: (id: string) => void
): BulkOperationResult {
  const result: BulkOperationResult = {
    success: true,
    processedCount: 0,
    failedCount: 0,
    errors: [],
  }

  const validation = validateBulkOperation(operation)
  if (!validation.valid) {
    result.success = false
    result.errors.push({ taskId: 'validation', error: validation.error || 'Invalid operation' })
    return result
  }

  for (const taskId of operation.taskIds) {
    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      switch (operation.type) {
        case 'update':
          if (operation.changes) {
            updateTask(taskId, operation.changes)
          }
          break
        case 'archive':
          archiveTask(taskId)
          break
        case 'delete':
          deleteTask(taskId)
          break
        default:
          throw new Error(`Unknown operation type: ${operation.type}`)
      }

      result.processedCount++
    } catch (error) {
      result.failedCount++
      result.errors.push({
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  result.success = result.failedCount === 0

  return result
}

/**
 * Create bulk update operation
 */
export function createBulkUpdate(
  taskIds: string[],
  changes: Partial<Pick<Task, 'status' | 'priority' | 'projectId' | 'dueDate' | 'subcategory'>>
): BulkOperation {
  return {
    type: 'update',
    taskIds,
    changes,
  }
}

/**
 * Create bulk archive operation
 */
export function createBulkArchive(taskIds: string[]): BulkOperation {
  return {
    type: 'archive',
    taskIds,
  }
}

/**
 * Create bulk delete operation
 */
export function createBulkDelete(taskIds: string[]): BulkOperation {
  return {
    type: 'delete',
    taskIds,
  }
}

/**
 * Get batch size for operations based on task count
 */
export function getBatchSize(totalTasks: number): number {
  if (totalTasks <= 10) return totalTasks
  if (totalTasks <= 50) return 10
  return 25
}

/**
 * Split tasks into batches for processing
 */
export function batchTasks<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return batches
}

/**
 * Estimate processing time for bulk operation (in milliseconds)
 */
export function estimateProcessingTime(taskCount: number): number {
  // Rough estimate: 50ms per task
  return taskCount * 50
}
