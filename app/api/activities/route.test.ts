import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaActivity } from '@/lib/api-types'

vi.mock('@/lib/db', () => ({
  prisma: {
    activity: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { GET } from './route'

const mockPrismaActivity: PrismaActivity = {
  id: 'act1',
  taskId: 'task1',
  projectId: 'proj1',
  type: 'task_created',
  description: 'Task created',
  metadata: '{}',
  createdAt: '2026-01-15T10:00:00.000Z',
}

describe('GET /api/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all activities', async () => {
    const mockActivities = [mockPrismaActivity]
    vi.mocked(prisma.activity.findMany).mockResolvedValueOnce(mockActivities as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('act1')
  })

  it('should filter activities by taskId', async () => {
    const mockActivities = [mockPrismaActivity]
    vi.mocked(prisma.activity.findMany).mockResolvedValueOnce(mockActivities as any)

    const request = new NextRequest('http://localhost:3000/api/activities?taskId=task1')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.activity.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should filter activities by projectId', async () => {
    const mockActivities = [mockPrismaActivity]
    vi.mocked(prisma.activity.findMany).mockResolvedValueOnce(mockActivities as any)

    const request = new NextRequest('http://localhost:3000/api/activities?projectId=proj1')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.activity.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should filter activities by date range', async () => {
    const mockActivities = [mockPrismaActivity]
    vi.mocked(prisma.activity.findMany).mockResolvedValueOnce(mockActivities as any)

    const request = new NextRequest(
      'http://localhost:3000/api/activities?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z'
    )
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Should have called with date range filters
    expect(prisma.activity.findMany).toHaveBeenCalled()
  })

  it('should return empty array when no activities exist', async () => {
    vi.mocked(prisma.activity.findMany).mockResolvedValueOnce([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.activity.findMany).mockRejectedValueOnce(new Error('DB Error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch activities')
  })

  it('should return activities in descending createdAt order', async () => {
    const act1 = { ...mockPrismaActivity, id: 'act1', createdAt: '2026-01-15T10:00:00.000Z' }
    const act2 = { ...mockPrismaActivity, id: 'act2', createdAt: '2026-01-16T10:00:00.000Z' }
    const mockActivities = [act2, act1]
    vi.mocked(prisma.activity.findMany).mockResolvedValueOnce(mockActivities as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data[0].id).toBe('act2') // Most recent first
    expect(data[1].id).toBe('act1')
  })
})
