import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, vi} from 'vitest'

import App from './App'

interface MatchMediaEntry {
  dispatchChange: (matches: boolean) => void
  listeners: Set<(event: MediaQueryListEvent) => void>
  mediaQueryList: MediaQueryList
}

const originalMatchMedia = window.matchMedia
const DZONE_ROUTE_FIND_TIMEOUT_MS = 8000
const DZONE_ROUTE_TEST_TIMEOUT_MS = 10000

afterEach(() => {
  window.matchMedia = originalMatchMedia
  vi.restoreAllMocks()
})

function mockMatchMedia(initialMatches: Record<string, boolean> = {}) {
  const entries = new Map<string, MatchMediaEntry>()

  window.matchMedia = vi.fn((query: string): MediaQueryList => {
    const existingEntry = entries.get(query)
    if (existingEntry) return existingEntry.mediaQueryList

    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    let matches = initialMatches[query] ?? false
    const mediaQueryList = {
      get matches() {
        return matches
      },
      media: query,
      onchange: null,
      addEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener)
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener)
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener)
      },
      dispatchEvent: () => true,
    } as MediaQueryList

    entries.set(query, {
      dispatchChange: (nextMatches: boolean) => {
        matches = nextMatches
        const event = {matches, media: query} as MediaQueryListEvent
        listeners.forEach((listener) => {
          listener(event)
        })
      },
      listeners,
      mediaQueryList,
    })

    return mediaQueryList
  })

  return {
    setMatches: (query: string, matches: boolean) => {
      entries.get(query)?.dispatchChange(matches)
    },
  }
}

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
    expect(within(desktopNav).getByRole('link', {name: /d-zone/i})).toBeInTheDocument()
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
    const mobileQuickNav = screen.getByRole('navigation', {
      name: /primary navigation mobile quick links/i,
    })
    const mobileOverflowNav = getMobileOverflowNav()
    const menuButton = screen.getByRole('button', {name: /more/i})

    expect(desktopNav).toHaveClass('site-desktop-nav')
    expect(mobileQuickNav).toHaveClass('site-mobile-quick-nav')
    expect(mobileOverflowNav).toHaveClass('mobile-site-nav')
    expect(menuButton).toHaveClass('site-mobile-menu-button')
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-primary-navigation')
  })

  it('toggles mobile overflow menu disclosure state', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const menuButton = screen.getByRole('button', {name: /more/i})
    const mobileOverflowNav = getMobileOverflowNav()

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(mobileOverflowNav).toHaveAttribute('aria-hidden', 'true')
    expect(mobileOverflowNav).toHaveAttribute('inert')

    fireEvent.click(menuButton)

    expect(screen.getByRole('button', {name: /close/i})).toHaveAttribute('aria-expanded', 'true')
    expect(mobileOverflowNav).toHaveAttribute('aria-hidden', 'false')
    expect(mobileOverflowNav).not.toHaveAttribute('inert')
  })

  it('closes the mobile overflow menu with Escape', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', {name: /more/i}))
    fireEvent.keyDown(window, {key: 'Escape'})

    expect(screen.getByRole('button', {name: /more/i})).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the mobile overflow menu after choosing a route link', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', {name: /more/i}))
    fireEvent.click(within(getMobileOverflowNav()).getByRole('link', {name: /^builder$/i}))

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /more/i})).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('closes the mobile overflow menu when the wide mobile breakpoint is promoted', () => {
    const matchMedia = mockMatchMedia()

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', {name: /more/i}))
    act(() => {
      matchMedia.setMatches('(min-width: 40rem)', true)
    })

    expect(screen.getByRole('button', {name: /more/i})).toHaveAttribute('aria-expanded', 'false')

    act(() => {
      matchMedia.setMatches('(min-width: 40rem)', false)
    })

    expect(screen.getByRole('button', {name: /more/i})).toHaveAttribute('aria-expanded', 'false')
  })

  it('marks the mobile menu button when the active overflow link is hidden', () => {
    mockMatchMedia({'(min-width: 30rem)': false, '(min-width: 40rem)': false})

    render(
      <MemoryRouter initialEntries={['/builder']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', {name: /more/i})).toHaveClass(
      'site-mobile-menu-button--active-compact',
    )
  })

  it('marks the mobile menu button when the active wide overflow link is hidden', () => {
    mockMatchMedia({'(min-width: 30rem)': true, '(min-width: 40rem)': false})

    render(
      <MemoryRouter initialEntries={['/d-zone']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', {name: /more/i})).toHaveClass(
      'site-mobile-menu-button--active-wide',
    )
  })

  it(
    'routes to the D-zone page',
    async () => {
      render(
        <MemoryRouter initialEntries={['/d-zone']}>
          <App />
        </MemoryRouter>,
      )

      expect(
        await screen.findByRole(
          'heading',
          {level: 1, name: 'D-Effect Zone'},
          {timeout: DZONE_ROUTE_FIND_TIMEOUT_MS},
        ),
      ).toBeInTheDocument()
      expect(screen.getByText(/Season 60 · May 11, 2026 - May 25, 2026/)).toBeInTheDocument()
    },
    DZONE_ROUTE_TEST_TIMEOUT_MS,
  )

  it(
    'routes to the D-zone history page',
    async () => {
      render(
        <MemoryRouter initialEntries={['/d-zone/history']}>
          <App />
        </MemoryRouter>,
      )

      expect(
        await screen.findByRole(
          'heading',
          {level: 1, name: 'D-Zone Archive'},
          {timeout: DZONE_ROUTE_FIND_TIMEOUT_MS},
        ),
      ).toBeInTheDocument()
    },
    DZONE_ROUTE_TEST_TIMEOUT_MS,
  )
})

function getMobileOverflowNav(): HTMLElement {
  const mobileOverflowNav = document.getElementById('mobile-primary-navigation')
  if (!mobileOverflowNav) {
    throw new Error('Expected mobile overflow nav to exist')
  }
  return mobileOverflowNav
}
