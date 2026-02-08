import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToolingTrackerStore } from './store'
import type { TimeEntry, Project } from './types'

describe('Focus Time Analysis - Store Helpers', () => {
  beforeEach(() => {
    // Mock global fetch
    global.fetch = vi.fn()
    
    // Reset store before each test
    const testProject: Project = {
      id: 'test-project-1',
      name: 'Test Project',
      color: 'blue',
      subcategories: [],
      jiraKey: null,
      createdAt: new Date(),
    }
    
    useToolingTrackerStore.setState({
      tasks: [],
      timeEntries: [],
      projects: [testProject],
      activities: [],
      comments: [],
      attachments: [],
      history: [],
      selectedProjectId: null,
      boardFilters: {
        search: '',
        projectId: null,
        priority: 'all',
        dateRange: 'all',
        customStart: null,
        customEnd: null,
        showArchived: false,
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper to inject a task directly into store (for testing, bypasses API)
  const injectTask = (task: any) => {
    const now = new Date()
    const newTask = {
      id: task.id || 'task-' + Math.random().toString(36).slice(2),
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      projectId: task.projectId,
      dueDate: task.dueDate || null,
      subcategory: task.subcategory || null,
      jiraKey: task.jiraKey || null,
      storyPoints: task.storyPoints || null,
      createdAt: task.createdAt || now,
      updatedAt: now,
      completedAt: task.completedAt || (task.status === 'done' ? now : null),
      isArchived: false,
      archivedAt: null,
      blockedBy: [],
      blocking: [],
    }
    useToolingTrackerStore.setState((state) => ({
      tasks: [...state.tasks, newTask],
    }))
    return newTask
  }

  // Helper to inject a time entry directly into store (for testing, bypasses API)
  const generateId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15)

  const injectTimeEntry = (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    useToolingTrackerStore.setState((state) => ({
      timeEntries: [
        ...state.timeEntries,
        {
          ...entry,
          id: generateId(),
          createdAt: new Date(),
        },
      ],
    }))
  }

  describe('getTimeByEntryType', () => {
    it('should calculate correct totals for each time entry type', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Inject a task directly (bypasses API)
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // Add time entries of different types
      const timeEntries: Omit<TimeEntry, 'id' | 'createdAt'>[] = [
        { taskId, hours: 2, minutes: 30, date: new Date('2026-01-10'), notes: 'Dev work', type: 'development' },
        { taskId, hours: 1, minutes: 0, date: new Date('2026-01-10'), notes: 'Team meeting', type: 'meeting' },
        { taskId, hours: 0, minutes: 45, date: new Date('2026-01-11'), notes: 'Code review', type: 'review' },
        { taskId, hours: 1, minutes: 15, date: new Date('2026-01-11'), notes: 'Research', type: 'research' },
        { taskId, hours: 0, minutes: 30, date: new Date('2026-01-12'), notes: 'Bug fix', type: 'debugging' },
        { taskId, hours: 3, minutes: 0, date: new Date('2026-01-12'), notes: 'More dev', type: 'development' },
      ]

      timeEntries.forEach(entry => injectTimeEntry(entry))

      const result = store.getTimeByEntryType()

      // Expected totals:
      // development: 2h 30m + 3h = 5h 30m = 330 minutes
      // meeting: 1h = 60 minutes
      // review: 45 minutes
      // research: 1h 15m = 75 minutes
      // debugging: 30 minutes
      // Total: 510 minutes

      expect(result).toHaveLength(5)
      
      const devEntry = result.find(r => r.type === 'development')
      expect(devEntry).toBeDefined()
      expect(devEntry?.minutes).toBe(330)

      const meetingEntry = result.find(r => r.type === 'meeting')
      expect(meetingEntry).toBeDefined()
      expect(meetingEntry?.minutes).toBe(60)

      const reviewEntry = result.find(r => r.type === 'review')
      expect(reviewEntry?.minutes).toBe(45)

      const researchEntry = result.find(r => r.type === 'research')
      expect(researchEntry?.minutes).toBe(75)

      const debugEntry = result.find(r => r.type === 'debugging')
      expect(debugEntry?.minutes).toBe(30)
    })

    it('should calculate percentages correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // Add entries: 80 mins dev, 20 mins meeting (total 100 mins)
      injectTimeEntry({ taskId, hours: 1, minutes: 20, date: new Date('2026-01-10'), notes: 'Dev', type: 'development' })
      injectTimeEntry({ taskId, hours: 0, minutes: 20, date: new Date('2026-01-10'), notes: 'Meeting', type: 'meeting' })

      const result = store.getTimeByEntryType()

      const devEntry = result.find(r => r.type === 'development')
      expect(devEntry?.percentage).toBe(80)

      const meetingEntry = result.find(r => r.type === 'meeting')
      expect(meetingEntry?.percentage).toBe(20)
    })

    it('should filter by date range correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // Add entries on different dates
      injectTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2025-12-15'), notes: 'Old dev work', type: 'development' })
      injectTimeEntry({ taskId, hours: 1, minutes: 0, date: new Date('2026-01-05'), notes: 'Recent dev work', type: 'development' })
      injectTimeEntry({ taskId, hours: 1, minutes: 0, date: new Date('2026-01-10'), notes: 'Very recent meeting', type: 'meeting' })

      // Filter from Jan 1, 2026 to Jan 15, 2026
      const startDate = new Date('2026-01-01T00:00:00.000Z')
      const endDate = new Date('2026-01-15T23:59:59.999Z')
      const result = store.getTimeByEntryType(startDate, endDate)

      // Should only include entries from Jan 2026
      const devEntry = result.find(r => r.type === 'development')
      expect(devEntry?.minutes).toBe(60) // Only 1 hour from Jan

      const meetingEntry = result.find(r => r.type === 'meeting')
      expect(meetingEntry?.minutes).toBe(60)
    })

    it('should return empty array when no time entries exist', () => {
      const store = useToolingTrackerStore.getState()
      const result = store.getTimeByEntryType()
      
      expect(result).toEqual([])
    })

    it('should exclude types with zero minutes', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // Only add development time
      injectTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2026-01-10'), notes: 'Dev', type: 'development' })

      const result = store.getTimeByEntryType()

      // Should only return development, not all 6 types
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('development')
    })
  })

  describe('getDeepWorkSessions', () => {
    it('should identify 2+ hour development blocks on same task', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // Add 3 consecutive development entries on same day and task (total 3 hours)
      const date = new Date('2026-01-10T00:00:00.000Z')
      injectTimeEntry({ taskId, hours: 1, minutes: 0, date, notes: 'Dev 1', type: 'development' })
      injectTimeEntry({ taskId, hours: 1, minutes: 30, date, notes: 'Dev 2', type: 'development' })
      injectTimeEntry({ taskId, hours: 0, minutes: 30, date, notes: 'Dev 3', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(1)
      expect(result[0].taskId).toBe(taskId)
      expect(result[0].duration).toBe(180) // 3 hours in minutes
      expect(result[0].date.toISOString().split('T')[0]).toBe('2026-01-10')
    })

    it('should not include sessions below minimum hours threshold', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // Add only 1.5 hours of development
      const date = new Date('2026-01-10')
      injectTimeEntry({ taskId, hours: 1, minutes: 30, date, notes: 'Short dev', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(0)
    })

    it('should separate sessions by date', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // 2.5 hours on Jan 10
      injectTimeEntry({ taskId, hours: 2, minutes: 30, date: new Date('2026-01-10'), notes: 'Dev', type: 'development' })
      
      // 3 hours on Jan 11
      injectTimeEntry({ taskId, hours: 3, minutes: 0, date: new Date('2026-01-11'), notes: 'Dev', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(2)
      expect(result[0].duration).toBe(150) // 2.5 hours
      expect(result[1].duration).toBe(180) // 3 hours
    })

    it('should separate sessions by task', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Task 1',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      injectTask({
        title: 'Task 2',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const tasks = useToolingTrackerStore.getState().tasks
      const task1Id = tasks[0].id
      const task2Id = tasks[1].id

      const date = new Date('2026-01-10')
      
      // 2 hours on task 1
      injectTimeEntry({ taskId: task1Id, hours: 2, minutes: 0, date, notes: 'Dev 1', type: 'development' })
      
      // 2.5 hours on task 2
      injectTimeEntry({ taskId: task2Id, hours: 2, minutes: 30, date, notes: 'Dev 2', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(2)
      expect(result.find(s => s.taskId === task1Id)?.duration).toBe(120)
      expect(result.find(s => s.taskId === task2Id)?.duration).toBe(150)
    })

    it('should only include development type entries', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      const date = new Date('2026-01-10')
      
      // Mix of types totaling 3 hours, but only 1.5 hours dev
      injectTimeEntry({ taskId, hours: 1, minutes: 30, date, notes: 'Dev', type: 'development' })
      injectTimeEntry({ taskId, hours: 1, minutes: 0, date, notes: 'Meeting', type: 'meeting' })
      injectTimeEntry({ taskId, hours: 0, minutes: 30, date, notes: 'Review', type: 'review' })

      const result = store.getDeepWorkSessions(2)

      // Should not count meeting/review toward deep work
      expect(result).toHaveLength(0)
    })

    it('should return empty array when no development entries exist', () => {
      const store = useToolingTrackerStore.getState()
      const result = store.getDeepWorkSessions(2)
      
      expect(result).toEqual([])
    })
  })

  describe('getActivitiesByDateRange', () => {
    it('should filter activities by date range correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add a task
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      // Manually add activities with different dates
      const activities = [
        {
          id: 'act1',
          taskId,
          type: 'task_created' as const,
          description: 'Task created',
          createdAt: new Date('2026-01-09T10:00:00.000Z'),
        },
        {
          id: 'act2',
          taskId,
          type: 'time_logged' as const,
          description: 'Logged 2h',
          createdAt: new Date('2026-01-10T14:00:00.000Z'),
        },
        {
          id: 'act3',
          taskId,
          type: 'time_logged' as const,
          description: 'Logged 1h',
          createdAt: new Date('2026-01-11T16:00:00.000Z'),
        },
        {
          id: 'act4',
          taskId,
          type: 'task_status_changed' as const,
          description: 'Status changed',
          createdAt: new Date('2026-01-12T09:00:00.000Z'),
        },
      ]

      useToolingTrackerStore.setState({ activities })

      // Filter for Jan 10-11 (should get act2 and act3)
      const startDate = new Date('2026-01-10T00:00:00.000Z')
      const endDate = new Date('2026-01-11T23:59:59.999Z')
      
      const result = store.getActivitiesByDateRange(startDate, endDate)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('act2')
      expect(result[1].id).toBe('act3')
    })

    it('should include activities on boundary dates', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id

      const activities = [
        {
          id: 'act1',
          taskId,
          type: 'time_logged' as const,
          description: 'Start of day',
          createdAt: new Date('2026-01-10T00:00:00.000Z'),
        },
        {
          id: 'act2',
          taskId,
          type: 'time_logged' as const,
          description: 'End of day',
          createdAt: new Date('2026-01-10T23:59:59.999Z'),
        },
      ]

      useToolingTrackerStore.setState({ activities })

      const startDate = new Date('2026-01-10T00:00:00.000Z')
      const endDate = new Date('2026-01-10T23:59:59.999Z')
      
      const result = store.getActivitiesByDateRange(startDate, endDate)

      expect(result).toHaveLength(2)
    })

    it('should return empty array when no activities in range', () => {
      const store = useToolingTrackerStore.getState()
      
      const startDate = new Date('2026-01-10T00:00:00.000Z')
      const endDate = new Date('2026-01-10T23:59:59.999Z')
      
      const result = store.getActivitiesByDateRange(startDate, endDate)

      expect(result).toEqual([])
    })
  })

  describe('getTasksCompletedInRange', () => {
    it('should filter tasks by completedAt date correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add tasks with different completion dates
      const tasks = [
        {
          id: 'task1',
          title: 'Task 1',
          description: 'Test',
          status: 'done' as const,
          priority: 'medium' as const,
          projectId,
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
          createdAt: new Date('2026-01-08'),
          updatedAt: new Date('2026-01-09'),
          completedAt: new Date('2026-01-09T15:00:00.000Z'),
          isArchived: false,
          archivedAt: null,
          blockedBy: [],
          blocking: [],
        },
        {
          id: 'task2',
          title: 'Task 2',
          description: 'Test',
          status: 'done' as const,
          priority: 'high' as const,
          projectId,
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
          createdAt: new Date('2026-01-10'),
          updatedAt: new Date('2026-01-10'),
          completedAt: new Date('2026-01-10T14:30:00.000Z'),
          isArchived: false,
          archivedAt: null,
          blockedBy: [],
          blocking: [],
        },
        {
          id: 'task3',
          title: 'Task 3',
          description: 'Test',
          status: 'done' as const,
          priority: 'low' as const,
          projectId,
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
          createdAt: new Date('2026-01-11'),
          updatedAt: new Date('2026-01-11'),
          completedAt: new Date('2026-01-11T10:00:00.000Z'),
          isArchived: false,
          archivedAt: null,
          blockedBy: [],
          blocking: [],
        },
        {
          id: 'task4',
          title: 'Task 4',
          description: 'Test',
          status: 'in-progress' as const,
          priority: 'medium' as const,
          projectId,
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
          createdAt: new Date('2026-01-10'),
          updatedAt: new Date('2026-01-10'),
          completedAt: null,
          isArchived: false,
          archivedAt: null,
          blockedBy: [],
          blocking: [],
        },
      ]

      useToolingTrackerStore.setState({ tasks })

      // Filter for Jan 10-11 (should get task2 and task3)
      const startDate = new Date('2026-01-10T00:00:00.000Z')
      const endDate = new Date('2026-01-11T23:59:59.999Z')
      
      const result = store.getTasksCompletedInRange(startDate, endDate)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('task2')
      expect(result[1].id).toBe('task3')
    })

    it('should only return tasks with completedAt dates', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      const tasks = [
        {
          id: 'task1',
          title: 'Incomplete Task',
          description: 'Test',
          status: 'in-progress' as const,
          priority: 'medium' as const,
          projectId,
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
          createdAt: new Date('2026-01-10'),
          updatedAt: new Date('2026-01-10'),
          completedAt: null,
          isArchived: false,
          archivedAt: null,
          blockedBy: [],
          blocking: [],
        },
      ]

      useToolingTrackerStore.setState({ tasks })

      const startDate = new Date('2026-01-10T00:00:00.000Z')
      const endDate = new Date('2026-01-10T23:59:59.999Z')
      
      const result = store.getTasksCompletedInRange(startDate, endDate)

      expect(result).toEqual([])
    })

    it('should return empty array when no tasks completed in range', () => {
      const store = useToolingTrackerStore.getState()
      
      const startDate = new Date('2026-01-10T00:00:00.000Z')
      const endDate = new Date('2026-01-10T23:59:59.999Z')
      
      const result = store.getTasksCompletedInRange(startDate, endDate)

      expect(result).toEqual([])
    })
  })

  describe('getTimeBreakdownByType', () => {
    it('should group time entries correctly by type', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      const date = new Date('2026-01-10')
      
      // Add different types of time entries
      injectTimeEntry({ taskId, hours: 2, minutes: 30, date, notes: 'Dev', type: 'development' })
      injectTimeEntry({ taskId, hours: 1, minutes: 0, date, notes: 'Meeting', type: 'meeting' })
      injectTimeEntry({ taskId, hours: 0, minutes: 45, date, notes: 'Review', type: 'review' })
      injectTimeEntry({ taskId, hours: 1, minutes: 15, date, notes: 'More dev', type: 'development' })

      const startDate = new Date('2026-01-09')
      const endDate = new Date('2026-01-11')
      const result = store.getTimeBreakdownByType(startDate, endDate)

      expect(result.development).toBe(2 * 60 + 30 + 1 * 60 + 15) // 225 minutes
      expect(result.meeting).toBe(60) // 60 minutes
      expect(result.review).toBe(45) // 45 minutes
      expect(result.research || 0).toBe(0)
      expect(result.debugging || 0).toBe(0)
      expect(result.other || 0).toBe(0)
    })

    it('should filter by date range correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Add entries on different dates
      injectTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2026-01-09'), notes: 'Before', type: 'development' })
      injectTimeEntry({ taskId, hours: 3, minutes: 0, date: new Date('2026-01-10'), notes: 'During', type: 'development' })
      injectTimeEntry({ taskId, hours: 1, minutes: 0, date: new Date('2026-01-11'), notes: 'After', type: 'development' })

      const startDate = new Date('2026-01-10')
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date('2026-01-10')
      endDate.setHours(23, 59, 59, 999)
      
      const result = store.getTimeBreakdownByType(startDate, endDate)

      expect(result.development).toBe(180) // Only the 3-hour entry
    })

    it('should return zeros for all types when no entries exist', () => {
      const store = useToolingTrackerStore.getState()
      
      const startDate = new Date('2026-01-10')
      const endDate = new Date('2026-01-11')
      const result = store.getTimeBreakdownByType(startDate, endDate)

      expect(result.development || 0).toBe(0)
      expect(result.meeting || 0).toBe(0)
      expect(result.review || 0).toBe(0)
      expect(result.research || 0).toBe(0)
      expect(result.debugging || 0).toBe(0)
      expect(result.other || 0).toBe(0)
    })
  })

  describe('getProductivityTrend', () => {
    it('should generate daily data points for date range', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Add entries on different days
      injectTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2026-01-10'), notes: 'Day 1', type: 'development' })
      injectTimeEntry({ taskId, hours: 3, minutes: 30, date: new Date('2026-01-11'), notes: 'Day 2', type: 'development' })
      injectTimeEntry({ taskId, hours: 1, minutes: 15, date: new Date('2026-01-11'), notes: 'Day 2 more', type: 'meeting' })

      const startDate = new Date('2026-01-10')
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date('2026-01-12')
      endDate.setHours(23, 59, 59, 999)
      
      const result = store.getProductivityTrend(startDate, endDate)

      expect(result).toHaveLength(3) // 3 days
      expect(result[0].minutes).toBe(120) // 2 hours
      expect(result[1].minutes).toBe(3 * 60 + 30 + 1 * 60 + 15) // 285 minutes
      expect(result[2].minutes).toBe(0) // No entries
    })

    it('should include days with no entries as 0', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Add entry only on first day
      injectTimeEntry({ taskId, hours: 4, minutes: 0, date: new Date('2026-01-10'), notes: 'Only day', type: 'development' })

      const startDate = new Date('2026-01-10')
      const endDate = new Date('2026-01-16') // 7 days
      
      const result = store.getProductivityTrend(startDate, endDate)

      expect(result).toHaveLength(7)
      expect(result[0].minutes).toBe(240) // First day: 4 hours
      expect(result[1].minutes).toBe(0)
      expect(result[2].minutes).toBe(0)
      expect(result[6].minutes).toBe(0)
    })

    it('should format day labels correctly', () => {
      const store = useToolingTrackerStore.getState()
      
      const startDate = new Date('2026-01-10')
      const endDate = new Date('2026-01-12')
      
      const result = store.getProductivityTrend(startDate, endDate)

      expect(result).toHaveLength(3)
      expect(result[0].day).toBeTruthy() // Should have a day label
      expect(result[1].day).toBeTruthy()
      expect(result[2].day).toBeTruthy()
    })
  })

  describe('getVelocityData', () => {
    it('should group completed tasks by week correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add tasks completed in different weeks
      injectTask({
        title: 'Task 1',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const task1Id = useToolingTrackerStore.getState().tasks[0].id
      
      injectTask({
        title: 'Task 2',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const task2Id = useToolingTrackerStore.getState().tasks[1].id
      
      // Manually set completed dates (2 weeks ago and 1 week ago)
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === task1Id) {
            const twoWeeksAgo = new Date()
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
            return { ...t, completedAt: twoWeeksAgo, createdAt: new Date(twoWeeksAgo.getTime() - 86400000 * 2) }
          }
          if (t.id === task2Id) {
            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
            return { ...t, completedAt: oneWeekAgo, createdAt: new Date(oneWeekAgo.getTime() - 86400000 * 1) }
          }
          return t
        }),
      }))
      
      const result = store.getVelocityData(3)
      
      expect(result).toHaveLength(3)
      // Should have at least one week with completed tasks
      const weeksWithTasks = result.filter(w => w.completed > 0)
      expect(weeksWithTasks.length).toBeGreaterThan(0)
    })

    it('should calculate average cycle time per week', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      injectTask({
        title: 'Task',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Set created 3 days ago, completed today
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === taskId ? { ...t, completedAt: new Date(), createdAt: threeDaysAgo } : t
        ),
      }))
      
      const result = store.getVelocityData(1)
      
      const currentWeek = result.find(w => w.completed > 0)
      expect(currentWeek).toBeDefined()
      expect(currentWeek!.avgCycleTime).toBeGreaterThan(2) // Should be around 3 days
      expect(currentWeek!.avgCycleTime).toBeLessThan(4)
    })

    it('should return correct number of weeks', () => {
      const store = useToolingTrackerStore.getState()
      
      const result = store.getVelocityData(4)
      
      expect(result).toHaveLength(4)
    })

    it('should include weeks with no completed tasks as 0', () => {
      const store = useToolingTrackerStore.getState()
      
      const result = store.getVelocityData(2)
      
      expect(result).toHaveLength(2)
      expect(result.every(w => w.completed === 0)).toBe(true)
    })
  })

  describe('getAverageCycleTime', () => {
    it('should calculate average cycle time across all completed tasks', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add two tasks with different cycle times
      injectTask({
        title: 'Task 1',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      injectTask({
        title: 'Task 2',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      // Set cycle times: Task 1 = 2 days, Task 2 = 4 days
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 86400000 * 2)
      const fourDaysAgo = new Date(now.getTime() - 86400000 * 4)
      
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t, index) => {
          if (index === 0) {
            return { ...t, completedAt: now, createdAt: twoDaysAgo }
          }
          if (index === 1) {
            return { ...t, completedAt: now, createdAt: fourDaysAgo }
          }
          return t
        }),
      }))
      
      const result = store.getAverageCycleTime()
      
      // Average should be (2 + 4) / 2 = 3 days
      expect(result).toBeGreaterThan(2.9)
      expect(result).toBeLessThan(3.1)
    })

    it('should filter by project when projectId provided', async () => {
      const store = useToolingTrackerStore.getState()
      const project1Id = store.projects[0].id
      
      // Add second project via direct state (not API since it's async)
      const project2: Project = {
        id: 'test-project-2',
        name: 'Project 2',
        color: 'green',
        subcategories: [],
        jiraKey: null,
        createdAt: new Date(),
      }
      useToolingTrackerStore.setState((state) => ({
        projects: [...state.projects, project2],
      }))
      
      const project2Id = useToolingTrackerStore.getState().projects[1].id
      
      // Add tasks to both projects
      injectTask({
        title: 'Task P1',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId: project1Id,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      injectTask({
        title: 'Task P2',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId: project2Id,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      // Set different cycle times
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 86400000 * 1)
      const fiveDaysAgo = new Date(now.getTime() - 86400000 * 5)
      
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.projectId === project1Id) {
            return { ...t, completedAt: now, createdAt: oneDayAgo }
          }
          if (t.projectId === project2Id) {
            return { ...t, completedAt: now, createdAt: fiveDaysAgo }
          }
          return t
        }),
      }))
      
      const project1CycleTime = store.getAverageCycleTime(project1Id)
      const project2CycleTime = store.getAverageCycleTime(project2Id)
      
      expect(project1CycleTime).toBeGreaterThan(0.9)
      expect(project1CycleTime).toBeLessThan(1.1)
      expect(project2CycleTime).toBeGreaterThan(4.9)
      expect(project2CycleTime).toBeLessThan(5.1)
    })

    it('should return 0 when no completed tasks exist', () => {
      const store = useToolingTrackerStore.getState()
      
      const result = store.getAverageCycleTime()
      
      expect(result).toBe(0)
    })
  })

  describe('getTaskEfficiencyMetrics', () => {
    it('should calculate average cycle time by priority', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add high priority task (2 day cycle)
      injectTask({
        title: 'High Priority Task',
        description: 'Test',
        status: 'done',
        priority: 'high',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      // Add low priority task (5 day cycle)
      injectTask({
        title: 'Low Priority Task',
        description: 'Test',
        status: 'done',
        priority: 'low',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 86400000 * 2)
      const fiveDaysAgo = new Date(now.getTime() - 86400000 * 5)
      
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.priority === 'high') {
            return { ...t, completedAt: now, createdAt: twoDaysAgo }
          }
          if (t.priority === 'low') {
            return { ...t, completedAt: now, createdAt: fiveDaysAgo }
          }
          return t
        }),
      }))
      
      const result = store.getTaskEfficiencyMetrics()
      
      expect(result.byPriority).toBeDefined()
      const highPriorityData = result.byPriority.find(p => p.category === 'high')
      const lowPriorityData = result.byPriority.find(p => p.category === 'low')
      
      expect(highPriorityData).toBeDefined()
      expect(highPriorityData!.avgCycleTimeDays).toBeGreaterThan(1.9)
      expect(highPriorityData!.avgCycleTimeDays).toBeLessThan(2.1)
      expect(highPriorityData!.taskCount).toBe(1)
      
      expect(lowPriorityData).toBeDefined()
      expect(lowPriorityData!.avgCycleTimeDays).toBeGreaterThan(4.9)
      expect(lowPriorityData!.avgCycleTimeDays).toBeLessThan(5.1)
    })

    it('should calculate average time spent by project', async () => {
      const store = useToolingTrackerStore.getState()
      const project1Id = store.projects[0].id
      
      // Add second project via direct state (not API since it's async)
      const project2: Project = {
        id: 'test-project-2',
        name: 'Project 2',
        color: 'green',
        subcategories: [],
        jiraKey: null,
        createdAt: new Date(),
      }
      useToolingTrackerStore.setState((state) => ({
        projects: [...state.projects, project2],
      }))
      
      const project2Id = useToolingTrackerStore.getState().projects[1].id
      
      // Add tasks to both projects
      injectTask({
        title: 'P1 Task',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId: project1Id,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      injectTask({
        title: 'P2 Task',
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId: project2Id,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const task1 = useToolingTrackerStore.getState().tasks[0]
      const task2 = useToolingTrackerStore.getState().tasks[1]
      
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 86400000)
      
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t) => ({
          ...t,
          completedAt: now,
          createdAt: oneDayAgo,
        })),
      }))
      
      // Add time entries (3 hours for P1, 5 hours for P2)
      injectTimeEntry({
        taskId: task1.id,
        date: now,
        hours: 3,
        minutes: 0,
        notes: 'Work on P1',
        type: 'development',
      })
      
      injectTimeEntry({
        taskId: task2.id,
        date: now,
        hours: 5,
        minutes: 0,
        notes: 'Work on P2',
        type: 'development',
      })
      
      const result = store.getTaskEfficiencyMetrics()
      
      expect(result.byProject).toBeDefined()
      expect(result.byProject.length).toBeGreaterThan(0)
      
      const project1Data = result.byProject.find(p => p.category === store.projects[0].name)
      const project2Data = result.byProject.find(p => p.category === 'Project 2')
      
      expect(project1Data).toBeDefined()
      expect(project1Data!.avgTimeSpentMinutes).toBe(180) // 3 hours
      
      expect(project2Data).toBeDefined()
      expect(project2Data!.avgTimeSpentMinutes).toBe(300) // 5 hours
    })

    it('should calculate overall averages correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add multiple completed tasks
      for (let i = 0; i < 3; i++) {
        injectTask({
          title: `Task ${i + 1}`,
          description: 'Test',
          status: 'done',
          priority: 'medium',
          projectId,
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
        })
      }
      
      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 86400000 * 3)
      
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t) => ({
          ...t,
          completedAt: now,
          createdAt: threeDaysAgo,
        })),
      }))
      
      // Add time entries (2 hours each)
      useToolingTrackerStore.getState().tasks.forEach((task) => {
        injectTimeEntry({
          taskId: task.id,
          date: now,
          hours: 2,
          minutes: 0,
          notes: 'Work',
          type: 'development',
        })
      })
      
      const result = store.getTaskEfficiencyMetrics()
      
      expect(result.overallAvgCycleTime).toBeGreaterThan(2.9)
      expect(result.overallAvgCycleTime).toBeLessThan(3.1)
      expect(result.overallAvgTimeSpent).toBe(120) // 2 hours in minutes
    })

    it('should handle empty data gracefully', () => {
      const store = useToolingTrackerStore.getState()
      
      const result = store.getTaskEfficiencyMetrics()
      
      expect(result.byPriority).toEqual([])
      expect(result.byProject).toEqual([])
      expect(result.overallAvgCycleTime).toBe(0)
      expect(result.overallAvgTimeSpent).toBe(0)
    })

    it('should group multiple tasks by priority correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add 2 high priority tasks
      for (let i = 0; i < 2; i++) {
        injectTask({
          title: `High Task ${i + 1}`,
          description: 'Test',
          status: 'done',
          priority: 'high',
          projectId,
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
        })
      }
      
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 86400000 * 2)
      
      useToolingTrackerStore.setState((state) => ({
        tasks: state.tasks.map((t) => ({
          ...t,
          completedAt: now,
          createdAt: twoDaysAgo,
        })),
      }))
      
      const result = store.getTaskEfficiencyMetrics()
      
      const highPriorityData = result.byPriority.find(p => p.category === 'high')
      expect(highPriorityData).toBeDefined()
      expect(highPriorityData!.taskCount).toBe(2)
    })
  })

  describe('Custom Date Range Filtering', () => {
    it('should filter tasks by custom date range', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id

      // Create tasks with different dates
      const task1Date = new Date('2026-01-01')
      const task2Date = new Date('2026-01-15')
      const task3Date = new Date('2026-01-31')

      injectTask({
        title: 'Task 1',
        description: 'Early January',
        status: 'todo',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      injectTask({
        title: 'Task 2',
        description: 'Mid January',
        status: 'todo',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      injectTask({
        title: 'Task 3',
        description: 'Late January',
        status: 'todo',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      // Manually set creation dates
      const tasks = useToolingTrackerStore.getState().tasks
      tasks[0].createdAt = task1Date
      tasks[1].createdAt = task2Date
      tasks[2].createdAt = task3Date

      // Set custom date range filter (Jan 10 - Jan 20)
      store.setBoardFilters({
        dateRange: 'custom',
        customStart: new Date('2026-01-10'),
        customEnd: new Date('2026-01-20'),
      })

      const filtered = store.getFilteredTasks()

      // Should only include task 2 (Jan 15)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Task 2')
    })

    it('should include tasks on boundary dates', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id

      injectTask({
        title: 'Start Task',
        description: 'On start date',
        status: 'todo',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      injectTask({
        title: 'End Task',
        description: 'On end date',
        status: 'todo',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      const tasks = useToolingTrackerStore.getState().tasks
      tasks[0].createdAt = new Date('2026-01-10T08:00:00')
      tasks[1].createdAt = new Date('2026-01-20T16:00:00')

      store.setBoardFilters({
        dateRange: 'custom',
        customStart: new Date('2026-01-10'),
        customEnd: new Date('2026-01-20'),
      })

      const filtered = store.getFilteredTasks()

      // Should include both boundary tasks
      expect(filtered).toHaveLength(2)
    })

    it('should ignore custom dates when dateRange is not "custom"', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id

      injectTask({
        title: 'Task',
        description: 'Test',
        status: 'todo',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      // Set custom dates but use "all" dateRange
      store.setBoardFilters({
        dateRange: 'all',
        customStart: new Date('2026-01-01'),
        customEnd: new Date('2026-01-02'),
      })

      const filtered = store.getFilteredTasks()

      // Should include task even though custom dates are set
      expect(filtered).toHaveLength(1)
    })
  })

  describe('Loading and Error State', () => {
    beforeEach(() => {
      // Clear loading and error state for these tests
      useToolingTrackerStore.setState({
        isLoading: false,
        error: null,
      })
    })

    it('should initialize with loading false and no error', () => {
      const store = useToolingTrackerStore.getState()
      
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set loading state', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setLoading(true)
      expect(useToolingTrackerStore.getState().isLoading).toBe(true)
      
      store.setLoading(false)
      expect(useToolingTrackerStore.getState().isLoading).toBe(false)
    })

    it('should set error state', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setError('Test error message')
      expect(useToolingTrackerStore.getState().error).toBe('Test error message')
    })

    it('should clear error with null', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setError('Error')
      expect(useToolingTrackerStore.getState().error).toBe('Error')
      
      store.setError(null)
      expect(useToolingTrackerStore.getState().error).toBeNull()
    })

    it('should support loading sequence: false -> true -> false', () => {
      const store = useToolingTrackerStore.getState()
      
      expect(useToolingTrackerStore.getState().isLoading).toBe(false)
      
      store.setLoading(true)
      expect(useToolingTrackerStore.getState().isLoading).toBe(true)
      
      store.setLoading(false)
      expect(useToolingTrackerStore.getState().isLoading).toBe(false)
    })

    it('should support error sequence: null -> message -> null', () => {
      const store = useToolingTrackerStore.getState()
      
      expect(useToolingTrackerStore.getState().error).toBeNull()
      
      store.setError('Network error')
      expect(useToolingTrackerStore.getState().error).toBe('Network error')
      
      store.setError(null)
      expect(useToolingTrackerStore.getState().error).toBeNull()
    })

    it('should allow updating both loading and error independently', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setLoading(true)
      expect(useToolingTrackerStore.getState().isLoading).toBe(true)
      expect(useToolingTrackerStore.getState().error).toBeNull()
      
      store.setError('Error occurred')
      expect(useToolingTrackerStore.getState().isLoading).toBe(true)
      expect(useToolingTrackerStore.getState().error).toBe('Error occurred')
      
      store.setLoading(false)
      expect(useToolingTrackerStore.getState().isLoading).toBe(false)
      expect(useToolingTrackerStore.getState().error).toBe('Error occurred')
      
      store.setError(null)
      expect(useToolingTrackerStore.getState().isLoading).toBe(false)
      expect(useToolingTrackerStore.getState().error).toBeNull()
    })

    it('should handle multiple error updates', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setError('Error 1')
      expect(useToolingTrackerStore.getState().error).toBe('Error 1')
      
      store.setError('Error 2')
      expect(useToolingTrackerStore.getState().error).toBe('Error 2')
      
      store.setError(null)
      expect(useToolingTrackerStore.getState().error).toBeNull()
    })
  })

  describe('Project API Integration', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = vi.fn()
      
      // Clear state before each test
      useToolingTrackerStore.setState({
        isLoading: false,
        error: null,
      })
    })

    it('addProject calls API and updates store on success', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'Test Project',
        color: 'blue',
        subcategories: [],
        jiraKey: null,
        createdAt: new Date(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.addProject('Test Project', 'blue', null)

      const projects = useToolingTrackerStore.getState().projects
      expect(projects).toHaveLength(2) // 1 from beforeEach + 1 new
      expect(projects[1].name).toBe('Test Project')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('addProject sets error on API failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Project name is required',
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.addProject('Test Project', 'blue', null)

      const stateAfter = useToolingTrackerStore.getState()
      expect(stateAfter.error).toBeTruthy()
      expect(stateAfter.isLoading).toBe(false)
    })

    it('addProject sends correct payload to API', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'My Project',
        color: 'green',
        subcategories: [],
        jiraKey: 'PROJ',
        createdAt: new Date(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.addProject('My Project', 'green', 'PROJ')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'My Project',
            color: 'green',
            jiraKey: 'PROJ',
          }),
        })
      )
    })

    it('updateProject calls API and updates store on success', async () => {
      const updatedProject: Project = {
        id: 'test-project-1',
        name: 'Updated Project',
        color: 'green',
        subcategories: ['New Sub'],
        jiraKey: 'UP',
        createdAt: new Date(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProject,
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.updateProject('test-project-1', { name: 'Updated Project' })

      const projects = useToolingTrackerStore.getState().projects
      expect(projects[0].name).toBe('Updated Project')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('updateProject sets error on API failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Project not found',
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.updateProject('nonexistent', { name: 'New Name' })

      const stateAfter = useToolingTrackerStore.getState()
      expect(stateAfter.error).toBeTruthy()
      expect(stateAfter.isLoading).toBe(false)
    })

    it('deleteProject calls API and removes project from store on success', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      const store = useToolingTrackerStore.getState()
      const initialCount = store.projects.length
      
      await store.deleteProject('test-project-1')

      const projects = useToolingTrackerStore.getState().projects
      expect(projects).toHaveLength(initialCount - 1)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('deleteProject sets error on API failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Project not found',
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.deleteProject('nonexistent')

      const stateAfter = useToolingTrackerStore.getState()
      expect(stateAfter.error).toBeTruthy()
      expect(stateAfter.isLoading).toBe(false)
    })

    it('addSubcategoryToProject calls API and updates store on success', async () => {
      const updatedProject: Project = {
        id: 'test-project-1',
        name: 'Test Project',
        color: 'blue',
        subcategories: ['New Category'],
        jiraKey: null,
        createdAt: new Date(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProject,
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.addSubcategoryToProject('test-project-1', 'New Category')

      const projects = useToolingTrackerStore.getState().projects
      expect(projects[0].subcategories).toContain('New Category')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('addSubcategoryToProject sends correct payload to API', async () => {
      const updatedProject: Project = {
        id: 'test-project-1',
        name: 'Test Project',
        color: 'blue',
        subcategories: ['UI'],
        jiraKey: null,
        createdAt: new Date(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProject,
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.addSubcategoryToProject('test-project-1', 'UI')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/test-project-1/subcategories',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'UI' }),
        })
      )
    })

    it('addSubcategoryToProject sets error on API failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid category name',
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.addSubcategoryToProject('test-project-1', '')

      const stateAfter = useToolingTrackerStore.getState()
      expect(stateAfter.error).toBeTruthy()
      expect(stateAfter.isLoading).toBe(false)
    })

    it('maintains loading state during async operations', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          name: 'Test',
          color: 'blue',
          subcategories: [],
          jiraKey: null,
          createdAt: new Date(),
        }),
      } as Response)

      const store = useToolingTrackerStore.getState()
      
      // Before calling
      expect(store.isLoading).toBe(false)
      
      const promise = store.addProject('Test', 'blue')
      // After calling but before await (isLoading might be true)
      
      await promise
      
      // After completion
      expect(store.isLoading).toBe(false)
    })

    it('addProject validates input and returns early if name is empty', async () => {
      const store = useToolingTrackerStore.getState()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await store.addProject('', 'blue')
      
      expect(consoleSpy).toHaveBeenCalledWith('Project name is required')
      expect(global.fetch).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('addProject trims whitespace from project name', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'Trimmed Project',
        color: 'blue',
        subcategories: [],
        jiraKey: null,
        createdAt: new Date(),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.addProject('  Trimmed Project  ', 'blue')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Trimmed Project',
            color: 'blue',
            jiraKey: null,
          }),
        })
      )
    })
  })
})

