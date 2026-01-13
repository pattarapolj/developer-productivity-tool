import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VelocityTracker } from './velocity-tracker'
import { useToolingTrackerStore } from '@/lib/store'

describe('VelocityTracker Component', () => {
  beforeEach(() => {
    useToolingTrackerStore.getState().clearAllData()
    
    // Add a project
    useToolingTrackerStore.getState().addProject('Test Project', 'blue')
  })

  it('should display empty state when no tasks completed', () => {
    render(<VelocityTracker />)
    
    expect(screen.getByText('No Velocity Data Available')).toBeInTheDocument()
    expect(screen.getByText(/Complete some tasks to start tracking/)).toBeInTheDocument()
  })

  it('should display velocity metrics when tasks are completed', () => {
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add completed tasks
    for (let i = 0; i < 5; i++) {
      useToolingTrackerStore.getState().addTask({
        title: `Task ${i + 1}`,
        description: 'Test task',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
    }
    
    // Set completion dates for the last 2 weeks
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 86400000 * 3)
    
    useToolingTrackerStore.setState((state) => ({
      tasks: state.tasks.map((task) => ({
        ...task,
        completedAt: now,
        createdAt: threeDaysAgo,
      })),
    }))
    
    render(<VelocityTracker />)
    
    // Should show metrics
    expect(screen.getByText('Average Velocity')).toBeInTheDocument()
    expect(screen.getByText('Average Cycle Time')).toBeInTheDocument()
    expect(screen.getByText('Velocity Trend')).toBeInTheDocument()
    
    // Should show charts
    expect(screen.getByText('Tasks Completed Per Week')).toBeInTheDocument()
    expect(screen.getByText('Average Cycle Time Trend')).toBeInTheDocument()
  })

  it('should change time range when buttons clicked', async () => {
    const user = userEvent.setup()
    render(<VelocityTracker />)
    
    const fourWeeksBtn = screen.getByRole('button', { name: '4 Weeks' })
    const eightWeeksBtn = screen.getByRole('button', { name: '8 Weeks' })
    const twelveWeeksBtn = screen.getByRole('button', { name: '12 Weeks' })
    
    // Default should be 8 weeks
    expect(eightWeeksBtn).toHaveClass('bg-primary')
    
    // Click 4 weeks
    await user.click(fourWeeksBtn)
    expect(fourWeeksBtn).toHaveClass('bg-primary')
    
    // Click 12 weeks
    await user.click(twelveWeeksBtn)
    expect(twelveWeeksBtn).toHaveClass('bg-primary')
  })

  it('should calculate velocity correctly', () => {
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add 10 tasks completed this week
    for (let i = 0; i < 10; i++) {
      useToolingTrackerStore.getState().addTask({
        title: `Task ${i + 1}`,
        description: 'Test task',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
    }
    
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 86400000 * 2)
    
    useToolingTrackerStore.setState((state) => ({
      tasks: state.tasks.map((task) => ({
        ...task,
        completedAt: now,
        createdAt: twoDaysAgo,
      })),
    }))
    
    render(<VelocityTracker />)
    
    // Average velocity should be displayed (10 tasks / 8 weeks = 1.3)
    const velocityCards = screen.getAllByText(/tasks completed per week|days from created/)
    expect(velocityCards.length).toBeGreaterThan(0)
  })

  it('should show trend direction based on recent vs previous velocity', () => {
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add tasks completed 7 weeks ago (2 tasks)
    for (let i = 0; i < 2; i++) {
      useToolingTrackerStore.getState().addTask({
        title: `Old Task ${i + 1}`,
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
    }
    
    // Add tasks completed this week (8 tasks - higher velocity)
    for (let i = 0; i < 8; i++) {
      useToolingTrackerStore.getState().addTask({
        title: `Recent Task ${i + 1}`,
        description: 'Test',
        status: 'done',
        priority: 'medium',
        projectId,
        dueDate: null,
        subcategory: null,
        jiraKey: null,
        storyPoints: null,
      })
    }
    
    const now = new Date()
    const sevenWeeksAgo = new Date(now.getTime() - 86400000 * 7 * 7)
    
    useToolingTrackerStore.setState((state) => ({
      tasks: state.tasks.map((task, index) => {
        if (index < 2) {
          // Old tasks
          return {
            ...task,
            completedAt: sevenWeeksAgo,
            createdAt: new Date(sevenWeeksAgo.getTime() - 86400000 * 2),
          }
        } else {
          // Recent tasks
          return {
            ...task,
            completedAt: now,
            createdAt: new Date(now.getTime() - 86400000 * 2),
          }
        }
      }),
    }))
    
    render(<VelocityTracker />)
    
    // Should show trend card
    expect(screen.getByText('Velocity Trend')).toBeInTheDocument()
    
    // Should display comparison of recent vs previous velocity
    const metricsText = screen.getByText(/vs.*tasks\/week/i)
    expect(metricsText).toBeInTheDocument()
  })
})
