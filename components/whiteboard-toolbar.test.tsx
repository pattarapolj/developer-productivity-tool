import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhiteboardToolbar } from './whiteboard-toolbar'

describe('WhiteboardToolbar Component', () => {
  const mockOnExportPNG = vi.fn()
  const mockOnExportSVG = vi.fn()
  const mockOnExportPDF = vi.fn()
  const mockOnPresentationMode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render export button', () => {
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    expect(screen.getByLabelText(/export/i)).toBeInTheDocument()
  })

  it('should render presentation button', () => {
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    expect(screen.getByLabelText(/present/i)).toBeInTheDocument()
  })

  it('should display export dropdown with PNG option', async () => {
    const user = userEvent.setup()
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const exportButton = screen.getByLabelText(/export/i)
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(screen.getByText(/export as png/i)).toBeInTheDocument()
    })
  })

  it('should display export dropdown with SVG option', async () => {
    const user = userEvent.setup()
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const exportButton = screen.getByLabelText(/export/i)
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(screen.getByText(/export as svg/i)).toBeInTheDocument()
    })
  })

  it('should display export dropdown with PDF option', async () => {
    const user = userEvent.setup()
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const exportButton = screen.getByLabelText(/export/i)
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(screen.getByText(/export as pdf/i)).toBeInTheDocument()
    })
  })

  it('should call onExportPNG when PNG option is clicked', async () => {
    const user = userEvent.setup()
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const exportButton = screen.getByLabelText(/export/i)
    await user.click(exportButton)
    
    const pngOption = await screen.findByText(/export as png/i)
    await user.click(pngOption)
    
    expect(mockOnExportPNG).toHaveBeenCalled()
  })

  it('should call onExportSVG when SVG option is clicked', async () => {
    const user = userEvent.setup()
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const exportButton = screen.getByLabelText(/export/i)
    await user.click(exportButton)
    
    const svgOption = await screen.findByText(/export as svg/i)
    await user.click(svgOption)
    
    expect(mockOnExportSVG).toHaveBeenCalled()
  })

  it('should call onExportPDF when PDF option is clicked', async () => {
    const user = userEvent.setup()
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const exportButton = screen.getByLabelText(/export/i)
    await user.click(exportButton)
    
    const pdfOption = await screen.findByText(/export as pdf/i)
    await user.click(pdfOption)
    
    expect(mockOnExportPDF).toHaveBeenCalled()
  })

  it('should call onPresentationMode when presentation button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const presentButton = screen.getByLabelText(/present/i)
    await user.click(presentButton)
    
    expect(mockOnPresentationMode).toHaveBeenCalled()
  })

  it('should have accessible button roles', () => {
    render(
      <WhiteboardToolbar
        onExportPNG={mockOnExportPNG}
        onExportSVG={mockOnExportSVG}
        onExportPDF={mockOnExportPDF}
        onPresentationMode={mockOnPresentationMode}
      />
    )
    
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})
