import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportDialog } from './export-dialog'
import { useToolingTrackerStore } from '@/lib/store'

vi.mock('@/lib/store')

// Mock ExcelJS
vi.mock('exceljs', () => ({
  default: class Workbook {
    addWorksheet() {
      return {
        columns: [],
        addRow: vi.fn(),
        getCell: vi.fn(() => ({
          font: {},
          alignment: {},
          fill: {},
        })),
        getColumn: vi.fn(() => ({ width: 0 })),
      }
    }
    xlsx = {
      writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    }
  },
}))

describe('ExportDialog Component', () => {
  const mockProjects = [
    { id: 'proj1', name: 'Project 1', color: 'blue' as const, subcategories: [], jiraKey: null, createdAt: new Date() },
    { id: 'proj2', name: 'Project 2', color: 'green' as const, subcategories: [], jiraKey: null, createdAt: new Date() },
  ]

  const mockTasks = [
    {
      id: 'task1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'done' as const,
      priority: 'high' as const,
      projectId: 'proj1',
      createdAt: new Date('2026-01-01'),
      completedAt: new Date('2026-01-10'),
      subcategory: 'Feature',
      jiraKey: 'PROJ-1',
      storyPoints: 5,
      dueDate: null,
      archived: false,
    },
  ]

  const mockTimeEntries = [
    {
      id: 'time1',
      taskId: 'task1',
      date: new Date('2026-01-05'),
      hours: 2,
      minutes: 30,
      type: 'development' as const,
      description: 'Worked on feature',
    },
  ]

  const mockStore = {
    projects: mockProjects,
    tasks: mockTasks,
    timeEntries: mockTimeEntries,
    getTimeForTask: vi.fn(() => 150),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToolingTrackerStore).mockReturnValue(mockStore as any)
  })

  it('should render dialog when open', () => {
    render(<ExportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Export Data')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<ExportDialog open={false} onOpenChange={vi.fn()} />)
    expect(screen.queryByText('Export Data')).not.toBeInTheDocument()
  })

  it('should render project selection dropdown', () => {
    render(<ExportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText(/Select project/i)).toBeInTheDocument()
  })

  it('should have project selector and export button', () => {
    render(<ExportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText(/Select project/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument()
  })

  it('should show export button', () => {
    render(<ExportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument()
  })

  it('should show cancel button', () => {
    render(<ExportDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('should have cancel button that closes dialog', () => {
    const onOpenChange = vi.fn()
    render(<ExportDialog open={true} onOpenChange={onOpenChange} />)
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
