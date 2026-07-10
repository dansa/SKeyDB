import type {RefObject} from 'react'

import {
  getRelicDatabaseCategoryFilterLabel,
  RELIC_DATABASE_CATEGORY_FILTER_IDS,
  RELIC_DATABASE_RARITY_FILTER_IDS,
  type RelicDatabaseCategoryFilterId,
  type RelicDatabaseRarityFilterId,
} from '@/domain/relic-database-browse-state'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogFilterRow} from './DatabaseChipPrimitives'

const CATEGORY_OPTIONS = RELIC_DATABASE_CATEGORY_FILTER_IDS.map((id) => ({
  id,
  label: getRelicDatabaseCategoryFilterLabel(id),
}))
const RARITY_OPTIONS = RELIC_DATABASE_RARITY_FILTER_IDS.map((id) => ({id, label: id}))

interface RelicDatabaseFiltersProps {
  categoryFilter: RelicDatabaseCategoryFilterId
  onCategoryFilterChange: (next: RelicDatabaseCategoryFilterId) => void
  onQueryChange: (query: string) => void
  onRarityFilterChange: (next: RelicDatabaseRarityFilterId) => void
  query: string
  rarityFilter: RelicDatabaseRarityFilterId
  searchInputRef: RefObject<HTMLInputElement | null>
}

export function RelicDatabaseFilters({
  categoryFilter,
  onCategoryFilterChange,
  onQueryChange,
  onRarityFilterChange,
  query,
  rarityFilter,
  searchInputRef,
}: RelicDatabaseFiltersProps) {
  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search relics'
        onQueryChange={onQueryChange}
        placeholder='Name, alias, category, or Awakener'
        query={query}
        searchInputRef={searchInputRef}
      />
      <CatalogFilterRow
        activeId={categoryFilter}
        defaultId='ALL'
        label='Category'
        onChange={onCategoryFilterChange}
        options={CATEGORY_OPTIONS}
      />
      <CatalogFilterRow
        activeId={rarityFilter}
        defaultId='ALL'
        label='Rarity'
        onChange={onRarityFilterChange}
        options={RARITY_OPTIONS}
      />
    </div>
  )
}
