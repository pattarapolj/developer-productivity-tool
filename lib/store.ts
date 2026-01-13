import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { 
  Project, 
  Task, 
  TimeEntry, 
  ProjectColor, 
  TaskStatus, 
  Priority, 
  BoardFilters,
  Activity,
  TaskComment,
  TaskAttachment,
  TaskHistory,
  TimeEntryType,
  TimeByEntryType,
  DeepWorkSession,
  VelocityWeekData,
  TaskEfficiencyMetrics,
  HistoryEntry,
  ComparisonPeriod,
  ComparisonData
} from "./types"

interface ToolingTrackerState {
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  activities: Activity[]
  comments: TaskComment[]
  attachments: TaskAttachment[]
  history: TaskHistory[]
  selectedProjectId: string | null
  boardFilters: BoardFilters

  // Project actions
  addProject: (name: string, color: ProjectColor, jiraKey?: string | null) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setSelectedProject: (id: string | null) => void
  addSubcategoryToProject: (projectId: string, name: string) => void

  // Task actions
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt" | "isArchived" | "archivedAt" | "blockedBy" | "blocking"> & {
    createdAt?: Date
    completedAt?: Date | null
  }) => Task | undefined
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  
  // Archive actions
  archiveTask: (id: string) => void
  unarchiveTask: (id: string) => void
  bulkArchiveTasks: (ids: string[]) => void
  bulkDeleteTasks: (ids: string[]) => void
  autoArchiveOldTasks: (daysOld: number) => number
  
  // Board filter actions
  setBoardFilters: (filters: Partial<BoardFilters>) => void
  resetBoardFilters: () => void

  // Time entry actions
  addTimeEntry: (entry: Omit<TimeEntry, "id" | "createdAt">) => void
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => void

  // Computed helpers
  getTasksForProject: (projectId: string) => Task[]
  getTimeForTask: (taskId: string) => number
  getTotalTimeForProject: (projectId: string) => number
  getFilteredTasks: () => Task[]
  getArchivedTasks: () => Task[]
  getArchiveStats: () => { total: number; byProject: Record<string, number> }
  getTimeByEntryType: (startDate?: Date, endDate?: Date) => TimeByEntryType[]
  getDeepWorkSessions: (minHours: number) => DeepWorkSession[]
  getActivitiesByDateRange: (startDate: Date, endDate: Date) => Activity[]
  getTasksCompletedInRange: (startDate: Date, endDate: Date) => Task[]
  getTimeBreakdownByType: (startDate: Date, endDate: Date) => Record<TimeEntryType, number>
  getProductivityTrend: (startDate: Date, endDate: Date) => { day: string; minutes: number }[]
  getComparisonData: (period: ComparisonPeriod, referenceDate?: Date) => ComparisonData
  getVelocityData: (weeksBack: number) => VelocityWeekData[]
  getAverageCycleTime: (projectId?: string) => number
  getTaskEfficiencyMetrics: () => TaskEfficiencyMetrics
  
  // Activity actions
  addActivity: (activity: Omit<Activity, "id" | "createdAt">) => void
  getActivitiesForTask: (taskId: string) => Activity[]
  
  // Comment actions
  addComment: (comment: Omit<TaskComment, "id" | "createdAt" | "updatedAt">) => void
  updateComment: (id: string, content: string) => void
  deleteComment: (id: string) => void
  getCommentsForTask: (taskId: string) => TaskComment[]
  
  // Attachment actions
  addAttachment: (attachment: Omit<TaskAttachment, "id" | "uploadedAt">) => void
  deleteAttachment: (id: string) => void
  getAttachmentsForTask: (taskId: string) => TaskAttachment[]
  
  // History actions
  addHistory: (history: Omit<TaskHistory, "id" | "changedAt">) => void
  getHistoryForTask: (taskId: string) => TaskHistory[]
  trackFieldChange: (taskId: string, field: string, oldValue: unknown, newValue: unknown) => void
  getFormattedHistory: (taskId: string) => HistoryEntry[]
  
  // Task dependencies
  addBlocker: (taskId: string, blockedByTaskId: string) => void
  removeBlocker: (taskId: string, blockedByTaskId: string) => void
  getBlockedTasks: () => Task[]
  
  // Seed/Clear data actions
  seedSampleData: (data: { 
    projects: Project[]; 
    tasks: Omit<Task, 'completedAt' | 'blockedBy' | 'blocking'>[]; 
    timeEntries: Omit<TimeEntry, 'type'>[] 
  }) => void
  clearAllData: () => void
}

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15)

const DEFAULT_BOARD_FILTERS: BoardFilters = {
  search: "",
  projectId: null,
  priority: "all",
  dateRange: "all",
  customStart: null,
  customEnd: null,
  showArchived: false,
}

