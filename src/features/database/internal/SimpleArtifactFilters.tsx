import type {RefObject} from 'react'

import {
  getPosseDatabaseRealmFilterLabel,
  POSSE_DATABASE_REALM_FILTER_IDS,
  type PosseDatabaseRealmFilterId,
} from '@/domain/simple-artifact-database-browse-state'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {SearchInput} from '@/ui/search/SearchInput'

export type PosseRealmFilter = PosseDatabaseRealmFilterId

const POSSE_REALM_OPTIONS: {id: PosseRealmFilter; label: string}[] =
  POSSE_DATABASE_REALM_FILTER_IDS.map((id) => ({
    id,
    label: getPosseDatabaseRealmFilterLabel(id),
  }))

interface PosseDatabaseFiltersProps {
  query: string
  realmFilter: PosseRealmFilter
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: PosseRealmFilter) => void
}

export function PosseDatabaseFilters({
  onQueryChange,
  onRealmFilterChange,
  query,
  realmFilter,
  searchInputRef,
}: PosseDatabaseFiltersProps) {
  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search posses'
        onQueryChange={onQueryChange}
        placeholder='Name or realm'
        query={query}
        searchInputRef={searchInputRef}
      />
      <ChipFilterRow
        activeId={realmFilter}
        label='Realm'
        onChange={onRealmFilterChange}
        options={POSSE_REALM_OPTIONS}
      />
    </div>
  )
}

interface CovenantDatabaseFiltersProps {
  query: string
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
}

export function CovenantDatabaseFilters({
  onQueryChange,
  query,
  searchInputRef,
}: CovenantDatabaseFiltersProps) {
  return (
    <SearchInput
      label='Search covenants'
      onQueryChange={onQueryChange}
      placeholder='Name'
      query={query}
      searchInputRef={searchInputRef}
    />
  )
}
