import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskComments } from './task-comments'
import { useToolingTrackerStore } from '@/lib/store'
import type { TaskComment } from '@/lib/types'

describe('TaskComments', () => {
  beforeEach(() => {
    useToolingTrackerStore.setState({
      comments: [],
      tasks: [],
      projects: [],
      timeEntries: [],
      activities: [],
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders empty state when no comments exist', () => {
    render(<TaskComments taskId="task-1" />)

    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument()
  })

  it('renders comment list correctly', () => {
    const mockComments: TaskComment[] = [
      {
        id: 'comment-1',
        taskId: 'task-1',
        content: 'First comment',
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-15T10:00:00'),
      },
      {
        id: 'comment-2',
        taskId: 'task-1',
        content: 'Second comment',
        createdAt: new Date('2024-01-15T11:00:00'),
        updatedAt: new Date('2024-01-15T11:00:00'),
      },
    ]

    useToolingTrackerStore.setState({ comments: mockComments })

    render(<TaskComments taskId="task-1" />)

    expect(screen.getByText('First comment')).toBeInTheDocument()
    expect(screen.getByText('Second comment')).toBeInTheDocument()
    expect(screen.getByText('Comments (2)')).toBeInTheDocument()
  })

  it('adds new comment when submitted', async () => {
    const addCommentSpy = vi.spyOn(useToolingTrackerStore.getState(), 'addComment')

    render(<TaskComments taskId="task-1" />)

    const textarea = screen.getByPlaceholderText(/write a comment/i)
    const submitButton = screen.getByRole('button', { name: /comment/i })

    fireEvent.change(textarea, { target: { value: 'New comment' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(addCommentSpy).toHaveBeenCalledWith({
        taskId: 'task-1',
        content: 'New comment',
      })
    })

    // Textarea should be cleared
    expect(textarea).toHaveValue('')
  })

  it('does not submit empty comments', () => {
    render(<TaskComments taskId="task-1" />)

    const initialCommentCount = useToolingTrackerStore.getState().comments.length
    const submitButton = screen.getByRole('button', { name: /comment/i })
    
    // Button should be disabled
    expect(submitButton).toBeDisabled()
    
    fireEvent.click(submitButton)

    // Comment count should not change
    expect(useToolingTrackerStore.getState().comments.length).toBe(initialCommentCount)
  })

  it('allows editing existing comments', async () => {
    const mockComment: TaskComment = {
      id: 'comment-1',
      taskId: 'task-1',
      content: 'Original comment',
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00'),
    }

    useToolingTrackerStore.setState({ comments: [mockComment] })

    const updateCommentSpy = vi.spyOn(useToolingTrackerStore.getState(), 'updateComment')

    const { container } = render(<TaskComments taskId="task-1" />)

    // Find edit button by looking for the Edit2 icon (pen icon, not trash icon)
    // The edit button is in the comment card, we can find it by the icon path
    const editButtons = container.querySelectorAll('button')
    let editButton: Element | undefined
    editButtons.forEach(btn => {
      const svgPaths = btn.querySelectorAll('path')
      svgPaths.forEach(path => {
        if (path.getAttribute('d')?.includes('21.174')) { // Edit icon path signature
          editButton = btn
        }
      })
    })

    expect(editButton).toBeTruthy()
    fireEvent.click(editButton!)

    // Wait for edit mode
    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox')
      expect(textareas.length).toBeGreaterThan(1)
    })

    // Edit textarea should now be visible (second one after the "add comment" textarea)
    const textareas = screen.getAllByRole('textbox')
    const editTextarea = textareas[textareas.length - 1]
    fireEvent.change(editTextarea, { target: { value: 'Updated comment' } })

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(updateCommentSpy).toHaveBeenCalledWith('comment-1', 'Updated comment')
    })
  })

  it('allows deleting comments with confirmation', () => {
    const mockComment: TaskComment = {
      id: 'comment-1',
      taskId: 'task-1',
      content: 'Comment to delete',
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00'),
    }

    useToolingTrackerStore.setState({ comments: [mockComment] })

    const deleteCommentSpy = vi.spyOn(useToolingTrackerStore.getState(), 'deleteComment')
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const { container } = render(<TaskComments taskId="task-1" />)

    // Find delete button by looking for the Trash2 icon path
    const allButtons = container.querySelectorAll('button')
    let deleteButton: Element | undefined
    allButtons.forEach(btn => {
      const svgPaths = btn.querySelectorAll('path')
      svgPaths.forEach(path => {
        if (path.getAttribute('d') === 'M3 6h18') { // Trash icon path signature
          deleteButton = btn
        }
      })
    })

    expect(deleteButton).toBeTruthy()
    fireEvent.click(deleteButton!)

    expect(confirmSpy).toHaveBeenCalled()
    expect(deleteCommentSpy).toHaveBeenCalledWith('comment-1')
  })

  it('cancels delete when confirmation is rejected', () => {
    const mockComment: TaskComment = {
      id: 'comment-1',
      taskId: 'task-1',
      content: 'Comment to delete',
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00'),
    }

    // Setup spy BEFORE setting state and rendering
    const confirmSpy = vi.spyOn(window, 'confirm')
    confirmSpy.mockImplementation(() => false)
    
    useToolingTrackerStore.setState({ comments: [mockComment] })

    const initialCommentCount = useToolingTrackerStore.getState().comments.length

    const { container } = render(<TaskComments taskId="task-1" />)

    // Find delete button by looking for the Trash2 icon path
    const allButtons = container.querySelectorAll('button')
    let deleteButton: Element | undefined
    allButtons.forEach(btn => {
      const svgPaths = btn.querySelectorAll('path')
      svgPaths.forEach(path => {
        if (path.getAttribute('d') === 'M3 6h18') { // Trash icon path signature
          deleteButton = btn
        }
      })
    })

    expect(deleteButton).toBeTruthy()
    fireEvent.click(deleteButton!)

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this comment?')
    // Verify comment count hasn't changed
    expect(useToolingTrackerStore.getState().comments.length).toBe(initialCommentCount)
    // Verify the comment still exists
    expect(useToolingTrackerStore.getState().comments.find(c => c.id === 'comment-1')).toBeTruthy()
  })

  it('shows edited indicator for modified comments', () => {
    const mockComment: TaskComment = {
      id: 'comment-1',
      taskId: 'task-1',
      content: 'Edited comment',
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T11:00:00'), // Different from createdAt
    }

    useToolingTrackerStore.setState({ comments: [mockComment] })

    render(<TaskComments taskId="task-1" />)

    expect(screen.getByText(/\(edited\)/i)).toBeInTheDocument()
  })

  it('supports keyboard shortcut Ctrl+Enter to submit', async () => {
    const addCommentSpy = vi.spyOn(useToolingTrackerStore.getState(), 'addComment')

    render(<TaskComments taskId="task-1" />)

    const textarea = screen.getByPlaceholderText(/write a comment/i)
    fireEvent.change(textarea, { target: { value: 'Comment via shortcut' } })
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })

    await waitFor(() => {
      expect(addCommentSpy).toHaveBeenCalledWith({
        taskId: 'task-1',
        content: 'Comment via shortcut',
      })
    })
  })
})
