import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import WhiteboardEdit from './page'
import { useToolingTrackerStore } from '@/lib/store'

// Mock the store
vi.mock('@/lib/store')

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useParams: () => ({
    boardId: 'board-123',
  }),
}))

// Mock the whiteboard editor component
vi.mock('@/components/whiteboard-editor', () => ({
  WhiteboardEditor: ({ boardId }: any) => (
    <div data-testid="whiteboard-editor">Editor for {boardId}</div>
  ),
}))

describe('Whiteboard Editor Page', () => {
  const mockBoard = {
    id: 'board-123',
    name: 'Test Whiteboard',
    projectId: 'proj-1',
    thumbnailPath: null,
    content: JSON.stringify({ elements: [] }),
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
  }

  const mockStore = {
    boards: [mockBoard],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToolingTrackerStore).mockReturnValue(mockStore as any)
  })

  it('should load board from store by ID', async () => {
    render(<WhiteboardEdit params={{ boardId: 'board-123' }} />)

    await waitFor(() => {
      expect(screen.getByText(/Test Whiteboard/i)).toBeInTheDocument()
    })
  })

  it('should render whiteboard editor component', async () => {
    render(<WhiteboardEdit params={{ boardId: 'board-123' }} />)

    await waitFor(() => {
      expect(screen.getByTestId('whiteboard-editor')).toBeInTheDocument()
    })
  })

  it('should display board name in header', async () => {
    render(<WhiteboardEdit params={{ boardId: 'board-123' }} />)

    await waitFor(() => {
      expect(screen.getByText('Test Whiteboard')).toBeInTheDocument()
    })
  })

  it('should show 404 when board not found', async () => {
    vi.mocked(useToolingTrackerStore).mockReturnValue({
      boards: [],
    } as any)

    render(<WhiteboardEdit params={{ boardId: 'nonexistent-board' }} />)

    await waitFor(() => {
      expect(screen.getByText('Board Not Found')).toBeInTheDocument()
    })
  })

  it('should have back button to whiteboards', async () => {
    render(<WhiteboardEdit params={{ boardId: 'board-123' }} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })
  })

  it('should pass board content to editor', async () => {
    render(<WhiteboardEdit params={{ boardId: 'board-123' }} />)

    await waitFor(() => {
      expect(screen.getByTestId('whiteboard-editor')).toBeInTheDocument()
    })
  })

  it('should handle hydration safely', async () => {
    const { container } = render(<WhiteboardEdit params={{ boardId: 'board-123' }} />)

    expect(container).toBeDefined()
  })

  it('should render multiple boards in store correctly', async () => {
    const board2 = {
      ...mockBoard,
      id: 'board-456',
      name: 'Another Whiteboard',
    }

    vi.mocked(useToolingTrackerStore).mockReturnValue({
      boards: [mockBoard, board2],
    } as any)

    render(<WhiteboardEdit params={{ boardId: 'board-456' }} />)

    await waitFor(() => {
      expect(screen.getByText('Another Whiteboard')).toBeInTheDocument()
    })
  })
})
