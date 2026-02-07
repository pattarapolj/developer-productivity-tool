import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaTaskAttachment } from '@/lib/api-types'

vi.mock('@/lib/db', () => ({
  prisma: {
    taskAttachment: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { GET, DELETE } from './route'

const mockPrismaAttachment: PrismaTaskAttachment = {
  id: 'attach1',
  taskId: 'task1',
  fileName: 'document.pdf',
  fileSize: 1024,
  fileType: 'application/pdf',
  dataUrl: 'data:application/pdf;base64,abc123',
  uploadedAt: '2026-01-15T10:00:00.000Z',
}

describe('GET /api/attachments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return attachment by id', async () => {
    vi.mocked(prisma.taskAttachment.findUnique).mockResolvedValueOnce(mockPrismaAttachment as any)

    const response = await GET(undefined, { params: { id: 'attach1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('attach1')
    expect(data.fileName).toBe('document.pdf')
  })

  it('should return 404 when attachment not found', async () => {
    vi.mocked(prisma.taskAttachment.findUnique).mockResolvedValueOnce(null)

    const response = await GET(undefined, { params: { id: 'nonexistent' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Attachment not found')
  })
})

describe('DELETE /api/attachments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete attachment', async () => {
    vi.mocked(prisma.taskAttachment.findUnique).mockResolvedValueOnce(mockPrismaAttachment as any)
    vi.mocked(prisma.taskAttachment.delete).mockResolvedValueOnce(mockPrismaAttachment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/attachments/attach1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'attach1' } } as any)

    expect(response.status).toBe(204)
  })

  it('should return 404 when attachment not found', async () => {
    vi.mocked(prisma.taskAttachment.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/attachments/attach1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'attach1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Attachment not found')
  })

  it('should create activity on DELETE', async () => {
    vi.mocked(prisma.taskAttachment.findUnique).mockResolvedValueOnce(mockPrismaAttachment as any)
    vi.mocked(prisma.taskAttachment.delete).mockResolvedValueOnce(mockPrismaAttachment as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/attachments/attach1', {
      method: 'DELETE',
    })

    await DELETE(request, { params: { id: 'attach1' } } as any)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'attachment_deleted',
        }),
      })
    )
  })
})
