import type {RefObject} from 'react'

import {
  getRelicDatabaseCategoryFilterLabel,
  RELIC_DATABASE_CATEGORY_FILTER_IDS,
  type RelicDatabaseCategoryFilterId,
} from '@/domain/relic-database-browse-state'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogFilterRow} from './DatabaseChipPrimitives'

const CATEGORY_OPTIONS = RELIC_DATABASE_CATEGORY_FILTER_IDS.map((id) => ({
  id,
  label: getRelicDatabaseCategoryFilterLabel(id),
}))
interface RelicDatabaseFiltersProps {
  categoryFilter: RelicDatabaseCategoryFilterId
  onCategoryFilterChange: (next: RelicDatabaseCategoryFilterId) => void
  onQueryChange: (query: string) => void
  query: string
  searchInputRef: RefObject<HTMLInputElement | null>
}

export function RelicDatabaseFilters({
  categoryFilter,
  onCategoryFilterChange,
  onQueryChange,
  query,
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
    </div>
  )
}
