import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  patchSearchParams,
  setSearchParam,
} from '@/domain/browse-state-search-params'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {RelicCategory} from '@/domain/relics'

const RELIC_DATABASE_CATEGORIES = [
  'ASTRAL_REIGN',
  'FADED_LEGACY',
  'DIMENSIONAL_IMAGE',
  'EVENT',
  'PENDULUM',
  'OTHER',
] as const satisfies readonly RelicCategory[]

export const RELIC_DATABASE_CATEGORY_FILTER_IDS = ['ALL', ...RELIC_DATABASE_CATEGORIES] as const
export type RelicDatabaseCategoryFilterId = (typeof RELIC_DATABASE_CATEGORY_FILTER_IDS)[number]

export const RELIC_DATABASE_SORT_OPTIONS = ['BEST_MATCH', 'ALPHABETICAL', 'VARIANT_COUNT'] as const
export type RelicDatabaseSortKey = (typeof RELIC_DATABASE_SORT_OPTIONS)[number]

export interface RelicDatabaseBrowseState {
  categoryFilter: RelicDatabaseCategoryFilterId
  query: string
  sortDirection: CollectionSortDirection
  sortKey: RelicDatabaseSortKey
}

export const RELIC_DATABASE_BROWSE_DEFAULTS: RelicDatabaseBrowseState = {
  categoryFilter: 'ALL',
  query: '',
  sortDirection: 'ASC',
  sortKey: 'BEST_MATCH',
}

export function getRelicDatabaseCategoryFilterLabel(category: RelicCategory | 'ALL'): string {
  switch (category) {
    case 'ALL':
      return 'All'
    case 'ASTRAL_REIGN':
      return 'Astral Reign'
    case 'FADED_LEGACY':
      return 'Faded Legacy'
    case 'DIMENSIONAL_IMAGE':
      return 'Dimensional Image'
    case 'EVENT':
      return 'Events'
    case 'PENDULUM':
      return 'Pendulum'
    case 'OTHER':
      return 'Other'
  }
}

export function getDefaultRelicDatabaseSortDirection(
  sortKey: RelicDatabaseSortKey,
): CollectionSortDirection {
  return sortKey === 'VARIANT_COUNT' ? 'DESC' : 'ASC'
}

function parseSortDirection(
  rawValue: string | null,
  sortKey: RelicDatabaseSortKey,
): CollectionSortDirection {
  return rawValue === 'ASC' || rawValue === 'DESC'
    ? rawValue
    : getDefaultRelicDatabaseSortDirection(sortKey)
}

export function parseRelicDatabaseBrowseState(
  searchParams: URLSearchParams,
): RelicDatabaseBrowseState {
  const sortKey = parseEnumSearchParam(
    searchParams.get('sort'),
    RELIC_DATABASE_SORT_OPTIONS,
    RELIC_DATABASE_BROWSE_DEFAULTS.sortKey,
  )

  return {
    categoryFilter: parseEnumSearchParam(
      searchParams.get('category'),
      RELIC_DATABASE_CATEGORY_FILTER_IDS,
      RELIC_DATABASE_BROWSE_DEFAULTS.categoryFilter,
    ),
    query: normalizeBrowseQuery(searchParams.get('q')),
    sortDirection: parseSortDirection(searchParams.get('dir'), sortKey),
    sortKey,
  }
}

export function patchRelicDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<RelicDatabaseBrowseState>,
  {includeSortParams = true}: {includeSortParams?: boolean} = {},
): URLSearchParams {
  return patchSearchParams(
    searchParams,
    patch,
    parseRelicDatabaseBrowseState,
    (nextParams, nextState) => {
      setSearchParam(nextParams, 'q', normalizeBrowseQuery(nextState.query))
      setSearchParam(
        nextParams,
        'category',
        nextState.categoryFilter === RELIC_DATABASE_BROWSE_DEFAULTS.categoryFilter
          ? undefined
          : nextState.categoryFilter,
      )
      nextParams.delete('rarity')
      if (includeSortParams) {
        setSearchParam(
          nextParams,
          'sort',
          nextState.sortKey === RELIC_DATABASE_BROWSE_DEFAULTS.sortKey
            ? undefined
            : nextState.sortKey,
        )
        setSearchParam(
          nextParams,
          'dir',
          nextState.sortDirection === getDefaultRelicDatabaseSortDirection(nextState.sortKey)
            ? undefined
            : nextState.sortDirection,
        )
      } else {
        nextParams.delete('sort')
        nextParams.delete('dir')
      }
    },
    (currentState, nextPatch) => {
      const nextState = {...currentState, ...nextPatch}
      if (nextPatch.sortKey && nextPatch.sortDirection === undefined) {
        nextState.sortDirection = getDefaultRelicDatabaseSortDirection(nextPatch.sortKey)
      }
      return nextState
    },
  )
}

export function resetRelicDatabaseBrowseFilters(searchParams: URLSearchParams): URLSearchParams {
  return patchRelicDatabaseBrowseState(searchParams, {
    categoryFilter: 'ALL',
    query: '',
  })
}
