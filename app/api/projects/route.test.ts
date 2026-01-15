import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from './route'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
    }
  }
}))

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all projects with proper date transformations', async () => {
    const mockProjects = [
      {
        id: 'proj1',
        name: 'Test Project',
        color: 'blue',
        subcategories: '["UI", "Components"]',
        jiraKey: 'TEST',
        createdAt: new Date('2026-01-01T10:00:00Z'),
      },
      {
        id: 'proj2',
        name: 'Another Project',
        color: 'green',
        subcategories: '[]',
        jiraKey: null,
        createdAt: new Date('2026-01-02T10:00:00Z'),
      },
    ]
    vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0]).toEqual({
      id: 'proj1',
      name: 'Test Project',
      color: 'blue',
      subcategories: ['UI', 'Components'],
      jiraKey: 'TEST',
      createdAt: '2026-01-01T10:00:00.000Z',
    })
    expect(data[1].subcategories).toEqual([])
  })

  it('returns empty array when no projects exist', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.project.findMany).mockRejectedValue(new Error('DB error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch projects')
  })
})

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates project with validation and returns 201', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'New Project',
        color: 'blue',
        jiraKey: 'PROJ',
      })
    } as NextRequest

    const mockCreated = {
      id: 'new-proj-id',
      name: 'New Project',
      color: 'blue',
      subcategories: '[]',
      jiraKey: 'PROJ',
      createdAt: new Date('2026-01-15T10:00:00Z'),
    }
    vi.mocked(prisma.project.create).mockResolvedValue(mockCreated)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual({
      id: 'new-proj-id',
      name: 'New Project',
      color: 'blue',
      subcategories: [],
      jiraKey: 'PROJ',
      createdAt: '2026-01-15T10:00:00.000Z',
    })
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: 'New Project',
        color: 'blue',
        jiraKey: 'PROJ',
        subcategories: '[]',
      }
    })
  })

  it('rejects missing name with 400', async () => {
    const mockRequest = {
      json: async () => ({
        color: 'blue',
      })
    } as NextRequest

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project name is required')
  })

  it('rejects empty name with 400', async () => {
    const mockRequest = {
      json: async () => ({
        name: '   ',
        color: 'blue',
      })
    } as NextRequest

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project name is required')
  })

  it('handles null jiraKey', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'Project Without Jira',
        color: 'green',
        jiraKey: null,
      })
    } as NextRequest

    const mockCreated = {
      id: 'proj-id',
      name: 'Project Without Jira',
      color: 'green',
      subcategories: '[]',
      jiraKey: null,
      createdAt: new Date('2026-01-15T10:00:00Z'),
    }
    vi.mocked(prisma.project.create).mockResolvedValue(mockCreated)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.jiraKey).toBeNull()
  })

  it('trims whitespace from name', async () => {
    const mockRequest = {
      json: async () => ({
        name: '  Project Name  ',
        color: 'blue',
      })
    } as NextRequest

    const mockCreated = {
      id: 'proj-id',
      name: 'Project Name',
      color: 'blue',
      subcategories: '[]',
      jiraKey: null,
      createdAt: new Date('2026-01-15T10:00:00Z'),
    }
    vi.mocked(prisma.project.create).mockResolvedValue(mockCreated)

    await POST(mockRequest)

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Project Name',
        color: 'blue',
        jiraKey: null,
        subcategories: '[]',
      }
    })
  })

  it('returns 500 on database error', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'Test Project',
        color: 'blue',
      })
    } as NextRequest

    vi.mocked(prisma.project.create).mockRejectedValue(new Error('DB error'))

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create project')
  })
})
