import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaTaskComment } from '@/lib/api-types'

vi.mock('@/lib/db', () => ({
  prisma: {
    taskComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { GET, POST } from './route'

const mockPrismaComment: PrismaTaskComment = {
  id: 'comment1',
  taskId: 'task1',
  content: 'This is a comment',
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
}

describe('GET /api/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all comments', async () => {
    const mockComments = [mockPrismaComment]
    vi.mocked(prisma.taskComment.findMany).mockResolvedValueOnce(mockComments as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('comment1')
  })

  it('should filter comments by taskId when provided', async () => {
    const mockComments = [mockPrismaComment]
    const prismaAny = prisma as any
    vi.mocked(prismaAny.taskComment.findMany).mockResolvedValueOnce(mockComments)

    const request = new NextRequest('http://localhost:3000/api/comments?taskId=task1')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prismaAny.taskComment.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should return empty array when no comments exist', async () => {
    const prismaAny = prisma as any
    const mockComments: any[] = []
    vi.mocked(prismaAny.taskComment.findMany).mockResolvedValueOnce(mockComments)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors', async () => {
    const prismaAny = prisma as any
    vi.mocked(prismaAny.taskComment.findMany).mockRejectedValueOnce(new Error('DB Error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch comments')
  })
})

describe('POST /api/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require taskId', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Comment text',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('taskId')
  })

  it('should require content', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('content')
  })

  it('should validate that task exists', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'nonexistent-task',
        content: 'Comment text',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Task not found')
  })

  it('should create comment', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.taskComment.create).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        content: 'This is a comment',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('comment1')
    expect(data.content).toBe('This is a comment')
  })

  it('should create activity on POST', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.taskComment.create).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        content: 'Comment text',
      }),
    })

    await POST(request)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: 'task1',
          type: 'comment_added',
        }),
      })
    )
  })

  it('should handle database errors', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.taskComment.create).mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        content: 'Comment text',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create comment')
  })
})
