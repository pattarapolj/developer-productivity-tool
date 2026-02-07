import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaTaskComment } from '@/lib/api-types'

vi.mock('@/lib/db', () => ({
  prisma: {
    taskComment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { GET, PATCH, DELETE } from './route'

const mockPrismaComment: PrismaTaskComment = {
  id: 'comment1',
  taskId: 'task1',
  content: 'This is a comment',
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
}

describe('GET /api/comments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return comment by id', async () => {
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(mockPrismaComment as any)

    const response = await GET(undefined, { params: { id: 'comment1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('comment1')
    expect(data.content).toBe('This is a comment')
  })

  it('should return 404 when comment not found', async () => {
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(null)

    const response = await GET(undefined, { params: { id: 'nonexistent' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Comment not found')
  })
})

describe('PATCH /api/comments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update comment content', async () => {
    const updated = { ...mockPrismaComment, content: 'Updated content' }
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.taskComment.update).mockResolvedValueOnce(updated as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/comments/comment1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    })

    const response = await PATCH(request, { params: { id: 'comment1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.content).toBe('Updated content')
  })

  it('should require content', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments/comment1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })

    const response = await PATCH(request, { params: { id: 'comment1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('content')
  })

  it('should return 404 when comment not found', async () => {
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/comments/comment1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated' }),
    })

    const response = await PATCH(request, { params: { id: 'comment1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Comment not found')
  })

  it('should create activity on PATCH', async () => {
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.taskComment.update).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/comments/comment1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    })

    await PATCH(request, { params: { id: 'comment1' } } as any)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'comment_updated',
        }),
      })
    )
  })
})

describe('DELETE /api/comments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete comment', async () => {
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.taskComment.delete).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/comments/comment1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'comment1' } } as any)

    expect(response.status).toBe(204)
  })

  it('should return 404 when comment not found', async () => {
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/comments/comment1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'comment1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Comment not found')
  })

  it('should create activity on DELETE', async () => {
    vi.mocked(prisma.taskComment.findUnique).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.taskComment.delete).mockResolvedValueOnce(mockPrismaComment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/comments/comment1', {
      method: 'DELETE',
    })

    await DELETE(request, { params: { id: 'comment1' } } as any)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'comment_deleted',
        }),
      })
    )
  })
})
