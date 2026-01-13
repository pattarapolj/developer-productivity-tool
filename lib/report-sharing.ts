import type { Priority, TaskStatus } from './types'

export interface ShareableFilters {
  search?: string
  projectId?: string
  priority?: Priority | ''
  status?: TaskStatus | ''
  dateRange?: {
    from: string | null
    to: string | null
  }
  reportType?: string
  reportParams?: Record<string, unknown>
}

/**
 * Encode filters to base64 URL-safe string
 */
export function encodeFilters(filters: ShareableFilters): string {
  const json = JSON.stringify(filters)
  const base64 = btoa(json)
  // Make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decode base64 URL-safe string to filters
 */
export function decodeFilters(encoded: string): ShareableFilters | null {
  try {
    // Restore standard base64
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if needed
    const padded = base64 + '=='.substring(0, (4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as ShareableFilters
  } catch (error) {
    console.error('Failed to decode filters:', error)
    return null
  }
}

/**
 * Generate shareable URL with encoded filters
 */
export function generateShareableURL(
  baseURL: string,
  path: string,
  filters: ShareableFilters
): string {
  const encoded = encodeFilters(filters)
  const url = new URL(path, baseURL)
  url.searchParams.set('filters', encoded)
  return url.toString()
}

/**
 * Parse filters from URL
 */
export function parseFiltersFromURL(url: string): ShareableFilters | null {
  try {
    const urlObj = new URL(url)
    const encoded = urlObj.searchParams.get('filters')
    if (!encoded) return null
    return decodeFilters(encoded)
  } catch (error) {
    console.error('Failed to parse URL:', error)
    return null
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate report metadata for sharing
 */
export function generateReportMetadata(reportType: string, filters: ShareableFilters) {
  return {
    reportType,
    generatedAt: new Date().toISOString(),
    filters,
    version: '1.0',
  }
}
