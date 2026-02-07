import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    activity: {
      createMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { POST } from './route'

describe('POST /api/tasks/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require operation field', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        taskIds: ['task1', 'task2'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('operation')
  })

  it('should require taskIds field', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'archive',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('taskIds')
  })

  it('should validate operation is archive or delete', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'invalid',
        taskIds: ['task1'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('operation')
  })

  it('should require non-empty taskIds', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'archive',
        taskIds: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('taskIds')
  })

  it('should archive tasks and create activities', async () => {
    const taskIds = ['task1', 'task2']
    const mockTasks = [
      { id: 'task1', projectId: 'proj1', title: 'Task 1' },
      { id: 'task2', projectId: 'proj1', title: 'Task 2' },
    ]

    vi.mocked(prisma.task.findMany).mockResolvedValueOnce(mockTasks as any)
    vi.mocked(prisma.task.updateMany).mockResolvedValueOnce({ count: 2 })
    vi.mocked(prisma.activity.createMany).mockResolvedValueOnce({ count: 2 })

    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'archive',
        taskIds,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.affected).toBe(2)
  })

  it('should delete tasks and create activities', async () => {
    const taskIds = ['task1', 'task2']
    const mockTasks = [
      { id: 'task1', projectId: 'proj1', title: 'Task 1' },
      { id: 'task2', projectId: 'proj1', title: 'Task 2' },
    ]

    vi.mocked(prisma.task.findMany).mockResolvedValueOnce(mockTasks as any)
    vi.mocked(prisma.task.deleteMany).mockResolvedValueOnce({ count: 2 })
    vi.mocked(prisma.activity.createMany).mockResolvedValueOnce({ count: 2 })

    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'delete',
        taskIds,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.affected).toBe(2)
  })

  it('should validate all taskIds exist before operating', async () => {
    const taskIds = ['task1', 'nonexistent']

    vi.mocked(prisma.task.findMany).mockResolvedValueOnce([
      { id: 'task1', projectId: 'proj1', title: 'Task 1' },
    ] as any)

    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'archive',
        taskIds,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('not found')
  })

  it('should handle database errors', async () => {
    const taskIds = ['task1']

    vi.mocked(prisma.task.findMany).mockResolvedValueOnce([
      { id: 'task1', projectId: 'proj1', title: 'Task 1' },
    ] as any)
    vi.mocked(prisma.task.updateMany).mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'archive',
        taskIds,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to perform bulk operation')
  })
})
