import '@testing-library/jest-dom/vitest'

import {Suspense} from 'react'

import {render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, Routes, useLocation} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'

import {DatabaseRouteElements} from './routes'

vi.mock('./DatabasePage', () => ({
  DatabasePage: () => null,
}))

function LocationProbe() {
  const location = useLocation()
  return (
    <>
      <div data-testid='location-path'>{location.pathname}</div>
      <div data-testid='location-search'>{location.search}</div>
    </>
  )
}

describe('DatabaseRouteElements', () => {
  it('redirects legacy awk routes through the feature route boundary with sanitized awakener params', async () => {
    render(
      <MemoryRouter initialEntries={['/database/awk/24?q=24&mainstat=KEYFLARE_REGEN&realm=CHAOS']}>
        <LocationProbe />
        <Suspense fallback={null}>
          <Routes>{DatabaseRouteElements}</Routes>
        </Suspense>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/24')
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=24&realm=CHAOS')
  })
})