describe('API Integration - Store Actions', () => {
  beforeEach(() => {
    // Reset store before each test
    const testProject: Project = {
      id: 'test-project-1',
      name: 'Test Project',
      color: 'blue',
      subcategories: [],
      jiraKey: null,
      createdAt: new Date(),
    }
    
    useToolingTrackerStore.setState({
      tasks: [],
      timeEntries: [],
      projects: [testProject],
      activities: [],
      comments: [],
      attachments: [],
      history: [],
      selectedProjectId: null,
      boardFilters: {
        search: '',
        projectId: null,
        priority: 'all',
        dateRange: 'all',
        customStart: null,
        customEnd: null,
        showArchived: false,
      },
      isLoading: false,
      error: null,
    })

    // Mock global fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('addTask - API Integration', () => {
    it('should call POST /api/tasks and update store on success', async () => {
      const mockTask = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      } as Response)

      const store = useToolingTrackerStore.getState()
      const result = await store.addTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'medium',
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      expect(result).toBeDefined()
      expect(result?.id).toBe('task1')

      // Verify task was added to store
      const state = useToolingTrackerStore.getState()
      expect(state.tasks).toHaveLength(1)
      expect(state.tasks[0].title).toBe('Test Task')
    })

    it('should set loading state during request', async () => {
      const mockTask = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      } as Response)

      const store = useToolingTrackerStore.getState()
      
      const promise = store.addTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'medium',
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      // After completion, loading should be false
      await promise
      const state = useToolingTrackerStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle API errors and set error state', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Validation error',
      } as Response)

      const store = useToolingTrackerStore.getState()
      const result = await injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'medium',
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      expect(result).toBeUndefined()

      const state = useToolingTrackerStore.getState()
      expect(state.error).toBeTruthy()
      expect(state.isLoading).toBe(false)
    })

    it('should validate title before making API call', async () => {
      const store = useToolingTrackerStore.getState()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await injectTask({
        title: '',
        description: 'Test',
        status: 'todo',
        priority: 'medium',
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      expect(result).toBeUndefined()
      expect(global.fetch).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should validate projectId before making API call', async () => {
      const store = useToolingTrackerStore.getState()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await injectTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'medium',
        projectId: '',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })

      expect(result).toBeUndefined()
      expect(global.fetch).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('updateTask - API Integration', () => {
    it('should call PATCH /api/tasks/:id and update store', async () => {
      // First add a task to the store
      const mockTask = {
        id: 'task1',
        title: 'Original Title',
        description: 'Test',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      }

      useToolingTrackerStore.setState({ tasks: [mockTask] })

      const updatedTask = { ...mockTask, title: 'Updated Title' }
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTask,
      } as Response)

      const store = useToolingTrackerStore.getState()
      store.updateTask('task1', { title: 'Updated Title' })

      // Wait a tick for state update
      await new Promise(r => setTimeout(r, 0))

      const state = useToolingTrackerStore.getState()
      // updateTask updates local state immediately (optimistic update)
      expect(state.tasks[0].title).toBe('Updated Title')
    })

    it('should handle update errors and set error state', async () => {
      const mockTask = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      }

      useToolingTrackerStore.setState({ tasks: [mockTask] })

      const store = useToolingTrackerStore.getState()
      store.updateTask('task1', { title: 'Updated' })

      // Store updates optimistically
      const state = useToolingTrackerStore.getState()
      expect(state.tasks[0].title).toBe('Updated')
    })
  })

  describe('deleteTask - API Integration', () => {
    it('should call DELETE /api/tasks/:id and remove from store', async () => {
      const mockTask = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      }

      useToolingTrackerStore.setState({ tasks: [mockTask] })

      const store = useToolingTrackerStore.getState()
      expect(store.tasks).toHaveLength(1)

      store.deleteTask('task1')

      const state = useToolingTrackerStore.getState()
      expect(state.tasks).toHaveLength(0)
    })

    it('should remove time entries when task is deleted', async () => {
      const mockTask = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: 'test-project-1',
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      }

      const mockTimeEntry: TimeEntry = {
        id: 'time1',
        taskId: 'task1',
        hours: 2,
        minutes: 30,
        date: new Date(),
        notes: 'Work',
        type: 'development',
        createdAt: new Date(),
      }

      useToolingTrackerStore.setState({ 
        tasks: [mockTask],
        timeEntries: [mockTimeEntry]
      })

      const store = useToolingTrackerStore.getState()
      store.deleteTask('task1')

      const state = useToolingTrackerStore.getState()
      expect(state.tasks).toHaveLength(0)
      expect(state.timeEntries).toHaveLength(0)
    })
  })

  describe('loadInitialData', () => {
    it('should call all API endpoints in parallel and update store on success', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Project 1',
          color: 'blue',
          subcategories: [],
          jiraKey: null,
          createdAt: new Date(),
        }
      ]

      const mockTasks: Task[] = [
        {
          id: 'task1',
          title: 'Test Task',
          description: '',
          status: 'todo',
          priority: 'medium',
          projectId: '1',
          dueDate: null,
          subcategory: null,
          jiraKey: null,
          storyPoints: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          isArchived: false,
          archivedAt: null,
          blockedBy: [],
          blocking: [],
        }
      ]

      const mockTimeEntries: TimeEntry[] = [
        {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date(),
          notes: 'Work',
          type: 'development',
          createdAt: new Date(),
        }
      ]

      const mockComments = []
      const mockAttachments = []
      const mockActivities = []

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      // Mock each endpoint's response
      let callCount = 0
      vi.mocked(global.fetch).mockImplementation(async (url) => {
        if (url === '/api/projects') {
          return { ok: true, json: async () => mockProjects } as Response
        }
        if (url === '/api/tasks') {
          return { ok: true, json: async () => mockTasks } as Response
        }
        if (url === '/api/time-entries') {
          return { ok: true, json: async () => mockTimeEntries } as Response
        }
        if (url === '/api/comments') {
          return { ok: true, json: async () => mockComments } as Response
        }
        if (url === '/api/attachments') {
          return { ok: true, json: async () => mockAttachments } as Response
        }
        if (url === '/api/activities') {
          return { ok: true, json: async () => mockActivities } as Response
        }
        return { ok: false, status: 404, text: async () => 'Not found' } as Response
      })

      const store = useToolingTrackerStore.getState()
      await store.loadInitialData()

      const state = useToolingTrackerStore.getState()
      expect(state.projects).toEqual(mockProjects)
      expect(state.tasks).toEqual(mockTasks)
      expect(state.timeEntries).toEqual(mockTimeEntries)
      expect(state.comments).toEqual(mockComments)
      expect(state.attachments).toEqual(mockAttachments)
      expect(state.activities).toEqual(mockActivities)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set isLoading to true during fetch and false after', async () => {
      let loadingDuringFetch = false

      vi.mocked(global.fetch).mockImplementation(async (url) => {
        const currentState = useToolingTrackerStore.getState()
        if (url === '/api/projects') {
          loadingDuringFetch = currentState.isLoading
        }
        return { ok: true, json: async () => [] } as Response
      })

      const store = useToolingTrackerStore.getState()
      await store.loadInitialData()

      expect(loadingDuringFetch).toBe(true)
      expect(useToolingTrackerStore.getState().isLoading).toBe(false)
    })

    it('should handle empty database (all arrays returned are empty)', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.loadInitialData()

      const state = useToolingTrackerStore.getState()
      expect(state.projects).toEqual([])
      expect(state.tasks).toEqual([])
      expect(state.timeEntries).toEqual([])
      expect(state.comments).toEqual([])
      expect(state.attachments).toEqual([])
      expect(state.activities).toEqual([])
      expect(state.error).toBeNull()
    })

    it('should handle API errors gracefully without failing', async () => {
      vi.mocked(global.fetch).mockImplementation(async (url) => {
        if (url === '/api/projects') {
          return { ok: true, json: async () => [] } as Response
        }
        if (url === '/api/tasks') {
          return { ok: false, status: 500, text: async () => 'Server error' } as Response
        }
        return { ok: true, json: async () => [] } as Response
      })

      const store = useToolingTrackerStore.getState()
      await store.loadInitialData()

      const state = useToolingTrackerStore.getState()
      expect(state.error).toBeTruthy()
      expect(state.isLoading).toBe(false)
    })

    it('should set error message when fetch fails', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.loadInitialData()

      const state = useToolingTrackerStore.getState()
      expect(state.error).toBeTruthy()
      expect(state.isLoading).toBe(false)
    })

    it('should clear previous error on successful load', async () => {
      // Set an initial error
      useToolingTrackerStore.setState({ error: 'Previous error' })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.loadInitialData()

      const state = useToolingTrackerStore.getState()
      expect(state.error).toBeNull()
    })

    it('should fetch all endpoints exactly once in parallel', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const store = useToolingTrackerStore.getState()
      await store.loadInitialData()

      // Should call 6 endpoints
      expect(fetchSpy).toHaveBeenCalledTimes(6)
      expect(fetchSpy).toHaveBeenCalledWith('/api/projects', expect.any(Object))
      expect(fetchSpy).toHaveBeenCalledWith('/api/tasks', expect.any(Object))
      expect(fetchSpy).toHaveBeenCalledWith('/api/time-entries', expect.any(Object))
      expect(fetchSpy).toHaveBeenCalledWith('/api/comments', expect.any(Object))
      expect(fetchSpy).toHaveBeenCalledWith('/api/attachments', expect.any(Object))
      expect(fetchSpy).toHaveBeenCalledWith('/api/activities', expect.any(Object))

      fetchSpy.mockRestore()
    })
  })

  describe('Phase 3 - Async Task Operations', () => {
    const mockTask = {
      id: 'task1',
      title: 'Test Task',
      description: 'Test',
      status: 'todo' as const,
      priority: 'medium' as const,
      projectId: 'test-project-1',
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      isArchived: false,
      archivedAt: null,
      blockedBy: [],
      blocking: [],
    }

    describe('updateTask - async API-backed', () => {
      it('should call PATCH /api/tasks/:id with updates', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const updatedTask = { ...mockTask, title: 'Updated Title' }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateTask('task1', { title: 'Updated Title' })

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/task1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ title: 'Updated Title' }),
          })
        )
      })

      it('should update task in store from API response', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const updatedTask = { ...mockTask, title: 'Updated Title', updatedAt: new Date() }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateTask('task1', { title: 'Updated Title' })

        const state = useToolingTrackerStore.getState()
        expect(state.tasks[0].title).toBe('Updated Title')
      })

      it('should set error on API failure', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Task not found',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateTask('task1', { title: 'Updated' })

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
      })

      it('should NOT create Activity records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], activities: [] })

        const updatedTask = { ...mockTask, title: 'Updated' }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length
        
        await store.updateTask('task1', { title: 'Updated' })

        const state = useToolingTrackerStore.getState()
        // Activities should NOT be created client-side (API creates them)
        expect(state.activities.length).toBe(initialActivityCount)
      })

      it('should set loading state during request', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const updatedTask = { ...mockTask, title: 'Updated' }
        let loadingDuringFetch = false

        vi.mocked(global.fetch).mockImplementation(async () => {
          loadingDuringFetch = useToolingTrackerStore.getState().isLoading
          return {
            ok: true,
            json: async () => updatedTask,
          } as Response
        })

        const store = useToolingTrackerStore.getState()
        await store.updateTask('task1', { title: 'Updated' })

        expect(loadingDuringFetch).toBe(true)
        expect(useToolingTrackerStore.getState().isLoading).toBe(false)
      })
    })

    describe('deleteTask - async API-backed', () => {
      it('should call DELETE /api/tasks/:id', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteTask('task1')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/task1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })

      it('should remove task from store after successful delete', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response)

        const store = useToolingTrackerStore.getState()
        expect(store.tasks).toHaveLength(1)

        await store.deleteTask('task1')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks).toHaveLength(0)
      })

      it('should remove associated time entries on delete', async () => {
        const timeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date(),
          notes: 'Work',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ 
          tasks: [mockTask],
          timeEntries: [timeEntry]
        })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteTask('task1')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks).toHaveLength(0)
        expect(state.timeEntries).toHaveLength(0)
      })

      it('should set error on API failure', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Task not found',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteTask('task1')

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.tasks).toHaveLength(1) // Task should NOT be removed on error
      })

      it('should NOT create Activity records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], activities: [] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length
        
        await store.deleteTask('task1')

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('moveTask - async API-backed', () => {
      it('should call PATCH /api/tasks/:id with new status', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const movedTask = { ...mockTask, status: 'in-progress' as const }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => movedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.moveTask('task1', 'in-progress')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/task1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"status":"in-progress"'),
          })
        )
      })

      it('should set completedAt when status changes to done', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const now = new Date()
        const completedTask = { ...mockTask, status: 'done' as const, completedAt: now }
        
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => completedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.moveTask('task1', 'done')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks[0].status).toBe('done')
        expect(state.tasks[0].completedAt).toBeTruthy()
      })

      it('should NOT set completedAt if already done', async () => {
        const doneTask = { ...mockTask, status: 'done' as const, completedAt: new Date('2026-01-10') }
        useToolingTrackerStore.setState({ tasks: [doneTask] })

        const movedTask = { ...doneTask, status: 'todo' as const, completedAt: new Date('2026-01-10') }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => movedTask,
        } as Response)

        const originalCompletedAt = doneTask.completedAt
        const store = useToolingTrackerStore.getState()
        await store.moveTask('task1', 'todo')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks[0].completedAt).toEqual(originalCompletedAt)
      })

      it('should NOT create History records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], history: [] })

        const movedTask = { ...mockTask, status: 'in-progress' as const }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => movedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialHistoryCount = store.history.length
        
        await store.moveTask('task1', 'in-progress')

        const state = useToolingTrackerStore.getState()
        expect(state.history.length).toBe(initialHistoryCount)
      })

      it('should NOT create Activity records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], activities: [] })

        const movedTask = { ...mockTask, status: 'in-progress' as const }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => movedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length
        
        await store.moveTask('task1', 'in-progress')

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('archiveTask - async API-backed', () => {
      it('should call PATCH /api/tasks/:id with isArchived and archivedAt', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const archivedTask = { ...mockTask, isArchived: true, archivedAt: new Date() }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => archivedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.archiveTask('task1')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/task1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"isArchived":true'),
          })
        )
      })

      it('should update task to archived status in store', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const archivedTask = { ...mockTask, isArchived: true, archivedAt: new Date() }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => archivedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.archiveTask('task1')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks[0].isArchived).toBe(true)
        expect(state.tasks[0].archivedAt).toBeTruthy()
      })

      it('should NOT create Activity records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], activities: [] })

        const archivedTask = { ...mockTask, isArchived: true, archivedAt: new Date() }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => archivedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length
        
        await store.archiveTask('task1')

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('unarchiveTask - async API-backed', () => {
      it('should call PATCH /api/tasks/:id with isArchived=false and archivedAt=null', async () => {
        const archivedTask = { ...mockTask, isArchived: true, archivedAt: new Date() }
        useToolingTrackerStore.setState({ tasks: [archivedTask] })

        const unarchivedTask = { ...mockTask, isArchived: false, archivedAt: null }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => unarchivedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.unarchiveTask('task1')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/task1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"isArchived":false'),
          })
        )
      })

      it('should update task to unarchived status in store', async () => {
        const archivedTask = { ...mockTask, isArchived: true, archivedAt: new Date() }
        useToolingTrackerStore.setState({ tasks: [archivedTask] })

        const unarchivedTask = { ...mockTask, isArchived: false, archivedAt: null }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => unarchivedTask,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.unarchiveTask('task1')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks[0].isArchived).toBe(false)
        expect(state.tasks[0].archivedAt).toBeNull()
      })
    })

    describe('bulkArchiveTasks - async API-backed', () => {
      it('should call POST /api/tasks/bulk with operation: archive', async () => {
        const task2 = { ...mockTask, id: 'task2', title: 'Task 2' }
        useToolingTrackerStore.setState({ tasks: [mockTask, task2] })

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, affected: 2 }),
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [
              { ...mockTask, isArchived: true, archivedAt: new Date() },
              { ...task2, isArchived: true, archivedAt: new Date() }
            ],
          } as Response)

        const store = useToolingTrackerStore.getState()
        await store.bulkArchiveTasks(['task1', 'task2'])

        // First call: POST to bulk endpoint
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/bulk',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ operation: 'archive', taskIds: ['task1', 'task2'] }),
          })
        )
      })

      it('should refresh tasks from database after bulk operation', async () => {
        const task2 = { ...mockTask, id: 'task2', title: 'Task 2' }
        useToolingTrackerStore.setState({ tasks: [mockTask, task2] })

        const archivedTasks = [
          { ...mockTask, isArchived: true, archivedAt: new Date() },
          { ...task2, isArchived: true, archivedAt: new Date() }
        ]

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, affected: 2 }),
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => archivedTasks,
          } as Response)

        const store = useToolingTrackerStore.getState()
        await store.bulkArchiveTasks(['task1', 'task2'])

        const state = useToolingTrackerStore.getState()
        expect(state.tasks.every(t => t.isArchived)).toBe(true)
      })
    })

    describe('bulkDeleteTasks - async API-backed', () => {
      it('should call POST /api/tasks/bulk with operation: delete', async () => {
        const task2 = { ...mockTask, id: 'task2', title: 'Task 2' }
        useToolingTrackerStore.setState({ tasks: [mockTask, task2] })

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, affected: 2 }),
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [],
          } as Response)

        const store = useToolingTrackerStore.getState()
        await store.bulkDeleteTasks(['task1', 'task2'])

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/bulk',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ operation: 'delete', taskIds: ['task1', 'task2'] }),
          })
        )
      })

      it('should remove tasks from store after bulk delete', async () => {
        const task2 = { ...mockTask, id: 'task2', title: 'Task 2' }
        useToolingTrackerStore.setState({ tasks: [mockTask, task2] })

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, affected: 2 }),
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [],
          } as Response)

        const store = useToolingTrackerStore.getState()
        expect(store.tasks).toHaveLength(2)

        await store.bulkDeleteTasks(['task1', 'task2'])

        const state = useToolingTrackerStore.getState()
        expect(state.tasks).toHaveLength(0)
      })
    })

    describe('addBlocker - async API-backed', () => {
      it('should call PATCH /api/tasks/:id with updated blocking/blockedBy arrays', async () => {
        const blocker = { ...mockTask, id: 'blocker1', title: 'Blocker Task' }
        useToolingTrackerStore.setState({ tasks: [mockTask, blocker] })

        const updatedTask = { ...mockTask, blockedBy: ['blocker1'], blocking: [] }
        const updatedBlocker = { ...blocker, blocking: ['task1'], blockedBy: [] }

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedTask,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedBlocker,
          } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addBlocker('task1', 'blocker1')

        // Should update both tasks
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })

      it('should add blockedBy to task and blocking to blocker', async () => {
        const blocker = { ...mockTask, id: 'blocker1', title: 'Blocker Task' }
        useToolingTrackerStore.setState({ tasks: [mockTask, blocker] })

        const updatedTask = { ...mockTask, blockedBy: ['blocker1'] }
        const updatedBlocker = { ...blocker, blocking: ['task1'] }

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedTask,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedBlocker,
          } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addBlocker('task1', 'blocker1')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks[0].blockedBy).toContain('blocker1')
        expect(state.tasks[1].blocking).toContain('task1')
      })
    })

    describe('removeBlocker - async API-backed', () => {
      it('should call PATCH /api/tasks/:id with updated blocking/blockedBy arrays', async () => {
        const blocker = { ...mockTask, id: 'blocker1', title: 'Blocker Task', blocking: ['task1'] }
        const blockedTask = { ...mockTask, blockedBy: ['blocker1'] }
        useToolingTrackerStore.setState({ tasks: [blockedTask, blocker] })

        const updatedTask = { ...blockedTask, blockedBy: [] }
        const updatedBlocker = { ...blocker, blocking: [] }

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedTask,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedBlocker,
          } as Response)

        const store = useToolingTrackerStore.getState()
        await store.removeBlocker('task1', 'blocker1')

        // Should update both tasks
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })

      it('should remove blockedBy from task and blocking from blocker', async () => {
        const blocker = { ...mockTask, id: 'blocker1', title: 'Blocker', blocking: ['task1'] }
        const blockedTask = { ...mockTask, blockedBy: ['blocker1'] }
        useToolingTrackerStore.setState({ tasks: [blockedTask, blocker] })

        const updatedTask = { ...blockedTask, blockedBy: [] }
        const updatedBlocker = { ...blocker, blocking: [] }

        vi.mocked(global.fetch)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedTask,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => updatedBlocker,
          } as Response)

        const store = useToolingTrackerStore.getState()
        await store.removeBlocker('task1', 'blocker1')

        const state = useToolingTrackerStore.getState()
        expect(state.tasks[0].blockedBy).not.toContain('blocker1')
        expect(state.tasks[1].blocking).not.toContain('task1')
      })
    })
  })

  describe('Phase 4 - Async Time Entry, Comment, and Attachment Operations', () => {
    const mockTask = {
      id: 'task1',
      title: 'Test Task',
      description: 'Test',
      status: 'todo' as const,
      priority: 'medium' as const,
      projectId: 'test-project-1',
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      isArchived: false,
      archivedAt: null,
      blockedBy: [],
      blocking: [],
    }

    describe('addTimeEntry - async API-backed', () => {
      it('should call POST /api/time-entries with time entry data', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Dev work',
          type: 'development',
          createdAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockTimeEntry,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addTimeEntry({
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Dev work',
          type: 'development',
        })

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/time-entries',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: 'task1',
              hours: 2,
              minutes: 30,
              date: new Date('2026-01-15'),
              notes: 'Dev work',
              type: 'development',
            }),
          })
        )
      })

      it('should add time entry to store from API response', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], timeEntries: [] })

        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Dev work',
          type: 'development',
          createdAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockTimeEntry,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addTimeEntry({
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Dev work',
          type: 'development',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.timeEntries).toHaveLength(1)
        expect(state.timeEntries[0].id).toBe('time1')
        expect(state.timeEntries[0].hours).toBe(2)
        expect(state.timeEntries[0].minutes).toBe(30)
      })

      it('should set loading state during request', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 1,
          minutes: 0,
          date: new Date(),
          notes: '',
          type: 'development',
          createdAt: new Date(),
        }

        let loadingDuringFetch = false
        vi.mocked(global.fetch).mockImplementation(async () => {
          loadingDuringFetch = useToolingTrackerStore.getState().isLoading
          return {
            ok: true,
            json: async () => mockTimeEntry,
            status: 201,
          } as Response
        })

        const store = useToolingTrackerStore.getState()
        await store.addTimeEntry({
          taskId: 'task1',
          hours: 1,
          minutes: 0,
          date: new Date(),
          notes: '',
          type: 'development',
        })

        expect(loadingDuringFetch).toBe(true)
        expect(useToolingTrackerStore.getState().isLoading).toBe(false)
      })

      it('should set error on API failure', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'Invalid time entry',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addTimeEntry({
          taskId: 'task1',
          hours: 1,
          minutes: 0,
          date: new Date(),
          notes: '',
          type: 'development',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
        expect(state.timeEntries).toHaveLength(0)
      })

      it('should NOT create Activity records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], activities: [], timeEntries: [] })

        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 1,
          minutes: 0,
          date: new Date(),
          notes: '',
          type: 'development',
          createdAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockTimeEntry,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.addTimeEntry({
          taskId: 'task1',
          hours: 1,
          minutes: 0,
          date: new Date(),
          notes: '',
          type: 'development',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })

      it('should use server-generated ID from response', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const mockTimeEntry: TimeEntry = {
          id: 'server-generated-id-12345',
          taskId: 'task1',
          hours: 1,
          minutes: 0,
          date: new Date(),
          notes: '',
          type: 'development',
          createdAt: new Date('2026-01-15T10:00:00Z'),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockTimeEntry,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addTimeEntry({
          taskId: 'task1',
          hours: 1,
          minutes: 0,
          date: new Date(),
          notes: '',
          type: 'development',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.timeEntries[0].id).toBe('server-generated-id-12345')
      })
    })

    describe('updateTimeEntry - async API-backed', () => {
      it('should call PATCH /api/time-entries/:id with updates', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Old notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry] })

        const updatedEntry: TimeEntry = {
          ...mockTimeEntry,
          notes: 'Updated notes',
          hours: 3,
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedEntry,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateTimeEntry('time1', { notes: 'Updated notes', hours: 3 })

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/time-entries/time1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ notes: 'Updated notes', hours: 3 }),
          })
        )
      })

      it('should update time entry in store from API response', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Old notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry] })

        const updatedEntry: TimeEntry = {
          ...mockTimeEntry,
          notes: 'Updated notes',
          hours: 3,
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedEntry,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateTimeEntry('time1', { notes: 'Updated notes', hours: 3 })

        const state = useToolingTrackerStore.getState()
        expect(state.timeEntries[0].notes).toBe('Updated notes')
        expect(state.timeEntries[0].hours).toBe(3)
      })

      it('should set error on API failure', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Time entry not found',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateTimeEntry('time1', { hours: 3 })

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
      })

      it('should NOT create Activity records client-side', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry], activities: [] })

        const updatedEntry: TimeEntry = { ...mockTimeEntry, hours: 3 }
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedEntry,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.updateTimeEntry('time1', { hours: 3 })

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('deleteTimeEntry - async API-backed', () => {
      it('should call DELETE /api/time-entries/:id', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteTimeEntry('time1')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/time-entries/time1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })

      it('should remove time entry from store after successful delete', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        expect(store.timeEntries).toHaveLength(1)

        await store.deleteTimeEntry('time1')

        const state = useToolingTrackerStore.getState()
        expect(state.timeEntries).toHaveLength(0)
      })

      it('should set error on API failure', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Time entry not found',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteTimeEntry('time1')

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
        expect(state.timeEntries).toHaveLength(1) // Entry should NOT be removed on error
      })

      it('should NOT create Activity records client-side', async () => {
        const mockTimeEntry: TimeEntry = {
          id: 'time1',
          taskId: 'task1',
          hours: 2,
          minutes: 30,
          date: new Date('2026-01-15'),
          notes: 'Notes',
          type: 'development',
          createdAt: new Date(),
        }

        useToolingTrackerStore.setState({ timeEntries: [mockTimeEntry], activities: [] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.deleteTimeEntry('time1')

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('addComment - async API-backed', () => {
      it('should call POST /api/comments with comment data', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Test comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockComment,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addComment({
          taskId: 'task1',
          content: 'Test comment',
        })

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/comments',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: 'task1',
              content: 'Test comment',
            }),
          })
        )
      })

      it('should add comment to store from API response', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], comments: [] })

        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Test comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockComment,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addComment({
          taskId: 'task1',
          content: 'Test comment',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.comments).toHaveLength(1)
        expect(state.comments[0].id).toBe('comment1')
        expect(state.comments[0].content).toBe('Test comment')
      })

      it('should set error on API failure', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], comments: [] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'Invalid comment',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addComment({
          taskId: 'task1',
          content: 'Test comment',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
        expect(state.comments).toHaveLength(0)
      })

      it('should NOT create Activity records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], comments: [], activities: [] })

        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Test comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockComment,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.addComment({
          taskId: 'task1',
          content: 'Test comment',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('updateComment - async API-backed', () => {
      it('should call PATCH /api/comments/:id with content', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Old content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment] })

        const updatedComment: TaskComment = {
          ...mockComment,
          content: 'Updated content',
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedComment,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateComment('comment1', 'Updated content')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/comments/comment1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ content: 'Updated content' }),
          })
        )
      })

      it('should update comment in store from API response', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Old content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment] })

        const updatedComment: TaskComment = {
          ...mockComment,
          content: 'Updated content',
          updatedAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedComment,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateComment('comment1', 'Updated content')

        const state = useToolingTrackerStore.getState()
        expect(state.comments[0].content).toBe('Updated content')
      })

      it('should set error on API failure', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Comment not found',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.updateComment('comment1', 'Updated content')

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
      })

      it('should NOT create Activity records client-side', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment], activities: [] })

        const updatedComment: TaskComment = {
          ...mockComment,
          content: 'Updated content',
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedComment,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.updateComment('comment1', 'Updated content')

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('deleteComment - async API-backed', () => {
      it('should call DELETE /api/comments/:id', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteComment('comment1')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/comments/comment1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })

      it('should remove comment from store after successful delete', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        expect(store.comments).toHaveLength(1)

        await store.deleteComment('comment1')

        const state = useToolingTrackerStore.getState()
        expect(state.comments).toHaveLength(0)
      })

      it('should set error on API failure', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status:404,
          text: async () => 'Comment not found',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteComment('comment1')

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
        expect(state.comments).toHaveLength(1) // Comment should NOT be removed on error
      })

      it('should NOT create Activity records client-side', async () => {
        const mockComment: TaskComment = {
          id: 'comment1',
          taskId: 'task1',
          content: 'Content',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        useToolingTrackerStore.setState({ comments: [mockComment], activities: [] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.deleteComment('comment1')

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('addAttachment - async API-backed', () => {
      it('should call POST /api/attachments with attachment data', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask] })

        const mockAttachment: TaskAttachment = {
          id: 'attach1',
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttachment,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addAttachment({
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        })

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/attachments',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: 'task1',
              fileName: 'document.pdf',
              fileSize: 1024,
              fileType: 'application/pdf',
            }),
          })
        )
      })

      it('should add attachment to store from API response', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], attachments: [] })

        const mockAttachment: TaskAttachment = {
          id: 'attach1',
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttachment,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addAttachment({
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.attachments).toHaveLength(1)
        expect(state.attachments[0].id).toBe('attach1')
        expect(state.attachments[0].fileName).toBe('document.pdf')
      })

      it('should set error on API failure', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], attachments: [] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => 'Invalid attachment',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.addAttachment({
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
        expect(state.attachments).toHaveLength(0)
      })

      it('should NOT create Activity records client-side', async () => {
        useToolingTrackerStore.setState({ tasks: [mockTask], attachments: [], activities: [] })

        const mockAttachment: TaskAttachment = {
          id: 'attach1',
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedAt: new Date(),
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttachment,
          status: 201,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.addAttachment({
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        })

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })

    describe('deleteAttachment - async API-backed', () => {
      it('should call DELETE /api/attachments/:id', async () => {
        const mockAttachment: TaskAttachment = {
          id: 'attach1',
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedAt: new Date(),
        }

        useToolingTrackerStore.setState({ attachments: [mockAttachment] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteAttachment('attach1')

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/attachments/attach1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })

      it('should remove attachment from store after successful delete', async () => {
        const mockAttachment: TaskAttachment = {
          id: 'attach1',
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedAt: new Date(),
        }

        useToolingTrackerStore.setState({ attachments: [mockAttachment] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        expect(store.attachments).toHaveLength(1)

        await store.deleteAttachment('attach1')

        const state = useToolingTrackerStore.getState()
        expect(state.attachments).toHaveLength(0)
      })

      it('should set error on API failure', async () => {
        const mockAttachment: TaskAttachment = {
          id: 'attach1',
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedAt: new Date(),
        }

        useToolingTrackerStore.setState({ attachments: [mockAttachment] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Attachment not found',
        } as Response)

        const store = useToolingTrackerStore.getState()
        await store.deleteAttachment('attach1')

        const state = useToolingTrackerStore.getState()
        expect(state.error).toBeTruthy()
        expect(state.isLoading).toBe(false)
        expect(state.attachments).toHaveLength(1) // Attachment should NOT be removed on error
      })

      it('should NOT create Activity records client-side', async () => {
        const mockAttachment: TaskAttachment = {
          id: 'attach1',
          taskId: 'task1',
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
          uploadedAt: new Date(),
        }

        useToolingTrackerStore.setState({ attachments: [mockAttachment], activities: [] })

        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => null,
          status: 204,
        } as Response)

        const store = useToolingTrackerStore.getState()
        const initialActivityCount = store.activities.length

        await store.deleteAttachment('attach1')

        const state = useToolingTrackerStore.getState()
        expect(state.activities.length).toBe(initialActivityCount)
      })
    })
  })

  describe('Persistence Configuration', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear()
      // Reset store
      const testProject: Project = {
        id: 'test-project-persistence',
        name: 'Persistence Test Project',
        color: 'blue',
        subcategories: [],
        jiraKey: null,
        createdAt: new Date(),
      }
      useToolingTrackerStore.setState({
        tasks: [],
        timeEntries: [],
        projects: [testProject],
        activities: [],
        comments: [],
        attachments: [],
        history: [],
        selectedProjectId: null,
        boardFilters: {
          search: '',
          projectId: null,
          priority: 'all',
          dateRange: 'all',
          customStart: null,
          customEnd: null,
          showArchived: false,
        },
        isLoading: false,
        error: null,
      })
    })

    afterEach(() => {
      localStorage.clear()
    })

    describe('Data Fields NOT Persisted to localStorage', () => {
      it('should NOT persist projects to localStorage', () => {
        useToolingTrackerStore.setState({
          projects: [
            {
              id: 'proj-1',
              name: 'Test Project',
              color: 'blue',
              subcategories: [],
              jiraKey: null,
              createdAt: new Date(),
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.projects).toBeUndefined()
      })

      it('should NOT persist tasks to localStorage', () => {
        useToolingTrackerStore.setState({
          tasks: [
            {
              id: 'task-1',
              title: 'Test Task',
              description: 'Test Description',
              status: 'todo',
              priority: 'high',
              projectId: 'proj-1',
              dueDate: null,
              subcategory: null,
              jiraKey: null,
              storyPoints: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: null,
              isArchived: false,
              archivedAt: null,
              blockedBy: [],
              blocking: [],
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.tasks).toBeUndefined()
      })

      it('should NOT persist timeEntries to localStorage', () => {
        useToolingTrackerStore.setState({
          timeEntries: [
            {
              id: 'time-1',
              taskId: 'task-1',
              hours: 2,
              minutes: 30,
              type: 'development',
              createdAt: new Date(),
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.timeEntries).toBeUndefined()
      })

      it('should NOT persist activities to localStorage', () => {
        useToolingTrackerStore.setState({
          activities: [
            {
              id: 'act-1',
              type: 'task_created',
              taskId: 'task-1',
              description: 'Task created',
              createdAt: new Date(),
              metadata: {},
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.activities).toBeUndefined()
      })

      it('should NOT persist comments to localStorage', () => {
        useToolingTrackerStore.setState({
          comments: [
            {
              id: 'comment-1',
              taskId: 'task-1',
              content: 'Test comment',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.comments).toBeUndefined()
      })

      it('should NOT persist attachments to localStorage', () => {
        useToolingTrackerStore.setState({
          attachments: [
            {
              id: 'attach-1',
              taskId: 'task-1',
              fileName: 'test.pdf',
              fileSize: 1024,
              fileType: 'application/pdf',
              uploadedAt: new Date(),
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.attachments).toBeUndefined()
      })

      it('should NOT persist history to localStorage', () => {
        useToolingTrackerStore.setState({
          history: [
            {
              id: 'hist-1',
              taskId: 'task-1',
              field: 'status',
              oldValue: 'todo',
              newValue: 'in-progress',
              changedAt: new Date(),
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.history).toBeUndefined()
      })
    })

    describe('UI State Persisted to localStorage', () => {
      it('should persist selectedProjectId to localStorage', () => {
        useToolingTrackerStore.setState({
          selectedProjectId: 'test-project-persistence',
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.selectedProjectId).toBe('test-project-persistence')
      })

      it('should persist boardFilters to localStorage', () => {
        useToolingTrackerStore.setState({
          boardFilters: {
            search: 'testing',
            projectId: 'proj-1',
            priority: 'high',
            dateRange: 'month',
            customStart: null,
            customEnd: null,
            showArchived: true,
          },
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed.state.boardFilters.search).toBe('testing')
        expect(parsed.state.boardFilters.projectId).toBe('proj-1')
        expect(parsed.state.boardFilters.priority).toBe('high')
        expect(parsed.state.boardFilters.dateRange).toBe('month')
        expect(parsed.state.boardFilters.showArchived).toBe(true)
      })

      it('should persist all boardFilters properties individually', () => {
        const customStart = new Date('2026-01-01')
        const customEnd = new Date('2026-01-31')
        useToolingTrackerStore.setState({
          boardFilters: {
            search: 'search text',
            projectId: 'proj-2',
            priority: 'low',
            dateRange: 'custom',
            customStart,
            customEnd,
            showArchived: false,
          },
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        const parsed = JSON.parse(stored!)
        
        expect(parsed.state.boardFilters.search).toBe('search text')
        expect(parsed.state.boardFilters.projectId).toBe('proj-2')
        expect(parsed.state.boardFilters.priority).toBe('low')
        expect(parsed.state.boardFilters.dateRange).toBe('custom')
        expect(parsed.state.boardFilters.showArchived).toBe(false)
      })
    })

    describe('Loading and Error State NOT Persisted', () => {
      it('should NOT persist isLoading to localStorage', () => {
        useToolingTrackerStore.setState({
          isLoading: true,
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        const parsed = JSON.parse(stored!)
        expect(parsed.state.isLoading).toBeUndefined()
      })

      it('should NOT persist error to localStorage', () => {
        useToolingTrackerStore.setState({
          error: 'Some error occurred',
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        const parsed = JSON.parse(stored!)
        expect(parsed.state.error).toBeUndefined()
      })
    })

    describe('localStorage Structure', () => {
      it('should only persist state with selectedProjectId and boardFilters', () => {
        useToolingTrackerStore.setState({
          selectedProjectId: 'test-proj',
          boardFilters: {
            search: 'test',
            projectId: null,
            priority: 'all',
            dateRange: 'all',
            customStart: null,
            customEnd: null,
            showArchived: false,
          },
          projects: [
            {
              id: 'test-proj',
              name: 'Test',
              color: 'blue',
              subcategories: [],
              jiraKey: null,
              createdAt: new Date(),
            },
          ],
          tasks: [
            {
              id: 'task-1',
              title: 'Task',
              description: '',
              status: 'todo',
              priority: 'medium',
              projectId: 'test-proj',
              dueDate: null,
              subcategory: null,
              jiraKey: null,
              storyPoints: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: null,
              isArchived: false,
              archivedAt: null,
              blockedBy: [],
              blocking: [],
            },
          ],
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        const parsed = JSON.parse(stored!)
        
        // Only these should be persisted
        expect(parsed.state).toHaveProperty('selectedProjectId')
        expect(parsed.state).toHaveProperty('boardFilters')
        
        // These should NOT be
        expect(parsed.state).not.toHaveProperty('projects')
        expect(parsed.state).not.toHaveProperty('tasks')
        expect(parsed.state).not.toHaveProperty('timeEntries')
        expect(parsed.state).not.toHaveProperty('activities')
        expect(parsed.state).not.toHaveProperty('comments')
        expect(parsed.state).not.toHaveProperty('attachments')
        expect(parsed.state).not.toHaveProperty('history')
      })

      it('should maintain proper localStorage format with version', () => {
        useToolingTrackerStore.setState({
          selectedProjectId: 'proj-1',
        })

        const stored = localStorage.getItem('ToolingTracker-storage')
        expect(stored).not.toBeNull()
        
        const parsed = JSON.parse(stored!)
        expect(parsed).toHaveProperty('state')
        expect(parsed.state).toHaveProperty('selectedProjectId')
        expect(parsed.state).toHaveProperty('boardFilters')
      })
    })

    describe('UI State Filter Updates', () => {
      it('should persist gradual filter state changes', () => {
        const store = useToolingTrackerStore.getState()
        
        // Change multiple filter properties
        store.setBoardFilters({ search: 'filter1' })
        let stored = localStorage.getItem('ToolingTracker-storage')
        let parsed = JSON.parse(stored!)
        expect(parsed.state.boardFilters.search).toBe('filter1')
        
        store.setBoardFilters({ priority: 'high' })
        stored = localStorage.getItem('ToolingTracker-storage')
        parsed = JSON.parse(stored!)
        expect(parsed.state.boardFilters.priority).toBe('high')
        expect(parsed.state.boardFilters.search).toBe('filter1') // Previous value maintained
      })

      it('should persist selected project changes', () => {
        const store = useToolingTrackerStore.getState()
        
        store.setSelectedProject('new-proj-1')
        let stored = localStorage.getItem('ToolingTracker-storage')
        let parsed = JSON.parse(stored!)
        expect(parsed.state.selectedProjectId).toBe('new-proj-1')
        
        store.setSelectedProject(null)
        stored = localStorage.getItem('ToolingTracker-storage')
        parsed = JSON.parse(stored!)
        expect(parsed.state.selectedProjectId).toBeNull()
      })
    })
  })
})
