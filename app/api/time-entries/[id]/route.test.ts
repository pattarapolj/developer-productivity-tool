import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaTimeEntry } from '@/lib/api-types'

vi.mock('@/lib/db', () => ({
  prisma: {
    timeEntry: {
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

describe('GET /api/time-entries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return time entry by id', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(mockPrismaTimeEntry as any)

    const response = await GET(undefined, { params: { id: 'time1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('time1')
    expect(data.hours).toBe(2)
  })

  it('should return 404 when time entry not found', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(null)

    const response = await GET(undefined, { params: { id: 'nonexistent' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Time entry not found')
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockRejectedValueOnce(new Error('DB Error'))

    const response = await GET(undefined, { params: { id: 'time1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch time entry')
  })
})

describe('PATCH /api/time-entries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update time entry', async () => {
    const updated = { ...mockPrismaTimeEntry, hours: 3 }
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.timeEntry.update).mockResolvedValueOnce(updated as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/time-entries/time1', {
      method: 'PATCH',
      body: JSON.stringify({ hours: 3 }),
    })

    const response = await PATCH(request, { params: { id: 'time1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hours).toBe(3)
  })

  it('should return 404 when time entry not found', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/time-entries/time1', {
      method: 'PATCH',
      body: JSON.stringify({ hours: 3 }),
    })

    const response = await PATCH(request, { params: { id: 'time1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Time entry not found')
  })

  it('should create activity on PATCH', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.timeEntry.update).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/time-entries/time1', {
      method: 'PATCH',
      body: JSON.stringify({ hours: 3 }),
    })

    await PATCH(request, { params: { id: 'time1' } } as any)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'time_updated',
        }),
      })
    )
  })
})

describe('DELETE /api/time-entries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete time entry', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.timeEntry.delete).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/time-entries/time1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'time1' } } as any)

    expect(response.status).toBe(204)
  })

  it('should return 404 when time entry not found', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/time-entries/time1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'time1' } } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Time entry not found')
  })

  it('should create activity on DELETE', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.timeEntry.delete).mockResolvedValueOnce(mockPrismaTimeEntry as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/time-entries/time1', {
      method: 'DELETE',
    })

    await DELETE(request, { params: { id: 'time1' } } as any)

    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'time_deleted',
        }),
      })
    )
  })
})
