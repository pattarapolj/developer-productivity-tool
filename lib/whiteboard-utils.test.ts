import { describe, it, expect } from 'vitest'
import {
  serializeExcalidrawState,
  deserializeExcalidrawState,
  generateThumbnail,
  initializeEmptyBoard,
} from './whiteboard-utils'

describe('whiteboard-utils', () => {
  describe('serializeExcalidrawState', () => {
    it('should convert elements and appState to JSON string', () => {
      const mockElements = [
        { id: 'elem1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
      ]
      const mockAppState = { zoom: { value: 1 }, scrollX: 0, scrollY: 0 }

      const result = serializeExcalidrawState(mockElements, mockAppState)

      expect(typeof result).toBe('string')
      expect(result).toBeTruthy()
      
      const parsed = JSON.parse(result)
      expect(parsed).toHaveProperty('elements')
      expect(parsed).toHaveProperty('appState')
    })

    it('should preserve element data', () => {
      const mockElements = [
        { id: 'elem1', type: 'rectangle', x: 10, y: 20, width: 100, height: 100 },
        { id: 'elem2', type: 'circle', x: 50, y: 50, width: 50, height: 50 },
      ]
      const mockAppState = { zoom: { value: 2 } }

      const result = serializeExcalidrawState(mockElements, mockAppState)
      const parsed = JSON.parse(result)

      expect(parsed.elements).toHaveLength(2)
      expect(parsed.elements[0].id).toBe('elem1')
      expect(parsed.elements[1].type).toBe('circle')
    })
  })

  describe('deserializeExcalidrawState', () => {
    it('should parse JSON string to elements and appState', () => {
      const mockJson = JSON.stringify({
        elements: [{ id: 'elem1', type: 'rectangle' }],
        appState: { zoom: { value: 1 } },
      })

      const result = deserializeExcalidrawState(mockJson)

      expect(result).toHaveProperty('elements')
      expect(result).toHaveProperty('appState')
      expect(Array.isArray(result.elements)).toBe(true)
    })

    it('should handle empty JSON', () => {
      const mockJson = JSON.stringify({})

      const result = deserializeExcalidrawState(mockJson)

      expect(result).toBeDefined()
    })

    it('should handle invalid JSON', () => {
      const invalidJson = '{invalid json'

      expect(() => deserializeExcalidrawState(invalidJson)).toThrow()
    })

    it('should preserve element and appState data', () => {
      const original = {
        elements: [
          { id: 'elem1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        ],
        appState: { zoom: { value: 1.5 }, scrollX: 10, scrollY: 20 },
      }
      const mockJson = JSON.stringify(original)

      const result = deserializeExcalidrawState(mockJson)

      expect(result.elements[0].id).toBe('elem1')
      expect(result.appState.zoom.value).toBe(1.5)
      expect(result.appState.scrollX).toBe(10)
    })
  })

  describe('generateThumbnail', () => {
    it('should return a placeholder string or null', async () => {
      const mockElements = [
        { id: 'elem1', type: 'rectangle' },
      ]
      const mockAppState = { zoom: { value: 1 } }

      const result = await generateThumbnail(mockElements, mockAppState)

      expect(result === null || typeof result === 'string').toBe(true)
    })

    it('should handle empty elements array', async () => {
      const mockElements: any[] = []
      const mockAppState = {}

      const result = await generateThumbnail(mockElements, mockAppState)

      expect(result === null || typeof result === 'string').toBe(true)
    })
  })

  describe('initializeEmptyBoard', () => {
    it('should return empty Excalidraw JSON state', () => {
      const result = initializeEmptyBoard()

      expect(typeof result).toBe('string')
      expect(result).toBeTruthy()
      
      const parsed = JSON.parse(result)
      expect(typeof parsed).toBe('object')
    })

    it('should return valid JSON string', () => {
      const result = initializeEmptyBoard()

      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('should be parseable by deserializeExcalidrawState', () => {
      const result = initializeEmptyBoard()

      expect(() => deserializeExcalidrawState(result)).not.toThrow()
    })
  })
})
