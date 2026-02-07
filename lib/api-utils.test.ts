import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  transformDateFromDB,
  transformDateToDB,
  parseJSONField,
  stringifyJSONField,
  apiClient,
  APIError,
  getErrorMessage,
} from './api-utils'

describe('api-utils - Date Transformations', () => {
  describe('transformDateFromDB', () => {
    it('should convert ISO string to Date object', () => {
      const isoString = '2026-01-15T10:30:00.000Z'
      const result = transformDateFromDB(isoString)
      
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString()).toBe(isoString)
    })

    it('should return null for null input', () => {
      const result = transformDateFromDB(null)
      expect(result).toBeNull()
    })

    it('should return null for undefined input', () => {
      const result = transformDateFromDB(undefined)
      expect(result).toBeNull()
    })

    it('should handle various ISO date formats', () => {
      const dates = [
        '2026-01-01T00:00:00.000Z',
        '2025-12-31T23:59:59.999Z',
        '2026-06-15T12:00:00.000Z',
      ]

      dates.forEach((isoString) => {
        const result = transformDateFromDB(isoString)
        expect(result).toBeInstanceOf(Date)
        expect(result?.toISOString()).toBe(isoString)
      })
    })
  })

  describe('transformDateToDB', () => {
    it('should convert Date object to ISO string', () => {
      const date = new Date('2026-01-15T10:30:00.000Z')
      const result = transformDateToDB(date)
      
      expect(typeof result).toBe('string')
      expect(result).toBe('2026-01-15T10:30:00.000Z')
    })

    it('should return null for null input', () => {
      const result = transformDateToDB(null)
      expect(result).toBeNull()
    })

    it('should return null for undefined input', () => {
      const result = transformDateToDB(undefined)
      expect(result).toBeNull()
    })

    it('should handle various Date objects', () => {
      const dates = [
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2025-12-31T23:59:59.999Z'),
        new Date('2026-06-15T12:00:00.000Z'),
      ]

      dates.forEach((date) => {
        const result = transformDateToDB(date)
        expect(result).toBe(date.toISOString())
      })
    })
  })

  describe('Date transformation round-trip', () => {
    it('should preserve date through DB -> Client -> DB cycle', () => {
      const originalISO = '2026-01-15T10:30:00.000Z'
      const asDate = transformDateFromDB(originalISO)
      const backToISO = transformDateToDB(asDate)
      
      expect(backToISO).toBe(originalISO)
    })

    it('should preserve date through Client -> DB -> Client cycle', () => {
      const originalDate = new Date('2026-01-15T10:30:00.000Z')
      const asISO = transformDateToDB(originalDate)
      const backToDate = transformDateFromDB(asISO)
      
      expect(backToDate?.toISOString()).toBe(originalDate.toISOString())
    })
  })
})

