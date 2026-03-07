import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'

import App from './App'

describe('App shell', () => {
  it('renders app navigation and title', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', {level: 1, name: /skeydb/i})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /database/i})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /builder/i})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /collection/i})).toBeInTheDocument()
  })

  it('uses a mobile-safe header layout that allows nav wrapping', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation')
    const headerRow = nav.parentElement

    expect(headerRow).toHaveClass('flex-col')
    expect(headerRow).toHaveClass('md:flex-row')
    expect(nav).toHaveClass('flex-wrap')
    expect(nav).toHaveClass('w-full')
  })
})
