'use client'

import { use, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToolingTrackerStore } from '@/lib/store'
import { useAutoSave } from '@/hooks/use-auto-save'
import { WhiteboardEditor } from '@/components/whiteboard-editor'
import { PresentationMode } from '@/components/presentation-mode'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function WhiteboardEdit({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const router = useRouter()
  const { boardId } = use(params)
  const store = useToolingTrackerStore()
  const [mounted, setMounted] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)
  const { toast } = useToast()

  // Derive board from store using useMemo
  const board = useMemo(() => {
    if (!mounted) return null
    const foundBoard = store.boards.find((b) => b.id === boardId) || null
    // Initialize last saved content reference
    if (foundBoard && lastSavedContentRef.current === null) {
      lastSavedContentRef.current = foundBoard.content
    }
    return foundBoard
  }, [mounted, boardId, store.boards])

  // Create auto-save handler
  const handleSave = useCallback(
    async (serializedContent: string) => {
      try {
        await store.updateBoard(boardId, { content: serializedContent })
        // Update the last saved content after successful save
        lastSavedContentRef.current = serializedContent
      } catch (error) {
        console.error('Failed to save board:', error)
        throw error
      }
    },
    [boardId, store]
  )

  // Use the auto-save hook with 2000ms debounce to reduce server load and UI flashing
  const { save: saveBoard, status: saveStatus, error: saveError } = useAutoSave(
    handleSave,
    2000 // 2 second debounce to batch rapid changes
  )

  // Handler for content changes from editor
  const handleEditorChange = useCallback(
    (newContent: string) => {
      // Only trigger save if content has actually changed
      if (newContent !== lastSavedContentRef.current) {
        saveBoard(newContent)
      }
    },
    [saveBoard]
  )

  useEffect(() => {
    // Mark as mounted for hydration safety - use microtask
    queueMicrotask(() => {
      setMounted(true)
    })
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Board Not Found</h1>
          <p className="text-slate-400 mb-6">
            The whiteboard with ID &quot;{boardId}&quot; does not exist.
          </p>
          <Button
            onClick={() => router.push('/whiteboards')}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Whiteboards
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Presentation Mode Overlay */}
      <PresentationMode
        isPresenting={isPresenting}
        onExit={() => setIsPresenting(false)}
        boardContent={board?.content || '{}'}
      />

      {/* Normal Editor View */}
      {!isPresenting && (
        <div className="w-full h-full flex flex-col bg-slate-900">
          {/* Header */}
          <div className="border-b border-slate-700 bg-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/whiteboards')}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white" data-testid="board-title">
                  {board.name}
                </h1>
                {board.projectId && (
                  <p className="text-xs text-slate-400">
                    Project: {board.projectId}
                  </p>
                )}
              </div>
            </div>

            {/* Auto-Save Status Indicator - Only show during active saving or errors */}
            <div className="flex items-center gap-2 min-w-[140px] justify-end">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-blue-400 transition-opacity duration-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-400 transition-opacity duration-200 animate-in fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    {saveError?.message || 'Save failed'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Editor Container */}
          <div className="flex-1 overflow-hidden">
            <WhiteboardEditor
              initialContent={board.content || '{}'}
              onChange={handleEditorChange}
              boardName={board.name}
              showToolbar={true}
              onPresentationModeToggle={(isPresenting) => setIsPresenting(isPresenting)}
              onSaveThumbnail={async (blob) => {
                try {
                  const formData = new FormData()
                  formData.append('file', blob, 'thumbnail.png')
                  
                  const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  })
                  
                  if (!res.ok) throw new Error('Upload failed')
                  
                  const { url } = await res.json()
                  await store.updateBoard(boardId, { thumbnailPath: url })
                  
                  toast({
                    title: "Cover image updated",
                    description: "The whiteboard thumbnail has been set successfully.",
                  })
                } catch (error) {
                  console.error('Failed to save thumbnail:', error)
                  toast({
                    title: "Failed to set cover",
                    description: "Could not upload the thumbnail image.",
                    variant: "destructive",
                  })
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
