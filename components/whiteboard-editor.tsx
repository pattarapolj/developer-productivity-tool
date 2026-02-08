'use client'

import '@excalidraw/excalidraw/index.css'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { deserializeExcalidrawState, serializeExcalidrawState } from '@/lib/whiteboard-utils'
import { WhiteboardToolbar } from '@/components/whiteboard-toolbar'
import { exportToPNG, exportToSVG, exportToPDF, downloadBlob } from '@/lib/whiteboard-export'

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
  // eslint-disable-next-line no-unused-vars
  onChange?: (newContent: string) => void // Used in Phase 5 for auto-save
  boardName?: string
  showToolbar?: boolean // Default true
  // eslint-disable-next-line no-unused-vars
  onPresentationModeToggle?: (isPresenting: boolean) => void
}

export function WhiteboardEditor({
  initialContent,
  onChange,
  boardName = 'board',
  showToolbar = true,
  onPresentationModeToggle,
}: WhiteboardEditorProps) {
  const [mounted, setMounted] = useState(false)
  const excalidrawAPIRef = useRef<any>(null)

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

  // Export handlers
  const handleExportPNG = useCallback(async () => {
    if (!excalidrawAPIRef.current) return

    try {
      const elements = excalidrawAPIRef.current.getSceneElements()
      const appState = excalidrawAPIRef.current.getAppState()
      const blob = await exportToPNG(elements, appState)
      downloadBlob(blob, `${boardName}.png`)
    } catch (error) {
      console.error('Export to PNG failed:', error)
    }
  }, [boardName])

  const handleExportSVG = useCallback(async () => {
    if (!excalidrawAPIRef.current) return

    try {
      const elements = excalidrawAPIRef.current.getSceneElements()
      const appState = excalidrawAPIRef.current.getAppState()
      const blob = await exportToSVG(elements, appState)
      downloadBlob(blob, `${boardName}.svg`)
    } catch (error) {
      console.error('Export to SVG failed:', error)
    }
  }, [boardName])

  const handleExportPDF = useCallback(async () => {
    if (!excalidrawAPIRef.current) return

    try {
      const elements = excalidrawAPIRef.current.getSceneElements()
      const appState = excalidrawAPIRef.current.getAppState()
      const blob = await exportToPDF(elements, appState)
      downloadBlob(blob, `${boardName}.pdf`)
    } catch (error) {
      console.error('Export to PDF failed:', error)
    }
  }, [boardName])

  const handlePresentationMode = useCallback(() => {
    if (onPresentationModeToggle) {
      onPresentationModeToggle(true)
    }
  }, [onPresentationModeToggle])

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
    <div className="w-full h-full relative" data-testid="board-editor">
      {/* Toolbar - Floating */}
      {showToolbar && (
        <div className="absolute top-4 right-4 z-10">
          <WhiteboardToolbar
            onExportPNG={handleExportPNG}
            onExportSVG={handleExportSVG}
            onExportPDF={handleExportPDF}
            onPresentationMode={handlePresentationMode}
          />
        </div>
      )}

      {/* Editor */}
      <div className="w-full h-full">
        <Excalidraw
          initialData={{
            elements: (initialState.elements || []) as readonly any[],
            appState: (initialState.appState || {}) as any,
          }}
          onChange={handleExcalidrawChange}
          theme="dark"
          renderTopRightUI={() => null}
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api
          }}
        />
      </div>
    </div>
  )
}
