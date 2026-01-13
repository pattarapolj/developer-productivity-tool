import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyStandup } from './daily-standup'
import { useToolingTrackerStore } from '@/lib/store'

describe('DailyStandup Component', () => {
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
  })

  it('should render with empty sections gracefully', () => {
    render(<DailyStandup />)
    
    // Should show the component title
    expect(screen.getByText('Daily Standup')).toBeInTheDocument()
    
    // Should show section headers
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Blockers')).toBeInTheDocument()
    
    // Should show empty state messages
    const noTasksMessages = screen.getAllByText('No tasks')
    expect(noTasksMessages).toHaveLength(3) // One for each section
  })

  it('should display tasks completed yesterday', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'blue')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Get yesterday's date (start and end of day)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(10, 30, 0, 0)
    
    // Add a task completed yesterday
    const tasks = [
      {
        id: 'task1',
        title: 'Completed Task',
        description: 'Test',
        status: 'done' as const,
        priority: 'medium' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: yesterday,
        completedAt: yesterday,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      },
    ]

    useToolingTrackerStore.setState({ tasks })

    // Add time entry for the task
    store.addTimeEntry({
      taskId: 'task1',
      hours: 2,
      minutes: 30,
      date: yesterday,
      notes: 'Work done',
      type: 'development',
    })
    
    render(<DailyStandup />)
    
    // Should show task in Yesterday section
    expect(screen.getByText('Completed Task')).toBeInTheDocument()
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
  })

  it('should display tasks in progress today', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'green')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add tasks with in-progress status
    const tasks = [
      {
        id: 'task1',
        title: 'Current Task 1',
        description: 'Test',
        status: 'in-progress' as const,
        priority: 'high' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      },
      {
        id: 'task2',
        title: 'Current Task 2',
        description: 'Test',
        status: 'in-progress' as const,
        priority: 'medium' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-11'),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      },
    ]

    useToolingTrackerStore.setState({ tasks })
    
    render(<DailyStandup />)
    
    // Should show both tasks in Today section
    expect(screen.getByText('Current Task 1')).toBeInTheDocument()
    expect(screen.getByText('Current Task 2')).toBeInTheDocument()
  })

  it('should display blocked tasks correctly', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'purple')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add tasks with blockers
    const tasks = [
      {
        id: 'task1',
        title: 'Blocked Task',
        description: 'Test',
        status: 'in-progress' as const,
        priority: 'high' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: ['task2'],
        blocking: [],
      },
      {
        id: 'task2',
        title: 'Blocking Task',
        description: 'Test',
        status: 'todo' as const,
        priority: 'high' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: ['task1'],
      },
    ]

    useToolingTrackerStore.setState({ tasks })
    
    render(<DailyStandup />)
    
    // Should show blocked task in Blockers section
    const blockedTaskLinks = screen.getAllByText('Blocked Task')
    expect(blockedTaskLinks.length).toBeGreaterThan(0)
    
    // Should indicate it's blocked by another task (appears in both Today and Blockers)
    const blockerBadges = screen.getAllByText('Blocked by 1 task')
    expect(blockerBadges.length).toBeGreaterThan(0)
  })

  it('should display project colors correctly', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project with blue color
    store.addProject('Test Project', 'blue')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add a task
    const tasks = [
      {
        id: 'task1',
        title: 'Test Task',
        description: 'Test',
        status: 'in-progress' as const,
        priority: 'medium' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      },
    ]

    useToolingTrackerStore.setState({ tasks })
    
    const { container } = render(<DailyStandup />)
    
    // Should have project color indicator (look for bg-project-blue class)
    const colorDot = container.querySelector('.bg-project-blue')
    expect(colorDot).toBeInTheDocument()
  })

  it('should handle multiple blockers correctly', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'orange')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add task with multiple blockers
    const tasks = [
      {
        id: 'task1',
        title: 'Multi-Blocked Task',
        description: 'Test',
        status: 'in-progress' as const,
        priority: 'high' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: ['task2', 'task3'],
        blocking: [],
      },
    ]

    useToolingTrackerStore.setState({ tasks })
    
    render(<DailyStandup />)
    
    // Should show correct blocker count (task appears in both Today and Blockers sections)
    const blockerBadges = screen.getAllByText('Blocked by 2 tasks')
    expect(blockerBadges.length).toBeGreaterThan(0)
  })

  it('should not show completed tasks in Today section', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'pink')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add tasks with different statuses
    const tasks = [
      {
        id: 'task1',
        title: 'In Progress Task',
        description: 'Test',
        status: 'in-progress' as const,
        priority: 'medium' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
        completedAt: null,
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      },
      {
        id: 'task2',
        title: 'Done Task',
        description: 'Test',
        status: 'done' as const,
        priority: 'medium' as const,
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
        completedAt: new Date(),
        isArchived: false,
        archivedAt: null,
        blockedBy: [],
        blocking: [],
      },
    ]

    useToolingTrackerStore.setState({ tasks })
    
    render(<DailyStandup />)
    
    // Should show in-progress task
    expect(screen.getByText('In Progress Task')).toBeInTheDocument()
    
    // Should not show done task in Today section
    // (It might be in Yesterday if completed today, but not in Today)
    const todaySection = screen.getByText('Today').closest('div')
    expect(todaySection).not.toHaveTextContent('Done Task')
  })
})
