import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import type { PrismaTask } from '@/lib/api-types'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'

const mockPrismaTask: PrismaTask = {
  id: 'task1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'todo',
  priority: 'medium',
  projectId: 'proj1',
  dueDate: null,
  subcategory: null,
  jiraKey: null,
  storyPoints: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
  completedAt: null,
  isArchived: false,
  archivedAt: null,
  blockedBy: '[]',
  blocking: '[]',
}

describe('GET /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all tasks with proper transformations', async () => {
    const mockTasks = [mockPrismaTask]
    vi.mocked(prisma.task.findMany).mockResolvedValueOnce(mockTasks as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('task1')
    expect(data[0].title).toBe('Test Task')
    // Check that dates are ISO strings (JSON serialization)
    expect(typeof data[0].createdAt).toBe('string')
    expect(data[0].blockedBy).toEqual([]) // Should be parsed array, not JSON string
  })

  it('should return empty array when no tasks exist', async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.task.findMany).mockRejectedValueOnce(new Error('DB Error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch tasks')
  })
})

describe('POST /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate that title is required', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        description: 'No title',
        projectId: 'proj1',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('title')
  })

  it('should validate that projectId is required', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        description: 'No project',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.toLowerCase()).toContain('project')
  })

  it('should validate that project exists in database', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        projectId: 'nonexistent-proj',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Project not found')
  })

  it('should create task with default values', async () => {
    const mockProject = { id: 'proj1', name: 'Test Project' }
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as any)
    vi.mocked(prisma.task.create).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        projectId: 'proj1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.title).toBe('Test Task')
    expect(data.projectId).toBe('proj1')

    // Verify create was called with correct data
    const createCall = vi.mocked(prisma.task.create).mock.calls[0]
    expect(createCall[0].data.title).toBe('Test Task')
    expect(createCall[0].data.status).toBe('todo')
    expect(createCall[0].data.priority).toBe('medium')
    expect(createCall[0].data.description).toBe('')
  })

  it('should trim whitespace from title and description', async () => {
    const mockProject = { id: 'proj1', name: 'Test Project' }
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as any)
    vi.mocked(prisma.task.create).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: '  Test Task  ',
        description: '  Test Description  ',
        projectId: 'proj1',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const createCall = vi.mocked(prisma.task.create).mock.calls[0]
    expect(createCall[0].data.title).toBe('Test Task')
    expect(createCall[0].data.description).toBe('Test Description')
  })

  it('should set completedAt when status is done', async () => {
    const mockProject = { id: 'proj1', name: 'Test Project' }
    const completedTask = { ...mockPrismaTask, status: 'done', completedAt: '2026-01-15T10:00:00.000Z' }
    
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as any)
    vi.mocked(prisma.task.create).mockResolvedValueOnce(completedTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Done Task',
        projectId: 'proj1',
        status: 'done',
        priority: 'high',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const createCall = vi.mocked(prisma.task.create).mock.calls[0]
    expect(createCall[0].data.completedAt).not.toBeNull()
  })

  it('should NOT set completedAt when status is not done', async () => {
    const mockProject = { id: 'proj1', name: 'Test Project' }
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as any)
    vi.mocked(prisma.task.create).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        projectId: 'proj1',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const createCall = vi.mocked(prisma.task.create).mock.calls[0]
    expect(createCall[0].data.completedAt).toBeNull()
  })

  it('should auto-generate Activity record on task creation', async () => {
    const mockProject = { id: 'proj1', name: 'Test Project' }
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as any)
    vi.mocked(prisma.task.create).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        projectId: 'proj1',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    // Verify activity was created
    expect(vi.mocked(prisma.activity.create)).toHaveBeenCalled()
    const activityCall = vi.mocked(prisma.activity.create).mock.calls[0]
    expect(activityCall[0].data.type).toBe('task_created')
    expect(activityCall[0].data.description).toContain('Test Task')
    expect(activityCall[0].data.projectId).toBe('proj1')
  })

  it('should initialize blockedBy and blocking as empty arrays', async () => {
    const mockProject = { id: 'proj1', name: 'Test Project' }
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as any)
    vi.mocked(prisma.task.create).mockResolvedValueOnce(mockPrismaTask as any)
    vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        projectId: 'proj1',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const createCall = vi.mocked(prisma.task.create).mock.calls[0]
    expect(createCall[0].data.blockedBy).toBe('[]')
    expect(createCall[0].data.blocking).toBe('[]')
  })

  it('should handle creation errors gracefully', async () => {
    const mockProject = { id: 'proj1', name: 'Test Project' }
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(mockProject as any)
    vi.mocked(prisma.task.create).mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        projectId: 'proj1',
        status: 'todo',
        priority: 'medium',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create task')
  })
})
