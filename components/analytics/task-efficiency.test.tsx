import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskEfficiency } from './task-efficiency'
import { useToolingTrackerStore } from '@/lib/store'

describe('TaskEfficiency Component', () => {
  beforeEach(() => {
    useToolingTrackerStore.getState().clearAllData()
    
    // Add a project
    useToolingTrackerStore.getState().addProject('Test Project', 'blue')
  })

  it('should display empty state when no completed tasks exist', () => {
    render(<TaskEfficiency />)
    
    expect(screen.getByText('No Efficiency Data Available')).toBeInTheDocument()
    expect(screen.getByText(/Complete some tasks and log time/)).toBeInTheDocument()
  })

  it('should display efficiency metrics when completed tasks exist', () => {
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add completed tasks with different priorities
    useToolingTrackerStore.getState().addTask({
      title: 'High Priority Task',
      description: 'Test',
      status: 'done',
      priority: 'high',
      projectId,
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
    })
    
    useToolingTrackerStore.getState().addTask({
      title: 'Low Priority Task',
      description: 'Test',
      status: 'done',
      priority: 'low',
      projectId,
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
    })
    
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 86400000 * 2)
    
    useToolingTrackerStore.setState((state) => ({
      tasks: state.tasks.map((task) => ({
        ...task,
        completedAt: now,
        createdAt: twoDaysAgo,
      })),
    }))
    
    render(<TaskEfficiency />)
    
    // Should show summary cards
    expect(screen.getByText('Overall Cycle Time')).toBeInTheDocument()
    expect(screen.getByText('Avg Time Spent')).toBeInTheDocument()
    expect(screen.getByText('Priority Levels')).toBeInTheDocument()
    expect(screen.getByText('Active Projects')).toBeInTheDocument()
    
    // Should show charts
    expect(screen.getByText('Efficiency by Priority')).toBeInTheDocument()
    expect(screen.getByText('Efficiency by Project')).toBeInTheDocument()
  })

  it('should display efficiency insights', () => {
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add high priority task (fast - 2 days)
    useToolingTrackerStore.getState().addTask({
      title: 'High Priority Task',
      description: 'Test',
      status: 'done',
      priority: 'high',
      projectId,
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
    })
    
    // Add low priority task (slow - 5 days)
    useToolingTrackerStore.getState().addTask({
      title: 'Low Priority Task',
      description: 'Test',
      status: 'done',
      priority: 'low',
      projectId,
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
    })
    
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 86400000 * 2)
    const fiveDaysAgo = new Date(now.getTime() - 86400000 * 5)
    
    useToolingTrackerStore.setState((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.priority === 'high') {
          return { ...task, completedAt: now, createdAt: twoDaysAgo }
        }
        return { ...task, completedAt: now, createdAt: fiveDaysAgo }
      }),
    }))
    
    render(<TaskEfficiency />)
    
    // Should show insights section
    expect(screen.getByText('Efficiency Insights')).toBeInTheDocument()
  })

  it('should calculate overall averages correctly', () => {
    const projectId = useToolingTrackerStore.getState().projects[0].id
    
    // Add task with 3 day cycle time
    useToolingTrackerStore.getState().addTask({
      title: 'Task 1',
      description: 'Test',
      status: 'done',
      priority: 'medium',
      projectId,
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
    })
    
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 86400000 * 3)
    
    useToolingTrackerStore.setState((state) => ({
      tasks: state.tasks.map((task) => ({
        ...task,
        completedAt: now,
        createdAt: threeDaysAgo,
      })),
    }))
    
    // Add time entry
    const taskId = useToolingTrackerStore.getState().tasks[0].id
    useToolingTrackerStore.getState().addTimeEntry({
      taskId,
      date: now,
      hours: 2,
      minutes: 30,
      description: 'Work',
      type: 'development',
    })
    
    render(<TaskEfficiency />)
    
    // Should display calculated values
    expect(screen.getByText('Overall Cycle Time')).toBeInTheDocument()
    expect(screen.getByText('Avg Time Spent')).toBeInTheDocument()
  })

  it('should handle multiple projects correctly', () => {
    const project1Id = useToolingTrackerStore.getState().projects[0].id
    
    // Add second project
    useToolingTrackerStore.getState().addProject('Project 2', 'green')
    const project2Id = useToolingTrackerStore.getState().projects[1].id
    
    // Add tasks to both projects
    useToolingTrackerStore.getState().addTask({
      title: 'P1 Task',
      description: 'Test',
      status: 'done',
      priority: 'medium',
      projectId: project1Id,
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
    })
    
    useToolingTrackerStore.getState().addTask({
      title: 'P2 Task',
      description: 'Test',
      status: 'done',
      priority: 'medium',
      projectId: project2Id,
      dueDate: null,
      subcategory: null,
      jiraKey: null,
      storyPoints: null,
    })
    
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000)
    
    useToolingTrackerStore.setState((state) => ({
      tasks: state.tasks.map((task) => ({
        ...task,
        completedAt: now,
        createdAt: oneDayAgo,
      })),
    }))
    
    render(<TaskEfficiency />)
    
    // Should show project chart
    expect(screen.getByText('Efficiency by Project')).toBeInTheDocument()
  })
})