describe('api-utils - JSON Field Transformations', () => {
  describe('parseJSONField', () => {
    it('should parse valid JSON string to array', () => {
      const jsonString = '["Component", "UI", "Styles"]'
      const result = parseJSONField<string[]>(jsonString)
      
      expect(result).toEqual(['Component', 'UI', 'Styles'])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should parse JSON array with task IDs', () => {
      const jsonString = '["task-1", "task-2", "task-3"]'
      const result = parseJSONField<string[]>(jsonString)
      
      expect(result).toEqual(['task-1', 'task-2', 'task-3'])
    })

    it('should parse empty array string', () => {
      const jsonString = '[]'
      const result = parseJSONField<string[]>(jsonString)
      
      expect(result).toEqual([])
    })

    it('should return empty array for invalid JSON', () => {
      const invalidJson = 'not valid json'
      const result = parseJSONField<string[]>(invalidJson)
      
      expect(result).toEqual([])
    })

    it('should return empty array for malformed JSON', () => {
      const malformedJson = '[incomplete,'
      const result = parseJSONField<string[]>(malformedJson)
      
      expect(result).toEqual([])
    })

    it('should parse object fields as well', () => {
      const jsonString = '{"key": "value", "nested": {"prop": true}}'
      const result = parseJSONField<Record<string, unknown>>(jsonString)
      
      expect(result).toEqual({ key: 'value', nested: { prop: true } })
    })

    it('should handle empty string', () => {
      const result = parseJSONField<string[]>('')
      expect(result).toEqual([])
    })
  })

  describe('stringifyJSONField', () => {
    it('should convert array to JSON string', () => {
      const array = ['Component', 'UI', 'Styles']
      const result = stringifyJSONField(array)
      
      expect(typeof result).toBe('string')
      expect(result).toBe('["Component","UI","Styles"]')
    })

    it('should convert task ID array to JSON string', () => {
      const taskIds = ['task-1', 'task-2', 'task-3']
      const result = stringifyJSONField(taskIds)
      
      expect(result).toBe('["task-1","task-2","task-3"]')
    })

    it('should convert empty array to empty JSON array', () => {
      const result = stringifyJSONField([])
      
      expect(result).toBe('[]')
    })

    it('should convert object to JSON string', () => {
      const obj = { key: 'value', nested: { prop: true } }
      const result = stringifyJSONField(obj)
      
      expect(typeof result).toBe('string')
      const parsed = JSON.parse(result)
      expect(parsed).toEqual(obj)
    })

    it('should handle metadata objects', () => {
      const metadata = { oldStatus: 'todo', newStatus: 'done' }
      const result = stringifyJSONField(metadata)
      
      expect(JSON.parse(result)).toEqual(metadata)
    })
  })

  describe('JSON field round-trip', () => {
    it('should preserve array through stringify -> parse cycle', () => {
      const originalArray = ['task-1', 'task-2', 'task-3']
      const stringified = stringifyJSONField(originalArray)
      const parsed = parseJSONField<string[]>(stringified)
      
      expect(parsed).toEqual(originalArray)
    })

    it('should preserve object through stringify -> parse cycle', () => {
      const originalObject = { field: 'value', count: 42 }
      const stringified = stringifyJSONField(originalObject)
      const parsed = parseJSONField<typeof originalObject>(stringified)
      
      expect(parsed).toEqual(originalObject)
    })
  })
})

describe('api-utils - Error Handling', () => {
  describe('APIError class', () => {
    it('should create error with status and message', () => {
      const error = new APIError(400, 'Invalid request')
      
      expect(error).toBeInstanceOf(Error)
      expect(error.status).toBe(400)
      expect(error.message).toBe('Invalid request')
    })

    it('should have correct status property', () => {
      const error = new APIError(404, 'Not found')
      expect(error.status).toBe(404)
    })
  })

  describe('getErrorMessage', () => {
    it('should map 400 to user-friendly message', () => {
      const error = new APIError(400, 'Invalid input')
      const message = getErrorMessage(error)
      
      expect(message).toContain('invalid')
      expect(message.toLowerCase()).toMatch(/data|input|invalid/)
    })

    it('should map 404 to not found message', () => {
      const error = new APIError(404, 'Resource not found')
      const message = getErrorMessage(error)
      
      expect(message.toLowerCase()).toContain('not found')
    })

    it('should map 500 to server error message', () => {
      const error = new APIError(500, 'Internal server error')
      const message = getErrorMessage(error)
      
      expect(message.toLowerCase()).toContain('server')
    })

    it('should map 409 to conflict message', () => {
      const error = new APIError(409, 'Conflict')
      const message = getErrorMessage(error)
      
      expect(message.toLowerCase()).toMatch(/conflict|already/)
    })

    it('should handle unknown status codes', () => {
      const error = new APIError(503, 'Service unavailable')
      const message = getErrorMessage(error)
      
      expect(typeof message).toBe('string')
      expect(message.length > 0).toBe(true)
    })

    it('should provide default message for non-APIError', () => {
      const error = new Error('Unknown error')
      const message = getErrorMessage(error)
      
      expect(typeof message).toBe('string')
      expect(message.length > 0).toBe(true)
    })
  })
})

