'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAllTemplates } from '@/lib/whiteboard-templates'
import type { WhiteboardTemplate } from '@/lib/whiteboard-templates'

interface TemplatePickerDialogProps {
  open: boolean
  // eslint-disable-next-line no-unused-vars
  onSelect: (template: WhiteboardTemplate) => void
  onCancel: () => void
}

export function TemplatePickerDialog({
  open,
  onSelect,
  onCancel,
}: TemplatePickerDialogProps) {
  const templates = getAllTemplates()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Select a template to get started with your whiteboard
          </DialogDescription>
        </DialogHeader>

        {/* Template Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="p-4 rounded-lg border border-slate-700 hover:border-teal-500 hover:bg-slate-800/50 transition-all flex flex-col gap-3 text-left"
              role="button"
              aria-label={`Select ${template.name} template`}
            >
              {/* <div className="text-4xl">{template.thumbnail}</div> */}
              <div>
                <h3 className="font-semibold text-sm text-slate-100">
                  {template.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {template.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
