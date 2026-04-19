import {NavLink} from 'react-router-dom'

import {buildDatabaseEntityBrowsePath} from '@/domain/database-entity-paths'

interface DatabaseEntityTabsProps {
  activeEntity: 'awakeners' | 'wheels'
  search: string
}

export function DatabaseEntityTabs({activeEntity, search}: DatabaseEntityTabsProps) {
  return (
    <nav
      aria-label='Database entities'
      className='grid w-full grid-cols-2 gap-1 rounded-sm border border-slate-700/60 bg-[linear-gradient(180deg,rgba(12,19,34,0.88),rgba(9,15,27,0.78))] p-1 shadow-[inset_0_1px_0_rgba(148,163,184,0.05)] sm:inline-flex sm:w-auto sm:min-w-[14rem] sm:auto-cols-fr'
    >
      <NavLink
        className={buildTabClassName(activeEntity === 'awakeners')}
        to={{pathname: buildDatabaseEntityBrowsePath('awakeners'), search}}
      >
        Awakeners
      </NavLink>
      <NavLink
        className={buildTabClassName(activeEntity === 'wheels')}
        to={{pathname: buildDatabaseEntityBrowsePath('wheels'), search}}
      >
        Wheels
      </NavLink>
    </nav>
  )
}

function buildTabClassName(active: boolean) {
  return `flex min-h-8 items-center justify-center rounded-[2px] border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase transition-[background-color,border-color,color,box-shadow] duration-200 sm:min-h-9 sm:px-3 sm:text-[11px] sm:tracking-[0.19em] ${
    active
      ? 'border-amber-300/40 bg-[linear-gradient(180deg,rgba(251,191,36,0.18),rgba(245,158,11,0.08))] text-amber-50 shadow-[inset_0_1px_0_rgba(255,251,235,0.08)]'
      : 'border-slate-700/55 bg-slate-900/38 text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/56 hover:text-slate-100'
  }`
}
