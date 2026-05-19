import {lazy, Suspense, useEffect, useState} from 'react'

import {Navigate, NavLink, Route, Routes, useLocation} from 'react-router-dom'

import {AppUpdateNotice} from './features/app-update/AppUpdateNotice'
import {StaleChunkErrorBoundary} from './features/app-update/StaleChunkErrorBoundary'
import {useAppUpdateNotice} from './features/app-update/useAppUpdateNotice'
import {DatabaseRouteElements} from './features/database/routes'
import {DomainMigrationNotice} from './features/migration/DomainMigrationNotice'
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
const MigrationReceivePage = lazy(() =>
  import('./features/migration/MigrationReceivePage').then((module) => ({
    default: module.MigrationReceivePage,
  })),
)
const MigrationExportPage = lazy(() =>
  import('./features/migration/MigrationExportPage').then((module) => ({
    default: module.MigrationExportPage,
  })),
)

interface NavItem {
  label: string
  to: string
  isActive?: (pathname: string) => boolean
  showInMobileNav?: boolean
}

type MobileNavItem = NavItem & {showInMobileNav: true}

const NAV_ITEMS: NavItem[] = [
  {label: 'Home', to: '/'},
  {
    label: 'Database',
    to: '/database',
    isActive: (pathname) => pathname === '/database' || pathname.startsWith('/database/'),
    showInMobileNav: true,
  },
  {label: 'Events', to: '/timeline', showInMobileNav: true},
  {label: 'D-Zone', to: '/d-zone', showInMobileNav: true},
  {label: 'Builder', to: '/builder', showInMobileNav: true},
  {label: 'Collection', to: '/collection', showInMobileNav: true},
]

function isMobileNavItem(item: NavItem): item is MobileNavItem {
  return item.showInMobileNav === true
}

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(isMobileNavItem)
const BASE_MOBILE_VISIBLE_ITEM_COUNT = 2
const COMPACT_MOBILE_VISIBLE_ITEM_COUNT = 3

function App() {
  const {key: locationKey, pathname} = useLocation()
  const appUpdateNotice = useAppUpdateNotice()
  const [mobileNavOpenLocationKey, setMobileNavOpenLocationKey] = useState<string | null>(null)
  const compactMobileNavVisible = useMediaQuery('(min-width: 30rem)')
  const wideMobileNavVisible = useMediaQuery('(min-width: 40rem)')
  const mobileVisibleItemCount = getMobileVisibleItemCount({
    compact: compactMobileNavVisible,
    wide: wideMobileNavVisible,
  })
  const mobileQuickNavItems = MOBILE_NAV_ITEMS.slice(0, mobileVisibleItemCount)
  const mobileOverflowItems = MOBILE_NAV_ITEMS.slice(mobileVisibleItemCount)
  const hasMobileOverflow = mobileOverflowItems.length > 0
  const mobileNavOpen = mobileNavOpenLocationKey === locationKey && hasMobileOverflow

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

  const activeHiddenMobileOverflowItem = mobileOverflowItems.find((item) => isNavActive(item))

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
                {mobileQuickNavItems.map((item) => (
                  <NavLink
                    className={() => mobileQuickNavClassName(isNavActive(item))}
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
                className={mobileMenuButtonClassName(Boolean(activeHiddenMobileOverflowItem))}
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
            {mobileOverflowItems.map((item) => (
              <NavLink
                className={() => mobileOverflowNavClassName(isNavActive(item))}
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

      <DomainMigrationNotice routePathname={pathname} />
      {appUpdateNotice.reason && (
        <AppUpdateNotice
          onDismiss={appUpdateNotice.dismiss}
          onRefresh={appUpdateNotice.refresh}
          reason={appUpdateNotice.reason}
        />
      )}

      <main
        className='mx-auto w-full max-w-[1240px] px-4 py-4 sm:px-5 md:py-5 lg:px-8'
        id='main-content'
      >
        <StaleChunkErrorBoundary>
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
              <Route element={<MigrationReceivePage />} path='/migrate' />
              <Route element={<MigrationExportPage />} path='/migrate/export' />
              <Route element={<Navigate replace to='/' />} path='*' />
            </Routes>
          </Suspense>
        </StaleChunkErrorBoundary>
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

function getMobileVisibleItemCount({compact, wide}: {compact: boolean; wide: boolean}): number {
  if (wide) return MOBILE_NAV_ITEMS.length
  if (compact) return Math.min(COMPACT_MOBILE_VISIBLE_ITEM_COUNT, MOBILE_NAV_ITEMS.length)
  return Math.min(BASE_MOBILE_VISIBLE_ITEM_COUNT, MOBILE_NAV_ITEMS.length)
}

function desktopNavClassName(active: boolean): string {
  return `site-nav-link ${active ? 'site-nav-link--active' : 'site-nav-link--inactive'}`
}

function mobileQuickNavClassName(active: boolean): string {
  return [
    'site-nav-link',
    'site-mobile-quick-link',
    active ? 'site-nav-link--active' : 'site-nav-link--inactive',
  ].join(' ')
}

function mobileOverflowNavClassName(active: boolean): string {
  return [
    'site-mobile-overflow-link',
    active ? 'site-mobile-overflow-link--active' : 'site-mobile-overflow-link--inactive',
  ].join(' ')
}

function mobileMenuButtonClassName(activeOverflowItem: boolean): string {
  return [
    'site-mobile-menu-button',
    activeOverflowItem ? 'site-mobile-menu-button--active-overflow' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export default App
