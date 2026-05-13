import {lazy, Suspense, useEffect, useState} from 'react'

import {Navigate, NavLink, Route, Routes, useLocation} from 'react-router-dom'

import {DatabaseRouteElements} from './features/database/routes'
import {HomePage} from './pages/HomePage'

const BuilderPage = lazy(() =>
  import('./features/builder/BuilderPage').then((module) => ({default: module.BuilderPage})),
)
const CollectionPage = lazy(() =>
  import('./features/collection/CollectionPage').then((module) => ({
    default: module.CollectionPage,
  })),
)
const TimelinePage = lazy(() =>
  import('./pages/TimelinePage').then((module) => ({default: module.TimelinePage})),
)
const DZonePage = lazy(() =>
  import('./pages/DZonePage').then((module) => ({default: module.DZonePage})),
)
const DZoneHistoryPage = lazy(() =>
  import('./pages/DZoneHistoryPage').then((module) => ({default: module.DZoneHistoryPage})),
)

interface NavItem {
  label: string
  to: string
  isActive?: (pathname: string) => boolean
  mobilePriority?: 'always' | 'compact' | 'wide'
}

type MobileNavItem = NavItem & {mobilePriority: NonNullable<NavItem['mobilePriority']>}

const NAV_ITEMS: NavItem[] = [
  {label: 'Home', to: '/'},
  {
    label: 'Database',
    to: '/database',
    isActive: (pathname) => pathname === '/database' || pathname.startsWith('/database/'),
    mobilePriority: 'always',
  },
  {label: 'Events', to: '/timeline', mobilePriority: 'always'},
  {label: 'D-Zone', to: '/d-zone', mobilePriority: 'wide'},
  {label: 'Builder', to: '/builder', mobilePriority: 'compact'},
  {label: 'Collection', to: '/collection', mobilePriority: 'wide'},
]

function hasMobilePriority(item: NavItem): item is MobileNavItem {
  return Boolean(item.mobilePriority)
}

const MOBILE_PRIORITY_ITEMS = NAV_ITEMS.filter(hasMobilePriority)
const MOBILE_OVERFLOW_ITEMS = MOBILE_PRIORITY_ITEMS.filter(
  (item) => item.mobilePriority !== 'always',
)

