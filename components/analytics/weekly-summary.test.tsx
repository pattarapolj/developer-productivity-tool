import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeeklySummary } from './weekly-summary'
import { useToolingTrackerStore } from '@/lib/store'

describe('WeeklySummary Component', () => {
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

  it('should render with empty data gracefully', () => {
    render(<WeeklySummary />)
    
    // Should show the component title
    expect(screen.getByText('Weekly Summary')).toBeInTheDocument()
    
    // Should show week selector buttons
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('Last Week')).toBeInTheDocument()
    
    // Should show stat cards
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument()
    expect(screen.getByText('Total Time')).toBeInTheDocument()
    expect(screen.getByText('Avg Daily Time')).toBeInTheDocument()
    expect(screen.getByText('Most Productive')).toBeInTheDocument()
  })

  it('should display stats cards with data', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'blue')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add a task and complete it this week
    store.addTask({
      title: 'Test Task',
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
    
    // Add time entries
    const today = new Date()
    store.addTimeEntry({
      taskId,
      hours: 3,
      minutes: 30,
      date: today,
      notes: 'Dev work',
      type: 'development',
    })
    
    render(<WeeklySummary />)
    
    // Should show completed tasks count
    expect(screen.getByText('1')).toBeInTheDocument()
    
    // Should show total time (appears in both Total Time card and Most Productive day)
    const timeElements = screen.getAllByText('3h 30m')
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('should show time breakdown chart when data exists', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'blue')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
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
    const today = new Date()
    
    // Add different types of time entries
    store.addTimeEntry({
      taskId,
      hours: 2,
      minutes: 0,
      date: today,
      notes: 'Dev',
      type: 'development',
    })
    
    store.addTimeEntry({
      taskId,
      hours: 1,
      minutes: 0,
      date: today,
      notes: 'Meeting',
      type: 'meeting',
    })
    
    render(<WeeklySummary />)
    
    // Should show time breakdown section
    expect(screen.getByText('Time Breakdown by Type')).toBeInTheDocument()
    
    // Should show daily productivity trend
    expect(screen.getByText('Daily Productivity Trend')).toBeInTheDocument()
  })

  it('should calculate average daily time correctly', () => {
    const store = useToolingTrackerStore.getState()
    
    // Add a project
    store.addProject('Test Project', 'blue')
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
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
    const today = new Date()
    
    // Add 7 hours total (1 hour avg per day)
    store.addTimeEntry({
      taskId,
      hours: 7,
      minutes: 0,
      date: today,
      notes: 'Work',
      type: 'development',
    })
    
    render(<WeeklySummary />)
    
    // Average should be 1h per day (7h / 7 days)
    expect(screen.getByText('1h')).toBeInTheDocument()
  })

  it('should show empty states when no data', () => {
    render(<WeeklySummary />)
    
    // Should show a day name for most productive day (even with no data, it shows current week's first day with 0m)
    // Most productive will be one of the days of the week
    const productiveDayElements = screen.getAllByText(/\d+ (Sun|Mon|Tue|Wed|Thu|Fri|Sat)/)
    expect(productiveDayElements.length).toBeGreaterThan(0)
    
    // Should show empty messages for charts
    expect(screen.getByText('No time logged yet')).toBeInTheDocument()
    // Daily trend chart renders even with no data (shows 7 days at 0 minutes)
  })
})
