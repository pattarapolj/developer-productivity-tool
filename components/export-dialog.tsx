"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ComponentProps } from "react"
import ExcelJS from "exceljs"

import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Download, FileSpreadsheet, FileJson, Table2 } from "lucide-react"

type ExportMode = "tasks" | "timeEntries" | "projects" | "all"
type ExportFormat = "xlsx" | "csv" | "json"

interface ExportDialogProps {
  isOpen: boolean
  onOpenChange: NonNullable<ComponentProps<typeof Dialog>["onOpenChange"]>
}

const toDate = (value: Date | string | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateISO = (value: Date | string | null | undefined) => {
  const date = toDate(value)
  return date ? date.toISOString() : ""
}

const formatDateDisplay = (value: Date | string | null | undefined) => {
  const date = toDate(value)
  return date ? date.toLocaleDateString() : ""
}

export function ExportDialog({ isOpen, onOpenChange }: ExportDialogProps) {
  const { projects, tasks, timeEntries, getTimeForTask } = useToolingTrackerStore()
  const { toast } = useToast()

  const [mode, setMode] = useState<ExportMode>("all")
  const [format, setFormat] = useState<ExportFormat>("xlsx")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [taskFilter, setTaskFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [includeMetadata, setIncludeMetadata] = useState(true)

  useEffect(() => {
    if (!isOpen) {
      setMode("all")
      setFormat("xlsx")
      setProjectFilter("all")
      setTaskFilter("all")
      setStartDate("")
      setEndDate("")
      setIsExporting(false)
      setIncludeMetadata(true)
    }
  }, [isOpen])

  useEffect(() => {
    setTaskFilter("all")
  }, [projectFilter])

  const projectLookup = useMemo(() => {
    return projects.reduce<Record<string, { name: string; color: string; jiraKey: string | null }>>((acc, project) => {
      acc[project.id] = { name: project.name, color: project.color, jiraKey: project.jiraKey }
      return acc
    }, {})
  }, [projects])

  const taskLookup = useMemo(() => {
    return tasks.reduce<Record<string, { title: string; projectId: string; status: string; priority: string }>>((acc, task) => {
      acc[task.id] = { title: task.title, projectId: task.projectId, status: task.status, priority: task.priority }
      return acc
    }, {})
  }, [tasks])

  const tasksInScope = useMemo(() => {
    return tasks.filter((task) => (projectFilter === "all" ? true : task.projectId === projectFilter))
  }, [tasks, projectFilter])

  const startBoundary = useMemo(() => (startDate ? new Date(startDate) : null), [startDate])
  const endBoundary = useMemo(() => (endDate ? new Date(`${endDate}T23:59:59.999Z`) : null), [endDate])

  const withinRange = useCallback((value: Date | string | null | undefined) => {
    if (!startBoundary && !endBoundary) return true
    const date = toDate(value)
    if (!date) return false
    if (startBoundary && date < startBoundary) return false
    if (endBoundary && date > endBoundary) return false
    return true
  }, [startBoundary, endBoundary])

  const filteredProjects = useMemo(() => {
    if (projectFilter === "all") return projects
    return projects.filter((p) => p.id === projectFilter)
  }, [projects, projectFilter])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (projectFilter !== "all" && task.projectId !== projectFilter) return false
      if (taskFilter !== "all" && task.id !== taskFilter) return false
      const taskDate = toDate(task.dueDate) ?? toDate(task.createdAt)
      return withinRange(taskDate)
    })
  }, [tasks, projectFilter, taskFilter, withinRange])

  const filteredEntries = useMemo(() => {
    return timeEntries.filter((entry) => {
      const entryTask = tasks.find((task) => task.id === entry.taskId)
      if (!entryTask) return false
      if (projectFilter !== "all" && entryTask.projectId !== projectFilter) return false
      if (taskFilter !== "all" && entry.taskId !== taskFilter) return false
      return withinRange(entry.date)
    })
  }, [timeEntries, tasks, projectFilter, taskFilter, withinRange])

  // Build comprehensive data structures for export
  const buildProjectsData = () => {
    return filteredProjects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id)
      const projectEntries = timeEntries.filter((e) => {
        const task = tasks.find((t) => t.id === e.taskId)
        return task?.projectId === project.id
      })
      const totalMinutes = projectEntries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0)
      
      return {
        project_id: project.id,
        project_name: project.name,
        project_color: project.color,
        jira_key: project.jiraKey || "",
        subcategories: project.subcategories.join("; "),
        subcategory_count: project.subcategories.length,
        total_tasks: projectTasks.length,
        tasks_todo: projectTasks.filter((t) => t.status === "todo").length,
        tasks_in_progress: projectTasks.filter((t) => t.status === "in-progress").length,
        tasks_done: projectTasks.filter((t) => t.status === "done").length,
        completion_rate: projectTasks.length > 0 
          ? Math.round((projectTasks.filter((t) => t.status === "done").length / projectTasks.length) * 100) 
          : 0,
        total_time_entries: projectEntries.length,
        total_minutes_logged: totalMinutes,
        total_hours_logged: Math.round(totalMinutes / 60 * 100) / 100,
        total_story_points: projectTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
        created_at: formatDateISO(project.createdAt),
        created_at_display: formatDateDisplay(project.createdAt),
      }
    })
  }

  const buildTasksData = () => {
    return filteredTasks.map((task) => {
      const taskEntries = timeEntries.filter((e) => e.taskId === task.id)
      const totalMinutes = getTimeForTask(task.id)
      const project = projectLookup[task.projectId]
      
      return {
        task_id: task.id,
        task_title: task.title,
        task_description: task.description || "",
        project_id: task.projectId,
        project_name: project?.name || "Unknown",
        project_jira_key: project?.jiraKey || "",
        task_jira_key: task.jiraKey || "",
        status: task.status,
        priority: task.priority,
        subcategory: task.subcategory || "",
        story_points: task.storyPoints,
        due_date: formatDateISO(task.dueDate),
        due_date_display: formatDateDisplay(task.dueDate),
        is_overdue: task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date() ? "Yes" : "No",
        total_time_entries: taskEntries.length,
        total_minutes_logged: totalMinutes,
        total_hours_logged: Math.round(totalMinutes / 60 * 100) / 100,
        created_at: formatDateISO(task.createdAt),
        created_at_display: formatDateDisplay(task.createdAt),
        updated_at: formatDateISO(task.updatedAt),
        updated_at_display: formatDateDisplay(task.updatedAt),
        days_since_created: Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        days_in_current_status: Math.floor((Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
      }
    })
  }

  const buildTimeEntriesData = () => {
    return filteredEntries.map((entry) => {
      const task = taskLookup[entry.taskId]
      const project = task ? projectLookup[task.projectId] : null
      const entryDate = toDate(entry.date)
      
      return {
        entry_id: entry.id,
        task_id: entry.taskId,
        task_title: task?.title || "Unknown",
        task_status: task?.status || "",
        task_priority: task?.priority || "",
        project_id: task?.projectId || "",
        project_name: project?.name || "Unknown",
        entry_date: formatDateISO(entry.date),
        entry_date_display: formatDateDisplay(entry.date),
        year: entryDate?.getFullYear() || "",
        month: entryDate ? entryDate.getMonth() + 1 : "",
        month_name: entryDate?.toLocaleDateString("en-US", { month: "long" }) || "",
        week_number: entryDate ? getWeekNumber(entryDate) : "",
        day_of_week: entryDate?.toLocaleDateString("en-US", { weekday: "long" }) || "",
        day_of_week_num: entryDate?.getDay() ?? "",
        hours: entry.hours,
        minutes: entry.minutes,
        total_minutes: entry.hours * 60 + entry.minutes,
        total_hours_decimal: Math.round((entry.hours * 60 + entry.minutes) / 60 * 100) / 100,
        notes: entry.notes || "",
        has_notes: entry.notes ? "Yes" : "No",
        created_at: formatDateISO(entry.createdAt),
      }
    })
  }

  // Build daily aggregation for analytics
  const buildDailyAggregation = () => {
    const dailyMap = new Map<string, { 
      date: string, 
      totalMinutes: number, 
      entryCount: number, 
      taskCount: Set<string>,
      projectCount: Set<string>
    }>()

    filteredEntries.forEach((entry) => {
      const dateKey = formatDateISO(entry.date).split("T")[0]
      const task = taskLookup[entry.taskId]
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { 
          date: dateKey, 
          totalMinutes: 0, 
          entryCount: 0, 
          taskCount: new Set(),
          projectCount: new Set()
        })
      }
      
      const day = dailyMap.get(dateKey)!
      day.totalMinutes += entry.hours * 60 + entry.minutes
      day.entryCount += 1
      day.taskCount.add(entry.taskId)
      if (task) day.projectCount.add(task.projectId)
    })

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => {
        const date = new Date(day.date)
        return {
          date: day.date,
          date_display: formatDateDisplay(day.date),
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          month_name: date.toLocaleDateString("en-US", { month: "long" }),
          week_number: getWeekNumber(date),
          day_of_week: date.toLocaleDateString("en-US", { weekday: "long" }),
          total_minutes: day.totalMinutes,
          total_hours_decimal: Math.round(day.totalMinutes / 60 * 100) / 100,
          entry_count: day.entryCount,
          unique_tasks: day.taskCount.size,
          unique_projects: day.projectCount.size,
          focus_score: day.projectCount.size > 0 ? Math.round(100 / day.projectCount.size) : 0,
        }
      })
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      if (format === "json") {
        await exportJSON()
      } else if (format === "csv") {
        await exportCSV()
      } else {
        await exportExcel()
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({ 
        title: "Export failed", 
        description: `Error: ${errorMessage}. Please try again.`, 
        variant: "destructive" 
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportJSON = async () => {
    const exportData: Record<string, unknown> = {}
    
    if (includeMetadata) {
      exportData.metadata = {
        exported_at: new Date().toISOString(),
        export_type: mode,
        filters: {
          project: projectFilter === "all" ? "All Projects" : projectLookup[projectFilter]?.name,
          task: taskFilter === "all" ? "All Tasks" : taskLookup[taskFilter]?.title,
          date_range: {
            start: startDate || null,
            end: endDate || null,
          },
        },
        record_counts: {
          projects: mode === "all" || mode === "projects" ? filteredProjects.length : 0,
          tasks: mode === "all" || mode === "tasks" ? filteredTasks.length : 0,
          time_entries: mode === "all" || mode === "timeEntries" ? filteredEntries.length : 0,
        },
      }
    }

    if (mode === "all" || mode === "projects") {
      exportData.projects = buildProjectsData()
    }
    if (mode === "all" || mode === "tasks") {
      exportData.tasks = buildTasksData()
    }
    if (mode === "all" || mode === "timeEntries") {
      exportData.time_entries = buildTimeEntriesData()
    }
    if (mode === "all") {
      exportData.daily_aggregation = buildDailyAggregation()
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    downloadBlob(blob, `productivity-export-${new Date().toISOString().split("T")[0]}.json`)
    
    const totalRecords = Object.values(exportData)
      .filter(Array.isArray)
      .reduce((sum, arr) => sum + arr.length, 0)
    toast({ title: "Export complete", description: `${totalRecords} records exported to JSON` })
  }

  const exportCSV = async () => {
    const datasets: { name: string; data: Record<string, unknown>[] }[] = []

    if (mode === "all" || mode === "projects") {
      datasets.push({ name: "projects", data: buildProjectsData() })
    }
    if (mode === "all" || mode === "tasks") {
      datasets.push({ name: "tasks", data: buildTasksData() })
    }
    if (mode === "all" || mode === "timeEntries") {
      datasets.push({ name: "time_entries", data: buildTimeEntriesData() })
    }
    if (mode === "all") {
      datasets.push({ name: "daily_aggregation", data: buildDailyAggregation() })
    }

    // Export each dataset as separate CSV
    for (const dataset of datasets) {
      if (dataset.data.length === 0) continue
      
      const headers = Object.keys(dataset.data[0])
      const rows = dataset.data.map((row) => 
        headers.map((h) => {
          const val = row[h]
          if (val === null || val === undefined) return ""
          if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return String(val)
        }).join(",")
      )
      
      const csv = [headers.join(","), ...rows].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      downloadBlob(blob, `productivity-${dataset.name}-${new Date().toISOString().split("T")[0]}.csv`)
    }

    const totalRecords = datasets.reduce((sum, d) => sum + d.data.length, 0)
    toast({ title: "Export complete", description: `${totalRecords} records exported to ${datasets.length} CSV files` })
  }

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.created = new Date()
    workbook.creator = "Developer Productivity Tool"

    // Metadata sheet
    if (includeMetadata) {
      const metaSheet = workbook.addWorksheet("Export Info")
      metaSheet.columns = [
        { header: "Property", key: "property", width: 25 },
        { header: "Value", key: "value", width: 40 },
      ]
      metaSheet.addRows([
        { property: "Exported At", value: new Date().toISOString() },
        { property: "Export Type", value: mode === "all" ? "Complete Export" : mode },
        { property: "Project Filter", value: projectFilter === "all" ? "All Projects" : projectLookup[projectFilter]?.name },
        { property: "Task Filter", value: taskFilter === "all" ? "All Tasks" : taskLookup[taskFilter]?.title },
        { property: "Date Range Start", value: startDate || "Not set" },
        { property: "Date Range End", value: endDate || "Not set" },
        { property: "Total Projects", value: filteredProjects.length },
        { property: "Total Tasks", value: filteredTasks.length },
        { property: "Total Time Entries", value: filteredEntries.length },
      ])
      applyWorksheetStyling(metaSheet)
    }

    // Projects sheet
    if (mode === "all" || mode === "projects") {
      const projectsData = buildProjectsData()
      if (projectsData.length > 0) {
        const sheet = workbook.addWorksheet("Projects")
        sheet.columns = PROJECT_COLUMNS.map((c) => ({ ...c }))
        projectsData.forEach((row) => sheet.addRow(row))
        applyWorksheetStyling(sheet)
      }
    }

    // Tasks sheet
    if (mode === "all" || mode === "tasks") {
      const tasksData = buildTasksData()
      if (tasksData.length > 0) {
        const sheet = workbook.addWorksheet("Tasks")
        sheet.columns = TASK_COLUMNS.map((c) => ({ ...c }))
        tasksData.forEach((row) => sheet.addRow(row))
        applyWorksheetStyling(sheet)
      }
    }

    // Time Entries sheet
    if (mode === "all" || mode === "timeEntries") {
      const entriesData = buildTimeEntriesData()
      if (entriesData.length > 0) {
        const sheet = workbook.addWorksheet("Time Entries")
        sheet.columns = TIME_ENTRY_COLUMNS.map((c) => ({ ...c }))
        entriesData.forEach((row) => sheet.addRow(row))
        applyWorksheetStyling(sheet)
      }
    }

    // Daily Aggregation sheet (for analytics)
    if (mode === "all") {
      const dailyData = buildDailyAggregation()
      if (dailyData.length > 0) {
        const sheet = workbook.addWorksheet("Daily Summary")
        sheet.columns = DAILY_COLUMNS.map((c) => ({ ...c }))
        dailyData.forEach((row) => sheet.addRow(row))
        applyWorksheetStyling(sheet)
      }
    }

    const filename = `productivity-export-${new Date().toISOString().split("T")[0]}.xlsx`
    await downloadWorkbook(workbook, filename)
    
    const sheetCount = workbook.worksheets.length
    toast({ title: "Export complete", description: `${sheetCount} sheets saved to ${filename}` })
  }

  const getPreviewCounts = () => {
    const counts: { label: string; count: number }[] = []
    if (mode === "all" || mode === "projects") {
      counts.push({ label: "Projects", count: filteredProjects.length })
    }
    if (mode === "all" || mode === "tasks") {
      counts.push({ label: "Tasks", count: filteredTasks.length })
    }
    if (mode === "all" || mode === "timeEntries") {
      counts.push({ label: "Time Entries", count: filteredEntries.length })
    }
    return counts
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your productivity data for analysis in external tools like Excel, Python, or BI platforms.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="data">Data Selection</TabsTrigger>
            <TabsTrigger value="format">Format & Options</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>What to Export</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as ExportMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4" />
                      Complete Export (All Data)
                    </div>
                  </SelectItem>
                  <SelectItem value="projects">Projects Summary</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="timeEntries">Time Entries</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Complete export includes all sheets plus daily aggregations for analytics.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filter by Project</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filter by Task</Label>
                <Select value={taskFilter} onValueChange={setTaskFilter} disabled={tasksInScope.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={tasksInScope.length === 0 ? "No tasks" : "All tasks"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tasks</SelectItem>
                    {tasksInScope.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Preview counts */}
            <div className="p-3 rounded-lg bg-secondary/50 border">
              <p className="text-xs text-muted-foreground mb-2">Records to export:</p>
              <div className="flex flex-wrap gap-2">
                {getPreviewCounts().map(({ label, count }) => (
                  <Badge key={label} variant={count > 0 ? "default" : "secondary"}>
                    {label}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="format" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={format === "xlsx" ? "default" : "outline"}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setFormat("xlsx")}
                >
                  <FileSpreadsheet className="w-5 h-5 mb-1" />
                  <span className="text-xs">Excel (.xlsx)</span>
                </Button>
                <Button
                  variant={format === "csv" ? "default" : "outline"}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setFormat("csv")}
                >
                  <Table2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">CSV</span>
                </Button>
                <Button
                  variant={format === "json" ? "default" : "outline"}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setFormat("json")}
                >
                  <FileJson className="w-5 h-5 mb-1" />
                  <span className="text-xs">JSON</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border">
              <p className="text-sm font-medium">Format Details</p>
              {format === "xlsx" && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Multiple sheets organized by data type</li>
                  <li>• Formatted headers and styled cells</li>
                  <li>• Ready for pivot tables and analysis</li>
                  <li>• Best for Excel, Google Sheets, LibreOffice</li>
                </ul>
              )}
              {format === "csv" && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Separate CSV file for each data type</li>
                  <li>• Universal compatibility</li>
                  <li>• Best for Python, R, database import</li>
                  <li>• UTF-8 encoded with proper escaping</li>
                </ul>
              )}
              {format === "json" && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Structured nested data format</li>
                  <li>• Includes metadata and relationships</li>
                  <li>• Best for programming, APIs, web apps</li>
                  <li>• Human-readable with pretty printing</li>
                </ul>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="metadata" 
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
              />
              <Label htmlFor="metadata" className="text-sm font-normal cursor-pointer">
                Include export metadata (filters, timestamps, counts)
              </Label>
            </div>

            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-xs font-medium text-primary mb-1">Downstream Processing Tips</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• All dates include ISO format for easy parsing</li>
                <li>• IDs are preserved for relational joins</li>
                <li>• Time entries include week/month for grouping</li>
                <li>• Daily aggregation ready for time series analysis</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || getPreviewCounts().every((c) => c.count === 0)}>
            {isExporting ? "Preparing..." : `Export ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const downloadWorkbook = async (workbook: ExcelJS.Workbook, filename: string) => {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  downloadBlob(blob, filename)
}

const applyWorksheetStyling = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1)
  const border = {
    top: { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    left: { style: "thin", color: { argb: "FFE5E7EB" } },
    right: { style: "thin", color: { argb: "FFE5E7EB" } },
  } as ExcelJS.Borders

  headerRow.height = 22
  headerRow.eachCell((cell: ExcelJS.Cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } }
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true }
    cell.border = border
  })

  worksheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row, rowNumber: number) => {
    if (rowNumber === 1) return
    row.height = 18
    row.eachCell((cell: ExcelJS.Cell) => {
      cell.border = border
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true }
      if (rowNumber % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }
      }
    })
  })
}

// Column definitions
const PROJECT_COLUMNS: readonly Partial<ExcelJS.Column>[] = [
  { header: "Project ID", key: "project_id", width: 20 },
  { header: "Project Name", key: "project_name", width: 24 },
  { header: "Color", key: "project_color", width: 12 },
  { header: "Jira Key", key: "jira_key", width: 14 },
  { header: "Subcategories", key: "subcategories", width: 30 },
  { header: "# Subcategories", key: "subcategory_count", width: 14 },
  { header: "Total Tasks", key: "total_tasks", width: 12 },
  { header: "To Do", key: "tasks_todo", width: 10 },
  { header: "In Progress", key: "tasks_in_progress", width: 12 },
  { header: "Done", key: "tasks_done", width: 10 },
  { header: "Completion %", key: "completion_rate", width: 14 },
  { header: "Time Entries", key: "total_time_entries", width: 14 },
  { header: "Minutes Logged", key: "total_minutes_logged", width: 16 },
  { header: "Hours Logged", key: "total_hours_logged", width: 14 },
  { header: "Story Points", key: "total_story_points", width: 14 },
  { header: "Created At (ISO)", key: "created_at", width: 22 },
  { header: "Created At", key: "created_at_display", width: 14 },
]

const TASK_COLUMNS: readonly Partial<ExcelJS.Column>[] = [
  { header: "Task ID", key: "task_id", width: 20 },
  { header: "Title", key: "task_title", width: 32 },
  { header: "Description", key: "task_description", width: 40 },
  { header: "Project ID", key: "project_id", width: 20 },
  { header: "Project Name", key: "project_name", width: 20 },
  { header: "Project Jira Key", key: "project_jira_key", width: 16 },
  { header: "Task Jira Key", key: "task_jira_key", width: 16 },
  { header: "Status", key: "status", width: 14 },
  { header: "Priority", key: "priority", width: 12 },
  { header: "Subcategory", key: "subcategory", width: 16 },
  { header: "Story Points", key: "story_points", width: 14 },
  { header: "Due Date (ISO)", key: "due_date", width: 22 },
  { header: "Due Date", key: "due_date_display", width: 14 },
  { header: "Is Overdue", key: "is_overdue", width: 12 },
  { header: "Time Entries", key: "total_time_entries", width: 14 },
  { header: "Minutes Logged", key: "total_minutes_logged", width: 16 },
  { header: "Hours Logged", key: "total_hours_logged", width: 14 },
  { header: "Created At (ISO)", key: "created_at", width: 22 },
  { header: "Created At", key: "created_at_display", width: 14 },
  { header: "Updated At (ISO)", key: "updated_at", width: 22 },
  { header: "Updated At", key: "updated_at_display", width: 14 },
  { header: "Days Since Created", key: "days_since_created", width: 18 },
  { header: "Days in Status", key: "days_in_current_status", width: 16 },
]

const TIME_ENTRY_COLUMNS: readonly Partial<ExcelJS.Column>[] = [
  { header: "Entry ID", key: "entry_id", width: 20 },
  { header: "Task ID", key: "task_id", width: 20 },
  { header: "Task Title", key: "task_title", width: 32 },
  { header: "Task Status", key: "task_status", width: 14 },
  { header: "Task Priority", key: "task_priority", width: 14 },
  { header: "Project ID", key: "project_id", width: 20 },
  { header: "Project Name", key: "project_name", width: 20 },
  { header: "Entry Date (ISO)", key: "entry_date", width: 22 },
  { header: "Entry Date", key: "entry_date_display", width: 14 },
  { header: "Year", key: "year", width: 8 },
  { header: "Month", key: "month", width: 8 },
  { header: "Month Name", key: "month_name", width: 14 },
  { header: "Week #", key: "week_number", width: 10 },
  { header: "Day of Week", key: "day_of_week", width: 14 },
  { header: "Day # (0-6)", key: "day_of_week_num", width: 12 },
  { header: "Hours", key: "hours", width: 10 },
  { header: "Minutes", key: "minutes", width: 10 },
  { header: "Total Minutes", key: "total_minutes", width: 14 },
  { header: "Hours (Decimal)", key: "total_hours_decimal", width: 16 },
  { header: "Notes", key: "notes", width: 40 },
  { header: "Has Notes", key: "has_notes", width: 12 },
  { header: "Created At (ISO)", key: "created_at", width: 22 },
]

const DAILY_COLUMNS: readonly Partial<ExcelJS.Column>[] = [
  { header: "Date", key: "date", width: 14 },
  { header: "Date Display", key: "date_display", width: 14 },
  { header: "Year", key: "year", width: 8 },
  { header: "Month", key: "month", width: 8 },
  { header: "Month Name", key: "month_name", width: 14 },
  { header: "Week #", key: "week_number", width: 10 },
  { header: "Day of Week", key: "day_of_week", width: 14 },
  { header: "Total Minutes", key: "total_minutes", width: 14 },
  { header: "Hours (Decimal)", key: "total_hours_decimal", width: 16 },
  { header: "Entry Count", key: "entry_count", width: 14 },
  { header: "Unique Tasks", key: "unique_tasks", width: 14 },
  { header: "Unique Projects", key: "unique_projects", width: 16 },
  { header: "Focus Score", key: "focus_score", width: 14 },
]
