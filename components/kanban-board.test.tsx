import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { KanbanBoard } from './kanban-board'
import { useToolingTrackerStore } from '@/lib/store'

vi.mock('@/lib/store')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/board',
  }),
  usePathname: () => '/board',
}))

describe('KanbanBoard Component', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo' as const,
      priority: 'high' as const,
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      status: 'in-progress' as const,
      priority: 'medium' as const,
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    },
    {
      id: '3',
      title: 'Task 3',
      description: 'Description 3',
      status: 'done' as const,
      priority: 'low' as const,
      projectId: 'proj1',
      createdAt: new Date(),
      completedAt: new Date(),
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
      dueDate: null,
      archived: false,
    },
  ]

  const mockStore = {
    getFilteredTasks: vi.fn(() => mockTasks),
    moveTask: vi.fn(),
    archiveTask: vi.fn(),
    unarchiveTask: vi.fn(),
    selectedProjectId: null,
    boardFilters: {
      search: '',
      projectId: null,
      priority: null,
      dateRange: 'all' as const,
      showArchived: false,
      customStart: null,
      customEnd: null,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToolingTrackerStore).mockReturnValue(mockStore as any)
  })

  it('should render all four columns', () => {
    render(<KanbanBoard />)
    
    expect(screen.getByText('Backlog')).toBeInTheDocument()
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('should display tasks in correct columns', async () => {
    render(<KanbanBoard />)
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getByText('Task 3')).toBeInTheDocument()
    })
  })

  it('should show task count in column headers', async () => {
    render(<KanbanBoard />)
    
    await waitFor(() => {
      const badges = screen.getAllByText('1')
      expect(badges).toHaveLength(3) // 3 columns with 1 task each
    })
  })

  it('should show empty state when column has no tasks', async () => {
    mockStore.getFilteredTasks.mockReturnValue([mockTasks[0]]) // Only todo task
    render(<KanbanBoard />)
    
    await waitFor(() => {
      const emptyStates = screen.getAllByText('No tasks')
      expect(emptyStates.length).toBeGreaterThan(0)
    })
  })

  it('should have drag and drop handlers', async () => {
    render(<KanbanBoard />)
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
    })

    const taskCard = screen.getByText('Task 1').closest('div[draggable="true"]')
    expect(taskCard).toBeInTheDocument()
    expect(taskCard).toHaveAttribute('draggable', 'true')
  })

  it('should show selection checkboxes in selection mode', async () => {
    const selectedTasks = new Set<string>()
    const onToggleTask = vi.fn()

    render(
      <KanbanBoard 
        selectionMode={true} 
        selectedTasks={selectedTasks} 
        onToggleTask={onToggleTask} 
      />
    )
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  it('should call onToggleTask when clicking checkbox in selection mode', async () => {
    const selectedTasks = new Set<string>()
    const onToggleTask = vi.fn()

    render(
      <KanbanBoard 
        selectionMode={true} 
        selectedTasks={selectedTasks} 
        onToggleTask={onToggleTask} 
      />
    )
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
    })

    expect(onToggleTask).toHaveBeenCalled()
  })

  it('should disable drag-and-drop in selection mode', async () => {
    render(
      <KanbanBoard 
        selectionMode={true} 
        selectedTasks={new Set()} 
        onToggleTask={vi.fn()} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
    })

    const taskCard = screen.getByText('Task 1').closest('div[draggable="false"]')
    expect(taskCard).toBeInTheDocument()
  })

  it('should show archived tasks when showArchived filter is true', async () => {
    mockStore.boardFilters.showArchived = true
    render(<KanbanBoard />)
    
    await waitFor(() => {
      expect(screen.getByText('Archived - Backlog')).toBeInTheDocument()
      expect(screen.getByText('Archived - To Do')).toBeInTheDocument()
      expect(screen.getByText('Archived - In Progress')).toBeInTheDocument()
      expect(screen.getByText('Archived - Done')).toBeInTheDocument()
    })
  })

  it('should hide add task buttons when viewing archives', async () => {
    mockStore.boardFilters.showArchived = true
    render(<KanbanBoard />)
    
    await waitFor(() => {
      const plusButtons = screen.queryAllByRole('button', { name: /plus/i })
      expect(plusButtons).toHaveLength(0)
    })
  })

  it('should render add task buttons when not viewing archives', async () => {
    render(<KanbanBoard />)
    
    await waitFor(() => {
      const addButtons = screen.getAllByRole('button')
      expect(addButtons.length).toBeGreaterThan(0)
    })
  })

  it('should call getFilteredTasks from store', async () => {
    render(<KanbanBoard />)
    
    await waitFor(() => {
      expect(mockStore.getFilteredTasks).toHaveBeenCalled()
    })
  })
})
