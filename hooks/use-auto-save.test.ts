import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutoSave } from './use-auto-save'

describe('useAutoSave Hook', () => {
  let mockSaveFunction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSaveFunction = vi.fn().mockResolvedValue(undefined)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should be defined', () => {
    const { result } = renderHook(() => useAutoSave(mockSaveFunction))
    expect(result.current).toBeDefined()
  })

  it('should return save function, status, and error', () => {
    const { result } = renderHook(() => useAutoSave(mockSaveFunction))
    expect(result.current).toHaveProperty('save')
    expect(result.current).toHaveProperty('status')
    expect(result.current).toHaveProperty('error')
  })

  it('should start with idle status', () => {
    const { result } = renderHook(() => useAutoSave(mockSaveFunction))
    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
  })

  it('should debounce rapid calls and execute only once after delay', async () => {
    const { result } = renderHook(() => useAutoSave(mockSaveFunction, 500))

    // Call save multiple times rapidly
    act(() => {
      result.current.save('data1')
      result.current.save('data2')
      result.current.save('data3')
    })

    // Mock function should not be called yet
    expect(mockSaveFunction).not.toHaveBeenCalled()

    // Fast-forward time by 400ms (less than delay)
    act(() => {
      vi.advanceTimersByTime(400)
    })

    // Still shouldn't be called
    expect(mockSaveFunction).not.toHaveBeenCalled()

    // Fast-forward remaining 100ms
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Now it should be called once with the last data
    expect(mockSaveFunction).toHaveBeenCalledTimes(1)
    expect(mockSaveFunction).toHaveBeenCalledWith('data3')
  })

  it('should use default delay of 2000ms', async () => {
    const { result } = renderHook(() => useAutoSave(mockSaveFunction))

    act(() => {
      result.current.save('test-data')
    })

    // Should not be called after 1000ms
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockSaveFunction).not.toHaveBeenCalled()

    // Should be called after 2000ms total
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(mockSaveFunction).toHaveBeenCalledTimes(1)
  })

  it('should transition to saving status during save', async () => {
    const { result } = renderHook(() => useAutoSave(mockSaveFunction, 100))

    act(() => {
      result.current.save('test-data')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Status should be saving immediately after save is triggered
    expect(result.current.status).toBe('saving')
  })

  it('should transition to saved status after successful save', async () => {
    // Use real timers for this test because it involves promises
    vi.useRealTimers()
    
    const { result } = renderHook(() => useAutoSave(mockSaveFunction, 50))

    act(() => {
      result.current.save('test-data')
    })

    // Wait for debounce delay and async save
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(result.current.status).toBe('saved')
    
    vi.useFakeTimers()
  })

  it('should transition to error status on save failure', async () => {
    // Use real timers for this test because it involves promises
    vi.useRealTimers()
    
    const testError = new Error('Save failed')
    const errorSaveFunction = vi.fn().mockRejectedValue(testError)

    const { result } = renderHook(() => useAutoSave(errorSaveFunction, 50))

    act(() => {
      result.current.save('test-data')
    })

    // Wait for debounce delay and async save
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe(testError)
    
    vi.useFakeTimers()
  })

  it('should handle multiple sequential saves', async () => {
    // Use real timers for this test because it involves promises
    vi.useRealTimers()
    
    const { result } = renderHook(() => useAutoSave(mockSaveFunction, 50))

    // First save
    act(() => {
      result.current.save('data1')
    })

    // Wait for first save to complete
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(mockSaveFunction).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('saved')

    // Reset mock for second save
    mockSaveFunction.mockClear()

    // Second save
    act(() => {
      result.current.save('data2')
    })

    // Wait for second save to complete
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(mockSaveFunction).toHaveBeenCalledTimes(1)
    expect(mockSaveFunction).toHaveBeenCalledWith('data2')
    
    vi.useFakeTimers()
  })

  it('should clear timers on unmount', () => {
    const { result, unmount } = renderHook(() => useAutoSave(mockSaveFunction, 100))

    // Create a pending save
    act(() => {
      result.current.save('test-data')
    })

    // Spy on clearTimeout before unmount
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    // Unmount the hook - should cleanup timers
    unmount()

    // Should have called clearTimeout during cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
  })

  it('should not call save after unmount', async () => {
    const { result, unmount } = renderHook(() => useAutoSave(mockSaveFunction, 100))

    act(() => {
      result.current.save('test-data')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Save should not be called after unmount
    expect(mockSaveFunction).not.toHaveBeenCalled()
  })

  it('should reset status to idle after some time', async () => {
    // Use real timers for this test because it involves promises and timeout resets
    vi.useRealTimers()
    
    const { result } = renderHook(() => useAutoSave(mockSaveFunction, 50))

    act(() => {
      result.current.save('test-data')
    })

    // Wait for save to complete
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(result.current.status).toBe('saved')

    // Wait for status to reset to idle (2 seconds after save)
    await new Promise(resolve => setTimeout(resolve, 2100))

    expect(result.current.status).toBe('idle')
    
    vi.useFakeTimers()
  })

  it('should handle generic type parameter', async () => {
    interface TestData {
      id: string
      content: string
    }

    const typedSaveFunction = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave<TestData>(typedSaveFunction, 100))

    const testData: TestData = { id: 'test-1', content: 'Hello' }

    act(() => {
      result.current.save(testData)
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    act(() => {
      vi.runAllTimers()
    })

    expect(typedSaveFunction).toHaveBeenCalledWith(testData)
  })
})