function App() {
  const {key: locationKey, pathname} = useLocation()
  const [mobileNavOpenLocationKey, setMobileNavOpenLocationKey] = useState<string | null>(null)
  const compactMobileNavVisible = useMediaQuery('(min-width: 30rem)')
  const wideMobileNavVisible = useMediaQuery('(min-width: 40rem)')
  const mobileNavOpen = mobileNavOpenLocationKey === locationKey && !wideMobileNavVisible

  useEffect(() => {
    if (!mobileNavOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpenLocationKey(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(min-width: 40rem)')
    const closeWhenWide = () => {
      if (mediaQuery.matches) {
        setMobileNavOpenLocationKey(null)
      }
    }

    mediaQuery.addEventListener('change', closeWhenWide)
    return () => {
      mediaQuery.removeEventListener('change', closeWhenWide)
    }
  }, [])

  function isNavActive(item: NavItem): boolean {
    if (item.isActive) return item.isActive(pathname)
    return pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
  }

  function isMobileOverflowItemHidden(item: MobileNavItem): boolean {
    if (item.mobilePriority === 'compact') return !compactMobileNavVisible
    if (item.mobilePriority === 'wide') return !wideMobileNavVisible
    return false
  }

  const activeHiddenMobileOverflowItem = MOBILE_OVERFLOW_ITEMS.find(
    (item) => isNavActive(item) && isMobileOverflowItemHidden(item),
  )

  return (
    <div className='app-shell min-h-dvh text-slate-100'>
      <a className='skip-link' href='#main-content'>
        Skip to content
      </a>
      <header className='site-header'>
        <div className='site-header-inner'>
          <div className='site-header-bar'>
            <NavLink
              aria-label='SKeyDB home'
              className='site-brand'
              onClick={() => {
                setMobileNavOpenLocationKey(null)
              }}
              to='/'
            >
              <h1 className='site-brand-title ui-title'>SKeyDB</h1>
              <span className='site-brand-subtitle'>Morimens Database</span>
            </NavLink>

            <div className='site-mobile-actions'>
              <nav
                aria-label='Primary navigation mobile quick links'
                className='site-mobile-quick-nav'
              >
                {MOBILE_PRIORITY_ITEMS.map((item) => (
                  <NavLink
                    className={() => mobileQuickNavClassName(item, isNavActive(item))}
                    end={item.to === '/'}
                    key={item.label}
                    onClick={() => {
                      setMobileNavOpenLocationKey(null)
                    }}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <button
                aria-controls='mobile-primary-navigation'
                aria-expanded={mobileNavOpen}
                className={mobileMenuButtonClassName(
                  activeHiddenMobileOverflowItem?.mobilePriority,
                )}
                onClick={() => {
                  setMobileNavOpenLocationKey((openKey) =>
                    openKey === locationKey ? null : locationKey,
                  )
                }}
                type='button'
              >
                <span>{mobileNavOpen ? 'Close' : 'More'}</span>
                <span aria-hidden className='site-menu-mark'>
                  <span />
                  <span />
                </span>
              </button>
            </div>

            <nav aria-label='Primary navigation desktop' className='site-desktop-nav'>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  className={({isActive}) =>
                    desktopNavClassName(item.isActive ? isNavActive(item) : isActive)
                  }
                  end={item.to === '/'}
                  key={item.label}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <nav
            aria-hidden={!mobileNavOpen}
            aria-label='Primary navigation mobile'
            className={`mobile-site-nav ${mobileNavOpen ? 'mobile-site-nav-open' : ''}`}
            id='mobile-primary-navigation'
            inert={!mobileNavOpen ? true : undefined}
          >
            {MOBILE_OVERFLOW_ITEMS.map((item) => (
              <NavLink
                className={() => mobileOverflowNavClassName(item, isNavActive(item))}
                end={item.to === '/'}
                key={item.label}
                onClick={() => {
                  setMobileNavOpenLocationKey(null)
                }}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main
        className='mx-auto w-full max-w-[1240px] px-4 py-4 sm:px-5 md:py-5 lg:px-8'
        id='main-content'
      >
        <Suspense
          fallback={<div className='px-2 py-6 text-sm text-slate-300'>Loading page...</div>}
        >
          <Routes>
            <Route element={<HomePage />} path='/' />
            {DatabaseRouteElements}
            <Route element={<TimelinePage />} path='/timeline' />
            <Route element={<DZonePage />} path='/d-zone' />
            <Route element={<DZoneHistoryPage />} path='/d-zone/history' />
            <Route element={<BuilderPage />} path='/builder' />
            <Route element={<CollectionPage />} path='/collection' />
            <Route element={<Navigate replace to='/' />} path='*' />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? false
      : window.matchMedia(query).matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    const updateMatches = () => {
      setMatches(mediaQuery.matches)
    }

    updateMatches()
    mediaQuery.addEventListener('change', updateMatches)
    return () => {
      mediaQuery.removeEventListener('change', updateMatches)
    }
  }, [query])

  return matches
}

function desktopNavClassName(active: boolean): string {
  return `site-nav-link ${active ? 'site-nav-link--active' : 'site-nav-link--inactive'}`
}

function mobileQuickNavClassName(item: MobileNavItem, active: boolean): string {
  return [
    'site-nav-link',
    'site-mobile-quick-link',
    `site-mobile-quick-link--${item.mobilePriority}`,
    active ? 'site-nav-link--active' : 'site-nav-link--inactive',
  ].join(' ')
}

function mobileOverflowNavClassName(item: MobileNavItem, active: boolean): string {
  return [
    'site-mobile-overflow-link',
    `site-mobile-overflow-link--${item.mobilePriority}`,
    active ? 'site-mobile-overflow-link--active' : 'site-mobile-overflow-link--inactive',
  ].join(' ')
}

function mobileMenuButtonClassName(activePriority?: MobileNavItem['mobilePriority']): string {
  return [
    'site-mobile-menu-button',
    activePriority ? `site-mobile-menu-button--active-${activePriority}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export default App
