import type {RefObject} from 'react'

import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {wheelMainstatFilterOptions, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {
  WHEELS_DATABASE_RARITY_FILTER_IDS,
  WHEELS_DATABASE_REALM_FILTER_IDS,
  WHEELS_DATABASE_SORT_OPTIONS,
  type WheelsDatabaseRarityFilterId,
  type WheelsDatabaseRealmFilterId,
  type WheelsDatabaseSortKey,
} from '@/domain/wheels-database-browse-state'

import {
  CatalogChipFilterRow,
  CatalogCompactSortRow,
  CatalogFiltersShell,
  CatalogRealmFilterRow,
} from './CatalogFiltersShell'

interface WheelDatabaseFiltersProps {
  query: string
  realmFilter: WheelsDatabaseRealmFilterId
  rarityFilter: WheelsDatabaseRarityFilterId
  mainstatFilter: WheelMainstatFilter
  sortKey: WheelsDatabaseSortKey
  sortDirection: CollectionSortDirection
  totalCount: number
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: WheelsDatabaseRealmFilterId) => void
  onRarityFilterChange: (filter: WheelsDatabaseRarityFilterId) => void
  onMainstatFilterChange: (filter: WheelMainstatFilter) => void
  onSortKeyChange: (key: WheelsDatabaseSortKey) => void
  onSortDirectionToggle: () => void
}

const REALM_FILTERS = WHEELS_DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = WHEELS_DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
}))

function getWheelSortLabel(sortKey: WheelsDatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'MAINSTAT') {
    return 'Main stat'
  }
  return 'Alphabetical'
}

export function WheelDatabaseFilters({
  filteredCount,
  mainstatFilter,
  onMainstatFilterChange,
  onQueryChange,
  onRarityFilterChange,
  onRealmFilterChange,
  onSortDirectionToggle,
  onSortKeyChange,
  query,
  rarityFilter,
  realmFilter,
  searchInputRef,
  sortDirection,
  sortKey,
  totalCount,
}: WheelDatabaseFiltersProps) {
  return (
    <CatalogFiltersShell
      filteredCount={filteredCount}
      onQueryChange={onQueryChange}
      query={query}
      searchInputRef={searchInputRef}
      searchLabel='Search wheels'
      searchPlaceholder='Name, owner, realm, main stat, or effect'
      totalCount={totalCount}
    >
      <div className='grid gap-2 lg:grid-cols-2'>
        <CatalogRealmFilterRow
          activeRealm={realmFilter}
          onChange={onRealmFilterChange}
          realms={REALM_FILTERS}
        />

        <CatalogChipFilterRow
          activeId={rarityFilter}
          label='Rarity'
          onChange={onRarityFilterChange}
          options={rarityFilterTabs}
        />
      </div>

      <CatalogChipFilterRow
        activeId={mainstatFilter}
        controlsClassName='grid min-w-0 flex-1 grid-cols-2 gap-1.5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        label='Main stat'
        onChange={onMainstatFilterChange}
        options={wheelMainstatFilterOptions.map((entry) => ({
          id: entry.id,
          iconSrc: entry.iconAsset,
          label: entry.label,
          mobileLabel: entry.label,
        }))}
      />

      <CatalogCompactSortRow
        getSortLabel={getWheelSortLabel}
        onSortDirectionToggle={onSortDirectionToggle}
        onSortKeyChange={onSortKeyChange}
        sortDirection={sortDirection}
        sortDirectionAriaLabel='Toggle wheel sort direction'
        sortKey={sortKey}
        sortOptions={WHEELS_DATABASE_SORT_OPTIONS}
        sortSelectAriaLabel='Wheel database sort key'
      />
    </CatalogFiltersShell>
  )
}
