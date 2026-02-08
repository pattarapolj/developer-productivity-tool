/**
 * API utilities for database integration
 * Handles:
 * - Date transformations between Prisma ISO strings and client Date objects
 * - JSON field parsing (subcategories, task dependencies, metadata)
 * - HTTP error handling and mapping
 * - Centralized fetch wrapper with proper error handling
 */

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    // eslint-disable-next-line no-unused-vars
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Transform ISO date string or Date object from database to Date object for client
 * @param value - ISO date string or Date object from Prisma
 * @returns Date object or null if input is null/undefined
 */
export const transformDateFromDB = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

/**
 * Transform Date object from client to ISO string for database
 * @param date - Date object from client
 * @returns ISO date string or null if input is null/undefined
 */
export const transformDateToDB = (date: Date | null | undefined): string | null => {
  if (!date) return null
  return date.toISOString()
}

/**
 * Parse JSON string field from database to typed value
 * Used for: subcategories, blockedBy, blocking, metadata
 * @param jsonString - JSON string stored in database
 * @returns Parsed value or empty array if parsing fails
 */
export const parseJSONField = <T>(jsonString: string): T => {
  if (!jsonString) return [] as T
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return [] as T
  }
}

/**
 * Stringify value to JSON for database storage
 * Used for: subcategories, blockedBy, blocking, metadata
 * @param value - Value to stringify
 * @returns Compact JSON string (no spaces)
 */
export const stringifyJSONField = <T>(value: T): string => {
  return JSON.stringify(value)
}

/**
 * Map HTTP status codes to user-friendly error messages
 * @param error - APIError or standard Error
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: Error | APIError): string => {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        return 'Invalid data. Please check your input and try again.'
      case 404:
        return 'Resource not found. It may have been deleted.'
      case 409:
        return 'Conflict. This resource already exists or is in use.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return `Error: ${error.message || 'Unknown error occurred'}`
    }
  }
  return error.message || 'An unknown error occurred'
}

/**
 * Centralized API client with error handling
 * All methods throw APIError on non-200 responses
 */
export const apiClient = {
  /**
   * GET request
   * @param url - API endpoint URL
   * @returns Parsed JSON response
   * @throws APIError if response is not ok
   */
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text()
      throw new APIError(response.status, text)
    }
    return response.json() as Promise<T>
  },

  /**
   * POST request
   * @param url - API endpoint URL
   * @param body - Request body to POST
   * @returns Parsed JSON response
   * @throws APIError if response is not ok
   */
  async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new APIError(response.status, text)
    }
    return response.json() as Promise<T>
  },

  /**
   * PATCH request
   * @param url - API endpoint URL
   * @param body - Request body with updates
   * @returns Parsed JSON response
   * @throws APIError if response is not ok
   */
  async patch<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new APIError(response.status, text)
    }
    return response.json() as Promise<T>
  },

  /**
   * DELETE request
   * @param url - API endpoint URL
   * @returns Parsed JSON response
   * @throws APIError if response is not ok
   */
  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const text = await response.text()
      throw new APIError(response.status, text)
    }
    return response.json() as Promise<T>
  },
}
