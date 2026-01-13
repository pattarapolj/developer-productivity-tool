import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendIndicator } from './trend-indicator'

describe('TrendIndicator Component', () => {
  it('should render with upward trend', () => {
    render(<TrendIndicator direction="up" percentage={25} />)
    
    expect(screen.getByText('+25%')).toBeInTheDocument()
  })

  it('should render with downward trend', () => {
    render(<TrendIndicator direction="down" percentage={-15} />)
    
    expect(screen.getByText('-15%')).toBeInTheDocument()
  })

  it('should render with stable trend', () => {
    render(<TrendIndicator direction="stable" percentage={0} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('should show positive sign for positive percentage', () => {
    render(<TrendIndicator direction="up" percentage={50} />)
    
    expect(screen.getByText('+50%')).toBeInTheDocument()
  })

  it('should not show icon when showIcon is false', () => {
    const { container } = render(
      <TrendIndicator direction="up" percentage={10} showIcon={false} />
    )
    
    // Check that no svg icon is rendered
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('should not show percentage when showPercentage is false', () => {
    render(<TrendIndicator direction="up" percentage={10} showPercentage={false} />)
    
    expect(screen.queryByText(/10%/)).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <TrendIndicator direction="up" percentage={10} className="custom-class" />
    )
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('should render small size', () => {
    const { container } = render(
      <TrendIndicator direction="up" percentage={10} size="sm" />
    )
    
    const badge = container.querySelector('.text-xs')
    expect(badge).toBeInTheDocument()
  })

  it('should render medium size by default', () => {
    const { container } = render(
      <TrendIndicator direction="up" percentage={10} />
    )
    
    const badge = container.querySelector('.text-sm')
    expect(badge).toBeInTheDocument()
  })

  it('should render large size', () => {
    const { container } = render(
      <TrendIndicator direction="up" percentage={10} size="lg" />
    )
    
    const badge = container.querySelector('.text-base')
    expect(badge).toBeInTheDocument()
  })

  it('should handle zero percentage', () => {
    render(<TrendIndicator direction="stable" percentage={0} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('should handle large positive percentage', () => {
    render(<TrendIndicator direction="up" percentage={150} />)
    
    expect(screen.getByText('+150%')).toBeInTheDocument()
  })

  it('should handle large negative percentage', () => {
    render(<TrendIndicator direction="down" percentage={-90} />)
    
    expect(screen.getByText('-90%')).toBeInTheDocument()
  })
})
