"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useToolingTrackerStore } from "@/lib/store"
import { cn, formatMinutes, formatDate, getProjectColorClass, getPriorityColorClass } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, MoreHorizontal, Trash2, Edit, Timer, ExternalLink, Archive, RotateCcw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Task } from "@/lib/types"
import { TaskDialog } from "./task-dialog"
import { TimeEntryDialog } from "./time-entry-dialog"

import { useRouter } from "next/navigation"

// Simple markdown stripper for preview
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "[code]") // code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1") // bold italic
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/___(.+?)___/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1") // strikethrough
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/^>\s+/gm, "") // blockquotes
    .replace(/^[-*]\s+/gm, "• ") // lists
    .replace(/^\d+\.\s+/gm, "") // numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^---$/gm, "") // horizontal rules
    .replace(/- \[[ x]\]\s*/g, "") // checkboxes
    .trim()
}

interface TaskCardProps {
  task: Task
  showProject?: boolean
  className?: string
  showArchiveAction?: boolean
  isArchived?: boolean
  onArchive?: () => void
  onUnarchive?: () => void
}

export function TaskCard({ 
  task, 
  showProject = false, 
  className,
  showArchiveAction = false,
  isArchived = false,
  onArchive,
  onUnarchive,
}: TaskCardProps) {
  const { projects, getTimeForTask, deleteTask } = useToolingTrackerStore()
  const [editOpen, setEditOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const router = useRouter()

  const project = projects.find((p) => p.id === task.projectId)
  const totalMinutes = getTimeForTask(task.id)
  const descriptionPreview = useMemo(() => 
    task.description ? stripMarkdown(task.description) : "", 
    [task.description]
  )

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown button
    if ((e.target as HTMLElement).closest('button')) return
    router.push(`/tasks/${task.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/tasks/${task.id}`)
    }
  }

  return (
    <>
      <Card 
        role="button"
        tabIndex={0}
        aria-label={`Task: ${task.title}`}
        className={cn("p-3 bg-card hover:bg-card/80 border-border cursor-pointer group transition-colors", className)}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <h4 className="font-medium text-sm text-card-foreground truncate">{task.title}</h4>
            {descriptionPreview && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words overflow-hidden">{descriptionPreview}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Details
                </Link>
              </DropdownMenuItem>
              {!isArchived && (
                <>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Quick Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeOpen(true)}>
                    <Timer className="w-4 h-4 mr-2" />
                    Log Time
                  </DropdownMenuItem>
                </>
              )}
              {showArchiveAction && (
                <>
                  <DropdownMenuSeparator />
                  {isArchived ? (
                    <DropdownMenuItem onClick={onUnarchive}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore from Archive
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onArchive}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  await deleteTask(task.id)
                }} 
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {showProject && project && (
            <Badge variant="secondary" className="text-xs">
              <div className={cn("w-2 h-2 rounded-full mr-1.5", getProjectColorClass(project.color))} />
              {project.name}
            </Badge>
          )}

          <Badge variant="outline" className={cn("text-xs", getPriorityColorClass(task.priority))}>
            {task.priority}
          </Badge>

          {task.jiraKey && (
            <Badge variant="outline" className="text-[10px] uppercase">
              {task.jiraKey}
            </Badge>
          )}

          {typeof task.storyPoints === "number" && (
            <span className="text-[11px] font-semibold text-foreground">SP {task.storyPoints}</span>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate)}
            </div>
          )}

          {totalMinutes > 0 && (
            <div className="flex items-center gap-1 text-xs text-primary ml-auto">
              <Clock className="w-3 h-3" />
              {formatMinutes(totalMinutes)}
            </div>
          )}
        </div>
      </Card>

      <TaskDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
      <TimeEntryDialog open={timeOpen} onOpenChange={setTimeOpen} taskId={task.id} />
    </>
  )
}
