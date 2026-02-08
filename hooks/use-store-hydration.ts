'use client'

import { useEffect, useState } from 'react'
import { useToolingTrackerStore } from '@/lib/store'

interface UseStoreHydrationResult {
  isHydrating: boolean
  error: string | null
}

/**
 * Hook to manage store hydration from database on app initialization
 * Calls loadInitialData once on mount and tracks hydration state
 *
 * @returns {UseStoreHydrationResult} Hydration status with isHydrating flag and error message
 *
 * @example
 * const { isHydrating, error } = useStoreHydration()
 * if (isHydrating) return <LoadingSpinner />
 * if (error) return <ErrorMessage message={error} />
 * return <AppContent />
 */
export function useStoreHydration(): UseStoreHydrationResult {
  const [isHydrating, setIsHydrating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hydrate = async () => {
      try {
        const store = useToolingTrackerStore.getState()
        await store.loadInitialData()

        const state = useToolingTrackerStore.getState()
        if (state.error) {
          setError(state.error)
        } else {
          setError(null)
        }
      } finally {
        setIsHydrating(false)
      }
    }

    hydrate()
  }, [])

  return { isHydrating, error }
}
