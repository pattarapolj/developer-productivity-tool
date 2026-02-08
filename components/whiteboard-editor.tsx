'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { deserializeExcalidrawState, serializeExcalidrawState } from '@/lib/whiteboard-utils'

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  () =>
    import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-white mb-4">Loading Excalidraw editor...</div>
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    ),
  }
)

interface WhiteboardEditorProps {
  initialContent: string
  onChange?: (newContent: string) => void // Used in Phase 5 for auto-save
}

export function WhiteboardEditor({
  initialContent,
  onChange,
}: WhiteboardEditorProps) {
  const [mounted, setMounted] = useState(false)

  // Derive initial state from initialContent without setState
  const initialState = useMemo(() => {
    try {
      return deserializeExcalidrawState(initialContent)
    } catch (error) {
      console.error('Failed to parse initial content:', error)
      return { elements: [], appState: {} }
    }
  }, [initialContent])

  // Handler for Excalidraw changes - serializes and calls onChange prop
  const handleExcalidrawChange = useCallback(
    (elements: readonly unknown[], appState: unknown) => {
      if (onChange) {
        try {
          // Cast to any for serialization compatibility with Excalidraw types
          const serialized = serializeExcalidrawState(elements as any[], appState as any)
          onChange(serialized)
        } catch (error) {
          console.error('Failed to serialize Excalidraw state:', error)
        }
      }
    },
    [onChange]
  )

  useEffect(() => {
    // Mark as mounted for hydration safety - use microtask to avoid cascading renders
    queueMicrotask(() => {
      setMounted(true)
    })
  }, [])

  if (!mounted || !initialState) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-white mb-4">Initializing editor...</div>
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <Excalidraw
        initialData={{
          elements: (initialState.elements || []) as readonly any[],
          appState: (initialState.appState || {}) as any,
        }}
        onChange={handleExcalidrawChange}
        theme="dark"
        renderTopRightUI={() => null}
      />
    </div>
  )
}
