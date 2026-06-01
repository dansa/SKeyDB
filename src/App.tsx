import {lazy, Suspense, useCallback, useEffect, useState, useSyncExternalStore} from 'react'

import {Link, Navigate, NavLink, Route, Routes, useLocation} from 'react-router-dom'

import {getBrowserLocalStorage} from '@/domain/storage'

import {AppUpdateNotice} from './features/app-update/AppUpdateNotice'
import {StaleChunkErrorBoundary} from './features/app-update/StaleChunkErrorBoundary'
import {useAppUpdateNotice} from './features/app-update/useAppUpdateNotice'
import {
  dismissBuilderV2BetaBanner,
  isBuilderV2BetaBannerDismissed,
  isBuilderV2Default,
  setBuilderV2Default,
} from './features/builder-v2/builder-v2-beta-preferences'
import {DatabaseRouteElements} from './features/database/routes'
import {FeedbackControl} from './features/feedback/FeedbackMenu'
import {DomainMigrationNotice} from './features/migration/DomainMigrationNotice'
import {HomePage} from './pages/HomePage'

const BuilderPage = lazy(() =>
  import('./features/builder/BuilderPage').then((module) => ({default: module.BuilderPage})),
)
const BuilderV2Page = lazy(() =>
  import('./features/builder-v2/BuilderV2Page').then((module) => ({
    default: module.BuilderV2Page,
  })),
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
  {
    label: 'Builder',
    to: '/builder',
    isActive: (pathname) => pathname === '/builder',
    showInMobileNav: true,
  },
  {label: 'Collection', to: '/collection', showInMobileNav: true},
]

function isMobileNavItem(item: NavItem): item is MobileNavItem {
  return item.showInMobileNav === true
}

const BUILDER_V2_MOBILE_NAV_ITEM: MobileNavItem = {
  label: 'Builder V2',
  to: '/builder-v2',
  showInMobileNav: true,
}

const MOBILE_NAV_ITEMS = NAV_ITEMS.reduce<MobileNavItem[]>((items, item) => {
  if (!isMobileNavItem(item)) {
    return items
  }

  items.push(item)
  if (item.to === '/builder') {
    items.push(BUILDER_V2_MOBILE_NAV_ITEM)
  }
  return items
}, [])
const BASE_MOBILE_VISIBLE_ITEM_COUNT = 2
const COMPACT_MOBILE_VISIBLE_ITEM_COUNT = 3

