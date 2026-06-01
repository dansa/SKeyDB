import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter, useNavigate} from 'react-router-dom'
import {afterEach, vi} from 'vitest'

import App from './App'

vi.mock('./features/builder/BuilderPage', () => ({
  BuilderPage: () => <h2>Builder page</h2>,
}))

vi.mock('./features/builder-v2/BuilderV2Page', () => ({
  BuilderV2Page: () => <h2>Builder V2 page</h2>,
}))

vi.mock('./features/collection/CollectionPage', () => ({
  CollectionPage: () => <h2>Collection page</h2>,
}))

vi.mock('./pages/DZonePage', () => ({
  DZonePage: () => (
    <>
      <h1>D-Effect Zone</h1>
      <p>Current Season: 60 · May 11, 2026 - May 25, 2026</p>
    </>
  ),
}))

vi.mock('./pages/DZoneHistoryPage', () => ({
  DZoneHistoryPage: () => <h1>D-Zone Archive</h1>,
}))

vi.mock('./pages/TimelinePage', () => ({
  TimelinePage: () => <h2>Events page</h2>,
}))

interface MatchMediaEntry {
  dispatchChange: (matches: boolean) => void
  listeners: Set<(event: MediaQueryListEvent) => void>
  mediaQueryList: MediaQueryList
}

const originalMatchMedia = window.matchMedia

