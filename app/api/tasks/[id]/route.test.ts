import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PATCH, DELETE } from './route'
import { NextRequest } from 'next/server'
import type { PrismaTask } from '@/lib/api-types'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
    taskHistory: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'

const mockPrismaTask: PrismaTask = {
  id: 'task1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'todo',
  priority: 'medium',
  projectId: 'proj1',
  dueDate: null,
  subcategory: null,
  jiraKey: null,
  storyPoints: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
  completedAt: null,
  isArchived: false,
  archivedAt: null,
  blockedBy: '[]',
  blocking: '[]',
}

describe('GET /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return single task with proper transformations', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)

    const response = await GET(new NextRequest('http://localhost:3000'), {
      params: { id: 'task1' },
    } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('task1')
    expect(data.title).toBe('Test Task')
    // Check that dates are ISO strings (JSON serialization)
    expect(typeof data.createdAt).toBe('string')
    expect(data.blockedBy).toEqual([])
  })

  it('should return 404 when task not found', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)

    const response = await GET(new NextRequest('http://localhost:3000'), {
      params: { id: 'nonexistent' },
    } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Task not found')
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.task.findUnique).mockRejectedValueOnce(new Error('DB Error'))

    const response = await GET(new NextRequest('http://localhost:3000'), {
      params: { id: 'task1' },
    } as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch task')
  })
})

describe('PATCH /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 404 when task not found', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    })

    const response = await PATCH(request, { params: { id: 'nonexistent' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Task not found')
  })

  it('should update task title', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    const updatedTask = { ...mockPrismaTask, title: 'Updated Task' }
    vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Task' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('Updated Task')

    // Verify update was called
    const updateCall = vi.mocked(prisma.task.update).mock.calls[0]
    expect(updateCall[0].data.title).toBe('Updated Task')
  })

  it('should trim whitespace from title during update', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    const updatedTask = { ...mockPrismaTask, title: 'Trimmed' }
    vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '  Trimmed  ' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    expect(response.status).toBe(200)

    const updateCall = vi.mocked(prisma.task.update).mock.calls[0]
    expect(updateCall[0].data.title).toBe('Trimmed')
  })

  it('should set completedAt when status changes to done', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    const completedTask = { ...mockPrismaTask, status: 'done', completedAt: '2026-01-15T10:30:00.000Z' }
    vi.mocked(prisma.task.update).mockResolvedValueOnce(completedTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.taskHistory.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'done' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    expect(response.status).toBe(200)

    const updateCall = vi.mocked(prisma.task.update).mock.calls[0]
    expect(updateCall[0].data.completedAt).not.toBeNull()
  })

  it('should NOT set completedAt when status is not done', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    const updatedTask = { ...mockPrismaTask, status: 'in-progress' }
    vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in-progress' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    expect(response.status).toBe(200)

    const updateCall = vi.mocked(prisma.task.update).mock.calls[0]
    expect(updateCall[0].data.completedAt).toBeUndefined()
  })

  it('should create Activity when status changes', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    const updatedTask = { ...mockPrismaTask, status: 'in-progress' }
    vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)
    vi.mocked(prisma.taskHistory.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in-progress' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    expect(response.status).toBe(200)

    // Verify activity was created
    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalled()
    const activityCall = vi.mocked(prisma.activity.create).mock.calls[0]
    expect(activityCall[0].data.type).toBe('task_status_changed')
    expect(activityCall[0].data.description).toContain('todo')
    expect(activityCall[0].data.description).toContain('in-progress')
  })

  it('should create TaskHistory for field changes', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    const updatedTask = { ...mockPrismaTask, priority: 'high' }
    vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask as any)
    vi.mocked(prisma.taskHistory.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ priority: 'high' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    expect(response.status).toBe(200)

    // Verify history was created
    expect(vi.mocked(prisma.taskHistory.create)).toHaveBeenCalled()
    const historyCall = vi.mocked(prisma.taskHistory.create).mock.calls[0]
    expect(historyCall[0].data.field).toBe('priority')
    expect(historyCall[0].data.oldValue).toBe('medium')
    expect(historyCall[0].data.newValue).toBe('high')
  })

  it('should NOT create Activity when no status change', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    const updatedTask = { ...mockPrismaTask, title: 'New Title' }
    vi.mocked(prisma.task.update).mockResolvedValueOnce(updatedTask as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    expect(response.status).toBe(200)

    // Activity should not be created for non-status changes
    expect(vi.mocked(prisma.activity.create)).not.toHaveBeenCalled()
  })

  it('should handle update errors gracefully', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.task.update).mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/tasks/task1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    })

    const response = await PATCH(request, { params: { id: 'task1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update task')
  })
})

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete task successfully', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.task.delete).mockResolvedValueOnce(mockPrismaTask as any)

    const response = await DELETE(new NextRequest('http://localhost:3000'), {
      params: { id: 'task1' },
    } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('successfully')

    // Verify delete was called
    expect(vi.mocked(prisma.task.delete)).toHaveBeenCalledWith({ where: { id: 'task1' } })
  })

  it('should return 404 when deleting non-existent task', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)

    const response = await DELETE(new NextRequest('http://localhost:3000'), {
      params: { id: 'nonexistent' },
    } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Task not found')
  })

  it('should handle delete errors gracefully', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.task.delete).mockRejectedValueOnce(new Error('DB Error'))

    const response = await DELETE(new NextRequest('http://localhost:3000'), {
      params: { id: 'task1' },
    } as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete task')
  })
})
