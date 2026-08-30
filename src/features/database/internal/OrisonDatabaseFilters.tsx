import type {RefObject} from 'react'

import type {OrisonTierFilter, OrisonTypeFilter} from '@/domain/orison-database-browse-state'
import {ORISON_TYPES, ORISON_VARIANT_TIERS} from '@/domain/orisons'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogFilterRow} from './DatabaseChipPrimitives'

const TYPE_OPTIONS: readonly {id: OrisonTypeFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  ...ORISON_TYPES.map((id) => ({id, label: id === 'STANDARD' ? 'Standard' : 'Special'})),
]
const TIER_OPTIONS: readonly {id: OrisonTierFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  ...ORISON_VARIANT_TIERS.map((id) => ({id, label: id})),
]

export function OrisonDatabaseFilters({
  query,
  typeFilter,
  tierFilter,
  searchInputRef,
  onQueryChange,
  onTypeFilterChange,
  onTierFilterChange,
}: {
  query: string
  typeFilter: OrisonTypeFilter
  tierFilter: OrisonTierFilter
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (value: string) => void
  onTypeFilterChange: (value: OrisonTypeFilter) => void
  onTierFilterChange: (value: OrisonTierFilter) => void
}) {
  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search orisons'
        onQueryChange={onQueryChange}
        placeholder='Name, type, or tier'
        query={query}
        searchInputRef={searchInputRef}
      />
      <CatalogFilterRow
        activeId={typeFilter}
        defaultId='ALL'
        label='Type'
        onChange={onTypeFilterChange}
        options={TYPE_OPTIONS}
      />
      <CatalogFilterRow
        activeId={tierFilter}
        defaultId='ALL'
        label='Tier'
        onChange={onTierFilterChange}
        options={TIER_OPTIONS}
      />
    </div>
  )
}
