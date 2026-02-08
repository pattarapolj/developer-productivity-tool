import { describe, it, expect } from 'vitest'
import { transformPrismaBoardToClient, transformClientBoardToPrisma } from './api-types'
import type { Board } from './types'

describe('api-types - Board Transformations', () => {
  describe('transformPrismaBoardToClient', () => {
    it('should convert Prisma board with all fields to client board', () => {
      const prismaBoard = {
        id: 'board-1',
        name: 'Design Whiteboard',
        projectId: 'proj-1',
        thumbnailPath: '/thumbnails/board-1.png',
        content: '{"version":1}',
        createdAt: '2026-01-15T10:30:00.000Z',
        updatedAt: '2026-01-16T14:20:00.000Z',
        isArchived: false,
      }

      const result = transformPrismaBoardToClient(prismaBoard)

      expect(result.id).toBe('board-1')
      expect(result.name).toBe('Design Whiteboard')
      expect(result.projectId).toBe('proj-1')
      expect(result.thumbnailPath).toBe('/thumbnails/board-1.png')
      expect(result.content).toBe('{"version":1}')
      expect(result.isArchived).toBe(false)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.createdAt.toISOString()).toBe('2026-01-15T10:30:00.000Z')
      expect(result.updatedAt.toISOString()).toBe('2026-01-16T14:20:00.000Z')
    })

    it('should handle null projectId correctly', () => {
      const prismaBoard = {
        id: 'board-2',
        name: 'Standalone Board',
        projectId: null,
        thumbnailPath: null,
        content: '{}',
        createdAt: '2026-01-15T10:30:00.000Z',
        updatedAt: '2026-01-15T10:30:00.000Z',
        isArchived: false,
      }

      const result = transformPrismaBoardToClient(prismaBoard)

      expect(result.projectId).toBeNull()
      expect(result.id).toBe('board-2')
      expect(result.name).toBe('Standalone Board')
    })

    it('should handle null thumbnailPath correctly', () => {
      const prismaBoard = {
        id: 'board-3',
        name: 'Board Without Thumbnail',
        projectId: 'proj-1',
        thumbnailPath: null,
        content: '{}',
        createdAt: '2026-01-15T10:30:00.000Z',
        updatedAt: '2026-01-15T10:30:00.000Z',
        isArchived: false,
      }

      const result = transformPrismaBoardToClient(prismaBoard)

      expect(result.thumbnailPath).toBeNull()
      expect(result.id).toBe('board-3')
      expect(result.projectId).toBe('proj-1')
    })

    it('should convert ISO date strings to Date objects', () => {
      const prismaBoard = {
        id: 'board-4',
        name: 'Board with dates',
        projectId: 'proj-1',
        thumbnailPath: null,
        content: '{}',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-20T16:45:30.000Z',
        isArchived: true,
      }

      const result = transformPrismaBoardToClient(prismaBoard)

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.createdAt.getFullYear()).toBe(2026)
      expect(result.updatedAt.getFullYear()).toBe(2026)
      expect(result.isArchived).toBe(true)
    })

    it('should preserve JSON content field as string', () => {
      const jsonContent = '{"version":2,"elements":[{"id":"elem1","type":"rectangle"}]}'
      const prismaBoard = {
        id: 'board-5',
        name: 'Board with complex content',
        projectId: 'proj-1',
        thumbnailPath: '/path/to/thumb.png',
        content: jsonContent,
        createdAt: '2026-01-15T10:30:00.000Z',
        updatedAt: '2026-01-15T10:30:00.000Z',
        isArchived: false,
      }

      const result = transformPrismaBoardToClient(prismaBoard)

      expect(result.content).toBe(jsonContent)
      expect(typeof result.content).toBe('string')
    })
  })

  describe('transformClientBoardToPrisma', () => {
    it('should convert client board to Prisma format', () => {
      const clientBoard: Board = {
        id: 'board-1',
        name: 'Design Whiteboard',
        projectId: 'proj-1',
        thumbnailPath: '/thumbnails/board-1.png',
        content: '{"version":1}',
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
        updatedAt: new Date('2026-01-16T14:20:00.000Z'),
        isArchived: false,
      }

      const result = transformClientBoardToPrisma(clientBoard)

      expect(result.id).toBe('board-1')
      expect(result.name).toBe('Design Whiteboard')
      expect(result.projectId).toBe('proj-1')
      expect(result.thumbnailPath).toBe('/thumbnails/board-1.png')
      expect(result.content).toBe('{"version":1}')
      expect(result.isArchived).toBe(false)
      expect(result.createdAt).toBe('2026-01-15T10:30:00.000Z')
      expect(result.updatedAt).toBe('2026-01-16T14:20:00.000Z')
    })

    it('should handle null projectId in client board', () => {
      const clientBoard: Board = {
        id: 'board-2',
        name: 'Standalone Board',
        projectId: null,
        thumbnailPath: null,
        content: '{}',
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
        updatedAt: new Date('2026-01-15T10:30:00.000Z'),
        isArchived: false,
      }

      const result = transformClientBoardToPrisma(clientBoard)

      expect(result.projectId).toBeNull()
      expect(result.id).toBe('board-2')
    })

    it('should handle null thumbnailPath in client board', () => {
      const clientBoard: Board = {
        id: 'board-3',
        name: 'Board Without Thumbnail',
        projectId: 'proj-1',
        thumbnailPath: null,
        content: '{}',
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
        updatedAt: new Date('2026-01-15T10:30:00.000Z'),
        isArchived: false,
      }

      const result = transformClientBoardToPrisma(clientBoard)

      expect(result.thumbnailPath).toBeNull()
      expect(result.projectId).toBe('proj-1')
    })

    it('should convert Date objects to ISO strings', () => {
      const clientBoard: Board = {
        id: 'board-4',
        name: 'Board with dates',
        projectId: 'proj-1',
        thumbnailPath: null,
        content: '{}',
        createdAt: new Date('2026-01-10T08:00:00.000Z'),
        updatedAt: new Date('2026-01-20T16:45:30.000Z'),
        isArchived: true,
      }

      const result = transformClientBoardToPrisma(clientBoard)

      expect(typeof result.createdAt).toBe('string')
      expect(typeof result.updatedAt).toBe('string')
      expect(result.createdAt).toBe('2026-01-10T08:00:00.000Z')
      expect(result.updatedAt).toBe('2026-01-20T16:45:30.000Z')
      expect(result.isArchived).toBe(true)
    })

    it('should preserve JSON content field as string in Prisma format', () => {
      const jsonContent = '{"version":2,"elements":[{"id":"elem1","type":"rectangle"}]}'
      const clientBoard: Board = {
        id: 'board-5',
        name: 'Board with complex content',
        projectId: 'proj-1',
        thumbnailPath: '/path/to/thumb.png',
        content: jsonContent,
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
        updatedAt: new Date('2026-01-15T10:30:00.000Z'),
        isArchived: false,
      }

      const result = transformClientBoardToPrisma(clientBoard)

      expect(result.content).toBe(jsonContent)
      expect(typeof result.content).toBe('string')
    })
  })

  describe('Board transformation round-trip', () => {
    it('should preserve board data through Prisma -> Client -> Prisma cycle', () => {
      const originalPrismaBoard = {
        id: 'board-1',
        name: 'Design Whiteboard',
        projectId: 'proj-1',
        thumbnailPath: '/thumbnails/board-1.png',
        content: '{"version":1,"elements":[]}',
        createdAt: '2026-01-15T10:30:00.000Z',
        updatedAt: '2026-01-16T14:20:00.000Z',
        isArchived: false,
      }

      const clientBoard = transformPrismaBoardToClient(originalPrismaBoard)
      const backToPrisma = transformClientBoardToPrisma(clientBoard)

      expect(backToPrisma.id).toBe(originalPrismaBoard.id)
      expect(backToPrisma.name).toBe(originalPrismaBoard.name)
      expect(backToPrisma.projectId).toBe(originalPrismaBoard.projectId)
      expect(backToPrisma.thumbnailPath).toBe(originalPrismaBoard.thumbnailPath)
      expect(backToPrisma.content).toBe(originalPrismaBoard.content)
      expect(backToPrisma.createdAt).toBe(originalPrismaBoard.createdAt)
      expect(backToPrisma.updatedAt).toBe(originalPrismaBoard.updatedAt)
      expect(backToPrisma.isArchived).toBe(originalPrismaBoard.isArchived)
    })

    it('should preserve board data through Client -> Prisma -> Client cycle', () => {
      const originalClientBoard: Board = {
        id: 'board-2',
        name: 'Standalone Board',
        projectId: null,
        thumbnailPath: null,
        content: '{"version":2}',
        createdAt: new Date('2026-01-15T10:30:00.000Z'),
        updatedAt: new Date('2026-01-15T10:30:00.000Z'),
        isArchived: true,
      }

      const prismaBoard = transformClientBoardToPrisma(originalClientBoard)
      const backToClient = transformPrismaBoardToClient(prismaBoard)

      expect(backToClient.id).toBe(originalClientBoard.id)
      expect(backToClient.name).toBe(originalClientBoard.name)
      expect(backToClient.projectId).toBe(originalClientBoard.projectId)
      expect(backToClient.thumbnailPath).toBe(originalClientBoard.thumbnailPath)
      expect(backToClient.content).toBe(originalClientBoard.content)
      expect(backToClient.createdAt.toISOString()).toBe(originalClientBoard.createdAt.toISOString())
      expect(backToClient.updatedAt.toISOString()).toBe(originalClientBoard.updatedAt.toISOString())
      expect(backToClient.isArchived).toBe(originalClientBoard.isArchived)
    })
  })
})
