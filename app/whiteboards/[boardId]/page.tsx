'use client'

import { use, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToolingTrackerStore } from '@/lib/store'
import { useAutoSave } from '@/hooks/use-auto-save'
import { WhiteboardEditor } from '@/components/whiteboard-editor'
import { PresentationMode } from '@/components/presentation-mode'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

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

  // Derive board from store using useMemo
  const board = useMemo(() => {
    if (!mounted) return null
    return store.boards.find((b) => b.id === boardId) || null
  }, [mounted, boardId, store.boards])

  // Create auto-save handler
  const handleSave = useCallback(
    async (serializedContent: string) => {
      try {
        await store.updateBoard(boardId, { content: serializedContent })
      } catch (error) {
        console.error('Failed to save board:', error)
        throw error
      }
    },
    [boardId, store]
  )

  // Use the auto-save hook with 500ms debounce (more responsive)
  const { save: saveBoard, status: saveStatus, error: saveError } = useAutoSave(
    handleSave,
    500 // 500ms debounce for better responsiveness
  )

  // Handler for content changes from editor
  const handleEditorChange = useCallback(
    (newContent: string) => {
      saveBoard(newContent)
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

            {/* Auto-Save Status Indicator */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">All changes saved</span>
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
            />
          </div>
        </div>
      )}
    </>
  )
}
