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
  ComparisonData,
  Board
} from "./types"
import { apiClient, APIError } from "./api-utils"

interface ToolingTrackerState {
  projects: Project[]
  tasks: Task[]
  timeEntries: TimeEntry[]
  activities: Activity[]
  comments: TaskComment[]
  attachments: TaskAttachment[]
  history: TaskHistory[]
  boards: Board[]
  selectedProjectId: string | null
  boardFilters: BoardFilters
  isLoading: boolean
  error: string | null

  // Data hydration
  loadInitialData: () => Promise<void>

  // Project actions
  addProject: (name: string, color: ProjectColor, jiraKey?: string | null) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setSelectedProject: (id: string | null) => void
  addSubcategoryToProject: (projectId: string, name: string) => Promise<void>

  // Task actions
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt" | "isArchived" | "archivedAt" | "blockedBy" | "blocking"> & {
    createdAt?: Date
    completedAt?: Date | null
  }) => Promise<Task | undefined>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveTask: (id: string, status: TaskStatus) => Promise<void>
  
  // Archive actions
  archiveTask: (id: string) => Promise<void>
  unarchiveTask: (id: string) => Promise<void>
  bulkArchiveTasks: (ids: string[]) => Promise<void>
  bulkDeleteTasks: (ids: string[]) => Promise<void>
  autoArchiveOldTasks: (daysOld: number) => number
  
  // Board filter actions
  setBoardFilters: (filters: Partial<BoardFilters>) => void
  resetBoardFilters: () => void

  // Whiteboard/Canvas board actions (Phase 2)
  addBoard: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Board | undefined>
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
  archiveBoard: (id: string) => Promise<void>
  getBoardsForProject: (projectId: string) => Board[]

  // Time entry actions
  addTimeEntry: (entry: Omit<TimeEntry, "id" | "createdAt">) => Promise<void>
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  deleteTimeEntry: (id: string) => Promise<void>

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
  addComment: (comment: Omit<TaskComment, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateComment: (id: string, content: string) => Promise<void>
  deleteComment: (id: string) => Promise<void>
  getCommentsForTask: (taskId: string) => TaskComment[]
  
  // Attachment actions
  addAttachment: (attachment: Omit<TaskAttachment, "id" | "uploadedAt">) => Promise<void>
  deleteAttachment: (id: string) => Promise<void>
  getAttachmentsForTask: (taskId: string) => TaskAttachment[]
  
  // History actions
  addHistory: (history: Omit<TaskHistory, "id" | "changedAt">) => void
  getHistoryForTask: (taskId: string) => TaskHistory[]
  trackFieldChange: (taskId: string, field: string, oldValue: unknown, newValue: unknown) => void
  getFormattedHistory: (taskId: string) => HistoryEntry[]
  
  // Task dependencies
  addBlocker: (taskId: string, blockedByTaskId: string) => Promise<void>
  removeBlocker: (taskId: string, blockedByTaskId: string) => Promise<void>
  getBlockedTasks: () => Task[]
  
  // Seed/Clear data actions
  seedSampleData: (data: { 
    projects: Project[]; 
    tasks: Omit<Task, 'completedAt' | 'blockedBy' | 'blocking'>[]; 
    timeEntries: Omit<TimeEntry, 'type'>[] 
  }) => void
  clearAllData: () => void
  
  // Loading and error state
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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
      boards: [],
      selectedProjectId: null,
      boardFilters: DEFAULT_BOARD_FILTERS,
      isLoading: false,
      error: null,

      loadInitialData: async () => {
        try {
          set({ isLoading: true, error: null })

          const results = await Promise.allSettled([
            apiClient.get<Project[]>('/api/projects'),
            apiClient.get<Task[]>('/api/tasks'),
            apiClient.get<TimeEntry[]>('/api/time-entries'),
            apiClient.get<TaskComment[]>('/api/comments'),
            apiClient.get<TaskAttachment[]>('/api/attachments'),
            apiClient.get<Activity[]>('/api/activities'),
            apiClient.get<Board[]>('/api/boards'),
            // NOTE: history is NOT loaded from API - it's generated from activity logs
            // If history should be persisted separately, implement /api/history endpoint
          ])

          // Extract successful results - allow partial hydration if some endpoints fail
          const [projectsResult, tasksResult, timeEntriesResult, commentsResult, attachmentsResult, activitiesResult, boardsResult] = results

          const newState: Partial<ToolingTrackerState> = {
            isLoading: false,
          }

          // Set successful results
          if (projectsResult.status === 'fulfilled') {
            newState.projects = projectsResult.value
          }
          if (tasksResult.status === 'fulfilled') {
            newState.tasks = tasksResult.value
          }
          if (timeEntriesResult.status === 'fulfilled') {
            newState.timeEntries = timeEntriesResult.value
          }
          if (commentsResult.status === 'fulfilled') {
            newState.comments = commentsResult.value
          }
          if (attachmentsResult.status === 'fulfilled') {
            newState.attachments = attachmentsResult.value
          }
          if (activitiesResult.status === 'fulfilled') {
            newState.activities = activitiesResult.value
          }
          if (boardsResult.status === 'fulfilled') {
            newState.boards = boardsResult.value
          }

          // Set error if ANY endpoint failed
          const failedResults = results.filter(r => r.status === 'rejected')
          if (failedResults.length > 0) {
            const errors = failedResults
              .map((r, i) => {
                const endpoints = [
                  '/api/projects',
                  '/api/tasks',
                  '/api/time-entries',
                  '/api/comments',
                  '/api/attachments',
                  '/api/activities',
                  '/api/boards',
                ]
                const endpoint = endpoints[results.indexOf(r)]
                return `${endpoint} failed`
              })
              .join(', ')
            newState.error = `Partial load: ${errors}. Some data may be missing.`
          }

          set(newState)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load initial data'
          set({ error: message, isLoading: false })
          console.error('Failed to load initial data:', error)
        }
      },

      addProject: async (name, color, jiraKey) => {
        if (!name?.trim()) {
          console.error('Project name is required')
          return
        }
        
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiClient.post<Project>('/api/projects', {
            name: name.trim(),
            color,
            jiraKey: jiraKey || null,
          })
          
          set((state) => ({ 
            projects: [...state.projects, response],
            isLoading: false 
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to create project'
          set({ error: message, isLoading: false })
          console.error('Failed to create project:', error)
        }
      },

      updateProject: async (id, updates) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiClient.patch<Project>(`/api/projects/${id}`, updates)
          
          set((state) => ({
            projects: state.projects.map((p) => (p.id === id ? response : p)),
            isLoading: false
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to update project'
          set({ error: message, isLoading: false })
          console.error('Failed to update project:', error)
        }
      },

      deleteProject: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await apiClient.delete<void>(`/api/projects/${id}`)
          
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            tasks: state.tasks.filter((t) => t.projectId !== id),
            timeEntries: state.timeEntries.filter((te) => {
              const task = state.tasks.find((t) => t.id === te.taskId)
              return task?.projectId !== id
            }),
            isLoading: false
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to delete project'
          set({ error: message, isLoading: false })
          console.error('Failed to delete project:', error)
        }
      },

      setSelectedProject: (id) => set({ selectedProjectId: id }),

      addSubcategoryToProject: async (projectId, name) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiClient.post<Project>(
            `/api/projects/${projectId}/subcategories`,
            { name }
          )
          
          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? response : p)),
            isLoading: false
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to add subcategory'
          set({ error: message, isLoading: false })
          console.error('Failed to add subcategory:', error)
        }
      },

      // Whiteboard/Canvas Board Actions (Phase 2)
      addBoard: async (boardData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiClient.post<Board>('/api/boards', boardData)
          
          set((state) => ({
            boards: [...state.boards, response],
            isLoading: false
          }))
          
          return response
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to create board'
          set({ error: message, isLoading: false })
          console.error('Failed to create board:', error)
          return undefined
        }
      },

      updateBoard: async (id, updates) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiClient.patch<Board>(`/api/boards/${id}`, updates)
          
          set((state) => ({
            boards: state.boards.map((b) => (b.id === id ? response : b)),
            isLoading: false
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to update board'
          set({ error: message, isLoading: false })
          console.error('Failed to update board:', error)
        }
      },

      deleteBoard: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await apiClient.delete<void>(`/api/boards/${id}`)
          
          set((state) => ({
            boards: state.boards.filter((b) => b.id !== id),
            isLoading: false
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to delete board'
          set({ error: message, isLoading: false })
          console.error('Failed to delete board:', error)
        }
      },

      archiveBoard: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiClient.patch<Board>(`/api/boards/${id}`, { isArchived: true })
          
          set((state) => ({
            boards: state.boards.map((b) => (b.id === id ? response : b)),
            isLoading: false
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to archive board'
          set({ error: message, isLoading: false })
          console.error('Failed to archive board:', error)
        }
      },

      getBoardsForProject: (projectId) => {
        return get().boards.filter((b) => b.projectId === projectId && !b.isArchived)
      },

      addTask: async (task) => {
        if (!task.title?.trim()) {
          console.error('Task title is required')
          return undefined
        }
        if (!task.projectId) {
          console.error('Task projectId is required')
          return undefined
        }
        
        set({ isLoading: true, error: null })
        
        try {
          const response = await apiClient.post<Task>('/api/tasks', {
            ...task,
            title: task.title.trim(),
            description: task.description?.trim() || '',
          })
          
          set((state) => ({ 
            tasks: [...state.tasks, response],
            isLoading: false 
          }))
          
          return response
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to create task'
          set({ error: message, isLoading: false })
          console.error('Failed to create task:', error)
          return undefined
        }
      },

      updateTask: async (id, updates) => {
        try {
          set({ isLoading: true, error: null })
          
          const updatedTask = await apiClient.patch<Task>(`/api/tasks/${id}`, updates)
          
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to update task'
          set({ error: message, isLoading: false })
          console.error('Failed to update task:', error)
        }
      },

      deleteTask: async (id) => {
        try {
          set({ isLoading: true, error: null })
          
          await apiClient.delete(`/api/tasks/${id}`)
          
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            timeEntries: state.timeEntries.filter((te) => te.taskId !== id),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to delete task'
          set({ error: message, isLoading: false })
          console.error('Failed to delete task:', error)
        }
      },

      moveTask: async (id, status) => {
        try {
          set({ isLoading: true, error: null })
          
          const updates: Partial<Task> = { status }
          if (status === 'done') {
            updates.completedAt = new Date()
          }
          
          const updatedTask = await apiClient.patch<Task>(`/api/tasks/${id}`, updates)
          
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to move task'
          set({ error: message, isLoading: false })
          console.error('Failed to move task:', error)
        }
      },

      // Archive actions
      archiveTask: async (id) => {
        try {
          set({ isLoading: true, error: null })
          
          const updatedTask = await apiClient.patch<Task>(`/api/tasks/${id}`, {
            isArchived: true,
            archivedAt: new Date(),
          })
          
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to archive task'
          set({ error: message, isLoading: false })
          console.error('Failed to archive task:', error)
        }
      },

      unarchiveTask: async (id) => {
        try {
          set({ isLoading: true, error: null })
          
          const updatedTask = await apiClient.patch<Task>(`/api/tasks/${id}`, {
            isArchived: false,
            archivedAt: null,
          })
          
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to unarchive task'
          set({ error: message, isLoading: false })
          console.error('Failed to unarchive task:', error)
        }
      },

      bulkArchiveTasks: async (ids) => {
        try {
          set({ isLoading: true, error: null })
          
          await apiClient.post('/api/tasks/bulk', {
            operation: 'archive',
            taskIds: ids,
          })
          
          // Refresh all tasks from database after bulk operation
          const tasks = await apiClient.get<Task[]>('/api/tasks')
          set({ tasks, isLoading: false })
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to archive tasks'
          set({ error: message, isLoading: false })
          console.error('Failed to archive tasks:', error)
        }
      },

      bulkDeleteTasks: async (ids) => {
        try {
          set({ isLoading: true, error: null })
          
          await apiClient.post('/api/tasks/bulk', {
            operation: 'delete',
            taskIds: ids,
          })
          
          // Refresh all tasks from database after bulk operation
          const tasks = await apiClient.get<Task[]>('/api/tasks')
          set({ tasks, isLoading: false })
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to delete tasks'
          set({ error: message, isLoading: false })
          console.error('Failed to delete tasks:', error)
        }
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

      // Time entry actions
      addTimeEntry: async (entry) => {
        try {
          set({ isLoading: true, error: null })

          const newEntry = await apiClient.post<TimeEntry>('/api/time-entries', {
            taskId: entry.taskId,
            date: entry.date,
            hours: entry.hours,
            minutes: entry.minutes,
            notes: entry.notes || '',
            type: entry.type || 'development',
          })

          set((state) => ({
            timeEntries: [...state.timeEntries, newEntry],
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to add time entry'
          set({ error: message, isLoading: false })
          console.error('Failed to add time entry:', error)
        }
      },

      updateTimeEntry: async (id, updates) => {
        try {
          set({ isLoading: true, error: null })

          const updatedEntry = await apiClient.patch<TimeEntry>(`/api/time-entries/${id}`, updates)

          set((state) => ({
            timeEntries: state.timeEntries.map((te) => (te.id === id ? updatedEntry : te)),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to update time entry'
          set({ error: message, isLoading: false })
          console.error('Failed to update time entry:', error)
        }
      },

      deleteTimeEntry: async (id) => {
        try {
          set({ isLoading: true, error: null })

          await apiClient.delete(`/api/time-entries/${id}`)

          set((state) => ({
            timeEntries: state.timeEntries.filter((te) => te.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to delete time entry'
          set({ error: message, isLoading: false })
          console.error('Failed to delete time entry:', error)
        }
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
      // Comment actions
      addComment: async (comment) => {
        try {
          set({ isLoading: true, error: null })

          const newComment = await apiClient.post<TaskComment>('/api/comments', {
            taskId: comment.taskId,
            content: comment.content,
          })

          set((state) => ({
            comments: [...state.comments, newComment],
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to add comment'
          set({ error: message, isLoading: false })
          console.error('Failed to add comment:', error)
        }
      },

      updateComment: async (id, content) => {
        try {
          set({ isLoading: true, error: null })

          const updatedComment = await apiClient.patch<TaskComment>(`/api/comments/${id}`, { content })

          set((state) => ({
            comments: state.comments.map((c) => (c.id === id ? updatedComment : c)),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to update comment'
          set({ error: message, isLoading: false })
          console.error('Failed to update comment:', error)
        }
      },

      deleteComment: async (id) => {
        try {
          set({ isLoading: true, error: null })

          await apiClient.delete(`/api/comments/${id}`)

          set((state) => ({
            comments: state.comments.filter((c) => c.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to delete comment'
          set({ error: message, isLoading: false })
          console.error('Failed to delete comment:', error)
        }
      },

      getCommentsForTask: (taskId) => {
        return get().comments.filter((c) => c.taskId === taskId).sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      },

      // Attachment actions
      addAttachment: async (attachment) => {
        try {
          set({ isLoading: true, error: null })

          const newAttachment = await apiClient.post<TaskAttachment>('/api/attachments', {
            taskId: attachment.taskId,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            fileType: attachment.fileType,
          })

          set((state) => ({
            attachments: [...state.attachments, newAttachment],
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to add attachment'
          set({ error: message, isLoading: false })
          console.error('Failed to add attachment:', error)
        }
      },

      deleteAttachment: async (id) => {
        try {
          set({ isLoading: true, error: null })

          await apiClient.delete(`/api/attachments/${id}`)

          set((state) => ({
            attachments: state.attachments.filter((a) => a.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to delete attachment'
          set({ error: message, isLoading: false })
          console.error('Failed to delete attachment:', error)
        }
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
      addBlocker: async (taskId, blockedByTaskId) => {
        try {
          set({ isLoading: true, error: null })
          
          // Get current task to update its blockedBy array
          const task = get().tasks.find(t => t.id === taskId)
          if (!task) {
            set({ error: 'Task not found', isLoading: false })
            return
          }
          
          // Get blocker task to update its blocking array
          const blockerTask = get().tasks.find(t => t.id === blockedByTaskId)
          if (!blockerTask) {
            set({ error: 'Blocker task not found', isLoading: false })
            return
          }
          
          // Update task being blocked
          const updatedBlockedBy = task.blockedBy ? [...task.blockedBy, blockedByTaskId] : [blockedByTaskId]
          const updatedTask = await apiClient.patch<Task>(`/api/tasks/${taskId}`, {
            blockedBy: updatedBlockedBy,
          })
          
          // Update blocking task
          const updatedBlocking = blockerTask.blocking ? [...blockerTask.blocking, taskId] : [taskId]
          const updatedBlockerTask = await apiClient.patch<Task>(`/api/tasks/${blockedByTaskId}`, {
            blocking: updatedBlocking,
          })
          
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id === taskId) return updatedTask
              if (t.id === blockedByTaskId) return updatedBlockerTask
              return t
            }),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to add blocker'
          set({ error: message, isLoading: false })
          console.error('Failed to add blocker:', error)
        }
      },

      removeBlocker: async (taskId, blockedByTaskId) => {
        try {
          set({ isLoading: true, error: null })
          
          // Get current task to update its blockedBy array
          const task = get().tasks.find(t => t.id === taskId)
          if (!task) {
            set({ error: 'Task not found', isLoading: false })
            return
          }
          
          // Get blocker task to update its blocking array
          const blockerTask = get().tasks.find(t => t.id === blockedByTaskId)
          if (!blockerTask) {
            set({ error: 'Blocker task not found', isLoading: false })
            return
          }
          
          // Update task being unblocked
          const updatedBlockedBy = task.blockedBy ? task.blockedBy.filter(id => id !== blockedByTaskId) : []
          const updatedTask = await apiClient.patch<Task>(`/api/tasks/${taskId}`, {
            blockedBy: updatedBlockedBy,
          })
          
          // Update blocking task
          const updatedBlocking = blockerTask.blocking ? blockerTask.blocking.filter(id => id !== taskId) : []
          const updatedBlockerTask = await apiClient.patch<Task>(`/api/tasks/${blockedByTaskId}`, {
            blocking: updatedBlocking,
          })
          
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id === taskId) return updatedTask
              if (t.id === blockedByTaskId) return updatedBlockerTask
              return t
            }),
            isLoading: false,
          }))
        } catch (error) {
          const message = error instanceof APIError ? error.message : 'Failed to remove blocker'
          set({ error: message, isLoading: false })
          console.error('Failed to remove blocker:', error)
        }
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

      // Loading and error state actions
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },
    }),
    {
      name: "ToolingTracker-storage",
      version: 1, // Increment this when state structure changes
      // Only persist UI state to localStorage, not data from database
      // This prevents race conditions where stale UI state overwrites fresh API data
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        boardFilters: state.boardFilters,
      }),
      // Migration function to handle state structure changes
      migrate: (persistedState: any, version: number) => {
        // If no version, it's old state - return default structure
        if (version === 0 || !persistedState) {
          return {
            selectedProjectId: null,
            boardFilters: DEFAULT_BOARD_FILTERS,
          }
        }
        
        // Ensure boardFilters has all required fields
        if (persistedState && !persistedState.boardFilters) {
          persistedState.boardFilters = DEFAULT_BOARD_FILTERS
        }
        
        return persistedState
      },
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
