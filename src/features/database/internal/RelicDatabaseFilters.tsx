import type {RefObject} from 'react'

import {
  getRelicDatabaseCategoryFilterLabel,
  RELIC_DATABASE_CATEGORY_FILTER_IDS,
  type RelicDatabaseCategoryFilterId,
  getRelicDatabaseTierFilterLabel,
  RELIC_DATABASE_TIER_FILTER_IDS,
  type RelicDatabaseTierFilterId,
} from '@/domain/relic-database-browse-state'
import {
  getRelicDatabaseDisplayScopeLabel,
  RELIC_DATABASE_DISPLAY_SCOPE_IDS,
  type RelicDatabaseDisplayScopeId,
} from '@/domain/relic-database-display-scopes'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogFilterRow, CatalogMultiFilterRow} from './DatabaseChipPrimitives'

const CATEGORY_OPTIONS = RELIC_DATABASE_CATEGORY_FILTER_IDS.map((id) => ({
  id,
  label: getRelicDatabaseCategoryFilterLabel(id),
}))
const TIER_OPTIONS = RELIC_DATABASE_TIER_FILTER_IDS.map((id) => ({
  id,
  label: getRelicDatabaseTierFilterLabel(id),
}))
const DISPLAY_OPTIONS = RELIC_DATABASE_DISPLAY_SCOPE_IDS.map((id) => ({
  id,
  label: getRelicDatabaseDisplayScopeLabel(id),
  ariaLabel: `Display ${getRelicDatabaseDisplayScopeLabel(id)}`,
}))
interface RelicDatabaseFiltersProps {
  categoryFilter: RelicDatabaseCategoryFilterId
  displayScopes: readonly RelicDatabaseDisplayScopeId[]
  onCategoryFilterChange: (next: RelicDatabaseCategoryFilterId) => void
  onDisplayScopeToggle: (scope: RelicDatabaseDisplayScopeId) => void
  onQueryChange: (query: string) => void
  onTierFilterChange: (next: RelicDatabaseTierFilterId) => void
  query: string
  searchInputRef: RefObject<HTMLInputElement | null>
  tierFilter: RelicDatabaseTierFilterId
}

export function RelicDatabaseFilters({
  categoryFilter,
  displayScopes,
  onCategoryFilterChange,
  onDisplayScopeToggle,
  onQueryChange,
  onTierFilterChange,
  query,
  searchInputRef,
  tierFilter,
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
        activeId={tierFilter}
        defaultId='ALL'
        label='Variant'
        onChange={onTierFilterChange}
        options={TIER_OPTIONS}
      />
      <CatalogMultiFilterRow
        activeIds={displayScopes}
        description='Saved for future visits'
        label='Display'
        onToggle={onDisplayScopeToggle}
        options={DISPLAY_OPTIONS}
      />
    </div>
  )
}
