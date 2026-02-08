import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock file-storage
vi.mock('@/lib/file-storage', () => ({
  saveBoardImage: vi.fn(),
}))

import { saveBoardImage } from '@/lib/file-storage'

describe('POST /api/boards/[id]/upload', () => {
  const mockBoardId = 'board-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept image file and return URL', async () => {
    const mockUrl = '/uploads/boards/board-123/test-1234.png'
    
    vi.mocked(saveBoardImage).mockResolvedValueOnce(mockUrl)

    const mockFile = new File(['test image data'], 'test.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/boards/board-123/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: { id: mockBoardId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe(mockUrl)
  })

  it('should return 400 for non-image files', async () => {
    const mockFile = new File(['test data'], 'test.txt', { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/boards/board-123/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: { id: mockBoardId } })

    expect(response.status).toBe(400)
  })

  it('should return 400 for missing file', async () => {
    const formData = new FormData()

    const request = new NextRequest('http://localhost:3000/api/boards/board-123/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: { id: mockBoardId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should handle storage errors gracefully', async () => {
    vi.mocked(saveBoardImage).mockRejectedValueOnce(new Error('Storage error'))

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', mockFile)

    const request = new NextRequest('http://localhost:3000/api/boards/board-123/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request, { params: { id: mockBoardId } })

    expect(response.status).toBe(400)
  })
})
