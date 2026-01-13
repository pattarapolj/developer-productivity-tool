"use client"

import { useMemo, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  Timer,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Minus,
  CheckCircle,
  AlertCircle,
  Calendar,
  FolderKanban,
  Trash2,
  Eye,
  Edit3,
  Pencil,
  CheckSquare,
  Link as LinkIcon,
} from "lucide-react"

import { useToolingTrackerStore } from "@/lib/store"
import { formatDate, formatMinutes, getPriorityColorClass, cn, getProjectColorClass } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TimeEntryDialog } from "@/components/time-entry-dialog"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import type { Priority, TaskStatus } from "@/lib/types"

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: typeof CheckCircle }[] = [
  { value: "todo", label: "To Do", icon: AlertCircle },
  { value: "in-progress", label: "In Progress", icon: Clock },
  { value: "done", label: "Done", icon: CheckCircle },
]

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>()
  const router = useRouter()
  const { taskId } = params

  const { tasks, projects, timeEntries, getTimeForTask, updateTask, deleteTask, addSubcategoryToProject, updateTimeEntry, deleteTimeEntry } =
    useToolingTrackerStore()
  const task = tasks.find((t) => t.id === taskId)

  const entries = useMemo(() => timeEntries.filter((entry) => entry.taskId === taskId), [timeEntries, taskId])

  // Editable state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<Priority>("medium")
  const [projectId, setProjectId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [jiraKey, setJiraKey] = useState("")
  const [storyPoints, setStoryPoints] = useState("")

  const [timeOpen, setTimeOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [initializedTaskId, setInitializedTaskId] = useState<string | null>(null)
  const [descriptionMode, setDescriptionMode] = useState<"edit" | "preview">("preview")
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [entryHours, setEntryHours] = useState("")
  const [entryMinutes, setEntryMinutes] = useState("")
  const [entryDate, setEntryDate] = useState("")
  const [entryNotes, setEntryNotes] = useState("")

  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Initialize form with task data when task changes
  if (task && task.id !== initializedTaskId) {
    setTitle(task.title)
    setDescription(task.description || "")
    setStatus(task.status)
    setPriority(task.priority)
    setProjectId(task.projectId)
    setSubcategory(task.subcategory || "")
    setJiraKey(task.jiraKey || "")
    setStoryPoints(task.storyPoints !== null ? String(task.storyPoints) : "")
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    setHasChanges(false)
    setInitializedTaskId(task.id)
  }

  // Track changes using useMemo
  const hasUnsavedChanges = useMemo(() => {
    if (!task) return false
    return (
      title !== task.title ||
      description !== (task.description || "") ||
      status !== task.status ||
      priority !== task.priority ||
      projectId !== task.projectId ||
      subcategory !== (task.subcategory || "") ||
      jiraKey !== (task.jiraKey || "") ||
      storyPoints !== (task.storyPoints !== null ? String(task.storyPoints) : "") ||
      dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    )
  }, [task, title, description, status, priority, projectId, subcategory, jiraKey, storyPoints, dueDate])

  const handleSave = () => {
    if (!task || !title.trim()) return

    setIsSaving(true)
    const parsedStoryPoints = storyPoints.trim() ? Number(storyPoints) : null

    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      projectId,
      subcategory: subcategory.trim() || null,
      jiraKey: jiraKey.trim() || null,
      storyPoints: parsedStoryPoints,
      dueDate: dueDate ? new Date(dueDate) : null,
    })

    if (subcategory.trim()) {
      addSubcategoryToProject(projectId, subcategory.trim())
    }

    setTimeout(() => {
      setIsSaving(false)
      setHasChanges(false)
    }, 300)
  }

  const handleDelete = () => {
    if (!task) return
    deleteTask(task.id)
    router.push("/board")
  }

  // Text formatting functions
  const insertFormat = (before: string, after: string = before) => {
    const textarea = descriptionRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = description.substring(start, end)
    const newText = description.substring(0, start) + before + selectedText + after + description.substring(end)

    setDescription(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertLinePrefix = (prefix: string) => {
    const textarea = descriptionRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = description.lastIndexOf("\n", start - 1) + 1
    const newText = description.substring(0, lineStart) + prefix + description.substring(lineStart)

    setDescription(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  if (!task) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Button variant="ghost" className="w-fit" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Task not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This task was removed or has not been created yet.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalMinutes = getTimeForTask(task.id)
  const currentProject = projects.find((p) => p.id === projectId)

  return (
    <div className="h-full overflow-auto">
      {/* Top toolbar - MS Word style */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                {currentProject && (
                  <Badge variant="secondary" className="gap-1">
                    <div className={cn("w-2 h-2 rounded-full", getProjectColorClass(currentProject.color))} />
                    {currentProject.name}
                  </Badge>
                )}
                {(hasChanges || hasUnsavedChanges) && (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setTimeOpen(true)}>
                <Timer className="w-4 h-4 mr-1" />
                Log Time
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{task.title}&quot; and all associated time entries. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="sm" onClick={handleSave} disabled={!(hasChanges || hasUnsavedChanges) || isSaving}>
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Title input */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Properties bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-secondary/30 border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-3 h-3" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Priority</span>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className={cn("h-8 w-[100px]", getPriorityColorClass(priority))}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <FolderKanban className="w-3 h-3 text-muted-foreground" />
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", getProjectColorClass(p.color))} />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 w-[140px]"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-sm font-medium">{formatMinutes(totalMinutes)}</span>
          </div>
        </div>

        {/* Secondary properties */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Jira Key</label>
            <Input
              value={jiraKey}
              onChange={(e) => setJiraKey(e.target.value)}
              placeholder="e.g. ENG-123"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Story Points</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={storyPoints}
              onChange={(e) => setStoryPoints(e.target.value)}
              placeholder="e.g. 3"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Subcategory</label>
            <Input
              list="subcategory-options"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Backend, Design"
              className="h-9"
            />
            <datalist id="subcategory-options">
              {(currentProject?.subcategories ?? []).map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Description editor with toolbar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex items-center rounded-md bg-secondary/50 p-1">
                  <Button
                    variant={descriptionMode === "edit" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setDescriptionMode("edit")}
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={descriptionMode === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setDescriptionMode("preview")}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            </div>
            {/* Formatting toolbar - only show in edit mode */}
            {descriptionMode === "edit" && (
              <TooltipProvider>
                <div className="flex items-center gap-1 p-1 rounded-md bg-secondary/50 mt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertFormat("**")}>
                        <Bold className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertFormat("*")}>
                        <Italic className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-4 mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertLinePrefix("# ")}>
                        <Heading1 className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 1</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertLinePrefix("## ")}>
                        <Heading2 className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 2</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-4 mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertLinePrefix("- ")}>
                        <List className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bullet list</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertLinePrefix("1. ")}>
                        <ListOrdered className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Numbered list</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertLinePrefix("- [ ] ")}>
                        <CheckSquare className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Checkbox</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-4 mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertLinePrefix("> ")}>
                        <Quote className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Quote</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertFormat("`")}>
                        <Code className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Inline code</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertFormat("[", "](url)")}>
                        <LinkIcon className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Link</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertLinePrefix("---\n")}>
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Divider</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
          </CardHeader>
          <CardContent>
            {descriptionMode === "edit" ? (
              <Textarea
                ref={descriptionRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a detailed description...

You can use markdown formatting:
**bold** for emphasis
*italic* for subtle emphasis  
# Heading for sections
- bullet points for lists
- [ ] checkboxes for tasks
> quotes for callouts
`code` for inline code"
                className="min-h-[300px] resize-y font-mono text-sm leading-relaxed border-none shadow-none focus-visible:ring-0 p-0 field-sizing-fixed"
              />
            ) : (
              <div className="min-h-[200px]">
                {description.trim() ? (
                  <MarkdownRenderer content={description} />
                ) : (
                  <div className="text-muted-foreground italic text-sm py-8 text-center">
                    No description yet. Click &quot;Edit&quot; to add one.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time log - Enhanced with inline editing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Time Log</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Total: <span className="font-semibold text-primary">{formatMinutes(totalMinutes)}</span>
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTimeOpen(true)}>
              <Clock className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No time entries logged yet.</p>
                <Button variant="link" size="sm" className="mt-2" onClick={() => setTimeOpen(true)}>
                  Log your first entry
                </Button>
              </div>
            ) : (
              entries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="group rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                  >
                    {editingEntryId === entry.id ? (
                      /* Edit mode for time entry */
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Hours</label>
                              <Input
                                type="number"
                                min="0"
                                value={entryHours}
                                onChange={(e) => setEntryHours(e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Minutes</label>
                              <Input
                                type="number"
                                min="0"
                                max="59"
                                value={entryMinutes}
                                onChange={(e) => setEntryMinutes(e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Date</label>
                              <Input
                                type="date"
                                value={entryDate}
                                onChange={(e) => setEntryDate(e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Notes (supports markdown)</label>
                          <Textarea
                            value={entryNotes}
                            onChange={(e) => setEntryNotes(e.target.value)}
                            placeholder="What did you work on?"
                            rows={2}
                            className="mt-1 field-sizing-fixed"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEntryId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const h = Number.parseInt(entryHours) || 0
                              const m = Number.parseInt(entryMinutes) || 0
                              if (h > 0 || m > 0) {
                                updateTimeEntry(entry.id, {
                                  hours: h,
                                  minutes: m,
                                  date: new Date(entryDate),
                                  notes: entryNotes.trim(),
                                })
                              }
                              setEditingEntryId(null)
                            }}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View mode for time entry */
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="text-center min-w-[70px] py-1 px-2 rounded bg-primary/10">
                              <p className="text-lg font-bold text-primary">
                                {formatMinutes(entry.hours * 60 + entry.minutes)}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="text-xs text-muted-foreground mb-1">
                                {new Date(entry.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              {entry.notes ? (
                                <div className="text-sm overflow-hidden">
                                  <MarkdownRenderer content={entry.notes} className="text-sm" />
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No notes</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingEntryId(entry.id)
                                setEntryHours(String(entry.hours))
                                setEntryMinutes(String(entry.minutes))
                                setEntryDate(new Date(entry.date).toISOString().split("T")[0])
                                setEntryNotes(entry.notes || "")
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteTimeEntry(entry.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Task metadata */}
        <div className="text-xs text-muted-foreground flex items-center gap-4 pb-6">
          <span>Created {formatDate(task.createdAt)}</span>
          <span>•</span>
          <span>Updated {formatDate(task.updatedAt)}</span>
        </div>
      </div>

      <TimeEntryDialog open={timeOpen} onOpenChange={setTimeOpen} taskId={task.id} />
    </div>
  )
}
