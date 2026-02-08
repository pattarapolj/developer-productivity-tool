"use client"

import { useState, useEffect } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateBoardDialogProps {
  _open: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void
}

export function CreateBoardDialog({ _open, onOpenChange }: CreateBoardDialogProps) {
  const { projects, addBoard } = useToolingTrackerStore()

  const [name, setName] = useState("")
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog closes
  useEffect(() => {
    if (!_open) {
      setName("")
      setProjectId(null)
      setIsSubmitting(false)
    }
  }, [_open])

  const isNameValid = name.trim().length > 0
  const isSubmitDisabled = !isNameValid || isSubmitting

  const handleSubmit = async () => {
    if (!isNameValid) return

    setIsSubmitting(true)
    try {
      const newBoard = await addBoard({
        name: name.trim(),
        projectId: projectId || null,
        content: '{}',
        thumbnailPath: null,
        isArchived: false,
      })

      if (newBoard) {
        onOpenChange(false)
        // Optionally navigate to the new board
        // router.push(`/whiteboards/${newBoard.id}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Board Name *</Label>
            <Input
              id="board-name"
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
            <Label htmlFor="board-project">Project (Optional)</Label>
            <Select value={projectId || 'none'} onValueChange={(value) => setProjectId(value === 'none' ? null : value)}>
              <SelectTrigger id="board-project" disabled={isSubmitting}>
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
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? 'Creating...' : 'Create Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
