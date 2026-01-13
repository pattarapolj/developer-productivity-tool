import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  encodeFilters,
  decodeFilters,
  generateShareableURL,
  parseFiltersFromURL,
  copyToClipboard,
  generateReportMetadata,
  type ShareableFilters,
} from './report-sharing'

describe('Report Sharing', () => {
  describe('encodeFilters / decodeFilters', () => {
    it('encodes and decodes filters correctly', () => {
      const filters: ShareableFilters = {
        search: 'test',
        projectId: 'proj-1',
        priority: 'high',
        reportType: 'focus-time',
      }

      const encoded = encodeFilters(filters)
      expect(encoded).toBeDefined()
      expect(typeof encoded).toBe('string')

      const decoded = decodeFilters(encoded)
      expect(decoded).toEqual(filters)
    })

    it('handles filters with date range', () => {
      const filters: ShareableFilters = {
        dateRange: {
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-01-31T23:59:59.999Z',
        },
      }

      const encoded = encodeFilters(filters)
      const decoded = decodeFilters(encoded)
      expect(decoded).toEqual(filters)
    })

    it('handles empty filters object', () => {
      const filters: ShareableFilters = {}

      const encoded = encodeFilters(filters)
      const decoded = decodeFilters(encoded)
      expect(decoded).toEqual(filters)
    })

    it('produces URL-safe encoded string', () => {
      const filters: ShareableFilters = {
        search: 'test with spaces',
        priority: 'high',
      }

      const encoded = encodeFilters(filters)
      // Should not contain +, /, or =
      expect(encoded).not.toMatch(/[+/=]/)
    })

    it('returns null for invalid encoded string', () => {
      const decoded = decodeFilters('invalid-base64-string!!!')
      expect(decoded).toBeNull()
    })

    it('handles complex nested objects', () => {
      const filters: ShareableFilters = {
        reportParams: {
          nestedParam: {
            deepValue: 'test',
            number: 42,
          },
        },
      }

      const encoded = encodeFilters(filters)
      const decoded = decodeFilters(encoded)
      expect(decoded).toEqual(filters)
    })
  })

  describe('generateShareableURL', () => {
    it('generates URL with encoded filters', () => {
      const filters: ShareableFilters = {
        projectId: 'proj-1',
        priority: 'high',
      }

      const url = generateShareableURL('http://localhost:3000', '/analytics', filters)
      expect(url).toContain('http://localhost:3000/analytics')
      expect(url).toContain('filters=')
    })

    it('generates valid URL that can be parsed', () => {
      const filters: ShareableFilters = {
        search: 'test task',
        projectId: 'proj-1',
        reportType: 'velocity-tracker',
      }

      const url = generateShareableURL('http://localhost:3000', '/analytics', filters)
      const parsedFilters = parseFiltersFromURL(url)
      expect(parsedFilters).toEqual(filters)
    })

    it('handles base URL with trailing slash', () => {
      const filters: ShareableFilters = { projectId: 'proj-1' }
      const url = generateShareableURL('http://localhost:3000/', '/analytics', filters)
      expect(url).toContain('http://localhost:3000/analytics')
    })

    it('handles path without leading slash', () => {
      const filters: ShareableFilters = { projectId: 'proj-1' }
      const url = generateShareableURL('http://localhost:3000', 'analytics', filters)
      expect(url).toContain('/analytics')
    })
  })

  describe('parseFiltersFromURL', () => {
    it('parses filters from URL', () => {
      const filters: ShareableFilters = {
        projectId: 'proj-1',
        priority: 'medium',
      }

      const url = generateShareableURL('http://localhost:3000', '/analytics', filters)
      const parsed = parseFiltersFromURL(url)
      expect(parsed).toEqual(filters)
    })

    it('returns null for URL without filters', () => {
      const parsed = parseFiltersFromURL('http://localhost:3000/analytics')
      expect(parsed).toBeNull()
    })

    it('returns null for invalid URL', () => {
      const parsed = parseFiltersFromURL('not-a-valid-url')
      expect(parsed).toBeNull()
    })

    it('returns null for URL with invalid filters param', () => {
      const parsed = parseFiltersFromURL('http://localhost:3000/analytics?filters=invalid')
      expect(parsed).toBeNull()
    })
  })

  describe('copyToClipboard', () => {
    let clipboardWriteTextSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
      clipboardWriteTextSpy = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: clipboardWriteTextSpy,
        },
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('copies text to clipboard successfully', async () => {
      const text = 'http://localhost:3000/analytics?filters=abc123'
      const result = await copyToClipboard(text)
      
      expect(result).toBe(true)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith(text)
    })

    it('returns false on clipboard error', async () => {
      clipboardWriteTextSpy.mockRejectedValue(new Error('Clipboard access denied'))
      
      const result = await copyToClipboard('test')
      expect(result).toBe(false)
    })
  })

  describe('generateReportMetadata', () => {
    it('generates metadata with all fields', () => {
      const filters: ShareableFilters = {
        projectId: 'proj-1',
        priority: 'high',
      }

      const metadata = generateReportMetadata('focus-time', filters)
      
      expect(metadata.reportType).toBe('focus-time')
      expect(metadata.generatedAt).toBeDefined()
      expect(metadata.filters).toEqual(filters)
      expect(metadata.version).toBe('1.0')
    })

    it('generates ISO timestamp', () => {
      const metadata = generateReportMetadata('daily-standup', {})
      
      expect(metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('includes empty filters object', () => {
      const metadata = generateReportMetadata('weekly-summary', {})
      
      expect(metadata.filters).toEqual({})
    })
  })
})