describe('api-utils - API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('apiClient.get', () => {
    it('should fetch and return JSON on success', async () => {
      const mockData = { id: 'test-1', name: 'Test Project' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await apiClient.get('/api/projects/test-1')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-1')
    })

    it('should throw APIError on 404', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      })

      await expect(apiClient.get('/api/projects/nonexistent')).rejects.toThrow(APIError)
    })

    it('should throw APIError on 400', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid input',
      })

      await expect(apiClient.get('/api/projects')).rejects.toThrow(APIError)
    })

    it('should throw APIError on 500', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      })

      await expect(apiClient.get('/api/projects')).rejects.toThrow(APIError)
    })
  })

  describe('apiClient.post', () => {
    it('should post data and return response on success', async () => {
      const postData = { name: 'New Project', color: 'blue' }
      const mockResponse = { id: 'proj-1', ...postData }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiClient.post('/api/projects', postData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })
    })

    it('should throw APIError on failure', async () => {
      const postData = { name: '' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Name required',
      })

      await expect(apiClient.post('/api/projects', postData)).rejects.toThrow(APIError)
    })
  })

  describe('apiClient.patch', () => {
    it('should patch data and return response on success', async () => {
      const patchData = { name: 'Updated Project' }
      const mockResponse = { id: 'proj-1', ...patchData }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiClient.patch('/api/projects/proj-1', patchData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/projects/proj-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      })
    })

    it('should throw APIError on failure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Project not found',
      })

      await expect(apiClient.patch('/api/projects/nonexistent', { name: 'Test' })).rejects.toThrow(
        APIError
      )
    })
  })

  describe('apiClient.delete', () => {
    it('should delete resource and return response on success', async () => {
      const mockResponse = { success: true }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiClient.delete('/api/projects/proj-1')

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/projects/proj-1', {
        method: 'DELETE',
      })
    })

    it('should throw APIError on 404', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      })

      await expect(apiClient.delete('/api/projects/nonexistent')).rejects.toThrow(APIError)
    })

    it('should throw APIError on 500', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      })

      await expect(apiClient.delete('/api/projects/proj-1')).rejects.toThrow(APIError)
    })
  })

  describe('apiClient error handling', () => {
    it('should capture status code in APIError', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      })

      try {
        await apiClient.get('/api/projects')
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect((error as APIError).status).toBe(400)
      }
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/api/projects')).rejects.toThrow()
    })
  })
})

describe('api-utils - Integration Tests', () => {
  it('should handle full transformation pipeline', () => {
    // Simulate Prisma returning data with ISO dates and JSON fields
    const prismaData = {
      id: 'proj-1',
      name: 'Frontend',
      subcategories: '["UI","Components","Performance"]',
      createdAt: '2026-01-15T10:00:00.000Z',
    }

    // Transform for client
    const subcategories = parseJSONField<string[]>(prismaData.subcategories)
    const createdAt = transformDateFromDB(prismaData.createdAt)

    // Verify client-side state
    expect(subcategories).toEqual(['UI', 'Components', 'Performance'])
    expect(createdAt).toBeInstanceOf(Date)

    // Transform back for DB
    const subcategoriesJSON = stringifyJSONField(subcategories)
    const createdAtISO = transformDateToDB(createdAt)

    expect(subcategoriesJSON).toBe('["UI","Components","Performance"]')
    expect(createdAtISO).toBe('2026-01-15T10:00:00.000Z')
  })

  it('should handle task dependencies transformation', () => {
    // Simulate Prisma task data
    const prismaTask = {
      blockedBy: '["task-1","task-2"]',
      blocking: '["task-5","task-6"]',
    }

    const blockedBy = parseJSONField<string[]>(prismaTask.blockedBy)
    const blocking = parseJSONField<string[]>(prismaTask.blocking)

    expect(blockedBy).toEqual(['task-1', 'task-2'])
    expect(blocking).toEqual(['task-5', 'task-6'])

    // Add new blocker
    const updatedBlockedBy = [...blockedBy, 'task-3']
    const blockedByJSON = stringifyJSONField(updatedBlockedBy)

    expect(blockedByJSON).toBe('["task-1","task-2","task-3"]')
  })
})
