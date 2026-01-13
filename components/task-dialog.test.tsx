import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskDialog } from './task-dialog'
import { useToolingTrackerStore } from '@/lib/store'
import type { Task } from '@/lib/types'

vi.mock('@/lib/store')

describe('TaskDialog Component', () => {
  const mockProjects = [
    { id: 'proj1', name: 'Project 1', color: 'blue' as const, subcategories: ['Feature', 'Bug'], jiraKey: 'PROJ1', createdAt: new Date() },
    { id: 'proj2', name: 'Project 2', color: 'green' as const, subcategories: [], jiraKey: null, createdAt: new Date() },
  ]

  const mockStore = {
    projects: mockProjects,
    selectedProjectId: 'proj1',
    addTask: vi.fn(),
    updateTask: vi.fn(),
    addSubcategoryToProject: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToolingTrackerStore).mockReturnValue(mockStore as any)
  })

  it('should render create dialog title when no task provided', () => {
    render(<TaskDialog open={true} onOpenChange={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Create Task')
  })

  it('should render edit dialog title when task provided', () => {
    const mockTask: Task = {
      id: 'task1',
      title: 'Existing Task',
      description: 'Description',
      status: 'todo',
      priority: 'high',
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    }

    render(<TaskDialog open={true} onOpenChange={vi.fn()} task={mockTask} />)
    expect(screen.getByText('Edit Task')).toBeInTheDocument()
  })

  it('should pre-fill form fields when editing task', () => {
    const mockTask: Task = {
      id: 'task1',
      title: 'Existing Task',
      description: 'Task description',
      status: 'in-progress',
      priority: 'high',
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: null,
      subcategory: 'Feature',
      jiraKey: 'JIRA-123',
      storyPoints: 5,
      dueDate: new Date('2026-01-15'),
      archived: false,
    }

    render(<TaskDialog open={true} onOpenChange={vi.fn()} task={mockTask} />)

    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Task description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Feature')).toBeInTheDocument()
    expect(screen.getByDisplayValue('JIRA-123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('should call addTask when creating new task', async () => {
    const onOpenChange = vi.fn()
    render(<TaskDialog open={true} onOpenChange={onOpenChange} />)

    // Fill in form
    const titleInput = screen.getByPlaceholderText('Task title')
    fireEvent.change(titleInput, { target: { value: 'New Task' } })

    // Submit form - button text is "Create Task" not "Save"
    const saveButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockStore.addTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          projectId: 'proj1',
        })
      )
    })
  })

  it('should call updateTask when editing existing task', async () => {
    const mockTask: Task = {
      id: 'task1',
      title: 'Existing Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    }

    const onOpenChange = vi.fn()
    render(<TaskDialog open={true} onOpenChange={onOpenChange} task={mockTask} />)

    // Change title
    const titleInput = screen.getByDisplayValue('Existing Task')
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } })

    // Submit form - button text is "Update Task" when editing
    const saveButton = screen.getByRole('button', { name: /update task/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockStore.updateTask).toHaveBeenCalledWith(
        'task1',
        expect.objectContaining({
          title: 'Updated Task',
        })
      )
    })
  })

  it('should have title input field', () => {
    render(<TaskDialog open={true} onOpenChange={vi.fn()} />)
    
    const titleInput = screen.getByPlaceholderText('Task title')
    expect(titleInput).toBeInTheDocument()
  })

  it('should render status and priority fields', () => {
    render(<TaskDialog open={true} onOpenChange={vi.fn()} />)

    // Check that status and priority labels exist
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
  })

  it('should show tabs for Details, Comments, and History when editing', () => {
    const mockTask: Task = {
      id: 'task1',
      title: 'Existing Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    }

    render(<TaskDialog open={true} onOpenChange={vi.fn()} task={mockTask} />)

    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Comments')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('should not show Comments and History tabs when creating new task', () => {
    render(<TaskDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.queryByText('Comments')).not.toBeInTheDocument()
    expect(screen.queryByText('History')).not.toBeInTheDocument()
  })

  it('should have subcategory input field', () => {
    render(<TaskDialog open={true} onOpenChange={vi.fn()} />)
    
    const subcategoryInput = screen.getByPlaceholderText(/subcategory/i)
    expect(subcategoryInput).toBeInTheDocument()
  })

  it('should use defaultStatus when creating new task', () => {
    render(<TaskDialog open={true} onOpenChange={vi.fn()} defaultStatus="in-progress" />)

    // The status select should have "In Progress" selected by default
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('should reset form when opening dialog without task', async () => {
    const { rerender } = render(<TaskDialog open={false} onOpenChange={vi.fn()} />)

    // Open with task
    const mockTask: Task = {
      id: 'task1',
      title: 'Existing Task',
      description: 'Description',
      status: 'done',
      priority: 'high',
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: new Date(),
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    }

    rerender(<TaskDialog open={true} onOpenChange={vi.fn()} task={mockTask} />)
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()

    // Close and reopen without task
    rerender(<TaskDialog open={false} onOpenChange={vi.fn()} />)
    rerender(<TaskDialog open={true} onOpenChange={vi.fn()} />)

    // Form should be reset
    const titleInput = screen.getByPlaceholderText('Task title') as HTMLInputElement
    expect(titleInput.value).toBe('')
  })
})
