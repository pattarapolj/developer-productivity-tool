import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
    prisma: {
        project: {
            findUnique: vi.fn(),
            update: vi.fn(),
        }
    }
}))

describe('POST /api/projects/[id]/subcategories', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('adds subcategory to project array', async () => {
        const mockRequest = {
            json: async () => ({
                name: 'NewCategory',
            })
        } as NextRequest

        const existingProject = {
            id: 'proj1',
            name: 'Test Project',
            color: 'blue',
            subcategories: '["UI", "Components"]',
            jiraKey: null,
            createdAt: new Date('2026-01-01T10:00:00.000Z'),
        }

        const updatedProject = {
            ...existingProject,
            subcategories: '["UI", "Components", "NewCategory"]',
        }

        vi.mocked(prisma.project.findUnique).mockResolvedValue(existingProject)
        vi.mocked(prisma.project.update).mockResolvedValue(updatedProject)

        const response = await POST(mockRequest, { params: { id: 'proj1' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.subcategories).toEqual(['UI', 'Components', 'NewCategory'])
        expect(prisma.project.update).toHaveBeenCalledWith({
            where: { id: 'proj1' },
            data: {
                subcategories: '["UI", "Components", "NewCategory"]',
            }
        })
    })

    it('prevents duplicate subcategories', async () => {
        const mockRequest = {
            json: async () => ({
                name: 'UI',
            })
        } as NextRequest

        const existingProject = {
            id: 'proj1',
            name: 'Test Project',
            color: 'blue',
            subcategories: '["UI", "Components"]',
            jiraKey: null,
            createdAt: new Date('2026-01-01T10:00:00Z'),
        }

        vi.mocked(prisma.project.findUnique).mockResolvedValue(existingProject)

        const response = await POST(mockRequest, { params: { id: 'proj1' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        // Should return unchanged since duplicate
        expect(data.subcategories).toEqual(['UI', 'Components'])
        expect(prisma.project.update).not.toHaveBeenCalled()
    })

    it('returns 404 if project not found', async () => {
        const mockRequest = {
            json: async () => ({
                name: 'NewCategory',
            })
        } as NextRequest

        vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

        const response = await POST(mockRequest, { params: { id: 'nonexistent' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Project not found')
    })

    it('rejects missing name with 400', async () => {
        const mockRequest = {
            json: async () => ({})
        } as NextRequest

        const response = await POST(mockRequest, { params: { id: 'proj1' } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Subcategory name is required')
    })

    it('handles project with empty subcategories array', async () => {
        const mockRequest = {
            json: async () => ({
                name: 'FirstCategory',
            })
        } as NextRequest

        const existingProject = {
            id: 'proj1',
            name: 'Test Project',
            color: 'blue',
            subcategories: '[]',
            jiraKey: null,
            createdAt: new Date('2026-01-01T10:00:00Z'),
        }

        const updatedProject = {
            ...existingProject,
            subcategories: '["FirstCategory"]',
        }

        vi.mocked(prisma.project.findUnique).mockResolvedValue(existingProject)
        vi.mocked(prisma.project.update).mockResolvedValue(updatedProject)

        const response = await POST(mockRequest, { params: { id: 'proj1' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.subcategories).toEqual(['FirstCategory'])
    })

    it('returns 500 on database error during fetch', async () => {
        const mockRequest = {
            json: async () => ({
                name: 'NewCategory',
            })
        } as NextRequest

        vi.mocked(prisma.project.findUnique).mockRejectedValue(new Error('DB error'))

        const response = await POST(mockRequest, { params: { id: 'proj1' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to add subcategory')
    })

    it('returns 500 on database error during update', async () => {
        const mockRequest = {
            json: async () => ({
                name: 'NewCategory',
            })
        } as NextRequest

        const existingProject = {
            id: 'proj1',
            name: 'Test Project',
            color: 'blue',
            subcategories: '[]',
            jiraKey: null,
            createdAt: new Date('2026-01-01T10:00:00Z'),
        }

        vi.mocked(prisma.project.findUnique).mockResolvedValue(existingProject)
        vi.mocked(prisma.project.update).mockRejectedValue(new Error('DB error'))

        const response = await POST(mockRequest, { params: { id: 'proj1' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to add subcategory')
    })
})
