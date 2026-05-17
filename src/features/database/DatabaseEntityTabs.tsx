import {NavLink} from 'react-router-dom'

import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'

interface DatabaseEntityTabsProps {
  activeEntity: DatabaseEntityId
  search: string
}

export function DatabaseEntityTabs({activeEntity, search}: DatabaseEntityTabsProps) {
  const getTabSearch = (targetEntity: DatabaseEntityId) =>
    targetEntity === activeEntity ? search : ''

  return (
    <nav
      aria-label='Database entities'
      className='flex flex-wrap items-end gap-1 border-b border-slate-700/45'
    >
      <NavLink
        aria-current={activeEntity === 'awakeners' ? 'page' : undefined}
        className={buildTabClassName(activeEntity === 'awakeners')}
        end
        to={{
          pathname: buildDatabaseEntityBrowsePath('awakeners'),
          search: getTabSearch('awakeners'),
        }}
      >
        Awakeners
      </NavLink>
      <NavLink
        aria-current={activeEntity === 'wheels' ? 'page' : undefined}
        className={buildTabClassName(activeEntity === 'wheels')}
        to={{pathname: buildDatabaseEntityBrowsePath('wheels'), search: getTabSearch('wheels')}}
      >
        Wheels
      </NavLink>
      <NavLink
        aria-current={activeEntity === 'posses' ? 'page' : undefined}
        className={buildTabClassName(activeEntity === 'posses')}
        to={{pathname: buildDatabaseEntityBrowsePath('posses'), search: getTabSearch('posses')}}
      >
        Posses
      </NavLink>
      <NavLink
        aria-current={activeEntity === 'covenants' ? 'page' : undefined}
        className={buildTabClassName(activeEntity === 'covenants')}
        to={{
          pathname: buildDatabaseEntityBrowsePath('covenants'),
          search: getTabSearch('covenants'),
        }}
      >
        Covenants
      </NavLink>
    </nav>
  )
}

function buildTabClassName(active: boolean) {
  const base =
    '-mb-px inline-flex min-h-11 items-center border-b-2 px-3.5 pb-2 pt-2 text-sm font-semibold tracking-[0.03em] transition-colors focus-visible:outline-none sm:min-h-10 sm:text-base sm:tracking-[0.02em]'
  return active
    ? `${base} border-amber-300/80 text-amber-100 focus-visible:border-amber-200`
    : `${base} border-transparent text-slate-400 hover:border-slate-500/55 hover:text-slate-200 focus-visible:border-amber-200/60 focus-visible:text-amber-200`
}
