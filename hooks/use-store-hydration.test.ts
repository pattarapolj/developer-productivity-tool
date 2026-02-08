import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStoreHydration } from './use-store-hydration'
import { useToolingTrackerStore } from '@/lib/store'
import type { Project } from '@/lib/types'

describe('useStoreHydration', () => {
  beforeEach(() => {
    global.fetch = vi.fn()

    // Reset store
    const testProject: Project = {
      id: 'test-project-1',
      name: 'Test Project',
      color: 'blue',
      subcategories: [],
      jiraKey: null,
      createdAt: new Date(),
    }

    useToolingTrackerStore.setState({
      tasks: [],
      timeEntries: [],
      projects: [testProject],
      activities: [],
      comments: [],
      attachments: [],
      history: [],
      selectedProjectId: null,
      boardFilters: {
        search: '',
        projectId: null,
        priority: 'all',
        dateRange: 'all',
        customStart: null,
        customEnd: null,
        showArchived: false,
      },
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call loadInitialData on mount', async () => {
    const loadInitialDataSpy = vi.spyOn(useToolingTrackerStore.getState(), 'loadInitialData')

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const { result } = renderHook(() => useStoreHydration())

    await waitFor(() => {
      expect(loadInitialDataSpy).toHaveBeenCalled()
    })

    loadInitialDataSpy.mockRestore()
  })

  it('should return isHydrating false initially and then update', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const { result } = renderHook(() => useStoreHydration())

    // Initially isHydrating should be true
    expect(result.current.isHydrating).toBe(true)
    expect(result.current.error).toBeNull()

    // Wait for hydration to complete
    await waitFor(() => {
      expect(result.current.isHydrating).toBe(false)
    })
  })

  it('should set error state when hydration fails', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error',
    } as Response)

    const { result } = renderHook(() => useStoreHydration())

    await waitFor(() => {
      expect(result.current.isHydrating).toBe(false)
      expect(result.current.error).toBeTruthy()
    })
  })

  it('should have no error when hydration succeeds', async () => {
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Project 1',
        color: 'blue',
        subcategories: [],
        jiraKey: null,
        createdAt: new Date(),
      }
    ]

    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url === '/api/projects') {
        return { ok: true, json: async () => mockProjects } as Response
      }
      return { ok: true, json: async () => [] } as Response
    })

    const { result } = renderHook(() => useStoreHydration())

    await waitFor(() => {
      expect(result.current.isHydrating).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('should only hydrate once on mount (not on every render)', async () => {
    const loadInitialDataSpy = vi.spyOn(useToolingTrackerStore.getState(), 'loadInitialData')

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const { rerender } = renderHook(() => useStoreHydration())

    await waitFor(() => {
      expect(loadInitialDataSpy).toHaveBeenCalledTimes(1)
    })

    // Rerender the hook
    rerender()

    // Should still only be called once
    expect(loadInitialDataSpy).toHaveBeenCalledTimes(1)

    loadInitialDataSpy.mockRestore()
  })

  it('should return object with isHydrating and error properties', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const { result } = renderHook(() => useStoreHydration())

    expect(result.current).toHaveProperty('isHydrating')
    expect(result.current).toHaveProperty('error')
    expect(typeof result.current.isHydrating).toBe('boolean')
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true)
  })
})
