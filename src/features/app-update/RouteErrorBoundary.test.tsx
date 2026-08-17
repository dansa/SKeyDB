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
      <RouteErrorBoundary onError={onError} resetKey='failed-route'>
        <ThrowRouteError />
      </RouteErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledWith(expect.any(TypeError), expect.any(Object))
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('recovers when navigation changes after a route error', () => {
    const onError = vi.fn()
    const {container, rerender} = render(
      <RouteErrorBoundary onError={onError} resetKey='detail-route'>
        <ThrowRouteError />
      </RouteErrorBoundary>,
    )

    expect(container).toBeEmptyDOMElement()

    rerender(
      <RouteErrorBoundary onError={onError} resetKey='browse-route'>
        <p>Database browse recovered</p>
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Database browse recovered')).toBeInTheDocument()
  })
})
