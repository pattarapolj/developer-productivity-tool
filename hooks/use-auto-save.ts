'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveReturn<T> {
  save: (data: T) => void
  status: SaveStatus
  error: Error | null
}

/**
 * Custom hook for debounced auto-save functionality
 * 
 * @param onSave - Async function to call for saving data
 * @param delay - Debounce delay in milliseconds (default: 2000)
 * @returns Object with save function, status, and error
 * 
 * @example
 * const { save, status, error } = useAutoSave(async (data) => {
 *   await api.updateBoard({ content: data })
 * }, 2000)
 * 
 * // Call save whenever content changes
 * save(serializedContent)
 */
export function useAutoSave<T>(
  onSave: (data: T) => Promise<void>,
  delay: number = 2000
): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDataRef = useRef<T | null>(null)
  const isMountedRef = useRef(true)
  const onSaveRef = useRef(onSave)
  
  // Keep onSave ref up to date
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // Clear timers on unmount - but save pending data first!
  useEffect(() => {
    return () => {
      // If there's pending data when unmounting, save it immediately
      if (pendingDataRef.current !== null && timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        
        // Save immediately using the ref to avoid dependency issues
        const dataToSave = pendingDataRef.current
        const saveFunc = onSaveRef.current
        
        // Execute save asynchronously but don't wait for it
        saveFunc(dataToSave).catch(() => {
          // Silent error on unmount
        })
      }
      
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  const executeSave = useCallback(
    async (data: T) => {
      if (!isMountedRef.current) return

      try {
        setStatus('saving')
        setError(null)

        await onSave(data)

        if (isMountedRef.current) {
          setStatus('saved')
          setError(null)

          // Reset to idle after 2 seconds
          resetTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setStatus('idle')
            }
          }, 2000)
        }
      } catch (err) {
        if (isMountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err))
          setStatus('error')
          setError(error)
        }
      }
    },
    [onSave]
  )

  const save = useCallback(
    (data: T) => {
      // Store the latest data
      pendingDataRef.current = data

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new debounced call
      timeoutRef.current = setTimeout(() => {
        if (pendingDataRef.current !== null && isMountedRef.current) {
          executeSave(pendingDataRef.current)
        }
      }, delay)
    },
    [delay, executeSave]
  )

  return {
    save,
    status,
    error,
  }
}
