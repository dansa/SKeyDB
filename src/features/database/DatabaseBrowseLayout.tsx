import type {ReactNode} from 'react'

import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import {ActiveFilterChips, type ActiveFilterChip} from '@/ui/filters/ActiveFilterChips'

import {DatabaseEntityTabs} from './DatabaseEntityTabs'

interface DatabaseBrowseLayoutProps {
  activeEntity: DatabaseEntityId
  search: string
  title: string
  unitNoun: string
  filteredCount: number
  totalCount: number
  activeFilterChips: readonly ActiveFilterChip[]
  onResetFilters: () => void
  filters: ReactNode
  viewControls: ReactNode
  results: ReactNode
}

export function DatabaseBrowseLayout({
  activeEntity,
  activeFilterChips,
  filteredCount,
  filters,
  onResetFilters,
  results,
  search,
  title,
  totalCount,
  unitNoun,
  viewControls,
}: DatabaseBrowseLayoutProps) {
  const isFiltered = filteredCount !== totalCount

  return (
    <div className='space-y-3 sm:space-y-4 lg:space-y-5'>
      <h2 className='sr-only'>{title}</h2>
      <DatabaseEntityTabs activeEntity={activeEntity} search={search} />

      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <p className='text-[11px] text-slate-400'>
          {isFiltered ? (
            <>
              <span className='font-medium text-slate-100 tabular-nums'>{filteredCount}</span> of{' '}
              <span className='tabular-nums'>{totalCount}</span>
            </>
          ) : (
            <>
              <span className='font-medium text-slate-100 tabular-nums'>{totalCount}</span>{' '}
              {unitNoun}
            </>
          )}
        </p>
        {viewControls}
      </div>

      {filters}

      <ActiveFilterChips chips={activeFilterChips} onResetAll={onResetFilters} />

      {results}
    </div>
  )
}
