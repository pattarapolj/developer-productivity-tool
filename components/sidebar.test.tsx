import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from './sidebar'
import { useToolingTrackerStore } from '@/lib/store'

vi.mock('@/lib/store')
vi.mock('next/navigation', () => ({
  usePathname: () => '/board',
}))

describe('Sidebar Component', () => {
  const mockProjects = [
    { id: 'proj1', name: 'Project Alpha', color: 'blue' as const, subcategories: [], jiraKey: null, createdAt: new Date() },
    { id: 'proj2', name: 'Project Beta', color: 'green' as const, subcategories: [], jiraKey: null, createdAt: new Date() },
    { id: 'proj3', name: 'Project Gamma', color: 'purple' as const, subcategories: [], jiraKey: null, createdAt: new Date() },
  ]

  const mockStore = {
    projects: mockProjects,
    setSelectedProject: vi.fn(),
    addProject: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToolingTrackerStore).mockReturnValue(mockStore as any)
  })

  it('should render application logo and name', () => {
    render(<Sidebar />)
    expect(screen.getByText('ToolingTracker')).toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Board')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('should highlight active navigation item', () => {
    render(<Sidebar />)
    
    const boardLink = screen.getByText('Board').closest('a')
    expect(boardLink).toHaveClass('bg-sidebar-accent')
  })

  it('should not highlight inactive navigation items', () => {
    render(<Sidebar />)
    
    const overviewLink = screen.getByText('Overview').closest('a')
    expect(overviewLink).not.toHaveClass('bg-sidebar-accent')
    expect(overviewLink).toHaveClass('text-sidebar-foreground/70')
  })

  it('should render projects section header', () => {
    render(<Sidebar />)
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('should render all projects in list', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    expect(screen.getByText('Project Beta')).toBeInTheDocument()
    expect(screen.getByText('Project Gamma')).toBeInTheDocument()
  })

  it('should toggle projects section when clicking header', () => {
    render(<Sidebar />)
    
    // Get the button with "Projects" text (not the navigation link)
    const projectsHeader = screen.getAllByText('Projects').find(el => el.tagName === 'BUTTON')
    
    // Projects should be visible initially
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    
    // Click to collapse
    if (projectsHeader) {
      fireEvent.click(projectsHeader)
    }
    
    // Projects should be hidden
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument()
    
    // Click to expand
    if (projectsHeader) {
      fireEvent.click(projectsHeader)
    }
    
    // Projects should be visible again
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
  })

  it('should show "All Projects" option', () => {
    render(<Sidebar />)
    expect(screen.getByText('All Projects')).toBeInTheDocument()
  })

  it('should call setSelectedProject when clicking All Projects', () => {
    render(<Sidebar />)
    
    const allProjectsButton = screen.getByText('All Projects')
    fireEvent.click(allProjectsButton)
    
    expect(mockStore.setSelectedProject).toHaveBeenCalledWith(null)
  })

  it('should call setSelectedProject when clicking a project', () => {
    render(<Sidebar />)
    
    const projectButton = screen.getByText('Project Alpha')
    fireEvent.click(projectButton)
    
    expect(mockStore.setSelectedProject).toHaveBeenCalledWith('proj1')
  })

  it('should show add project button', () => {
    render(<Sidebar />)
    const addButton = screen.getByRole('button', { name: /Add Project/i })
    expect(addButton).toBeInTheDocument()
  })

  it('should open add project dialog when clicking add button', () => {
    render(<Sidebar />)
    
    const addButton = screen.getByRole('button', { name: /Add Project/i })
    fireEvent.click(addButton)
    
    expect(screen.getByText('Create New Project')).toBeInTheDocument()
  })

  it('should render project color indicators', () => {
    render(<Sidebar />)
    
    const projects = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Project')
    )
    
    // Each project should have a color indicator (check for elements with project color classes)
    projects.forEach(project => {
      const colorIndicator = project.querySelector('[class*="project-"]')
      expect(colorIndicator).toBeInTheDocument()
    })
  })

  it('should have add project functionality', () => {
    render(<Sidebar />)
    
    const addButton = screen.getByRole('button', { name: /Add Project/i })
    fireEvent.click(addButton)
    
    expect(screen.getByText('Create New Project')).toBeInTheDocument()
  })

  it('should handle empty projects list', () => {
    mockStore.projects = []
    
    render(<Sidebar />)
    
    expect(screen.getByText('All Projects')).toBeInTheDocument()
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument()
  })

  it('should render navigation links with correct hrefs', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Board').closest('a')).toHaveAttribute('href', '/board')
    // Get the Projects link (not the button) by finding all and filtering
    const projectsLink = screen.getAllByText('Projects').find(el => el.closest('a'))
    expect(projectsLink?.closest('a')).toHaveAttribute('href', '/projects')
    expect(screen.getByText('Calendar').closest('a')).toHaveAttribute('href', '/calendar')
    expect(screen.getByText('Analytics').closest('a')).toHaveAttribute('href', '/analytics')
  })
})
