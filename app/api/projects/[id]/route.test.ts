import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PATCH, DELETE } from './route'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  }
}))

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns single project when found', async () => {
    const mockProject = {
      id: 'proj1',
      name: 'Test Project',
      color: 'blue',
      subcategories: '["UI"]',
      jiraKey: 'TEST',
      createdAt: new Date('2026-01-01T10:00:00Z'),
    }
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject)

    const response = await GET(new NextRequest('http://localhost:3000/api/projects/proj1'), {
      params: { id: 'proj1' },
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      id: 'proj1',
      name: 'Test Project',
      color: 'blue',
      subcategories: ['UI'],
      jiraKey: 'TEST',
      createdAt: '2026-01-01T10:00:00.000Z',
    })
  })

  it('returns 404 when project not found', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost:3000/api/projects/nonexistent'), {
      params: { id: 'nonexistent' },
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.project.findUnique).mockRejectedValue(new Error('DB error'))

    const response = await GET(new NextRequest('http://localhost:3000/api/projects/proj1'), {
      params: { id: 'proj1' },
    })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch project')
  })
})

describe('PATCH /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates project fields', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'Updated Project',
        color: 'green',
      })
    } as NextRequest

    const mockUpdated = {
      id: 'proj1',
      name: 'Updated Project',
      color: 'green',
      subcategories: '[]',
      jiraKey: 'TEST',
      createdAt: new Date('2026-01-01T10:00:00Z'),
    }
    vi.mocked(prisma.project.update).mockResolvedValue(mockUpdated)

    const response = await PATCH(mockRequest, { params: { id: 'proj1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Updated Project')
    expect(data.color).toBe('green')
  })

  it('returns 404 when project not found', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'Updated Project',
      })
    } as NextRequest

    vi.mocked(prisma.project.update).mockRejectedValue({ code: 'P2025' })

    const response = await PATCH(mockRequest, { params: { id: 'nonexistent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('validates name is not empty', async () => {
    const mockRequest = {
      json: async () => ({
        name: '   ',
      })
    } as NextRequest

    const response = await PATCH(mockRequest, { params: { id: 'proj1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project name is required')
  })

  it('returns 500 on database error', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'Updated Project',
      })
    } as NextRequest

    vi.mocked(prisma.project.update).mockRejectedValue(new Error('DB error'))

    const response = await PATCH(mockRequest, { params: { id: 'proj1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update project')
  })
})

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes project and cascades to tasks', async () => {
    const mockDeleted = {
      id: 'proj1',
      name: 'Test Project',
      color: 'blue',
      subcategories: '[]',
      jiraKey: null,
      createdAt: new Date('2026-01-01T10:00:00Z'),
    }
    vi.mocked(prisma.project.delete).mockResolvedValue(mockDeleted)

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/projects/proj1'),
      { params: { id: 'proj1' } }
    )

    expect(response.status).toBe(204)
    expect(prisma.project.delete).toHaveBeenCalledWith({
      where: { id: 'proj1' }
    })
  })

  it('returns 404 when project not found', async () => {
    vi.mocked(prisma.project.delete).mockRejectedValue({ code: 'P2025' })

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/projects/nonexistent'),
      { params: { id: 'nonexistent' } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.project.delete).mockRejectedValue(new Error('DB error'))

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/projects/proj1'),
      { params: { id: 'proj1' } }
    )
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete project')
  })
})
