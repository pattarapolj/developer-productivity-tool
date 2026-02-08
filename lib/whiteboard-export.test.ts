import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportToPNG, exportToSVG, exportToPDF, downloadBlob } from './whiteboard-export'

// Mock Excalidraw's exportToBlob
vi.mock('@excalidraw/excalidraw', () => ({
  exportToBlob: vi.fn((config) => {
    return Promise.resolve(
      new Blob(['mock image data'], { type: config.mimeType || 'image/png' })
    )
  }),
}))

describe('Whiteboard Export', () => {
  const mockElements = [
    {
      id: 'elem1',
      type: 'text',
      x: 0,
      y: 0,
      text: 'Test',
    } as any,
  ]

  const mockAppState = {
    zoom: { value: 1 },
    scrollX: 0,
    scrollY: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportToPNG', () => {
    it('should return a Blob with image/png type', async () => {
      const blob = await exportToPNG(mockElements, mockAppState, 'test.png')
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
    })

    it('should work with empty elements array', async () => {
      const blob = await exportToPNG([], mockAppState, 'empty.png')
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
    })

    it('should work with multiple elements', async () => {
      const elements = [
        { id: 'e1', type: 'rectangle' } as any,
        { id: 'e2', type: 'text' } as any,
        { id: 'e3', type: 'arrow' } as any,
      ]
      const blob = await exportToPNG(elements, mockAppState, 'multi.png')
      expect(blob).toBeInstanceOf(Blob)
    })
  })

  describe('exportToSVG', () => {
    it('should return a Blob with image/svg+xml type', async () => {
      const blob = await exportToSVG(mockElements, mockAppState, 'test.svg')
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/svg+xml')
    })

    it('should work with empty elements array', async () => {
      const blob = await exportToSVG([], mockAppState, 'empty.svg')
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/svg+xml')
    })
  })

  describe('exportToPDF', () => {
    it('should return a Blob with application/pdf type', async () => {
      const blob = await exportToPDF(mockElements, mockAppState, 'test.pdf')
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/pdf')
    })

    it('should work with empty elements array', async () => {
      const blob = await exportToPDF([], mockAppState, 'empty.pdf')
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/pdf')
    })

    it('should create a PDF with image embedded', async () => {
      const blob = await exportToPDF(mockElements, mockAppState, 'test.pdf')
      expect(blob.size).toBeGreaterThan(0)
    })
  })

  describe('downloadBlob', () => {
    let createElementSpyOn: any
    let removeChildSpyOn: any
    let clickSpyOn: any

    beforeEach(() => {
      clickSpyOn = vi.fn()
      createElementSpyOn = vi.spyOn(document, 'createElement')
      removeChildSpyOn = vi.spyOn(document.body, 'removeChild').mockImplementation(() => undefined as any)
      
      // Mock createElement to return a proper anchor element
      createElementSpyOn.mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          const anchor = document.createElement('a')
          anchor.click = clickSpyOn
          return anchor
        }
        return document.createElement(tagName)
      })
    })

    afterEach(() => {
      createElementSpyOn.mockRestore()
      removeChildSpyOn.mockRestore()
    })

    it('should create an anchor element', () => {
      const blob = new Blob(['test'], { type: 'image/png' })
      downloadBlob(blob, 'test.png')
      expect(createElementSpyOn).toHaveBeenCalledWith('a')
    })

    it('should set download attribute with filename', () => {
      const blob = new Blob(['test'], { type: 'image/png' })
      const setAttributeSpy = vi.fn()
      createElementSpyOn.mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          const anchor = {
            setAttribute: setAttributeSpy,
            click: vi.fn(),
            href: '',
          } as any
          return anchor
        }
        return document.createElement(tagName)
      })

      downloadBlob(blob, 'test.png')
      expect(setAttributeSpy).toHaveBeenCalledWith('download', 'test.png')
    })

    it('should trigger click event', () => {
      const blob = new Blob(['test'], { type: 'image/png' })
      downloadBlob(blob, 'test.png')
      expect(clickSpyOn).toHaveBeenCalled()
    })

    it('should handle different file types', () => {
      const pngBlob = new Blob(['png data'], { type: 'image/png' })
      const svgBlob = new Blob(['svg data'], { type: 'image/svg+xml' })
      const pdfBlob = new Blob(['pdf data'], { type: 'application/pdf' })

      expect(() => downloadBlob(pngBlob, 'file.png')).not.toThrow()
      expect(() => downloadBlob(svgBlob, 'file.svg')).not.toThrow()
      expect(() => downloadBlob(pdfBlob, 'file.pdf')).not.toThrow()
    })
  })
})
