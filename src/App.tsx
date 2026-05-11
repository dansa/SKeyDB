import {lazy, Suspense, useState} from 'react'

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

interface NavItem {
  label: string
  to: string
  isActive?: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {label: 'Home', to: '/'},
  {
    label: 'Database',
    to: '/database',
    isActive: (pathname) => pathname === '/database' || pathname.startsWith('/database/'),
  },
  {label: 'Events', to: '/timeline'},
  {label: 'Builder', to: '/builder'},
  {label: 'Collection', to: '/collection'},
]

function App() {
  const {pathname} = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  function isNavActive(item: NavItem): boolean {
    if (item.isActive) return item.isActive(pathname)
    return pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
  }

  return (
    <div className='app-shell min-h-dvh text-slate-100'>
      <a className='skip-link' href='#main-content'>
        Skip to content
      </a>
      <header className='site-header border-b border-amber-200/35 bg-slate-950/80 backdrop-blur-md'>
        <div className='mx-auto w-full max-w-[1240px] px-4 sm:px-5 lg:px-8'>
          <div className='flex min-h-16 items-center justify-between gap-4'>
            <NavLink
              aria-label='SKeyDB home'
              className='group/brand grid w-fit gap-0.5 leading-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none'
              onClick={() => {
                setMobileNavOpen(false)
              }}
              to='/'
            >
              <h1 className='ui-title text-[1.35rem] text-amber-100 transition-colors group-hover/brand:text-amber-50 sm:text-[1.55rem]'>
                SKeyDB
              </h1>
              <span className='text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase transition-colors group-hover/brand:text-slate-300'>
                Morimens Database
              </span>
            </NavLink>

            <nav
              aria-label='Primary navigation desktop'
              className='hidden min-w-0 items-center justify-end gap-1 md:flex'
            >
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

            <button
              aria-controls='mobile-primary-navigation'
              aria-expanded={mobileNavOpen}
              className='inline-flex min-h-11 items-center gap-2 rounded-[2px] border border-slate-700/80 bg-slate-950/45 px-3 text-[11px] font-bold tracking-[0.1em] text-slate-200 uppercase transition-[background-color,border-color,color] hover:border-amber-200/45 hover:bg-slate-900/75 hover:text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-200/35 focus-visible:outline-none md:hidden'
              onClick={() => {
                setMobileNavOpen((open) => !open)
              }}
              type='button'
            >
              <span>{mobileNavOpen ? 'Close' : 'Menu'}</span>
              <span aria-hidden className='site-menu-mark'>
                <span />
                <span />
              </span>
            </button>
          </div>

          <nav
            aria-label='Primary navigation mobile'
            className={`mobile-site-nav md:hidden ${mobileNavOpen ? 'mobile-site-nav-open' : ''}`}
            id='mobile-primary-navigation'
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                className={() => mobileNavClassName(isNavActive(item))}
                end={item.to === '/'}
                key={item.label}
                onClick={() => {
                  setMobileNavOpen(false)
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
            <Route element={<BuilderPage />} path='/builder' />
            <Route element={<CollectionPage />} path='/collection' />
            <Route element={<Navigate replace to='/' />} path='*' />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function desktopNavClassName(active: boolean): string {
  const base =
    'relative inline-flex min-h-10 shrink-0 items-center border-b-2 px-3 text-sm font-semibold transition-[background-color,border-color,color] duration-150 focus-visible:ring-2 focus-visible:ring-amber-200/35 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none sm:min-h-9'
  if (active) {
    return `${base} border-amber-300/85 bg-amber-200/[0.07] text-amber-100`
  }
  return `${base} border-transparent text-slate-300 hover:border-slate-500/70 hover:bg-slate-800/35 hover:text-slate-100`
}

function mobileNavClassName(active: boolean): string {
  const base =
    'flex min-h-11 items-center border-b border-l-2 border-b-slate-700/45 px-3 text-sm font-semibold transition-[background-color,border-color,color] last:border-b-0 focus-visible:ring-2 focus-visible:ring-amber-200/35 focus-visible:outline-none'
  return active
    ? `${base} border-l-amber-300/80 bg-amber-200/[0.06] text-amber-100`
    : `${base} border-l-transparent text-slate-300 hover:border-l-slate-500/70 hover:bg-slate-800/30 hover:text-slate-100`
}

export default App
