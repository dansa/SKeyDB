import type {RefObject} from 'react'

import {
  DATABASE_RARITY_FILTER_IDS,
  DATABASE_REALM_FILTER_IDS,
  DATABASE_TYPE_FILTER_IDS,
  getTypeFilterLabel,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogRealmFilterRow} from './DatabaseChipPrimitives'

interface DatabaseFiltersProps {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
}

const REALM_FILTERS = DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
}))

const typeFilterTabs = DATABASE_TYPE_FILTER_IDS.map((id) => ({
  id,
  label: getTypeFilterLabel(id),
}))

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
}: DatabaseFiltersProps) {
  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search awakeners'
        onQueryChange={onQueryChange}
        placeholder='Name, tag, realm, or role'
        query={query}
        searchInputRef={searchInputRef}
      />
      <div className='space-y-2.5 sm:space-y-3'>
        <div className='grid gap-2 lg:grid-cols-2'>
          <CatalogRealmFilterRow
            activeRealm={realmFilter}
            onChange={onRealmFilterChange}
            realms={REALM_FILTERS}
          />

          <ChipFilterRow
            activeId={rarityFilter}
            label='Rarity'
            onChange={onRarityFilterChange}
            options={rarityFilterTabs}
          />
        </div>

        <ChipFilterRow
          activeId={typeFilter}
          label='Type'
          onChange={onTypeFilterChange}
          options={typeFilterTabs}
        />
      </div>
    </div>
  )
}
