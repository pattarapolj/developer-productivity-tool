import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskHistory } from './task-history'
import { useToolingTrackerStore } from '@/lib/store'
import type { TaskHistory as TaskHistoryType, HistoryEntry } from '@/lib/types'

describe('TaskHistory', () => {
  beforeEach(() => {
    useToolingTrackerStore.setState({
      comments: [],
      tasks: [],
      projects: [
        { id: 'proj-1', name: 'Project Alpha', subcategories: [], jiraKey: null },
      ],
      timeEntries: [],
      activities: [],
      history: [],
      selectedProjectId: null,
      boardFilters: {
        search: '',
        projectId: '',
        priority: '',
        dateRange: { from: null, to: null },
        showArchived: false,
      },
    })
  })

  it('renders empty state when no history exists', () => {
    render(<TaskHistory taskId="task-1" />)

    expect(screen.getByText(/no history yet/i)).toBeInTheDocument()
  })

  it('renders history timeline correctly', () => {
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'status',
        oldValue: 'todo',
        newValue: 'in-progress',
        changedAt: new Date('2024-01-15T10:00:00'),
      },
      {
        id: 'hist-2',
        taskId: 'task-1',
        field: 'priority',
        oldValue: 'low',
        newValue: 'high',
        changedAt: new Date('2024-01-15T11:00:00'),
      },
    ]

    useToolingTrackerStore.setState({ history: mockHistory })

    render(<TaskHistory taskId="task-1" />)

    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('groups history by date correctly', () => {
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'status',
        oldValue: 'todo',
        newValue: 'in-progress',
        changedAt: new Date('2024-01-15T10:00:00'),
      },
      {
        id: 'hist-2',
        taskId: 'task-1',
        field: 'priority',
        oldValue: 'low',
        newValue: 'high',
        changedAt: new Date('2024-01-15T14:00:00'), // Same day
      },
      {
        id: 'hist-3',
        taskId: 'task-1',
        field: 'title',
        oldValue: 'Old Title',
        newValue: 'New Title',
        changedAt: new Date('2024-01-16T09:00:00'), // Different day
      },
    ]

    useToolingTrackerStore.setState({ history: mockHistory })

    render(<TaskHistory taskId="task-1" />)

    // Should have two date headers (Jan 15 and Jan 16)
    const dateHeaders = screen.getAllByText(/jan/i)
    expect(dateHeaders.length).toBeGreaterThanOrEqual(2)
  })

  it('formats status values correctly', () => {
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'status',
        oldValue: 'todo',
        newValue: 'in-progress',
        changedAt: new Date('2024-01-15T10:00:00'),
      },
    ]

    useToolingTrackerStore.setState({ history: mockHistory })

    render(<TaskHistory taskId="task-1" />)

    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('formats priority values correctly', () => {
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'priority',
        oldValue: 'low',
        newValue: 'high',
        changedAt: new Date('2024-01-15T10:00:00'),
      },
    ]

    useToolingTrackerStore.setState({ history: mockHistory })

    render(<TaskHistory taskId="task-1" />)

    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('formats project changes with project names', () => {
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'projectId',
        oldValue: '',
        newValue: 'proj-1',
        changedAt: new Date('2024-01-15T10:00:00'),
      },
    ]

    useToolingTrackerStore.setState({ 
      history: mockHistory,
      projects: [
        { id: 'proj-1', name: 'Project Alpha', subcategories: [], jiraKey: null },
      ],
    })

    render(<TaskHistory taskId="task-1" />)

    expect(screen.getByText('Project')).toBeInTheDocument()
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
  })

  it('displays relative timestamps correctly', () => {
    const now = new Date()
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'title',
        oldValue: 'Old',
        newValue: 'New',
        changedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      },
    ]

    useToolingTrackerStore.setState({ history: mockHistory })

    render(<TaskHistory taskId="task-1" />)

    // Should show "30m ago" or similar
    expect(screen.getByText(/ago|just now/i)).toBeInTheDocument()
  })

  it('shows change type icons correctly', () => {
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'status',
        oldValue: 'todo',
        newValue: 'done',
        changedAt: new Date('2024-01-15T10:00:00'),
      },
    ]

    useToolingTrackerStore.setState({ history: mockHistory })

    const { container } = render(<TaskHistory taskId="task-1" />)

    // Check for SVG icons
    const svgElements = container.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(0)
  })

  it('handles empty old values gracefully', () => {
    const mockHistory: TaskHistoryType[] = [
      {
        id: 'hist-1',
        taskId: 'task-1',
        field: 'description',
        oldValue: '',
        newValue: 'New description',
        changedAt: new Date('2024-01-15T10:00:00'),
      },
    ]

    useToolingTrackerStore.setState({ history: mockHistory })

    render(<TaskHistory taskId="task-1" />)

    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('New description')).toBeInTheDocument()
    // Should not show old value arrow when old value is empty
    expect(screen.queryByText(/→/)).not.toBeInTheDocument()
  })
})
