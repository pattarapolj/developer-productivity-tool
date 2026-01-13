import { describe, it, expect, beforeEach } from 'vitest'
import { useToolingTrackerStore } from './store'
import type { TimeEntry } from './types'

describe('Focus Time Analysis - Store Helpers', () => {
  beforeEach(() => {
    // Reset store before each test
    useToolingTrackerStore.setState({
      tasks: [],
      timeEntries: [],
      projects: [],
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
        showArchived: false,
      },
    })
    
    // Add a test project
    useToolingTrackerStore.getState().addProject('Test Project', 'blue')
  })

  describe('getTimeByEntryType', () => {
    it('should calculate correct totals for each time entry type', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add a task
      store.addTask({
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

      // Add time entries of different types
      const timeEntries: Omit<TimeEntry, 'id' | 'createdAt'>[] = [
        { taskId, hours: 2, minutes: 30, date: new Date('2026-01-10'), notes: 'Dev work', type: 'development' },
        { taskId, hours: 1, minutes: 0, date: new Date('2026-01-10'), notes: 'Team meeting', type: 'meeting' },
        { taskId, hours: 0, minutes: 45, date: new Date('2026-01-11'), notes: 'Code review', type: 'review' },
        { taskId, hours: 1, minutes: 15, date: new Date('2026-01-11'), notes: 'Research', type: 'research' },
        { taskId, hours: 0, minutes: 30, date: new Date('2026-01-12'), notes: 'Bug fix', type: 'debugging' },
        { taskId, hours: 3, minutes: 0, date: new Date('2026-01-12'), notes: 'More dev', type: 'development' },
      ]

      timeEntries.forEach(entry => store.addTimeEntry(entry))

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
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 1, minutes: 20, date: new Date('2026-01-10'), notes: 'Dev', type: 'development' })
      store.addTimeEntry({ taskId, hours: 0, minutes: 20, date: new Date('2026-01-10'), notes: 'Meeting', type: 'meeting' })

      const result = store.getTimeByEntryType()

      const devEntry = result.find(r => r.type === 'development')
      expect(devEntry?.percentage).toBe(80)

      const meetingEntry = result.find(r => r.type === 'meeting')
      expect(meetingEntry?.percentage).toBe(20)
    })

    it('should filter by date range correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2025-12-15'), notes: 'Old dev work', type: 'development' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 0, date: new Date('2026-01-05'), notes: 'Recent dev work', type: 'development' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 0, date: new Date('2026-01-10'), notes: 'Very recent meeting', type: 'meeting' })

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
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2026-01-10'), notes: 'Dev', type: 'development' })

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
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 1, minutes: 0, date, notes: 'Dev 1', type: 'development' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 30, date, notes: 'Dev 2', type: 'development' })
      store.addTimeEntry({ taskId, hours: 0, minutes: 30, date, notes: 'Dev 3', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(1)
      expect(result[0].taskId).toBe(taskId)
      expect(result[0].duration).toBe(180) // 3 hours in minutes
      expect(result[0].date.toISOString().split('T')[0]).toBe('2026-01-10')
    })

    it('should not include sessions below minimum hours threshold', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 1, minutes: 30, date, notes: 'Short dev', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(0)
    })

    it('should separate sessions by date', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 2, minutes: 30, date: new Date('2026-01-10'), notes: 'Dev', type: 'development' })
      
      // 3 hours on Jan 11
      store.addTimeEntry({ taskId, hours: 3, minutes: 0, date: new Date('2026-01-11'), notes: 'Dev', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(2)
      expect(result[0].duration).toBe(150) // 2.5 hours
      expect(result[1].duration).toBe(180) // 3 hours
    })

    it('should separate sessions by task', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
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
      
      store.addTask({
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
      store.addTimeEntry({ taskId: task1Id, hours: 2, minutes: 0, date, notes: 'Dev 1', type: 'development' })
      
      // 2.5 hours on task 2
      store.addTimeEntry({ taskId: task2Id, hours: 2, minutes: 30, date, notes: 'Dev 2', type: 'development' })

      const result = store.getDeepWorkSessions(2)

      expect(result).toHaveLength(2)
      expect(result.find(s => s.taskId === task1Id)?.duration).toBe(120)
      expect(result.find(s => s.taskId === task2Id)?.duration).toBe(150)
    })

    it('should only include development type entries', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 1, minutes: 30, date, notes: 'Dev', type: 'development' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 0, date, notes: 'Meeting', type: 'meeting' })
      store.addTimeEntry({ taskId, hours: 0, minutes: 30, date, notes: 'Review', type: 'review' })

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
      store.addTask({
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
      
      store.addTask({
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
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 2, minutes: 30, date, notes: 'Dev', type: 'development' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 0, date, notes: 'Meeting', type: 'meeting' })
      store.addTimeEntry({ taskId, hours: 0, minutes: 45, date, notes: 'Review', type: 'review' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 15, date, notes: 'More dev', type: 'development' })

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
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2026-01-09'), notes: 'Before', type: 'development' })
      store.addTimeEntry({ taskId, hours: 3, minutes: 0, date: new Date('2026-01-10'), notes: 'During', type: 'development' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 0, date: new Date('2026-01-11'), notes: 'After', type: 'development' })

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
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 2, minutes: 0, date: new Date('2026-01-10'), notes: 'Day 1', type: 'development' })
      store.addTimeEntry({ taskId, hours: 3, minutes: 30, date: new Date('2026-01-11'), notes: 'Day 2', type: 'development' })
      store.addTimeEntry({ taskId, hours: 1, minutes: 15, date: new Date('2026-01-11'), notes: 'Day 2 more', type: 'meeting' })

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
      
      store.addTask({
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
      store.addTimeEntry({ taskId, hours: 4, minutes: 0, date: new Date('2026-01-10'), notes: 'Only day', type: 'development' })

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
})

