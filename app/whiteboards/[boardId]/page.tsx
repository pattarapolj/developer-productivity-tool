'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useToolingTrackerStore } from '@/lib/store'
import { WhiteboardEditor } from '@/components/whiteboard-editor'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function WhiteboardEdit({
  params,
}: {
  params: { boardId: string }
}) {
  const router = useRouter()
  const { boardId } = params
  const store = useToolingTrackerStore()
  const [mounted, setMounted] = useState(false)

  // Derive board from store using useMemo
  const board = useMemo(() => {
    if (!mounted) return null
    return store.boards.find((b) => b.id === boardId) || null
  }, [mounted, boardId, store.boards])

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
            <h1 className="text-xl font-bold text-white">{board.name}</h1>
            {board.projectId && (
              <p className="text-xs text-slate-400">
                Project: {board.projectId}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden">
        <WhiteboardEditor
          boardId={boardId}
          initialContent={board.content || '{}'}
        />
      </div>
    </div>
  )
}
