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
    return 'Mainstat'
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
      searchPlaceholder='Search wheels... (name, owner, realm, mainstat, effects)'
      totalCount={totalCount}
    >
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

      <CatalogChipFilterRow
        activeId={mainstatFilter}
        controlsClassName='grid min-w-0 flex-1 max-w-[calc(5*10rem+4*0.375rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-1.5'
        label='Mainstat'
        onChange={onMainstatFilterChange}
        options={wheelMainstatFilterOptions.map((entry) => ({
          id: entry.id,
          iconSrc: entry.iconAsset,
          label: entry.label,
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
