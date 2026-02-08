import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoreHydration } from './store-hydration'
import * as useStoreHydrationModule from '@/hooks/use-store-hydration'

// Mock the useStoreHydration hook
vi.mock('@/hooks/use-store-hydration', () => ({
  useStoreHydration: vi.fn(),
}))

describe('StoreHydration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading spinner when isHydrating is true', () => {
    vi.mocked(useStoreHydrationModule.useStoreHydration).mockReturnValue({
      isHydrating: true,
      error: null,
    })

    render(
      <StoreHydration>
        <div>Test Content</div>
      </StoreHydration>
    )

    expect(screen.getByText('Loading data...')).toBeInTheDocument()
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
  })

  it('renders error message when error exists', () => {
    const errorMessage = 'Failed to connect to database'
    vi.mocked(useStoreHydrationModule.useStoreHydration).mockReturnValue({
      isHydrating: false,
      error: errorMessage,
    })

    render(
      <StoreHydration>
        <div>Test Content</div>
      </StoreHydration>
    )

    expect(screen.getByText('Failed to Load Data')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText('Please refresh the page to try again.')).toBeInTheDocument()
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
  })

  it('renders children when hydration successful', () => {
    vi.mocked(useStoreHydrationModule.useStoreHydration).mockReturnValue({
      isHydrating: false,
      error: null,
    })

    const testChildren = <div>Test Content Successfully Rendered</div>

    render(
      <StoreHydration>
        {testChildren}
      </StoreHydration>
    )

    expect(screen.getByText('Test Content Successfully Rendered')).toBeInTheDocument()
  })

  it('uses useStoreHydration hook correctly', () => {
    const mockUseStoreHydration = vi.mocked(useStoreHydrationModule.useStoreHydration)
    mockUseStoreHydration.mockReturnValue({
      isHydrating: false,
      error: null,
    })

    render(
      <StoreHydration>
        <div>Test Content</div>
      </StoreHydration>
    )

    expect(mockUseStoreHydration).toHaveBeenCalled()
  })

  it('displays different loading state while hydrating and after hydration', () => {
    const mockUseStoreHydration = vi.mocked(useStoreHydrationModule.useStoreHydration)

    // First render with loading
    mockUseStoreHydration.mockReturnValue({
      isHydrating: true,
      error: null,
    })

    const { rerender } = render(
      <StoreHydration>
        <div>Test Content</div>
      </StoreHydration>
    )

    expect(screen.getByText('Loading data...')).toBeInTheDocument()

    // Re-render with hydration complete
    mockUseStoreHydration.mockReturnValue({
      isHydrating: false,
      error: null,
    })

    rerender(
      <StoreHydration>
        <div>Test Content</div>
      </StoreHydration>
    )

    expect(screen.queryByText('Loading data...')).not.toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
