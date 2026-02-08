"use client"

import { useState, useEffect } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TemplatePickerDialog } from "@/components/template-picker-dialog"
import { serializeExcalidrawState } from "@/lib/whiteboard-utils"
import { normalizeTemplateElements } from "@/lib/whiteboard-templates"
import type { WhiteboardTemplate } from "@/lib/whiteboard-templates"

interface CreateBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const { projects, addBoard } = useToolingTrackerStore()

  const [name, setName] = useState("")
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WhiteboardTemplate | null>(null)

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("")
      setProjectId(null)
      setIsSubmitting(false)
      setShowTemplatePicker(false)
      setSelectedTemplate(null)
    } else {
      // Show template picker when dialog opens
      setShowTemplatePicker(true)
    }
  }, [open])

  const isNameValid = name.trim().length > 0
  const isSubmitDisabled = !isNameValid || isSubmitting

  const handleSubmit = async () => {
    if (!isNameValid) return

    setIsSubmitting(true)
    try {
      // Normalize and serialize template elements as initial board content
      const initialContent = selectedTemplate 
        ? serializeExcalidrawState(normalizeTemplateElements(selectedTemplate.elements), {})
        : '{}'

      const newBoard = await addBoard({
        name: name.trim(),
        projectId: projectId || null,
        content: initialContent,
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
    <>
      {/* Template Picker Dialog */}
      <TemplatePickerDialog
        open={showTemplatePicker}
        onSelect={(template) => {
          setSelectedTemplate(template)
          setShowTemplatePicker(false)
        }}
        onCancel={() => {
          setShowTemplatePicker(false)
          onOpenChange(false)
        }}
      />

      {/* Board Details Dialog */}
      <Dialog open={open && !showTemplatePicker} onOpenChange={handleOpenChange}>
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

            {selectedTemplate && (
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2">
                    {/* <span className="text-2xl">{selectedTemplate.thumbnail}</span> */}
                    <div>
                      <p className="font-medium text-sm">{selectedTemplate.name}</p>
                      <p className="text-xs text-slate-400">{selectedTemplate.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
    </>
  )
}
