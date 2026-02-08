import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PATCH, DELETE } from './route'
import { NextRequest } from 'next/server'
import type { PrismaBoard } from '@/lib/api-types'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    board: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'

const mockPrismaBoard: PrismaBoard = {
  id: 'board1',
  name: 'Test Board',
  projectId: 'proj1',
  thumbnailPath: '/thumbnails/board1.png',
  content: '{"version":1}',
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
  isArchived: false,
}

describe('GET /api/boards/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return board by ID', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValueOnce(mockPrismaBoard as any)

    const response = await GET(new NextRequest('http://localhost:3000/api/boards/board1'), {
      params: { id: 'board1' },
    } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('board1')
    expect(data.name).toBe('Test Board')
  })

  it('should return 404 for non-existent board', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValueOnce(null)

    const response = await GET(new NextRequest('http://localhost:3000/api/boards/nonexistent'), {
      params: { id: 'nonexistent' },
    } as any)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })

  it('should call findUnique with correct ID', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValueOnce(mockPrismaBoard as any)

    await GET(new NextRequest('http://localhost:3000/api/boards/board1'), {
      params: { id: 'board1' },
    } as any)

    expect(vi.mocked(prisma.board.findUnique)).toHaveBeenCalledWith({
      where: { id: 'board1' },
    })
  })
})

describe('PATCH /api/boards/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update board name', async () => {
    const updated = { ...mockPrismaBoard, name: 'Updated Board' }
    vi.mocked(prisma.board.update).mockResolvedValueOnce(updated as any)

    const request = new NextRequest('http://localhost:3000/api/boards/board1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Board' }),
    })

    const response = await PATCH(request, { params: { id: 'board1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Updated Board')
  })

  it('should update board content', async () => {
    const newContent = '{"version":2,"elements":[]}'
    const updated = { ...mockPrismaBoard, content: newContent }
    vi.mocked(prisma.board.update).mockResolvedValueOnce(updated as any)

    const request = new NextRequest('http://localhost:3000/api/boards/board1', {
      method: 'PATCH',
      body: JSON.stringify({ content: newContent }),
    })

    const response = await PATCH(request, { params: { id: 'board1' } } as any)
    const data = await response.json()

    expect(data.content).toBe(newContent)
  })

  it('should update board thumbnailPath', async () => {
    const updated = { ...mockPrismaBoard, thumbnailPath: '/new/path.png' }
    vi.mocked(prisma.board.update).mockResolvedValueOnce(updated as any)

    const request = new NextRequest('http://localhost:3000/api/boards/board1', {
      method: 'PATCH',
      body: JSON.stringify({ thumbnailPath: '/new/path.png' }),
    })

    const response = await PATCH(request, { params: { id: 'board1' } } as any)
    const data = await response.json()

    expect(data.thumbnailPath).toBe('/new/path.png')
  })

  it('should archive board by setting isArchived to true', async () => {
    const archived = { ...mockPrismaBoard, isArchived: true }
    vi.mocked(prisma.board.update).mockResolvedValueOnce(archived as any)

    const request = new NextRequest('http://localhost:3000/api/boards/board1', {
      method: 'PATCH',
      body: JSON.stringify({ isArchived: true }),
    })

    const response = await PATCH(request, { params: { id: 'board1' } } as any)
    const data = await response.json()

    expect(data.isArchived).toBe(true)
  })

  it('should return 404 for non-existent board', async () => {
    vi.mocked(prisma.board.update).mockRejectedValueOnce(
      { code: 'P2025', meta: { cause: 'Record not found' } } as any
    )

    const request = new NextRequest('http://localhost:3000/api/boards/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })

    const response = await PATCH(request, { params: { id: 'nonexistent' } } as any)

    expect(response.status).toBe(404)
  })

  it('should update multiple fields at once', async () => {
    const updated = {
      ...mockPrismaBoard,
      name: 'New Name',
      content: '{"version":2}',
      isArchived: true,
    }
    vi.mocked(prisma.board.update).mockResolvedValueOnce(updated as any)

    const request = new NextRequest('http://localhost:3000/api/boards/board1', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'New Name',
        content: '{"version":2}',
        isArchived: true,
      }),
    })

    const response = await PATCH(request, { params: { id: 'board1' } } as any)
    const data = await response.json()

    expect(data.name).toBe('New Name')
    expect(data.content).toBe('{"version":2}')
    expect(data.isArchived).toBe(true)
  })
})

describe('DELETE /api/boards/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete board permanently', async () => {
    vi.mocked(prisma.board.delete).mockResolvedValueOnce(mockPrismaBoard as any)

    const response = await DELETE(new NextRequest('http://localhost:3000/api/boards/board1'), {
      params: { id: 'board1' },
    } as any)

    expect(response.status).toBe(204)
  })

  it('should call delete with correct ID', async () => {
    vi.mocked(prisma.board.delete).mockResolvedValueOnce(mockPrismaBoard as any)

    await DELETE(new NextRequest('http://localhost:3000/api/boards/board1'), {
      params: { id: 'board1' },
    } as any)

    expect(vi.mocked(prisma.board.delete)).toHaveBeenCalledWith({
      where: { id: 'board1' },
    })
  })

  it('should return 404 for non-existent board', async () => {
    vi.mocked(prisma.board.delete).mockRejectedValueOnce(
      { code: 'P2025', meta: { cause: 'Record not found' } } as any
    )

    const response = await DELETE(new NextRequest('http://localhost:3000/api/boards/nonexistent'), {
      params: { id: 'nonexistent' },
    } as any)

    expect(response.status).toBe(404)
  })

  it('should return 204 No Content on successful deletion', async () => {
    vi.mocked(prisma.board.delete).mockResolvedValueOnce(mockPrismaBoard as any)

    const response = await DELETE(new NextRequest('http://localhost:3000/api/boards/board1'), {
      params: { id: 'board1' },
    } as any)

    expect(response.status).toBe(204)
    expect(response.headers.get('content-length')).not.toBe('0') // NextResponse automatically handles this
  })
})
