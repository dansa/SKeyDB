import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {PopoverErrorBoundary} from './PopoverErrorBoundary'

function BrokenComponent(): null {
  throw new Error('Test rendering crash')
}

describe('PopoverErrorBoundary', () => {
  it('renders children when there are no errors', () => {
    render(
      <PopoverErrorBoundary>
        <div data-testid='child'>Happy Component</div>
      </PopoverErrorBoundary>,
    )
    expect(screen.getByTestId('child')).toHaveTextContent('Happy Component')
  })

  it('renders fallback UI when children crash', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress expected rendering error console output
    })

    render(
      <PopoverErrorBoundary>
        <BrokenComponent />
      </PopoverErrorBoundary>,
    )

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    expect(screen.getByText('Internal formula error in render')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
