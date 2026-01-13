import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FocusTime } from './focus-time'
import { useToolingTrackerStore } from '@/lib/store'

describe('FocusTime Component', () => {
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
    render(<FocusTime />)
    
    // Should show the component title
    expect(screen.getByText('Focus Time Analysis')).toBeInTheDocument()
    
    // Should show empty state messages
    expect(screen.getByText('No data yet')).toBeInTheDocument()
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
    expect(screen.getByText('No time logged yet')).toBeInTheDocument()
  })

  it('should display time range selector buttons', () => {
    render(<FocusTime />)
    
    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('3M')).toBeInTheDocument()
    expect(screen.getByText('6M')).toBeInTheDocument()
  })

  it('should render stats cards', () => {
    render(<FocusTime />)
    
    expect(screen.getByText('Dev vs Meetings')).toBeInTheDocument()
    expect(screen.getByText('Deep Work Sessions')).toBeInTheDocument()
    expect(screen.getByText('Total Time')).toBeInTheDocument()
  })

  it('should display chart with data when time entries exist', () => {
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
    
    // Add time entries
    store.addTimeEntry({
      taskId,
      hours: 2,
      minutes: 30,
      date: new Date(),
      notes: 'Dev work',
      type: 'development',
    })
    
    store.addTimeEntry({
      taskId,
      hours: 1,
      minutes: 0,
      date: new Date(),
      notes: 'Meeting',
      type: 'meeting',
    })
    
    render(<FocusTime />)
    
    // Should show time breakdown section
    expect(screen.getByText('Time Breakdown by Type')).toBeInTheDocument()
    
    // Should show development and meeting labels
    expect(screen.getByText('Development')).toBeInTheDocument()
    expect(screen.getByText('Meetings')).toBeInTheDocument()
  })

  it('should show deep work sessions when 2+ hour blocks exist', () => {
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
    
    // Add 3 hours of development time (qualifies as deep work)
    store.addTimeEntry({
      taskId,
      hours: 3,
      minutes: 0,
      date: new Date(),
      notes: 'Deep work session',
      type: 'development',
    })
    
    render(<FocusTime />)
    
    // Deep work sessions should be displayed
    expect(screen.getByText('Deep Work Sessions')).toBeInTheDocument()
    expect(screen.getByText('3h total (2+ hour blocks)')).toBeInTheDocument()
  })
})