export const useToolingTrackerStore = create<ToolingTrackerState>()(
  persist(
    (set, get) => ({
      projects: [],
      tasks: [],
      timeEntries: [],
      activities: [],
      comments: [],
      attachments: [],
      history: [],
      selectedProjectId: null,
      boardFilters: DEFAULT_BOARD_FILTERS,

      addProject: (name, color, jiraKey) => {
        if (!name?.trim()) {
          console.error('Project name is required')
          return
        }
        const normalizedKey = jiraKey && jiraKey.trim().length > 0 ? jiraKey.trim() : null
        const newProject: Project = {
          id: generateId(),
          name: name.trim(),
          color,
          subcategories: [],
          createdAt: new Date(),
          jiraKey: normalizedKey,
        }
        set((state) => ({ projects: [...state.projects, newProject] }))
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          timeEntries: state.timeEntries.filter((te) => {
            const task = state.tasks.find((t) => t.id === te.taskId)
            return task?.projectId !== id
          }),
        }))
      },

      setSelectedProject: (id) => set({ selectedProjectId: id }),

      addSubcategoryToProject: (projectId, name) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project
            const exists = project.subcategories?.some((sub) => sub.toLowerCase() === name.toLowerCase())
            if (exists) return project
            const updatedSubs = [...(project.subcategories ?? []), name]
            return { ...project, subcategories: updatedSubs }
          }),
        }))
      },

      addTask: (task) => {
        if (!task.title?.trim()) {
          console.error('Task title is required')
          return
        }
        if (!task.projectId) {
          console.error('Task projectId is required')
          return
        }
        // Validate project exists
        const projectExists = get().projects.some(p => p.id === task.projectId)
        if (!projectExists) {
          console.error('Project not found:', task.projectId)
          return
        }
        const taskId = generateId()
        const now = new Date()
        const newTask: Task = {
          ...task,
          id: taskId,
          title: task.title.trim(),
          description: task.description?.trim() || '',
          subcategory: task.subcategory?.trim() || null,
          jiraKey: task.jiraKey?.trim() || null,
          storyPoints: typeof task.storyPoints === "number" ? task.storyPoints : null,
          createdAt: task.createdAt || now,
          updatedAt: now,
          completedAt: task.completedAt || (task.status === 'done' ? now : null),
          isArchived: false,
          archivedAt: null,
          blockedBy: [],
          blocking: [],
        }
        
        // Log activity
        const activity = {
          id: generateId(),
          taskId,
          type: 'task_created' as const,
          description: `Task "${newTask.title}" created`,
          metadata: { projectId: newTask.projectId, status: newTask.status },
          createdAt: now,
        }
        
        set((state) => ({ 
          tasks: [...state.tasks, newTask],
          activities: [...state.activities, activity]
        }))
        
        return newTask
      },

      updateTask: (id, updates) => {
        const task = get().tasks.find(t => t.id === id)
        if (!task) return
        
        const now = new Date()
        const historyEntries: TaskHistory[] = []
        
        // Track field changes
        Object.keys(updates).forEach(key => {
          const oldValue = String(task[key as keyof Task] ?? '')
          const newValue = String(updates[key as keyof Task] ?? '')
          if (oldValue !== newValue) {
            historyEntries.push({
              id: generateId(),
              taskId: id,
              field: key,
              oldValue,
              newValue,
              changedAt: now,
            })
          }
        })
        
        // Check if status changed to done
        const completedAt = updates.status === 'done' && task.status !== 'done' ? now : task.completedAt
        
        // Log activity if status changed
        let activity = null
        if (updates.status && updates.status !== task.status) {
          activity = {
            id: generateId(),
            taskId: id,
            type: 'task_status_changed' as const,
            description: `Status changed from ${task.status} to ${updates.status}`,
            metadata: { oldStatus: task.status, newStatus: updates.status },
            createdAt: now,
          }
        } else {
          activity = {
            id: generateId(),
            taskId: id,
            type: 'task_updated' as const,
            description: `Task updated`,
            metadata: updates,
            createdAt: now,
          }
        }
        
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates, completedAt, updatedAt: now } : t)),
          history: [...state.history, ...historyEntries],
          activities: activity ? [...state.activities, activity] : state.activities,
        }))
      },

      deleteTask: (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (!task) return
        
        const activity = {
          id: generateId(),
          taskId: id,
          type: 'task_deleted' as const,
          description: `Task "${task.title}" deleted`,
          metadata: { title: task.title },
          createdAt: new Date(),
        }
        
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          timeEntries: state.timeEntries.filter((te) => te.taskId !== id),
          activities: [...state.activities, activity],
        }))
      },

      moveTask: (id, status) => {
        const task = get().tasks.find(t => t.id === id)
        if (!task) return
        
        const now = new Date()
        const completedAt = status === 'done' && task.status !== 'done' ? now : task.completedAt
        
        const activity = {
          id: generateId(),
          taskId: id,
          type: 'task_status_changed' as const,
          description: `Status changed from ${task.status} to ${status}`,
          metadata: { oldStatus: task.status, newStatus: status },
          createdAt: now,
        }
        
        const historyEntry = {
          id: generateId(),
          taskId: id,
          field: 'status',
          oldValue: task.status,
          newValue: status,
          changedAt: now,
        }
        
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status, completedAt, updatedAt: now } : t)),
          activities: [...state.activities, activity],
          history: [...state.history, historyEntry],
        }))
      },

      // Archive actions
      archiveTask: (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (!task) return
        
        const now = new Date()
        const activity = {
          id: generateId(),
          taskId: id,
          type: 'task_archived' as const,
          description: `Task "${task.title}" archived`,
          createdAt: now,
        }
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, isArchived: true, archivedAt: now, updatedAt: now } : t
          ),
          activities: [...state.activities, activity],
        }))
      },

      unarchiveTask: (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (!task) return
        
        const now = new Date()
        const activity = {
          id: generateId(),
          taskId: id,
          type: 'task_unarchived' as const,
          description: `Task "${task.title}" restored from archive`,
          createdAt: now,
        }
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, isArchived: false, archivedAt: null, updatedAt: now } : t
          ),
          activities: [...state.activities, activity],
        }))
      },

      bulkArchiveTasks: (ids) => {
        const now = new Date()
        set((state) => ({
          tasks: state.tasks.map((t) =>
            ids.includes(t.id) ? { ...t, isArchived: true, archivedAt: now, updatedAt: now } : t
          ),
        }))
      },

      bulkDeleteTasks: (ids) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => !ids.includes(t.id)),
          timeEntries: state.timeEntries.filter((te) => !ids.includes(te.taskId)),
        }))
      },

      autoArchiveOldTasks: (daysOld) => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysOld)
        const now = new Date()
        
        let archivedCount = 0
        set((state) => {
          const updatedTasks = state.tasks.map((t) => {
            // Only auto-archive completed tasks that are old enough and not already archived
            if (
              t.status === "done" &&
              !t.isArchived &&
              new Date(t.updatedAt) < cutoffDate
            ) {
              archivedCount++
              return { ...t, isArchived: true, archivedAt: now, updatedAt: now }
            }
            return t
          })
          return { tasks: updatedTasks }
        })
        return archivedCount
      },

      // Board filter actions
      setBoardFilters: (filters) => {
        set((state) => ({
          boardFilters: { ...state.boardFilters, ...filters },
        }))
      },

      resetBoardFilters: () => {
        set({ boardFilters: DEFAULT_BOARD_FILTERS })
      },

      addTimeEntry: (entry) => {
        // Validate task exists
        const taskExists = get().tasks.some(t => t.id === entry.taskId)
        if (!taskExists) {
          console.error('Task not found:', entry.taskId)
          return
        }
        // Validate time values
        if (entry.hours < 0 || entry.minutes < 0 || entry.minutes >= 60) {
          console.error('Invalid time values')
          return
        }
        const now = new Date()
        const newEntry: TimeEntry = {
          ...entry,
          id: generateId(),
          notes: entry.notes?.trim() || '',
          type: entry.type || 'development',
          createdAt: now,
        }
        
        // Log activity
        const task = get().tasks.find(t => t.id === entry.taskId)
        const activity = {
          id: generateId(),
          taskId: entry.taskId,
          type: 'time_logged' as const,
          description: `Logged ${entry.hours}h ${entry.minutes}m (${entry.type || 'development'})`,
          metadata: { hours: entry.hours, minutes: entry.minutes, type: entry.type },
          createdAt: now,
        }
        
        set((state) => ({ 
          timeEntries: [...state.timeEntries, newEntry],
          activities: [...state.activities, activity]
        }))
      },

      updateTimeEntry: (id, updates) => {
        set((state) => ({
          timeEntries: state.timeEntries.map((te) => (te.id === id ? { ...te, ...updates } : te)),
        }))
      },

      deleteTimeEntry: (id) => {
        set((state) => ({
          timeEntries: state.timeEntries.filter((te) => te.id !== id),
        }))
      },

      getTasksForProject: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId && !t.isArchived)
      },

      getTimeForTask: (taskId) => {
        const entries = get().timeEntries.filter((te) => te.taskId === taskId)
        return entries.reduce((acc, e) => acc + e.hours * 60 + e.minutes, 0)
      },

      getTotalTimeForProject: (projectId) => {
        const tasks = get().tasks.filter((t) => t.projectId === projectId)
        const taskIds = tasks.map((t) => t.id)
        const entries = get().timeEntries.filter((te) => taskIds.includes(te.taskId))
        return entries.reduce((acc, e) => acc + e.hours * 60 + e.minutes, 0)
      },

      getFilteredTasks: () => {
        const { tasks, boardFilters, selectedProjectId } = get()
        const { search, projectId, priority, dateRange, customStart, customEnd, showArchived } = boardFilters

        return tasks.filter((task) => {
          // Handle tasks that may not have isArchived field yet (migration)
          const taskIsArchived = task.isArchived ?? false

          // Archive filter
          if (!showArchived && taskIsArchived) return false
          if (showArchived && !taskIsArchived) return false

          // Project filter (from sidebar or board filter)
          // When viewing archive, ignore sidebar project selection to show all archived tasks
          const effectiveProjectId = showArchived ? projectId : (projectId || selectedProjectId)
          if (effectiveProjectId && task.projectId !== effectiveProjectId) return false

          // Search filter
          if (search) {
            const searchLower = search.toLowerCase()
            const matchesTitle = task.title.toLowerCase().includes(searchLower)
            const matchesDescription = task.description?.toLowerCase().includes(searchLower)
            const matchesJira = task.jiraKey?.toLowerCase().includes(searchLower)
            if (!matchesTitle && !matchesDescription && !matchesJira) return false
          }

          // Priority filter
          if (priority !== "all" && task.priority !== priority) return false

          // Date range filter
          if (dateRange !== "all") {
            const taskDate = new Date(task.createdAt)
            const now = new Date()
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            
            if (dateRange === "custom") {
              // Use custom date range if provided
              if (customStart && customEnd) {
                const customStartDate = new Date(customStart)
                const customEndDate = new Date(customEnd)
                customStartDate.setHours(0, 0, 0, 0)
                customEndDate.setHours(23, 59, 59, 999)
                
                if (taskDate < customStartDate || taskDate > customEndDate) return false
              }
            } else {
              // Use preset date ranges
              switch (dateRange) {
                case "today": {
                  if (taskDate < startOfDay) return false
                  break
                }
                case "week": {
                  const weekAgo = new Date(startOfDay)
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  if (taskDate < weekAgo) return false
                  break
                }
                case "month": {
                  const monthAgo = new Date(startOfDay)
                  monthAgo.setMonth(monthAgo.getMonth() - 1)
                  if (taskDate < monthAgo) return false
                  break
                }
                case "quarter": {
                  const quarterAgo = new Date(startOfDay)
                  quarterAgo.setMonth(quarterAgo.getMonth() - 3)
                  if (taskDate < quarterAgo) return false
                  break
                }
              }
            }
          }

          return true
        })
      },

      getArchivedTasks: () => {
        return get().tasks.filter((t) => t.isArchived)
      },

      getArchiveStats: () => {
        const archivedTasks = get().tasks.filter((t) => t.isArchived)
        const byProject: Record<string, number> = {}
        
        archivedTasks.forEach((task) => {
          byProject[task.projectId] = (byProject[task.projectId] || 0) + 1
        })

        return {
          total: archivedTasks.length,
          byProject,
        }
      },

      getTimeByEntryType: (startDate?: Date, endDate?: Date) => {
        const { timeEntries } = get()
        
        // Filter by date range if provided
        let filteredEntries = timeEntries
        if (startDate || endDate) {
          filteredEntries = timeEntries.filter((entry) => {
            const entryDate = new Date(entry.date)
            if (startDate && entryDate < startDate) return false
            if (endDate && entryDate > endDate) return false
            return true
          })
        }

        // Group by type and calculate totals
        const typeMap = new Map<TimeEntryType, number>()
        filteredEntries.forEach((entry) => {
          const minutes = entry.hours * 60 + entry.minutes
          typeMap.set(entry.type, (typeMap.get(entry.type) || 0) + minutes)
        })

        // Calculate total for percentages
        const totalMinutes = Array.from(typeMap.values()).reduce((sum, min) => sum + min, 0)

        // Convert to array with percentages
        const result: TimeByEntryType[] = Array.from(typeMap.entries())
          .map(([type, minutes]) => ({
            type,
            minutes,
            percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
          }))
          .filter((item) => item.minutes > 0)

        return result
      },

      getDeepWorkSessions: (minHours: number) => {
        const { timeEntries } = get()
        const minMinutes = minHours * 60

        // Filter only development entries
        const devEntries = timeEntries.filter((entry) => entry.type === 'development')

        // Group by date + taskId
        const sessionMap = new Map<string, { taskId: string; date: Date; minutes: number }>()
        
        devEntries.forEach((entry) => {
          const entryDate = new Date(entry.date)
          const dateKey = entryDate.toISOString().split('T')[0] // YYYY-MM-DD
          const key = `${dateKey}-${entry.taskId}`
          
          const minutes = entry.hours * 60 + entry.minutes
          const existing = sessionMap.get(key)
          
          if (existing) {
            existing.minutes += minutes
          } else {
            sessionMap.set(key, {
              taskId: entry.taskId,
              date: entryDate,
              minutes,
            })
          }
        })

        // Filter sessions that meet minimum threshold and convert to result format
        const result: DeepWorkSession[] = Array.from(sessionMap.values())
          .filter((session) => session.minutes >= minMinutes)
          .map((session) => ({
            taskId: session.taskId,
            date: session.date,
            duration: session.minutes,
          }))

        return result
      },

      getActivitiesByDateRange: (startDate, endDate) => {
        const { activities } = get()
        
        return activities.filter((activity) => {
          const activityDate = new Date(activity.createdAt)
          return activityDate >= startDate && activityDate <= endDate
        })
      },

      getTasksCompletedInRange: (startDate, endDate) => {
        const { tasks } = get()
        
        return tasks.filter((task) => {
          if (!task.completedAt) return false
          const completedDate = new Date(task.completedAt)
          return completedDate >= startDate && completedDate <= endDate
        })
      },

      getTimeBreakdownByType: (startDate, endDate) => {
        const { timeEntries } = get()
        
        const breakdown: Record<TimeEntryType, number> = {
          development: 0,
          meeting: 0,
          review: 0,
          research: 0,
          debugging: 0,
          other: 0,
        }
        
        timeEntries.forEach((entry) => {
          const entryDate = new Date(entry.date)
          if (entryDate >= startDate && entryDate <= endDate) {
            const minutes = entry.hours * 60 + entry.minutes
            breakdown[entry.type] = (breakdown[entry.type] || 0) + minutes
          }
        })
        
        return breakdown
      },

      getProductivityTrend: (startDate, endDate) => {
        const { timeEntries } = get()
        const trend: { day: string; minutes: number }[] = []
        
        // Calculate number of days between start and end (inclusive)
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(0, 0, 0, 0)
        
        const dayCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        // Generate data for each day
        for (let i = 0; i < dayCount; i++) {
          const currentDay = new Date(start)
          currentDay.setDate(start.getDate() + i)
          
          const dayStart = new Date(currentDay)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(currentDay)
          dayEnd.setHours(23, 59, 59, 999)
          
          // Calculate total minutes for this day
          const dayMinutes = timeEntries
            .filter((entry) => {
              const entryDate = new Date(entry.date)
              return entryDate >= dayStart && entryDate <= dayEnd
            })
            .reduce((sum, entry) => sum + entry.hours * 60 + entry.minutes, 0)
          
          // Format day label (e.g., "Mon 13", "Tue 14")
          const dayLabel = currentDay.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
          
          trend.push({
            day: dayLabel,
            minutes: dayMinutes,
          })
        }
        
        return trend
      },

      getComparisonData: (period, referenceDate = new Date()) => {
        const { tasks, timeEntries } = get()
        
        // Helper to get date ranges based on period type
        const getDateRanges = (refDate: Date) => {
          const ref = new Date(refDate)
          let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date
          
          if (period === "week-over-week") {
            // Current week: Sunday to Saturday (using UTC to avoid timezone issues)
            currentStart = new Date(Date.UTC(
              ref.getUTCFullYear(),
              ref.getUTCMonth(),
              ref.getUTCDate() - ref.getUTCDay(), // Go to Sunday
              0, 0, 0, 0
            ))
            
            currentEnd = new Date(Date.UTC(
              currentStart.getUTCFullYear(),
              currentStart.getUTCMonth(),
              currentStart.getUTCDate() + 6, // Go to Saturday
              23, 59, 59, 999
            ))
            
            // Previous week
            previousEnd = new Date(Date.UTC(
              currentStart.getUTCFullYear(),
              currentStart.getUTCMonth(),
              currentStart.getUTCDate() - 1, // Saturday of previous week
              23, 59, 59, 999
            ))
            previousStart = new Date(Date.UTC(
              previousEnd.getUTCFullYear(),
              previousEnd.getUTCMonth(),
              previousEnd.getUTCDate() - 6, // Sunday of previous week
              0, 0, 0, 0
            ))
          } else if (period === "month-over-month") {
            // Current month: 1st to last day (using UTC)
            currentStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1, 0, 0, 0, 0))
            currentEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0, 23, 59, 59, 999))
            
            // Previous month
            previousStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - 1, 1, 0, 0, 0, 0))
            previousEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 0, 23, 59, 59, 999))
          } else {
            // quarter-over-quarter (using UTC)
            const currentQuarter = Math.floor(ref.getUTCMonth() / 3)
            currentStart = new Date(Date.UTC(ref.getUTCFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0))
            currentEnd = new Date(Date.UTC(ref.getUTCFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999))
            
            // Previous quarter
            const previousQuarter = currentQuarter - 1
            const previousYear = previousQuarter < 0 ? ref.getUTCFullYear() - 1 : ref.getUTCFullYear()
            const adjustedQuarter = previousQuarter < 0 ? 3 : previousQuarter
            previousStart = new Date(Date.UTC(previousYear, adjustedQuarter * 3, 1, 0, 0, 0, 0))
            previousEnd = new Date(Date.UTC(previousYear, (adjustedQuarter + 1) * 3, 0, 23, 59, 59, 999))
          }
          
          return { currentStart, currentEnd, previousStart, previousEnd }
        }
        
        const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges(referenceDate)
        
        // Filter non-archived tasks
        const activeTasks = tasks.filter(t => !t.archivedAt)
        
        // Calculate current period metrics
        const currentCompleted = activeTasks.filter(t => 
          t.completedAt && 
          new Date(t.completedAt) >= currentStart && 
          new Date(t.completedAt) <= currentEnd
        )
        const currentCreated = activeTasks.filter(t => 
          new Date(t.createdAt) >= currentStart && 
          new Date(t.createdAt) <= currentEnd
        )
        const currentTimeEntries = timeEntries.filter(e => 
          new Date(e.date) >= currentStart && 
          new Date(e.date) <= currentEnd
        )
        const currentTotalTime = currentTimeEntries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0)
        
        // Calculate average completion time for current period
        let currentAvgCompletionTime = 0
        if (currentCompleted.length > 0) {
          const totalDays = currentCompleted.reduce((sum, task) => {
            const created = new Date(task.createdAt).getTime()
            const completed = new Date(task.completedAt!).getTime()
            const days = (completed - created) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0)
          currentAvgCompletionTime = Math.round(totalDays / currentCompleted.length)
        }
        
        // Calculate previous period metrics
        const previousCompleted = activeTasks.filter(t => 
          t.completedAt && 
          new Date(t.completedAt) >= previousStart && 
          new Date(t.completedAt) <= previousEnd
        )
        const previousCreated = activeTasks.filter(t => 
          new Date(t.createdAt) >= previousStart && 
          new Date(t.createdAt) <= previousEnd
        )
        const previousTimeEntries = timeEntries.filter(e => 
          new Date(e.date) >= previousStart && 
          new Date(e.date) <= previousEnd
        )
        const previousTotalTime = previousTimeEntries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0)
        
        // Calculate average completion time for previous period
        let previousAvgCompletionTime = 0
        if (previousCompleted.length > 0) {
          const totalDays = previousCompleted.reduce((sum, task) => {
            const created = new Date(task.createdAt).getTime()
            const completed = new Date(task.completedAt!).getTime()
            const days = (completed - created) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0)
          previousAvgCompletionTime = Math.round(totalDays / previousCompleted.length)
        }
        
        // Calculate deltas and percentages
        const calculateDelta = (current: number, previous: number) => ({
          absolute: current - previous,
          percent: previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100)
        })
        
        const completedDelta = calculateDelta(currentCompleted.length, previousCompleted.length)
        const createdDelta = calculateDelta(currentCreated.length, previousCreated.length)
        const timeDelta = calculateDelta(currentTotalTime, previousTotalTime)
        const avgCompletionDelta = calculateDelta(currentAvgCompletionTime, previousAvgCompletionTime)
        
        return {
          current: {
            tasksCompleted: currentCompleted.length,
            tasksCreated: currentCreated.length,
            totalTime: currentTotalTime,
            avgCompletionTime: currentAvgCompletionTime,
          },
          previous: {
            tasksCompleted: previousCompleted.length,
            tasksCreated: previousCreated.length,
            totalTime: previousTotalTime,
            avgCompletionTime: previousAvgCompletionTime,
          },
          delta: {
            tasksCompleted: completedDelta.absolute,
            tasksCompletedPercent: completedDelta.percent,
            tasksCreated: createdDelta.absolute,
            tasksCreatedPercent: createdDelta.percent,
            totalTime: timeDelta.absolute,
            totalTimePercent: timeDelta.percent,
            avgCompletionTime: avgCompletionDelta.absolute,
            avgCompletionTimePercent: avgCompletionDelta.percent,
          },
        }
      },

      getVelocityData: (weeksBack) => {
        const { tasks } = get()
        const velocityData: VelocityWeekData[] = []
        
        // Generate data for the requested number of weeks
        for (let weekOffset = 0; weekOffset < weeksBack; weekOffset++) {
          const weekEnd = new Date()
          weekEnd.setDate(weekEnd.getDate() - (weekOffset * 7))
          weekEnd.setHours(23, 59, 59, 999)
          
          const weekStart = new Date(weekEnd)
          weekStart.setDate(weekStart.getDate() - 6)
          weekStart.setHours(0, 0, 0, 0)
          
          // Get tasks completed in this week
          const completedInWeek = tasks.filter((task) => {
            if (!task.completedAt) return false
            const completedDate = new Date(task.completedAt)
            return completedDate >= weekStart && completedDate <= weekEnd
          })
          
          // Calculate average cycle time for this week
          let avgCycleTime = 0
          if (completedInWeek.length > 0) {
            const totalCycleDays = completedInWeek.reduce((sum, task) => {
              const created = new Date(task.createdAt)
              const completed = new Date(task.completedAt!)
              const cycleDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
              return sum + cycleDays
            }, 0)
            avgCycleTime = totalCycleDays / completedInWeek.length
          }
          
          // Format week label (e.g., "Jan 1-7")
          const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.getDate()}`
          
          velocityData.unshift({
            week: weekLabel,
            weekStart,
            weekEnd,
            completed: completedInWeek.length,
            avgCycleTime,
          })
        }
        
        return velocityData
      },

      getAverageCycleTime: (projectId?) => {
        const { tasks } = get()
        
        // Filter completed tasks
        let completedTasks = tasks.filter((task) => task.completedAt !== null)
        
        // Further filter by project if provided
        if (projectId) {
          completedTasks = completedTasks.filter((task) => task.projectId === projectId)
        }
        
        if (completedTasks.length === 0) return 0
        
        // Calculate average cycle time in days
        const totalCycleDays = completedTasks.reduce((sum, task) => {
          const created = new Date(task.createdAt)
          const completed = new Date(task.completedAt!)
          const cycleDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          return sum + cycleDays
        }, 0)
        
        return totalCycleDays / completedTasks.length
      },

      getTaskEfficiencyMetrics: () => {
        const { tasks, timeEntries, projects } = get()
        
        // Filter completed tasks only
        const completedTasks = tasks.filter((task) => task.completedAt !== null)
        
        if (completedTasks.length === 0) {
          return {
            byPriority: [],
            byProject: [],
            overallAvgCycleTime: 0,
            overallAvgTimeSpent: 0,
          }
        }
        
        // Calculate metrics by priority
        const priorityGroups = new Map<string, { tasks: Task[]; totalCycleTime: number; totalTimeSpent: number }>()
        
        completedTasks.forEach((task) => {
          const priority = task.priority
          if (!priorityGroups.has(priority)) {
            priorityGroups.set(priority, { tasks: [], totalCycleTime: 0, totalTimeSpent: 0 })
          }
          
          const group = priorityGroups.get(priority)!
          group.tasks.push(task)
          
          // Calculate cycle time
          const created = new Date(task.createdAt)
          const completed = new Date(task.completedAt!)
          const cycleDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          group.totalCycleTime += cycleDays
          
          // Calculate time spent
          const taskTimeEntries = timeEntries.filter((entry) => entry.taskId === task.id)
          const timeSpentMinutes = taskTimeEntries.reduce((sum, entry) => sum + entry.hours * 60 + entry.minutes, 0)
          group.totalTimeSpent += timeSpentMinutes
        })
        
        const byPriority = Array.from(priorityGroups.entries()).map(([priority, group]) => ({
          category: priority,
          avgCycleTimeDays: group.totalCycleTime / group.tasks.length,
          avgTimeSpentMinutes: group.totalTimeSpent / group.tasks.length,
          taskCount: group.tasks.length,
        }))
        
        // Calculate metrics by project
        const projectGroups = new Map<string, { tasks: Task[]; totalCycleTime: number; totalTimeSpent: number }>()
        
        completedTasks.forEach((task) => {
          const project = projects.find((p) => p.id === task.projectId)
          const projectName = project?.name || 'Unknown'
          
          if (!projectGroups.has(projectName)) {
            projectGroups.set(projectName, { tasks: [], totalCycleTime: 0, totalTimeSpent: 0 })
          }
          
          const group = projectGroups.get(projectName)!
          group.tasks.push(task)
          
          // Calculate cycle time
          const created = new Date(task.createdAt)
          const completed = new Date(task.completedAt!)
          const cycleDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          group.totalCycleTime += cycleDays
          
          // Calculate time spent
          const taskTimeEntries = timeEntries.filter((entry) => entry.taskId === task.id)
          const timeSpentMinutes = taskTimeEntries.reduce((sum, entry) => sum + entry.hours * 60 + entry.minutes, 0)
          group.totalTimeSpent += timeSpentMinutes
        })
        
        const byProject = Array.from(projectGroups.entries()).map(([projectName, group]) => ({
          category: projectName,
          avgCycleTimeDays: group.totalCycleTime / group.tasks.length,
          avgTimeSpentMinutes: group.totalTimeSpent / group.tasks.length,
          taskCount: group.tasks.length,
        }))
        
        // Calculate overall averages
        const totalCycleDays = completedTasks.reduce((sum, task) => {
          const created = new Date(task.createdAt)
          const completed = new Date(task.completedAt!)
          const cycleDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          return sum + cycleDays
        }, 0)
        
        const totalTimeSpentMinutes = completedTasks.reduce((sum, task) => {
          const taskTimeEntries = timeEntries.filter((entry) => entry.taskId === task.id)
          return sum + taskTimeEntries.reduce((entrySum, entry) => entrySum + entry.hours * 60 + entry.minutes, 0)
        }, 0)
        
        return {
          byPriority,
          byProject,
          overallAvgCycleTime: totalCycleDays / completedTasks.length,
          overallAvgTimeSpent: totalTimeSpentMinutes / completedTasks.length,
        }
      },

      // Activity actions
      addActivity: (activity) => {
        const newActivity = {
          ...activity,
          id: generateId(),
          createdAt: new Date(),
        }
        set((state) => ({ activities: [...state.activities, newActivity] }))
      },

      getActivitiesForTask: (taskId) => {
        return get().activities.filter((a) => a.taskId === taskId).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      },

      // Comment actions
      addComment: (comment) => {
        const now = new Date()
        const newComment = {
          ...comment,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        
        const activity = {
          id: generateId(),
          taskId: comment.taskId,
          type: 'comment_added' as const,
          description: `Comment added`,
          metadata: { commentId: newComment.id },
          createdAt: now,
        }
        
        set((state) => ({ 
          comments: [...state.comments, newComment],
          activities: [...state.activities, activity]
        }))
      },

      updateComment: (id, content) => {
        set((state) => ({
          comments: state.comments.map((c) => 
            c.id === id ? { ...c, content, updatedAt: new Date() } : c
          ),
        }))
      },

      deleteComment: (id) => {
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== id),
        }))
      },

      getCommentsForTask: (taskId) => {
        return get().comments.filter((c) => c.taskId === taskId).sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      },

      // Attachment actions
      addAttachment: (attachment) => {
        const now = new Date()
        const newAttachment = {
          ...attachment,
          id: generateId(),
          uploadedAt: now,
        }
        
        const activity = {
          id: generateId(),
          taskId: attachment.taskId,
          type: 'attachment_added' as const,
          description: `Attachment added: ${attachment.fileName}`,
          metadata: { attachmentId: newAttachment.id, fileName: attachment.fileName },
          createdAt: now,
        }
        
        set((state) => ({ 
          attachments: [...state.attachments, newAttachment],
          activities: [...state.activities, activity]
        }))
      },

      deleteAttachment: (id) => {
        set((state) => ({
          attachments: state.attachments.filter((a) => a.id !== id),
        }))
      },

      getAttachmentsForTask: (taskId) => {
        return get().attachments.filter((a) => a.taskId === taskId).sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
      },

      // History actions
      addHistory: (history) => {
        const newHistory = {
          ...history,
          id: generateId(),
          changedAt: new Date(),
        }
        set((state) => ({ history: [...state.history, newHistory] }))
      },

      getHistoryForTask: (taskId) => {
        return get().history.filter((h) => h.taskId === taskId).sort((a, b) => 
          new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        )
      },

      trackFieldChange: (taskId, field, oldValue, newValue) => {
        // Only track if values are different
        if (oldValue === newValue) return
        
        const oldValueStr = oldValue === null || oldValue === undefined ? '' : String(oldValue)
        const newValueStr = newValue === null || newValue === undefined ? '' : String(newValue)
        
        if (oldValueStr === newValueStr) return
        
        get().addHistory({
          taskId,
          field,
          oldValue: oldValueStr,
          newValue: newValueStr,
        })
      },

      getFormattedHistory: (taskId) => {
        const history = get().getHistoryForTask(taskId)
        const { tasks, projects } = get()
        
        const formatFieldLabel = (field: string): string => {
          const labels: Record<string, string> = {
            title: 'Title',
            description: 'Description',
            status: 'Status',
            priority: 'Priority',
            projectId: 'Project',
            dueDate: 'Due Date',
            subcategory: 'Subcategory',
            jiraKey: 'Jira Key',
            storyPoints: 'Story Points',
          }
          return labels[field] || field.charAt(0).toUpperCase() + field.slice(1)
        }
        
        const formatStatusValue = (value: string): string => {
          const statusLabels: Record<string, string> = {
            backlog: 'Backlog',
            todo: 'To Do',
            'in-progress': 'In Progress',
            done: 'Done',
          }
          return statusLabels[value] || value
        }
        
        const formatPriorityValue = (value: string): string => {
          return value.charAt(0).toUpperCase() + value.slice(1)
        }
        
        const formatProjectValue = (projectId: string): string => {
          const project = projects.find(p => p.id === projectId)
          return project?.name || projectId
        }
        
        const formatValue = (field: string, value: string): string => {
          if (!value) return '(empty)'
          
          switch (field) {
            case 'status':
              return formatStatusValue(value)
            case 'priority':
              return formatPriorityValue(value)
            case 'projectId':
              return formatProjectValue(value)
            case 'dueDate':
              return value ? new Date(value).toLocaleDateString() : '(empty)'
            default:
              return value || '(empty)'
          }
        }
        
        return history.map((h): HistoryEntry => {
          let changeType: HistoryEntry['changeType'] = 'updated'
          if (h.field === 'status') {
            changeType = 'status_changed'
          }
          
          return {
            id: h.id,
            taskId: h.taskId,
            field: h.field,
            fieldLabel: formatFieldLabel(h.field),
            oldValue: h.oldValue,
            newValue: h.newValue,
            oldValueFormatted: formatValue(h.field, h.oldValue),
            newValueFormatted: formatValue(h.field, h.newValue),
            changedAt: h.changedAt,
            changeType,
          }
        })
      },

      // Task dependencies
      addBlocker: (taskId, blockedByTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, blockedBy: [...(t.blockedBy || []), blockedByTaskId] }
            }
            if (t.id === blockedByTaskId) {
              return { ...t, blocking: [...(t.blocking || []), taskId] }
            }
            return t
          }),
        }))
      },

      removeBlocker: (taskId, blockedByTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, blockedBy: (t.blockedBy || []).filter(id => id !== blockedByTaskId) }
            }
            if (t.id === blockedByTaskId) {
              return { ...t, blocking: (t.blocking || []).filter(id => id !== taskId) }
            }
            return t
          }),
        }))
      },

      getBlockedTasks: () => {
        return get().tasks.filter((t) => t.blockedBy && t.blockedBy.length > 0)
      },

      // Seed/Clear data actions
      seedSampleData: (data) => {
        set({
          projects: data.projects,
          tasks: data.tasks.map(task => ({
            ...task,
            completedAt: task.status === 'done' ? task.updatedAt : null,
            blockedBy: [],
            blocking: [],
          })),
          timeEntries: data.timeEntries.map(entry => ({
            ...entry,
            type: 'development' as const,
          })),
          selectedProjectId: null,
          boardFilters: DEFAULT_BOARD_FILTERS,
        })
      },

      clearAllData: () => {
        set({
          projects: [],
          tasks: [],
          timeEntries: [],
          activities: [],
          comments: [],
          attachments: [],
          history: [],
          selectedProjectId: null,
          boardFilters: DEFAULT_BOARD_FILTERS,
        })
      },
    }),
    {
      name: "ToolingTracker-storage",
      // Migrate old data to include new fields
      migrate: (persistedState: unknown) => {
        const state = persistedState as ToolingTrackerState
        
        // Migrate tasks
        if (state && state.tasks) {
          state.tasks = state.tasks.map((task) => ({
            ...task,
            isArchived: task.isArchived ?? false,
            archivedAt: task.archivedAt ?? null,
            completedAt: task.completedAt ?? (task.status === 'done' ? task.updatedAt : null),
            blockedBy: task.blockedBy ?? [],
            blocking: task.blocking ?? [],
          }))
        }
        
        // Migrate time entries
        if (state && state.timeEntries) {
          state.timeEntries = state.timeEntries.map((entry: any) => ({
            ...entry,
            type: entry.type ?? 'development',
          }))
        }
        
        // Initialize new arrays if not present
        if (!state.activities) state.activities = []
        if (!state.comments) state.comments = []
        if (!state.attachments) state.attachments = []
        if (!state.history) state.history = []
        
        if (state && !state.boardFilters) {
          state.boardFilters = DEFAULT_BOARD_FILTERS
        }
        return state
      },
      version: 1,
      // Handle localStorage quota errors
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to load persisted state:', error)
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded. Consider archiving old tasks.')
          }
        }
      },
    },
  ),
)
