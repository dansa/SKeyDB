import type {RefObject} from 'react'

import {TogglePill} from '@/components/ui/TogglePill'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'

import {
  CatalogChipFilterRow,
  CatalogCompactSortRow,
  CatalogFiltersShell,
  CatalogRealmFilterRow,
} from './CatalogFiltersShell'
import {
  DATABASE_RARITY_FILTER_IDS,
  DATABASE_REALM_FILTER_IDS,
  DATABASE_SORT_OPTIONS,
  DATABASE_TYPE_FILTER_IDS,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from './database-browse-state'

interface DatabaseFiltersProps {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
  totalCount: number
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
  onSortKeyChange: (key: DatabaseSortKey) => void
  onSortDirectionToggle: () => void
  onGroupByRealmChange: (next: boolean) => void
}

const REALM_FILTERS = DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
}))

const typeFilterTabs = DATABASE_TYPE_FILTER_IDS.map((id) => ({
  id,
  label:
    id === 'ALL' ? 'All' : id === 'ASSAULT' ? 'Assault' : id === 'WARDEN' ? 'Warden' : 'Chorus',
}))

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  sortKey,
  sortDirection,
  groupByRealm,
  totalCount,
  filteredCount,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
  onSortKeyChange,
  onSortDirectionToggle,
  onGroupByRealmChange,
}: DatabaseFiltersProps) {
  return (
    <CatalogFiltersShell
      filteredCount={filteredCount}
      onQueryChange={onQueryChange}
      query={query}
      searchInputRef={searchInputRef}
      searchLabel='Search awakeners'
      searchPlaceholder='Name, tag, realm, or role'
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
        activeId={typeFilter}
        label='Type'
        onChange={onTypeFilterChange}
        options={typeFilterTabs}
      />

      <CatalogCompactSortRow
        onSortDirectionToggle={onSortDirectionToggle}
        onSortKeyChange={onSortKeyChange}
        sortDirection={sortDirection}
        sortDirectionAriaLabel='Toggle database sort direction'
        sortKey={sortKey}
        sortOptions={DATABASE_SORT_OPTIONS}
        sortSelectAriaLabel='Database sort key'
        trailingContent={
          <>
            <span>Keep realms together</span>
            <TogglePill
              ariaLabel='Toggle grouping awakeners by realm'
              checked={groupByRealm}
              className='ownership-pill-builder'
              offLabel='Off'
              onChange={onGroupByRealmChange}
              onLabel='On'
              variant='flat'
            />
          </>
        }
      />
    </CatalogFiltersShell>
  )
}
