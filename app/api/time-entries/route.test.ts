import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaTimeEntry } from '@/lib/api-types'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    timeEntry: {
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

const mockPrismaTimeEntry: PrismaTimeEntry = {
  id: 'time1',
  taskId: 'task1',
  hours: 2,
  minutes: 30,
  date: '2026-01-15T00:00:00.000Z',
  notes: 'Test entry',
  type: 'development',
  createdAt: '2026-01-15T10:00:00.000Z',
}

describe('GET /api/time-entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all time entries', async () => {
    const mockEntries = [mockPrismaTimeEntry]
    vi.mocked(prisma.timeEntry.findMany).mockResolvedValueOnce(mockEntries as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('time1')
    expect(data[0].hours).toBe(2)
    expect(data[0].minutes).toBe(30)
  })

  it('should filter time entries by taskId when provided', async () => {
    const mockEntries = [mockPrismaTimeEntry]
    vi.mocked(prisma.timeEntry.findMany).mockResolvedValueOnce(mockEntries as any)

    const request = new NextRequest('http://localhost:3000/api/time-entries?taskId=task1')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task1' },
      orderBy: { date: 'desc' },
    })
  })

  it('should return empty array when no entries exist', async () => {
    vi.mocked(prisma.timeEntry.findMany).mockResolvedValueOnce([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.timeEntry.findMany).mockRejectedValueOnce(new Error('DB Error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch time entries')
  })
})

describe('POST /api/time-entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require taskId', async () => {
    const request = new NextRequest('http://localhost:3000/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        hours: 2,
        minutes: 30,
        date: '2026-01-15',
        type: 'development',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('taskId')
  })

  it('should require date', async () => {
    const request = new NextRequest('http://localhost:3000/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        hours: 2,
        minutes: 30,
        type: 'development',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('date')
  })

  it('should validate that task exists', async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'nonexistent-task',
        hours: 2,
        minutes: 30,
        date: '2026-01-15T00:00:00.000Z',
        type: 'development',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Task not found')
  })

  it('should create time entry with defaults', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.timeEntry.create).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        hours: 2,
        minutes: 30,
        date: '2026-01-15T00:00:00.000Z',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('time1')
    expect(data.hours).toBe(2)
    expect(data.minutes).toBe(30)
    expect(data.type).toBe('development') // default
  })

  it('should create activity on POST', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.timeEntry.create).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        hours: 2,
        minutes: 30,
        date: '2026-01-15T00:00:00.000Z',
        type: 'development',
      }),
    })

    await POST(request)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: 'task1',
          type: 'time_logged',
        }),
      })
    )
  })

  it('should handle database errors', async () => {
    const mockTask = { id: 'task1', projectId: 'proj1' }
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(mockTask as any)
    vi.mocked(prisma.timeEntry.create).mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task1',
        hours: 2,
        minutes: 30,
        date: '2026-01-15T00:00:00.000Z',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create time entry')
  })
})

