import { describe, it, expect, vi } from 'vitest'
import type { Task } from './types'
import {
  validateBulkOperation,
  applyBulkOperation,
  createBulkUpdate,
  createBulkArchive,
  createBulkDelete,
  getBatchSize,
  batchTasks,
  estimateProcessingTime,
  type BulkOperation,
} from './bulk-operations'

describe('Bulk Operations', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: '',
      status: 'todo',
      priority: 'medium',
      projectId: 'proj-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: null,
      completedAt: null,
      isArchived: false,
      archivedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      blockedBy: [],
      blocking: [],
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: '',
      status: 'in-progress',
      priority: 'high',
      projectId: 'proj-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: null,
      completedAt: null,
      isArchived: false,
      archivedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      blockedBy: [],
      blocking: [],
    },
  ]

  describe('validateBulkOperation', () => {
    it('validates valid update operation', () => {
      const operation: BulkOperation = {
        type: 'update',
        taskIds: ['task-1', 'task-2'],
        changes: { status: 'done' },
      }
      const result = validateBulkOperation(operation)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects operation with no tasks', () => {
      const operation: BulkOperation = {
        type: 'update',
        taskIds: [],
        changes: { status: 'done' },
      }
      const result = validateBulkOperation(operation)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('No tasks selected')
    })

    it('rejects operation with too many tasks', () => {
      const operation: BulkOperation = {
        type: 'update',
        taskIds: Array(101).fill('task-id'),
        changes: { status: 'done' },
      }
      const result = validateBulkOperation(operation)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Cannot process more than 100 tasks at once')
    })

    it('rejects update operation without changes', () => {
      const operation: BulkOperation = {
        type: 'update',
        taskIds: ['task-1'],
      }
      const result = validateBulkOperation(operation)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('No changes specified for update operation')
    })

    it('rejects update operation with empty changes', () => {
      const operation: BulkOperation = {
        type: 'update',
        taskIds: ['task-1'],
        changes: {},
      }
      const result = validateBulkOperation(operation)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('No changes specified for update operation')
    })

    it('validates archive operation', () => {
      const operation: BulkOperation = {
        type: 'archive',
        taskIds: ['task-1', 'task-2'],
      }
      const result = validateBulkOperation(operation)
      expect(result.valid).toBe(true)
    })

    it('validates delete operation', () => {
      const operation: BulkOperation = {
        type: 'delete',
        taskIds: ['task-1'],
      }
      const result = validateBulkOperation(operation)
      expect(result.valid).toBe(true)
    })
  })

  describe('applyBulkOperation', () => {
    it('applies update operation successfully', () => {
      const updateTask = vi.fn()
      const archiveTask = vi.fn()
      const deleteTask = vi.fn()

      const operation: BulkOperation = {
        type: 'update',
        taskIds: ['task-1', 'task-2'],
        changes: { status: 'done', priority: 'high' },
      }

      const result = applyBulkOperation(mockTasks, operation, updateTask, archiveTask, deleteTask)

      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(2)
      expect(result.failedCount).toBe(0)
      expect(updateTask).toHaveBeenCalledTimes(2)
      expect(updateTask).toHaveBeenCalledWith('task-1', { status: 'done', priority: 'high' })
      expect(updateTask).toHaveBeenCalledWith('task-2', { status: 'done', priority: 'high' })
    })

    it('applies archive operation successfully', () => {
      const updateTask = vi.fn()
      const archiveTask = vi.fn()
      const deleteTask = vi.fn()

      const operation: BulkOperation = {
        type: 'archive',
        taskIds: ['task-1'],
      }

      const result = applyBulkOperation(mockTasks, operation, updateTask, archiveTask, deleteTask)

      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(1)
      expect(archiveTask).toHaveBeenCalledWith('task-1')
    })

    it('applies delete operation successfully', () => {
      const updateTask = vi.fn()
      const archiveTask = vi.fn()
      const deleteTask = vi.fn()

      const operation: BulkOperation = {
        type: 'delete',
        taskIds: ['task-2'],
      }

      const result = applyBulkOperation(mockTasks, operation, updateTask, archiveTask, deleteTask)

      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(1)
      expect(deleteTask).toHaveBeenCalledWith('task-2')
    })

    it('handles task not found error', () => {
      const updateTask = vi.fn()
      const archiveTask = vi.fn()
      const deleteTask = vi.fn()

      const operation: BulkOperation = {
        type: 'update',
        taskIds: ['non-existent'],
        changes: { status: 'done' },
      }

      const result = applyBulkOperation(mockTasks, operation, updateTask, archiveTask, deleteTask)

      expect(result.success).toBe(false)
      expect(result.processedCount).toBe(0)
      expect(result.failedCount).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].taskId).toBe('non-existent')
      expect(result.errors[0].error).toBe('Task not found')
    })

    it('handles invalid operation validation', () => {
      const updateTask = vi.fn()
      const archiveTask = vi.fn()
      const deleteTask = vi.fn()

      const operation: BulkOperation = {
        type: 'update',
        taskIds: [],
        changes: { status: 'done' },
      }

      const result = applyBulkOperation(mockTasks, operation, updateTask, archiveTask, deleteTask)

      expect(result.success).toBe(false)
      expect(result.errors[0].taskId).toBe('validation')
    })

    it('continues processing after partial failures', () => {
      const updateTask = vi.fn()
      const archiveTask = vi.fn()
      const deleteTask = vi.fn()

      const operation: BulkOperation = {
        type: 'update',
        taskIds: ['task-1', 'non-existent', 'task-2'],
        changes: { status: 'done' },
      }

      const result = applyBulkOperation(mockTasks, operation, updateTask, archiveTask, deleteTask)

      expect(result.success).toBe(false)
      expect(result.processedCount).toBe(2)
      expect(result.failedCount).toBe(1)
      expect(updateTask).toHaveBeenCalledTimes(2)
    })
  })

  describe('createBulkUpdate', () => {
    it('creates update operation', () => {
      const operation = createBulkUpdate(['task-1'], { status: 'done' })
      expect(operation.type).toBe('update')
      expect(operation.taskIds).toEqual(['task-1'])
      expect(operation.changes).toEqual({ status: 'done' })
    })
  })

  describe('createBulkArchive', () => {
    it('creates archive operation', () => {
      const operation = createBulkArchive(['task-1', 'task-2'])
      expect(operation.type).toBe('archive')
      expect(operation.taskIds).toEqual(['task-1', 'task-2'])
    })
  })

  describe('createBulkDelete', () => {
    it('creates delete operation', () => {
      const operation = createBulkDelete(['task-1'])
      expect(operation.type).toBe('delete')
      expect(operation.taskIds).toEqual(['task-1'])
    })
  })

  describe('getBatchSize', () => {
    it('returns full count for small batches', () => {
      expect(getBatchSize(5)).toBe(5)
      expect(getBatchSize(10)).toBe(10)
    })

    it('returns 10 for medium batches', () => {
      expect(getBatchSize(20)).toBe(10)
      expect(getBatchSize(50)).toBe(10)
    })

    it('returns 25 for large batches', () => {
      expect(getBatchSize(51)).toBe(25)
      expect(getBatchSize(100)).toBe(25)
    })
  })

  describe('batchTasks', () => {
    it('splits tasks into batches', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const batches = batchTasks(items, 3)
      expect(batches).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]])
    })

    it('handles single batch', () => {
      const items = [1, 2, 3]
      const batches = batchTasks(items, 5)
      expect(batches).toEqual([[1, 2, 3]])
    })

    it('handles exact division', () => {
      const items = [1, 2, 3, 4]
      const batches = batchTasks(items, 2)
      expect(batches).toEqual([[1, 2], [3, 4]])
    })
  })

  describe('estimateProcessingTime', () => {
    it('estimates processing time', () => {
      expect(estimateProcessingTime(10)).toBe(500) // 10 * 50ms
      expect(estimateProcessingTime(50)).toBe(2500) // 50 * 50ms
    })
  })
})
