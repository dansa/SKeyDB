import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {StaleChunkErrorBoundary} from './StaleChunkErrorBoundary'

function ThrowStaleChunkError() {
  throw new TypeError('Failed to fetch dynamically imported module')
  return null
}

describe('StaleChunkErrorBoundary', () => {
  it('shows a refresh recovery screen for stale chunk errors', () => {
    render(
      <StaleChunkErrorBoundary>
        <ThrowStaleChunkError />
      </StaleChunkErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/could not finish loading/i)
    expect(screen.getByRole('button', {name: /refresh/i})).toBeInTheDocument()
  })
})
