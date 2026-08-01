import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {RouteErrorBoundary} from './RouteErrorBoundary'

function ThrowRouteError(): never {
  throw new TypeError('Route render failed')
}

describe('RouteErrorBoundary', () => {
  it('reports a route error without rendering a second recovery surface', () => {
    const onError = vi.fn()
    const {container} = render(
      <RouteErrorBoundary onError={onError}>
        <ThrowRouteError />
      </RouteErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledWith(expect.any(TypeError), expect.any(Object))
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
