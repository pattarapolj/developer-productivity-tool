import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PresentationMode } from './presentation-mode'

// Mock the Excalidraw dynamic import
vi.mock('next/dynamic', () => ({
  default: vi.fn((config) => {
    return ({ initialData }: any) => (
      <div data-testid="excalidraw-mock">
        Excalidraw Mock
      </div>
    )
  }),
}))

describe('PresentationMode Component', () => {
  const mockOnExit = vi.fn()
  const mockBoardContent = '{}'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isPresenting is false', () => {
    const { container } = render(
      <PresentationMode
        isPresenting={false}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const presentationOverlay = container.querySelector('[data-testid="presentation-overlay"]')
    expect(presentationOverlay).not.toBeInTheDocument()
  })

  it('should render full-screen overlay when isPresenting is true', () => {
    const { container } = render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const presentationOverlay = container.querySelector('[data-testid="presentation-overlay"]')
    expect(presentationOverlay).toBeInTheDocument()
  })

  it('should have full-screen styling', () => {
    const { container } = render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const presentationOverlay = container.querySelector('[data-testid="presentation-overlay"]')
    expect(presentationOverlay).toHaveClass('fixed')
    expect(presentationOverlay).toHaveClass('inset-0')
    expect(presentationOverlay).toHaveClass('z-50')
  })

  it('should display exit button', () => {
    render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const exitButton = screen.getByLabelText(/exit presentation/i)
    expect(exitButton).toBeInTheDocument()
  })

  it('should call onExit when exit button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const exitButton = screen.getByLabelText(/exit presentation/i)
    await user.click(exitButton)
    
    expect(mockOnExit).toHaveBeenCalled()
  })

  it('should call onExit when ESC key is pressed', () => {
    render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    
    expect(mockOnExit).toHaveBeenCalled()
  })

  it('should position exit button in top-right corner', () => {
    const { container } = render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const exitButton = screen.getByLabelText(/exit presentation/i)
    const buttonContainer = exitButton.parentElement
    
    expect(buttonContainer).toHaveClass('absolute')
    expect(buttonContainer).toHaveClass('top-4')
    expect(buttonContainer).toHaveClass('right-4')
  })

  it('should render Excalidraw in read-only mode', () => {
    render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    // Check that Excalidraw mock is rendered
    expect(screen.getByTestId('excalidraw-mock')).toBeInTheDocument()
  })

  it('should use dark background', () => {
    const { container } = render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const presentationOverlay = container.querySelector('[data-testid="presentation-overlay"]')
    expect(presentationOverlay).toHaveClass('bg-slate-950')
  })

  it('should handle empty board content', () => {
    expect(() => {
      render(
        <PresentationMode
          isPresenting={true}
          onExit={mockOnExit}
          boardContent="{}"
        />
      )
    }).not.toThrow()
  })

  it('should have z-index above other content', () => {
    const { container } = render(
      <PresentationMode
        isPresenting={true}
        onExit={mockOnExit}
        boardContent={mockBoardContent}
      />
    )
    
    const presentationOverlay = container.querySelector('[data-testid="presentation-overlay"]')
    expect(presentationOverlay).toHaveClass('z-50')
  })
})
