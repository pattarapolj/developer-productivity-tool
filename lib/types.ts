export type Priority = "low" | "medium" | "high"
export type TaskStatus = "backlog" | "todo" | "in-progress" | "done"

export type ProjectColor = "blue" | "green" | "purple" | "orange" | "pink"

export interface Project {
  id: string
  name: string
  color: ProjectColor
  createdAt: Date
  subcategories: string[]
  jiraKey: string | null
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dueDate: Date | null
  subcategory: string | null
  jiraKey: string | null
  storyPoints: number | null
  projectId: string
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  isArchived: boolean
  archivedAt: Date | null
  blockedBy: string[] // Task IDs that block this task
  blocking: string[] // Task IDs that this task blocks
}

export interface BoardFilters {
  search: string
  projectId: string | null
  priority: Priority | "all"
  dateRange: "all" | "today" | "week" | "month" | "quarter" | "custom"
  customStart: Date | null
  customEnd: Date | null
  showArchived: boolean
}

export interface FilterPreset {
  id: string
  name: string
  filters: BoardFilters
  createdAt: Date
}

export type ComparisonPeriod = "week-over-week" | "month-over-month" | "quarter-over-quarter"

export interface ComparisonData {
  current: {
    tasksCompleted: number
    tasksCreated: number
    totalTime: number
    avgCompletionTime: number
  }
  previous: {
    tasksCompleted: number
    tasksCreated: number
    totalTime: number
    avgCompletionTime: number
  }
  delta: {
    tasksCompleted: number
    tasksCompletedPercent: number
    tasksCreated: number
    tasksCreatedPercent: number
    totalTime: number
    totalTimePercent: number
    avgCompletionTime: number
    avgCompletionTimePercent: number
  }
}

export type TimeEntryType = "development" | "meeting" | "review" | "research" | "debugging" | "other"

export interface TimeEntry {
  id: string
  taskId: string
  hours: number
  minutes: number
  date: Date
  notes: string
  type: TimeEntryType
  createdAt: Date
}

export interface TaskWithTime extends Task {
  totalMinutes: number
  timeEntries: TimeEntry[]
  project?: Project
}

export type ActivityType = 
  | "task_created"
  | "task_updated" 
  | "task_status_changed"
  | "task_archived"
  | "task_unarchived"
  | "task_deleted"
  | "time_logged"
  | "comment_added"
  | "attachment_added"

export interface Activity {
  id: string
  taskId: string
  type: ActivityType
  description: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface TaskComment {
  id: string
  taskId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface TaskAttachment {
  id: string
  taskId: string
  fileName: string
  fileSize: number
  fileType: string
  dataUrl: string // base64 data URL for small files
  uploadedAt: Date
}

export interface TaskHistory {
  id: string
  taskId: string
  field: string
  oldValue: string
  newValue: string
  changedAt: Date
}

export interface HistoryEntry {
  id: string
  taskId: string
  field: string
  fieldLabel: string
  oldValue: string
  newValue: string
  oldValueFormatted: string
  newValueFormatted: string
  changedAt: Date
  changeType: 'created' | 'updated' | 'status_changed' | 'deleted'
}

export interface TimeByEntryType {
  type: TimeEntryType
  minutes: number
  percentage: number
}

export interface DeepWorkSession {
  date: Date
  duration: number
  taskId: string
}

export interface FocusTimeMetrics {
  timeByType: TimeByEntryType[]
  totalMinutes: number
  meetingMinutes: number
  developmentMinutes: number
  deepWorkSessions: DeepWorkSession[]
}

export interface StandupData {
  yesterday: Task[]
  today: Task[]
  blockers: Task[]
}

export interface WeeklySummaryData {
  tasksCompleted: number
  totalMinutes: number
  avgDailyMinutes: number
  mostProductiveDay: string
  timeByType: Record<TimeEntryType, number>
  dailyTrend: { day: string; minutes: number }[]
}

export interface VelocityWeekData {
  week: string
  weekStart: Date
  weekEnd: Date
  completed: number
  avgCycleTime: number
}

export interface VelocityMetrics {
  weeklyData: VelocityWeekData[]
  avgVelocity: number
  avgCycleTime: number
  trend: 'up' | 'down' | 'stable'
}

export interface TaskEfficiencyData {
  category: string
  avgCycleTimeDays: number
  avgTimeSpentMinutes: number
  taskCount: number
}

export interface TaskEfficiencyMetrics {
  byPriority: TaskEfficiencyData[]
  byProject: TaskEfficiencyData[]
  overallAvgCycleTime: number
  overallAvgTimeSpent: number
}
