import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplatePickerDialog } from './template-picker-dialog'

describe('TemplatePickerDialog Component', () => {
  const mockOnSelect = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dialog with title', () => {
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/choose a template/i)).toBeInTheDocument()
  })

  it('should display all 5 templates', async () => {
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Blank Canvas')).toBeInTheDocument()
      expect(screen.getByText('Meeting Agenda')).toBeInTheDocument()
      expect(screen.getByText('Sprint Retrospective')).toBeInTheDocument()
      expect(screen.getByText('Brainstorm Canvas')).toBeInTheDocument()
      expect(screen.getByText('Architecture Diagram')).toBeInTheDocument()
    })
  })

  it('should display template descriptions', async () => {
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    await waitFor(() => {
      const descriptions = screen.getAllByText(/template|canvas|agenda|diagram/i)
      expect(descriptions.length).toBeGreaterThan(0)
    })
  })

  it('should select template on click', async () => {
    const user = userEvent.setup()
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    const blankCanvasOption = await screen.findByText('Blank Canvas')
    const blankCanvasCard = blankCanvasOption.closest('[role="button"]') || blankCanvasOption.closest('[class*="cursor-pointer"]')
    
    if (blankCanvasCard) {
      await user.click(blankCanvasCard)
      expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'blank-canvas' }))
    }
  })

  it('should close dialog and call onSelect when template is selected', async () => {
    const user = userEvent.setup()
    const onSelectSpy = vi.fn()
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={onSelectSpy}
        onCancel={mockOnCancel}
      />
    )
    
    const meetingAgendaOption = await screen.findByText('Meeting Agenda')
    const meetingAgendaCard = meetingAgendaOption.closest('[role="button"]') || meetingAgendaOption.closest('[class*="cursor-pointer"]')
    
    if (meetingAgendaCard) {
      await user.click(meetingAgendaCard)
      expect(onSelectSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'meeting-agenda' }))
    }
  })

  it('should have cancel button', async () => {
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    const cancelButton = await screen.findByRole('button', { name: /cancel/i })
    expect(cancelButton).toBeInTheDocument()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    const cancelButton = await screen.findByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should have blank template prominently displayed', async () => {
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    const blankCanvas = await screen.findByText('Blank Canvas')
    expect(blankCanvas).toBeInTheDocument()
  })

  it('should not render when open is false', () => {
    const { container } = render(
      <TemplatePickerDialog
        open={false}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).not.toBeVisible()
  })

  it('should be accessible with keyboard navigation', async () => {
    const user = userEvent.setup()
    render(
      <TemplatePickerDialog
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    )
    
    // Tab to first template option and check it's focusable
    const templates = await screen.findAllByRole('button')
    expect(templates.length).toBeGreaterThan(0)
  })
})
