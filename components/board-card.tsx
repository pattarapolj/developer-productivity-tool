"use client"

import { useState, type MouseEvent, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useToolingTrackerStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PenTool, MoreHorizontal, Archive, Trash2, ExternalLink, Copy } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Board } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface BoardCardProps {
  board: Board
  className?: string
}

export function BoardCard({ board, className }: BoardCardProps) {
  const router = useRouter()
  const { projects, archiveBoard, deleteBoard, addBoard } = useToolingTrackerStore()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const project = projects.find((p) => p.id === board.projectId)

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    // Don't navigate if clicking on the dropdown button
    if ((e.target as HTMLElement).closest('button')) return
    router.push(`/whiteboards/${board.id}`)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/whiteboards/${board.id}`)
    }
  }

  const handleArchive = async () => {
    await archiveBoard(board.id)
  }

  const handleDelete = async () => {
    await deleteBoard(board.id)
    setDeleteOpen(false)
  }

  const handleDuplicate = async () => {
    try {
      await addBoard({
        name: `${board.name} (Copy)`,
        projectId: board.projectId,
        content: board.content,
        thumbnailPath: board.thumbnailPath,
        isArchived: false,
      })
    } catch (error) {
      console.error('Failed to duplicate board:', error)
    }
  }

  const relativeTime = formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Board: ${board.name}`}
        className={cn(
          "p-0 bg-card border-border cursor-pointer group transition-all hover:shadow-md overflow-hidden flex flex-col h-full relative",
          className
        )}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
      >
        {/* Toolbar - Top right corner */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 shadow-md"
                aria-label="More actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/whiteboards/${board.id}`)
                  }}
                  className="flex items-center cursor-pointer w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleDuplicate()
                }}
                className="cursor-pointer"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleArchive()
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Thumbnail / Placeholder */}
        <div className="relative aspect-video bg-accent/10 flex items-center justify-center border-b border-border overflow-hidden">
          {board.thumbnailPath ? (
            <Image
              src={board.thumbnailPath}
              alt={board.name}
              fill
              className="object-cover"
            />
          ) : (
            <PenTool className="h-12 w-12 text-muted-foreground opacity-40" />
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          <h3 className="font-semibold text-base text-card-foreground line-clamp-2 min-h-[2.5rem]">
            {board.name}
          </h3>

          <div className="flex items-center justify-between gap-2 mt-auto">
            {/* Project Badge */}
            <div className="flex-1 min-w-0">
              {project ? (
                <Badge variant="outline" className="text-xs truncate max-w-full">
                  {project.name}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-xs">No project</span>
              )}
            </div>

            {/* Updated time */}
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {relativeTime}
            </p>
          </div>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{board.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