function App() {
  const {key: locationKey, pathname, search} = useLocation()
  const appUpdateNotice = useAppUpdateNotice()
  const [storage] = useState(() => getBrowserLocalStorage())
  const [builderV2Default, setBuilderV2DefaultState] = useState(() => isBuilderV2Default(storage))
  const [dismissedBuilderV2Surfaces, setDismissedBuilderV2Surfaces] = useState(() => ({
    classic: isBuilderV2BetaBannerDismissed({
      buildId: CURRENT_BUILD_ID,
      storage,
      surface: 'classic',
    }),
    v2: isBuilderV2BetaBannerDismissed({
      buildId: CURRENT_BUILD_ID,
      storage,
      surface: 'v2',
    }),
  }))
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

  // Mobile overflow state is keyed by the router location; this effect only wires Escape while open.
  // react-doctor-disable-next-line no-reset-all-state-on-prop-change, react-doctor/no-reset-all-state-on-prop-change
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
  const builderV2BannerSurface = getBuilderV2BannerSurface({
    builderV2Default,
    dismissedBuilderV2Surfaces,
    pathname,
    search,
  })

  const optIntoBuilderV2 = () => {
    setBuilderV2Default(storage, true)
    setBuilderV2DefaultState(true)
  }

  const dismissBuilderV2Banner = () => {
    if (!builderV2BannerSurface) {
      return
    }

    dismissBuilderV2BetaBanner({
      buildId: CURRENT_BUILD_ID,
      storage,
      surface: builderV2BannerSurface,
    })
    setDismissedBuilderV2Surfaces((current) => ({
      ...current,
      [builderV2BannerSurface]: true,
    }))
  }

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
              {NAV_ITEMS.map((item) => {
                const navLink = (
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
                )

                if (item.to !== '/builder') {
                  return navLink
                }

                return (
                  <span className='site-builder-nav-cluster' key={item.label}>
                    {navLink}
                    <NavLink
                      aria-label='Builder V2 beta'
                      className={({isActive}) => builderV2NavMarkClassName(isActive)}
                      to='/builder-v2'
                    >
                      V2
                    </NavLink>
                  </span>
                )
              })}
              <FeedbackControl locationKey={locationKey} variant='desktop' />
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
            <FeedbackControl locationKey={locationKey} variant='mobile' />
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
      {builderV2BannerSurface ? (
        <BuilderV2BetaNotice
          onDismiss={dismissBuilderV2Banner}
          onOptIn={optIntoBuilderV2}
          surface={builderV2BannerSurface}
        />
      ) : null}

      <main
        className='mx-auto w-full max-w-[1240px] px-4 py-4 sm:px-5 md:py-5 lg:px-8'
        id='main-content'
      >
        <StaleChunkErrorBoundary>
          <Suspense
            fallback={<div className='px-2 py-6 text-sm text-slate-300'>Loading page…</div>}
          >
            <Routes>
              <Route element={<HomePage />} path='/' />
              {DatabaseRouteElements}
              <Route element={<TimelinePage />} path='/timeline' />
              <Route element={<DZonePage />} path='/d-zone' />
              <Route element={<DZoneHistoryPage />} path='/d-zone/history' />
              <Route
                element={
                  builderV2Default && !isClassicBuilderRequest(search) ? (
                    <Navigate replace to='/builder-v2' />
                  ) : (
                    <BuilderPage />
                  )
                }
                path='/builder'
              />
              <Route element={<BuilderV2Page />} path='/builder-v2' />
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

const CURRENT_BUILD_ID = getCurrentBuildId()

function getBuilderV2BannerSurface({
  builderV2Default,
  dismissedBuilderV2Surfaces,
  pathname,
  search,
}: {
  builderV2Default: boolean
  dismissedBuilderV2Surfaces: Record<'classic' | 'v2', boolean>
  pathname: string
  search: string
}): 'classic' | 'v2' | null {
  if (
    pathname === '/builder' &&
    !builderV2Default &&
    !dismissedBuilderV2Surfaces.classic &&
    !isClassicBuilderRequest(search)
  ) {
    return 'classic'
  }

  if (
    pathname === '/builder-v2' &&
    !builderV2Default &&
    !dismissedBuilderV2Surfaces.v2 &&
    !isClassicBuilderRequest(search)
  ) {
    return 'v2'
  }

  return null
}

function BuilderV2BetaNotice({
  onDismiss,
  onOptIn,
  surface,
}: {
  onDismiss: () => void
  onOptIn: () => void
  surface: 'classic' | 'v2'
}) {
  return (
    <section
      aria-label='Builder V2 beta'
      className='mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[1240px] flex-col gap-3 border border-amber-300/25 bg-slate-950/80 px-3 py-3 text-sm text-slate-200 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between sm:px-4'
    >
      <p className='m-0 max-w-3xl text-left leading-5'>
        <strong className='text-amber-100'>Builder V2 is in beta.</strong>{' '}
        {surface === 'classic'
          ? 'Try the new builder flow when you have a minute.'
          : 'Make it your default builder route if this beta already fits your workflow.'}
      </p>
      <div className='flex flex-wrap items-center gap-2'>
        {surface === 'classic' ? (
          <Link
            className='rounded border border-amber-300/45 bg-amber-300/15 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200'
            to='/builder-v2'
          >
            Try Builder V2
          </Link>
        ) : (
          <>
            <button
              className='rounded border border-amber-300/45 bg-amber-300/15 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200'
              onClick={onOptIn}
              type='button'
            >
              Make Builder V2 default
            </button>
            <Link
              className='rounded border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-400 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200'
              to='/builder?classic=1'
            >
              Classic builder
            </Link>
          </>
        )}
        <button
          aria-label='Dismiss Builder V2 beta prompt'
          className='rounded border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-400 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200'
          onClick={onDismiss}
          type='button'
        >
          Not now
        </button>
      </div>
    </section>
  )
}

function isClassicBuilderRequest(search: string): boolean {
  return new URLSearchParams(search).get('classic') === '1'
}

function getCurrentBuildId(): string {
  const configuredBuildId: unknown = import.meta.env.VITE_SKEYDB_BUILD_ID
  return typeof configuredBuildId === 'string' && configuredBuildId.trim() !== ''
    ? configuredBuildId
    : 'dev'
}

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => undefined
      }

      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => {
        mediaQuery.removeEventListener('change', onStoreChange)
      }
    },
    [query],
  )
  const getSnapshot = useCallback(
    () =>
      typeof window === 'undefined' || typeof window.matchMedia !== 'function'
        ? false
        : window.matchMedia(query).matches,
    [query],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getServerMediaQuerySnapshot)
}

function getServerMediaQuerySnapshot(): boolean {
  return false
}

function getMobileVisibleItemCount({compact, wide}: {compact: boolean; wide: boolean}): number {
  if (wide) return MOBILE_NAV_ITEMS.length
  if (compact) return Math.min(COMPACT_MOBILE_VISIBLE_ITEM_COUNT, MOBILE_NAV_ITEMS.length)
  return Math.min(BASE_MOBILE_VISIBLE_ITEM_COUNT, MOBILE_NAV_ITEMS.length)
}

function desktopNavClassName(active: boolean): string {
  return `site-nav-link ${active ? 'site-nav-link--active' : 'site-nav-link--inactive'}`
}

function builderV2NavMarkClassName(active: boolean): string {
  return `site-builder-v2-mark ${
    active ? 'site-builder-v2-mark--active' : 'site-builder-v2-mark--inactive'
  }`
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
