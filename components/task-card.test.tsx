import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskCard } from './task-card'
import { useToolingTrackerStore } from '@/lib/store'
import type { Task } from '@/lib/types'

vi.mock('@/lib/store')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('TaskCard Component', () => {
  const mockTask: Task = {
    id: 'task1',
    title: 'Test Task',
    description: '**Bold** description with *italic* text',
    status: 'todo',
    priority: 'high',
    projectId: 'proj1',
    createdAt: new Date('2026-01-01'),
    completedAt: null,
    subcategory: 'Feature',
    jiraKey: 'JIRA-123',
    storyPoints: 5,
    dueDate: new Date('2026-01-15'),
    archived: false,
  }

  const mockProjects = [
    { id: 'proj1', name: 'Project 1', color: 'blue' as const, subcategories: [], jiraKey: null, createdAt: new Date() },
  ]

  const mockStore = {
    tasks: [mockTask],
    timeEntries: [
      {
        id: 'te1',
        taskId: 'task1',
        hours: 2,
        minutes: 0,
        type: 'development' as const,
        date: new Date('2024-01-15'),
        notes: 'Test entry',
      },
    ],
    projects: mockProjects,
    getTimeForTask: vi.fn(() => 120), // 2 hours
    deleteTask: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToolingTrackerStore).mockReturnValue(mockStore as any)
  })

  it('should render task title', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should render stripped markdown description', () => {
    render(<TaskCard task={mockTask} />)
    // Markdown should be stripped: "Bold description with italic text"
    expect(screen.getByText(/Bold description with italic text/)).toBeInTheDocument()
  })

  it('should render priority badge', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('should render JIRA key if present', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('JIRA-123')).toBeInTheDocument()
  })

  it('should render story points if present', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('5 pts')).toBeInTheDocument()
  })

  it('should render subcategory badge', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Feature')).toBeInTheDocument()
  })

  it('should render time logged', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('2h 0m')).toBeInTheDocument()
  })

  it('should render project name when showProject is true', () => {
    render(<TaskCard task={mockTask} showProject={true} />)
    expect(screen.getByText('Project 1')).toBeInTheDocument()
  })

  it('should not render project name when showProject is false', () => {
    render(<TaskCard task={mockTask} showProject={false} />)
    expect(screen.queryByText('Project 1')).not.toBeInTheDocument()
  })

  it('should render due date badge', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument()
  })

  it('should show overdue badge if due date is past', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: new Date('2025-12-01'), // Past date
    }
    render(<TaskCard task={overdueTask} />)
    const dueDateText = screen.getByText('Dec 1, 2025')
    expect(dueDateText.closest('.badge')).toHaveClass('destructive')
  })

  it('should have clickable card element', () => {
    render(<TaskCard task={mockTask} />)
    const card = screen.getByRole('button', { name: /Task: Test Task/ })
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('tabIndex', '0')
  })

  it('should support keyboard accessibility', () => {
    render(<TaskCard task={mockTask} />)
    const card = screen.getByRole('button', { name: /Task: Test Task/ })
    expect(card).toHaveAttribute('tabIndex', '0')
    expect(card).toHaveAttribute('role', 'button')
  })

  it('should have dropdown menu button', () => {
    render(<TaskCard task={mockTask} />)
    const menuButtons = screen.getAllByRole('button')
    expect(menuButtons.length).toBeGreaterThan(1) // Card + menu button
  })

  it('should accept archive/unarchive callbacks', () => {
    const onArchive = vi.fn()
    const onUnarchive = vi.fn()
    
    render(<TaskCard task={mockTask} showArchiveAction={true} onArchive={onArchive} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    
    const { rerender } = render(<TaskCard task={mockTask} isArchived={true} onUnarchive={onUnarchive} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<TaskCard task={mockTask} className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('should not render description if empty', () => {
    const taskWithoutDescription = { ...mockTask, description: '' }
    render(<TaskCard task={taskWithoutDescription} />)
    
    // Only title should be present, no description paragraph
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.queryByText(/Bold description/)).not.toBeInTheDocument()
  })

  it('should handle task without optional fields', () => {
    const minimalTask: Task = {
      id: 'task2',
      title: 'Minimal Task',
      description: '',
      status: 'todo',
      priority: 'low',
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    }

    render(<TaskCard task={minimalTask} />)
    
    expect(screen.getByText('Minimal Task')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
    expect(screen.queryByText(/JIRA/)).not.toBeInTheDocument()
  })
})
