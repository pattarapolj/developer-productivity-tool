"use client"

import { useState, useEffect } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { formatMinutes } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, X } from "lucide-react"
import type { TimeEntryType } from "@/lib/types"

interface TimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
}

const TIME_ENTRY_TYPES: { value: TimeEntryType; label: string; color: string }[] = [
  { value: "development", label: "Development", color: "text-blue-500" },
  { value: "meeting", label: "Meeting", color: "text-purple-500" },
  { value: "review", label: "Code Review", color: "text-green-500" },
  { value: "research", label: "Research", color: "text-yellow-500" },
  { value: "debugging", label: "Debugging", color: "text-red-500" },
  { value: "other", label: "Other", color: "text-gray-500" },
]

export function TimeEntryDialog({ open, onOpenChange, taskId }: TimeEntryDialogProps) {
  const { tasks, timeEntries, addTimeEntry, deleteTimeEntry, updateTimeEntry, getTimeForTask } = useToolingTrackerStore()

  const [hours, setHours] = useState("0")
  const [minutes, setMinutes] = useState("30")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [type, setType] = useState<TimeEntryType>("development")
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  const task = tasks.find((t) => t.id === taskId)
  const taskTimeEntries = timeEntries.filter((te) => te.taskId === taskId)
  const totalMinutes = getTimeForTask(taskId)

  const resetForm = () => {
    setHours("0")
    setMinutes("30")
    setDate(new Date().toISOString().split("T")[0])
    setNotes("")
    setType("development")
    setEditingEntryId(null)
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetForm()
    }
  }, [open])

  const handleSubmit = async () => {
    const h = Number.parseInt(hours) || 0
    const m = Number.parseInt(minutes) || 0

    if (h === 0 && m === 0) return

    const payload = {
      hours: h,
      minutes: m,
      date: new Date(date),
      notes: notes.trim(),
      type,
    }

    if (editingEntryId) {
      await updateTimeEntry(editingEntryId, payload)
    } else {
      await addTimeEntry({ taskId, ...payload })
    }

    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingEntryId ? "Update Time Entry" : "Log Time"}</DialogTitle>
          {task && <p className="text-sm text-muted-foreground">{task.title}</p>}
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {editingEntryId && (
            <div className="p-3 rounded-md border border-border bg-secondary/50 text-xs text-muted-foreground flex items-center justify-between">
              <span>Editing existing entry</span>
              <button type="button" className="flex items-center gap-1" onClick={resetForm}>
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          )}

          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">Total time logged</p>
            <p className="text-2xl font-semibold text-foreground">{formatMinutes(totalMinutes)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hours</label>
              <Input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Minutes</label>
              <Input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Type</label>
            <Select value={type} onValueChange={(v) => setType(v as TimeEntryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_ENTRY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className={t.color}>{t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {editingEntryId ? "Update Entry" : "Add Time Entry"}
          </Button>

          {taskTimeEntries.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-sm font-medium">Previous entries</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {taskTimeEntries.map((entry) => {
                  const entryType = TIME_ENTRY_TYPES.find(t => t.value === entry.type) || TIME_ENTRY_TYPES[0]
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatMinutes(entry.hours * 60 + entry.minutes)}</span>
                          <span className={`text-xs ${entryType.color}`}>• {entryType.label}</span>
                          <span className="text-muted-foreground text-xs">{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        {entry.notes && <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingEntryId(entry.id)
                            setHours(String(entry.hours))
                            setMinutes(String(entry.minutes))
                            setDate(new Date(entry.date).toISOString().split("T")[0])
                            setNotes(entry.notes ?? "")
                            setType(entry.type || "development")
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={async () => {
                            await deleteTimeEntry(entry.id)
                            if (editingEntryId === entry.id) {
                              resetForm()
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
