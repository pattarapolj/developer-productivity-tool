import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaTaskAttachment } from '@/lib/api-types'

vi.mock('@/lib/db', () => ({
  prisma: {
    taskAttachment: {
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

const mockPrismaAttachment: PrismaTaskAttachment = {
  id: 'attach1',
  taskId: 'task1',
  fileName: 'document.pdf',
  fileSize: 1024,
  fileType: 'application/pdf',
  dataUrl: 'data:application/pdf;base64,abc123',
  uploadedAt: '2026-01-15T10:00:00.000Z',
}

describe('GET /api/attachments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all attachments', async () => {
    const mockAttachments = [mockPrismaAttachment]
    vi.mocked(prisma.taskAttachment.findMany).mockResolvedValueOnce(mockAttachments as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('attach1')
  })

  it('should filter attachments by taskId when provided', async () => {
    const mockAttachments = [mockPrismaAttachment]
    vi.mocked(prisma.taskAttachment.findMany).mockResolvedValueOnce(mockAttachments as any)

    const request = new NextRequest('http://localhost:3000/api/attachments?taskId=task1')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.taskAttachment.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task1' },
      orderBy: { uploadedAt: 'desc' },
    })
  })

  it('should return empty array when no attachments exist', async () => {
    vi.mocked(prisma.taskAttachment.findMany).mockResolvedValueOnce([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.taskAttachment.findMany).mockRejectedValueOnce(new Error('DB Error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch attachments')
  })
})

describe('POST /api/attachments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require taskId', async () => {
    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,abc123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('taskId')
  })

  it('should require fileName', async () => {
    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        fileType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,abc123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('fileName')
  })

  it('should require fileType', async () => {
    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        fileName: 'document.pdf',
        dataUrl: 'data:application/pdf;base64,abc123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('fileType')
  })

  it('should require dataUrl', async () => {
    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('dataUrl')
  })

  it('should validate that task exists', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'nonexistent-task',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,abc123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Task not found')
  })

  it('should create attachment', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.taskAttachment.create).mockResolvedValueOnce(mockPrismaAttachment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,abc123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('attach1')
    expect(data.fileName).toBe('document.pdf')
  })

  it('should create activity on POST', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.taskAttachment.create).mockResolvedValueOnce(mockPrismaAttachment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,abc123',
      }),
    })

    await POST(request)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: 'task1',
          type: 'attachment_added',
        }),
      })
    )
  })

  it('should handle database errors', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.taskAttachment.create).mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/attachments', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,abc123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create attachment')
  })
})
