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
        customStart: null,
        customEnd: null,
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

  describe('getVelocityData', () => {
    it('should group completed tasks by week correctly', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      // Add tasks completed in different weeks
      store.addTask({
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
      
      store.addTask({
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
      
      store.addTask({
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
      store.addTask({
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
      
      store.addTask({
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

    it('should filter by project when projectId provided', () => {
      const store = useToolingTrackerStore.getState()
      const project1Id = store.projects[0].id
      
      // Add second project
      store.addProject('Project 2', 'green')
      const project2Id = useToolingTrackerStore.getState().projects[1].id
      
      // Add tasks to both projects
      store.addTask({
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
      
      store.addTask({
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
      store.addTask({
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
      store.addTask({
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

    it('should calculate average time spent by project', () => {
      const store = useToolingTrackerStore.getState()
      const project1Id = store.projects[0].id
      
      // Add second project
      store.addProject('Project 2', 'green')
      const project2Id = useToolingTrackerStore.getState().projects[1].id
      
      // Add tasks to both projects
      store.addTask({
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
      
      store.addTask({
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
      store.addTimeEntry({
        taskId: task1.id,
        date: now,
        hours: 3,
        minutes: 0,
        description: 'Work on P1',
        type: 'development',
      })
      
      store.addTimeEntry({
        taskId: task2.id,
        date: now,
        hours: 5,
        minutes: 0,
        description: 'Work on P2',
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
        store.addTask({
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
        store.addTimeEntry({
          taskId: task.id,
          date: now,
          hours: 2,
          minutes: 0,
          description: 'Work',
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
        store.addTask({
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

  describe('trackFieldChange and getFormattedHistory', () => {
    it('should track field changes when task is updated', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Update priority
      store.updateTask(taskId, { priority: 'high' })
      
      const history = store.getHistoryForTask(taskId)
      expect(history.length).toBeGreaterThan(0)
      
      const priorityChange = history.find(h => h.field === 'priority')
      expect(priorityChange).toBeDefined()
      expect(priorityChange!.oldValue).toBe('low')
      expect(priorityChange!.newValue).toBe('high')
    })

    it('should format history entries with labels', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Update status
      store.updateTask(taskId, { status: 'in-progress' })
      
      const formattedHistory = store.getFormattedHistory(taskId)
      expect(formattedHistory.length).toBeGreaterThan(0)
      
      const statusChange = formattedHistory.find(h => h.field === 'status')
      expect(statusChange).toBeDefined()
      expect(statusChange!.fieldLabel).toBe('Status')
      expect(statusChange!.oldValueFormatted).toBe('To Do')
      expect(statusChange!.newValueFormatted).toBe('In Progress')
    })

    it('should format priority with capitalization', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Update priority
      store.updateTask(taskId, { priority: 'high' })
      
      const formattedHistory = store.getFormattedHistory(taskId)
      const priorityChange = formattedHistory.find(h => h.field === 'priority')
      
      expect(priorityChange).toBeDefined()
      expect(priorityChange!.oldValueFormatted).toBe('Low')
      expect(priorityChange!.newValueFormatted).toBe('High')
    })

    it('should track multiple field changes', () => {
      const store = useToolingTrackerStore.getState()
      const projectId = store.projects[0].id
      
      store.addTask({
        title: 'Test Task',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
      
      const taskId = useToolingTrackerStore.getState().tasks[0].id
      
      // Multiple updates
      store.updateTask(taskId, { priority: 'high' })
      store.updateTask(taskId, { status: 'in-progress' })
      store.updateTask(taskId, { title: 'Updated Task' })
      
      const history = store.getHistoryForTask(taskId)
      expect(history.length).toBeGreaterThanOrEqual(3)
      
      const fields = history.map(h => h.field)
      expect(fields).toContain('priority')
      expect(fields).toContain('status')
      expect(fields).toContain('title')
    })

    it('should return empty array for task with no history', () => {
      const store = useToolingTrackerStore.getState()
      
      const history = store.getFormattedHistory('nonexistent-task')
      expect(history).toEqual([])
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

      store.addTask({
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

      store.addTask({
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

      store.addTask({
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

      store.addTask({
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

      store.addTask({
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

      store.addTask({
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
    it('should initialize with loading false and no error', () => {
      const store = useToolingTrackerStore.getState()
      
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set loading state', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
      
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('should set error state', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setError('Test error message')
      expect(store.error).toBe('Test error message')
    })

    it('should clear error with null', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setError('Error')
      expect(store.error).toBe('Error')
      
      store.setError(null)
      expect(store.error).toBeNull()
    })

    it('should support loading sequence: false -> true -> false', () => {
      const store = useToolingTrackerStore.getState()
      
      expect(store.isLoading).toBe(false)
      
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
      
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('should support error sequence: null -> message -> null', () => {
      const store = useToolingTrackerStore.getState()
      
      expect(store.error).toBeNull()
      
      store.setError('Network error')
      expect(store.error).toBe('Network error')
      
      store.setError(null)
      expect(store.error).toBeNull()
    })

    it('should allow updating both loading and error independently', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
      expect(store.error).toBeNull()
      
      store.setError('Error occurred')
      expect(store.isLoading).toBe(true)
      expect(store.error).toBe('Error occurred')
      
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Error occurred')
      
      store.setError(null)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle multiple error updates', () => {
      const store = useToolingTrackerStore.getState()
      
      store.setError('Error 1')
      expect(store.error).toBe('Error 1')
      
      store.setError('Error 2')
      expect(store.error).toBe('Error 2')
      
      store.setError(null)
      expect(store.error).toBeNull()
    })
  })
})

