'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'
import { deserializeExcalidrawState } from '@/lib/whiteboard-utils'
import { Button } from '@/components/ui/button'

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  () =>
    import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  {
    ssr: false,
  }
)

interface PresentationModeProps {
  isPresenting: boolean
  onExit: () => void
  boardContent: string
}

export function PresentationMode({
  isPresenting,
  onExit,
  boardContent,
}: PresentationModeProps) {
  const [mounted, setMounted] = useState(false)

  // Parse initial state from boardContent
  const initialState = useMemo(() => {
    try {
      return deserializeExcalidrawState(boardContent)
    } catch (error) {
      console.error('Failed to parse board content:', error)
      return { elements: [], appState: {} }
    }
  }, [boardContent])

  // Handle ESC key to exit presentation mode
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExit()
      }
    },
    [onExit]
  )

  useEffect(() => {
    // Mark as mounted for hydration safety - use microtask to avoid cascading renders
    queueMicrotask(() => {
      setMounted(true)
    })
  }, [])

  useEffect(() => {
    if (isPresenting && mounted) {
      document.addEventListener('keydown', handleKeyDown)
      // Hide scrollbars while presenting
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isPresenting, mounted, handleKeyDown])

  if (!isPresenting || !mounted) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center"
      data-testid="presentation-overlay"
    >
      {/* Exit Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-slate-800"
          onClick={onExit}
          aria-label="Exit presentation mode"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Excalidraw in Presentation Mode */}
      <div className="w-full h-full">
        <Excalidraw
          initialData={{
            elements: (initialState.elements || []) as readonly any[],
            appState: {
              ...initialState.appState,
              viewBackgroundColor: '#0f172a',
              viewModeEnabled: true, // Enable view-only mode for presentation
            } as any,
          }}
          onChange={() => {
            // Presentation mode is read-only, so no changes should be persisted
          }}
        />
      </div>

      {/* ESC hint */}
      <div className="absolute bottom-4 left-4 text-sm text-slate-400">
        Press ESC to exit presentation
      </div>
    </div>
  )
}
