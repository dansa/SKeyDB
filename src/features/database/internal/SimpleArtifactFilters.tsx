import type {RefObject} from 'react'

import {
  POSSE_DATABASE_REALM_FILTER_IDS,
  POSSE_DATABASE_TYPE_FILTER_IDS,
  type PosseDatabaseRealmFilterId,
  type PosseDatabaseTypeFilterId,
} from '@/domain/simple-artifact-database-browse-state'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogFilterRow, CatalogRealmFilterRow} from './DatabaseChipPrimitives'

export type PosseRealmFilter = PosseDatabaseRealmFilterId

const POSSE_REALM_FILTERS = POSSE_DATABASE_REALM_FILTER_IDS.slice(1)

interface PosseDatabaseFiltersProps {
  query: string
  realmFilter: PosseRealmFilter
  typeFilter: PosseDatabaseTypeFilterId
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: PosseRealmFilter) => void
  onTypeFilterChange: (filter: PosseDatabaseTypeFilterId) => void
}

export function PosseDatabaseFilters({
  onQueryChange,
  onRealmFilterChange,
  onTypeFilterChange,
  query,
  realmFilter,
  typeFilter,
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
      <CatalogRealmFilterRow
        activeRealm={realmFilter}
        onChange={onRealmFilterChange}
        realms={POSSE_REALM_FILTERS}
      />
      <CatalogFilterRow
        activeId={typeFilter}
        defaultId='ALL'
        label='Type'
        onChange={onTypeFilterChange}
        options={POSSE_DATABASE_TYPE_FILTER_IDS.map((id) => ({
          id,
          label: id === 'NORMAL' ? 'Normal' : id === 'PRIMORDIAL_MEMORY' ? 'Memories' : 'All',
        }))}
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
