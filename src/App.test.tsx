import {render, screen, within} from '@testing-library/react'
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
    const desktopNav = screen.getByRole('navigation', {name: /primary navigation desktop/i})
    expect(within(desktopNav).getByRole('link', {name: /database/i})).toBeInTheDocument()
    expect(within(desktopNav).getByRole('link', {name: /builder/i})).toBeInTheDocument()
    expect(within(desktopNav).getByRole('link', {name: /collection/i})).toBeInTheDocument()
  })

  it('uses separate desktop and mobile navigation surfaces', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const desktopNav = screen.getByRole('navigation', {name: /primary navigation desktop/i})
    const mobileNav = screen.getByRole('navigation', {name: /primary navigation mobile/i})
    const menuButton = screen.getByRole('button', {name: /menu/i})

    expect(desktopNav).toHaveClass('hidden')
    expect(desktopNav).toHaveClass('md:flex')
    expect(mobileNav).toHaveClass('md:hidden')
    expect(menuButton).toHaveClass('md:hidden')
  })
})
