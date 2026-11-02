import {AVAILABILITY_LABELS, COMMON_AVAILABILITY_FILTER_IDS} from '@/domain/availability-filters'
import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  patchSearchParams,
  setSearchParam,
} from '@/domain/browse-state-search-params'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {wheelMainstatFilterOptions, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'

export const WHEELS_DATABASE_AVAILABILITY_FILTER_IDS = [
  ...COMMON_AVAILABILITY_FILTER_IDS,
  'EVENT',
  'BATTLE_PASS',
] as const
export type WheelsDatabaseAvailabilityFilterId =
  (typeof WHEELS_DATABASE_AVAILABILITY_FILTER_IDS)[number]

export function getWheelAvailabilityFilterLabel(id: WheelsDatabaseAvailabilityFilterId): string {
  return AVAILABILITY_LABELS[id]
}

export const WHEELS_DATABASE_REALM_FILTER_IDS = [
  'ALL',
  'AEQUOR',
  'CARO',
  'CHAOS',
  'ULTRA',
  'NEUTRAL',
] as const
export type WheelsDatabaseRealmFilterId = (typeof WHEELS_DATABASE_REALM_FILTER_IDS)[number]

export const WHEELS_DATABASE_RARITY_FILTER_IDS = ['ALL', 'SSR', 'SR', 'R', 'N'] as const
export type WheelsDatabaseRarityFilterId = (typeof WHEELS_DATABASE_RARITY_FILTER_IDS)[number]

export const WHEELS_DATABASE_SORT_OPTIONS = ['ALPHABETICAL', 'RARITY', 'MAINSTAT'] as const
export type WheelsDatabaseSortKey = (typeof WHEELS_DATABASE_SORT_OPTIONS)[number]

export interface WheelsDatabaseBrowseState {
  availabilityFilter: WheelsDatabaseAvailabilityFilterId
  query: string
  realmFilter: WheelsDatabaseRealmFilterId
  rarityFilter: WheelsDatabaseRarityFilterId
  mainstatFilter: WheelMainstatFilter
  sortKey: WheelsDatabaseSortKey
  sortDirection: CollectionSortDirection
}

export const WHEELS_DATABASE_BROWSE_DEFAULTS: WheelsDatabaseBrowseState = {
  availabilityFilter: 'ALL',
  query: '',
  realmFilter: 'ALL',
  rarityFilter: 'ALL',
  mainstatFilter: 'ALL',
  sortKey: 'RARITY',
  sortDirection: 'DESC',
}

export function getDefaultWheelsDatabaseSortDirection(
  sortKey: WheelsDatabaseSortKey,
): CollectionSortDirection {
  return sortKey === 'RARITY' ? 'DESC' : 'ASC'
}

const WHEELS_DATABASE_MAINSTAT_FILTER_IDS = wheelMainstatFilterOptions.map((entry) => entry.id)

function parseSortDirection(
  rawValue: string | null,
  sortKey: WheelsDatabaseSortKey,
): CollectionSortDirection {
  if (rawValue === 'ASC' || rawValue === 'DESC') {
    return rawValue
  }
  return getDefaultWheelsDatabaseSortDirection(sortKey)
}

export function parseWheelsDatabaseBrowseState(
  searchParams: URLSearchParams,
): WheelsDatabaseBrowseState {
  const sortKey = parseEnumSearchParam(
    searchParams.get('sort'),
    WHEELS_DATABASE_SORT_OPTIONS,
    WHEELS_DATABASE_BROWSE_DEFAULTS.sortKey,
  )

  return {
    availabilityFilter: parseEnumSearchParam(
      searchParams.get('availability'),
      WHEELS_DATABASE_AVAILABILITY_FILTER_IDS,
      WHEELS_DATABASE_BROWSE_DEFAULTS.availabilityFilter,
    ),
    query: normalizeBrowseQuery(searchParams.get('q')),
    realmFilter: parseEnumSearchParam(
      searchParams.get('realm'),
      WHEELS_DATABASE_REALM_FILTER_IDS,
      WHEELS_DATABASE_BROWSE_DEFAULTS.realmFilter,
    ),
    rarityFilter: parseEnumSearchParam(
      searchParams.get('rarity'),
      WHEELS_DATABASE_RARITY_FILTER_IDS,
      WHEELS_DATABASE_BROWSE_DEFAULTS.rarityFilter,
    ),
    mainstatFilter: parseEnumSearchParam(
      searchParams.get('mainstat'),
      WHEELS_DATABASE_MAINSTAT_FILTER_IDS,
      WHEELS_DATABASE_BROWSE_DEFAULTS.mainstatFilter,
    ),
    sortKey,
    sortDirection: parseSortDirection(searchParams.get('dir'), sortKey),
  }
}

export function patchWheelsDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<WheelsDatabaseBrowseState>,
  {includeSortParams = true}: {includeSortParams?: boolean} = {},
): URLSearchParams {
  return patchSearchParams(
    searchParams,
    patch,
    parseWheelsDatabaseBrowseState,
    (nextParams, patchedState) => {
      setSearchParam(
        nextParams,
        'availability',
        patchedState.availabilityFilter === 'ALL' ? undefined : patchedState.availabilityFilter,
      )
      setSearchParam(nextParams, 'q', normalizeBrowseQuery(patchedState.query))
      setSearchParam(
        nextParams,
        'realm',
        patchedState.realmFilter === WHEELS_DATABASE_BROWSE_DEFAULTS.realmFilter
          ? undefined
          : patchedState.realmFilter,
      )
      setSearchParam(
        nextParams,
        'rarity',
        patchedState.rarityFilter === WHEELS_DATABASE_BROWSE_DEFAULTS.rarityFilter
          ? undefined
          : patchedState.rarityFilter,
      )
      setSearchParam(
        nextParams,
        'mainstat',
        patchedState.mainstatFilter === WHEELS_DATABASE_BROWSE_DEFAULTS.mainstatFilter
          ? undefined
          : patchedState.mainstatFilter,
      )
      if (includeSortParams) {
        setSearchParam(
          nextParams,
          'sort',
          patchedState.sortKey === WHEELS_DATABASE_BROWSE_DEFAULTS.sortKey
            ? undefined
            : patchedState.sortKey,
        )
        setSearchParam(
          nextParams,
          'dir',
          patchedState.sortDirection === getDefaultWheelsDatabaseSortDirection(patchedState.sortKey)
            ? undefined
            : patchedState.sortDirection,
        )
      } else {
        nextParams.delete('sort')
        nextParams.delete('dir')
      }
    },
    (currentState, nextPatch) => {
      const nextState = {
        ...currentState,
        ...nextPatch,
      }
      if (nextPatch.sortKey && nextPatch.sortDirection === undefined) {
        nextState.sortDirection = getDefaultWheelsDatabaseSortDirection(nextPatch.sortKey)
      }
      return nextState
    },
  )
}
