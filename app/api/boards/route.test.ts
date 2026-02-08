import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import type { PrismaBoard } from '@/lib/api-types'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    board: {
      findMany: vi.fn(),
      create: vi.fn(),
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

describe('GET /api/boards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all non-archived boards', async () => {
    const mockBoards = [mockPrismaBoard]
    vi.mocked(prisma.board.findMany).mockResolvedValueOnce(mockBoards as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('board1')
    expect(data[0].name).toBe('Test Board')
  })

  it('should exclude archived boards', async () => {
    const mockBoards = [
      mockPrismaBoard,
      { ...mockPrismaBoard, id: 'board2', isArchived: true },
    ]
    vi.mocked(prisma.board.findMany).mockResolvedValueOnce([mockBoards[0]] as any)

    const response = await GET()
    const data = await response.json()

    expect(data).toHaveLength(1)
    expect(data[0].isArchived).toBe(false)
  })

  it('should return empty array when no boards exist', async () => {
    vi.mocked(prisma.board.findMany).mockResolvedValueOnce([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should order by updatedAt descending', async () => {
    const mockBoards = [mockPrismaBoard]
    vi.mocked(prisma.board.findMany).mockResolvedValueOnce(mockBoards as any)

    await GET()

    expect(vi.mocked(prisma.board.findMany)).toHaveBeenCalledWith({
      where: { isArchived: false },
      orderBy: { updatedAt: 'desc' },
    })
  })
})

describe('POST /api/boards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create board with required fields only (name)', async () => {
    vi.mocked(prisma.board.create).mockResolvedValueOnce(mockPrismaBoard as any)

    const request = new NextRequest('http://localhost:3000/api/boards', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Board',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('board1')
    expect(data.name).toBe('Test Board')
  })

  it('should create board with all fields (name, projectId, content)', async () => {
    const newBoard = {
      ...mockPrismaBoard,
      projectId: 'proj2',
      content: '{"version":2,"elements":[]}',
    }
    vi.mocked(prisma.board.create).mockResolvedValueOnce(newBoard as any)

    const request = new NextRequest('http://localhost:3000/api/boards', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Design Board',
        projectId: 'proj2',
        content: '{"version":2,"elements":[]}',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.projectId).toBe('proj2')
  })

  it('should return 400 when name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/boards', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'proj1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should return 400 when name is empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/boards', {
      method: 'POST',
      body: JSON.stringify({
        name: '   ',
        projectId: 'proj1',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.board.create).mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/boards', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Board',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create board')
  })

  it('should use crypto.randomUUID() for ID generation', async () => {
    vi.mocked(prisma.board.create).mockResolvedValueOnce(mockPrismaBoard as any)

    const request = new NextRequest('http://localhost:3000/api/boards', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Board',
      }),
    })

    await POST(request)

    expect(vi.mocked(prisma.board.create)).toHaveBeenCalled()
    const callArgs = vi.mocked(prisma.board.create).mock.calls[0][0]
    expect(callArgs.data.id).toBeTruthy()
  })

  it('should set isArchived to false by default', async () => {
    vi.mocked(prisma.board.create).mockResolvedValueOnce(mockPrismaBoard as any)

    const request = new NextRequest('http://localhost:3000/api/boards', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Board',
      }),
    })

    await POST(request)

    const callArgs = vi.mocked(prisma.board.create).mock.calls[0][0]
    expect(callArgs.data.isArchived).toBe(false)
  })
})