afterEach(() => {
  window.localStorage.clear()
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
    expect(within(desktopNav).getByRole('link', {name: /^builder$/i})).toBeInTheDocument()
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

  it('closes the mobile overflow menu after a router location change', async () => {
    render(
      <MemoryRouter>
        <App />
        <ProgrammaticRouteButton to='/collection' />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', {name: /more/i}))
    fireEvent.click(screen.getByRole('button', {name: /programmatic route/i}))

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /more/i})).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('derives mobile quick links and overflow from the same nav order', () => {
    mockMatchMedia({'(min-width: 30rem)': true, '(min-width: 40rem)': false})

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const mobileQuickNav = screen.getByRole('navigation', {
      name: /primary navigation mobile quick links/i,
    })
    expect(
      within(mobileQuickNav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Database', 'Events', 'D-Zone'])

    fireEvent.click(screen.getByRole('button', {name: /more/i}))

    expect(
      within(getMobileOverflowNav())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Builder', 'Builder V2', 'Collection'])
  })

  it('exposes Builder V2 from the mobile overflow menu', () => {
    mockMatchMedia({'(min-width: 30rem)': true, '(min-width: 40rem)': false})

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const mobileQuickNav = screen.getByRole('navigation', {
      name: /primary navigation mobile quick links/i,
    })
    expect(
      within(mobileQuickNav).queryByRole('link', {name: /builder v2/i}),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /more/i}))

    expect(within(getMobileOverflowNav()).getByRole('link', {name: /builder v2/i})).toHaveAttribute(
      'href',
      '/builder-v2',
    )
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
      'site-mobile-menu-button--active-overflow',
    )
  })

  it('does not mark the mobile menu button once the active route is visible', () => {
    mockMatchMedia({'(min-width: 30rem)': true, '(min-width: 40rem)': false})

    render(
      <MemoryRouter initialEntries={['/d-zone']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', {name: /more/i})).not.toHaveClass(
      'site-mobile-menu-button--active-overflow',
    )
  })

  it('opens a feedback menu with direct contact links from desktop chrome', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', {name: /feedback/i}))

    const menu = screen.getByRole('menu', {name: /feedback/i})
    expect(
      within(menu).getByText(/found bad data, a bug, or have a suggestion/i),
    ).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', {name: /email/i})).toHaveAttribute(
      'href',
      'mailto:skeydb@dansa.dev?subject=SKeyDB%20feedback',
    )
    expect(within(menu).getByRole('menuitem', {name: /discord: fjantsa/i})).toHaveAttribute(
      'href',
      'https://discord.com/users/1280181546527096993',
    )
    expect(within(menu).getByRole('menuitem', {name: /^x: @skeydb$/i})).toHaveAttribute(
      'href',
      'https://x.com/skeydb',
    )
  })

  it('closes the feedback menu with Escape and after route changes', async () => {
    render(
      <MemoryRouter>
        <App />
        <ProgrammaticRouteButton to='/collection' />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', {name: /feedback/i}))
    expect(screen.getByRole('menu', {name: /feedback/i})).toBeInTheDocument()

    fireEvent.keyDown(window, {key: 'Escape'})
    expect(screen.queryByRole('menu', {name: /feedback/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /feedback/i}))
    fireEvent.click(screen.getByRole('button', {name: /programmatic route/i}))

    await waitFor(() => {
      expect(screen.queryByRole('menu', {name: /feedback/i})).not.toBeInTheDocument()
    })
  })

  it('exposes feedback from the mobile overflow menu without adding it to quick nav', () => {
    mockMatchMedia({'(min-width: 30rem)': true, '(min-width: 40rem)': false})

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const mobileQuickNav = screen.getByRole('navigation', {
      name: /primary navigation mobile quick links/i,
    })
    expect(
      within(mobileQuickNav).queryByRole('button', {name: /feedback/i}),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /more/i}))
    fireEvent.click(within(getMobileOverflowNav()).getByRole('button', {name: /feedback/i}))

    expect(screen.getByRole('menu', {name: /feedback/i})).toBeInTheDocument()
  })

  it('offers Builder V2 from the classic builder without affecting the builder page render', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {level: 2, name: /builder page/i}),
    ).toBeInTheDocument()
    const banner = screen.getByRole('region', {name: /builder v2 beta/i})
    expect(within(banner).getByRole('link', {name: /try builder v2/i})).toHaveAttribute(
      'href',
      '/builder-v2',
    )
  })

  it('dismisses the classic builder V2 prompt independently for the current build', () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', {name: /dismiss builder v2 beta prompt/i}))

    expect(screen.queryByRole('region', {name: /builder v2 beta/i})).not.toBeInTheDocument()
    expect(window.localStorage.getItem('skeydb.builderV2Beta.classicDismissedFor.v1')).toBe('dev')
    expect(window.localStorage.getItem('skeydb.builderV2Beta.v2DismissedFor.v1')).toBeNull()
  })

  it('lets users opt into Builder V2 as the default from the V2 beta banner', async () => {
    render(
      <MemoryRouter initialEntries={['/builder-v2']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {level: 2, name: /builder v2 page/i}),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /make builder v2 default/i}))

    expect(window.localStorage.getItem('skeydb.builderV2Beta.default.v1')).toBe('1')
    expect(screen.queryByRole('region', {name: /builder v2 beta/i})).not.toBeInTheDocument()
  })

  it('redirects the builder route to Builder V2 after opt-in while preserving a classic escape hatch', async () => {
    window.localStorage.setItem('skeydb.builderV2Beta.default.v1', '1')

    const {unmount} = render(
      <MemoryRouter initialEntries={['/builder']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {level: 2, name: /builder v2 page/i}),
    ).toBeInTheDocument()

    unmount()
    render(
      <MemoryRouter initialEntries={['/builder?classic=1']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {level: 2, name: /builder page/i}),
    ).toBeInTheDocument()
  })

  it('does not show the classic Builder V2 prompt on the classic escape route', async () => {
    render(
      <MemoryRouter initialEntries={['/builder?classic=1']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {level: 2, name: /builder page/i}),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', {name: /builder v2 beta/i})).not.toBeInTheDocument()
  })

  it('adds a compact Builder V2 nav mark without changing the primary Builder destination', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const desktopNav = screen.getByRole('navigation', {name: /primary navigation desktop/i})
    expect(within(desktopNav).getByRole('link', {name: /^builder$/i})).toHaveAttribute(
      'href',
      '/builder',
    )
    expect(within(desktopNav).getByRole('link', {name: /builder v2 beta/i})).toHaveAttribute(
      'href',
      '/builder-v2',
    )
  })
})

function getMobileOverflowNav(): HTMLElement {
  const mobileOverflowNav = document.getElementById('mobile-primary-navigation')
  if (!mobileOverflowNav) {
    throw new Error('Expected mobile overflow nav to exist')
  }
  return mobileOverflowNav
}

function ProgrammaticRouteButton({to}: {to: string}) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => {
        void navigate(to)
      }}
      type='button'
    >
      Programmatic route
    </button>
  )
}
