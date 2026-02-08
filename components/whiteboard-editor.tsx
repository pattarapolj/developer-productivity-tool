'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { deserializeExcalidrawState } from '@/lib/whiteboard-utils'

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
  boardId: string // Used in Phase 5 for auto-save
  initialContent: string
  onChange?: (newContent: string) => void // Used in Phase 5 for auto-save
}

export function WhiteboardEditor({
  // boardId reserved for Phase 5 auto-save
  initialContent,
  // onChange reserved for Phase 5 auto-save
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
        theme="dark"
        renderTopRightUI={() => null}
      />
    </div>
  )
}
