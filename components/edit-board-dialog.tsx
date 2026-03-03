"use client"

import { useState, useEffect } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Board } from "@/lib/types"

interface EditBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  board: Board
}

export function EditBoardDialog({ open, onOpenChange, board }: EditBoardDialogProps) {
  const { projects, updateBoard } = useToolingTrackerStore()

  const [name, setName] = useState(board.name)
  const [projectId, setProjectId] = useState<string | null>(board.projectId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens with new board data
  useEffect(() => {
    if (open) {
      setName(board.name)
      setProjectId(board.projectId)
    }
  }, [open, board])

  const isNameValid = name.trim().length > 0
  const isSubmitDisabled = !isNameValid || isSubmitting

  const handleSubmit = async () => {
    if (!isNameValid) return

    setIsSubmitting(true)
    try {
      await updateBoard(board.id, {
        name: name.trim(),
        projectId: projectId || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update board:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Board Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-board-name">Board Name</Label>
            <Input
              id="edit-board-name"
              placeholder="Whiteboard name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitDisabled) {
                  handleSubmit()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-board-project">Project</Label>
            <Select value={projectId || 'none'} onValueChange={(value) => setProjectId(value === 'none' ? null : value)}>
              <SelectTrigger id="edit-board-project" disabled={isSubmitting}>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
