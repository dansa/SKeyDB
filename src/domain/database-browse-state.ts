import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  patchSearchParams,
  setSearchParam,
} from '@/domain/browse-state-search-params'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'

export type {DatabaseSortKey} from '@/domain/database-sorting'

export const DATABASE_REALM_FILTER_IDS = ['ALL', 'AEQUOR', 'CARO', 'CHAOS', 'ULTRA'] as const
export type RealmFilterId = (typeof DATABASE_REALM_FILTER_IDS)[number]
export const DATABASE_RARITY_FILTER_IDS = ['ALL', 'Genesis', 'SSR', 'SR'] as const
export type RarityFilterId = (typeof DATABASE_RARITY_FILTER_IDS)[number]
export const DATABASE_TYPE_FILTER_IDS = ['ALL', 'ASSAULT', 'WARDEN', 'CHORUS'] as const
export type TypeFilterId = (typeof DATABASE_TYPE_FILTER_IDS)[number]

export function getTypeFilterLabel(id: TypeFilterId): string {
  if (id === 'ALL') {
    return 'All'
  }
  if (id === 'ASSAULT') {
    return 'Assault'
  }
  if (id === 'WARDEN') {
    return 'Warden'
  }
  return 'Chorus'
}

export const DATABASE_SORT_OPTIONS: readonly DatabaseSortKey[] = [
  'ALPHABETICAL',
  'RARITY',
  'ATK',
  'DEF',
  'CON',
]

export interface DatabaseBrowseState {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
}

export const DATABASE_BROWSE_DEFAULTS: DatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
  rarityFilter: 'ALL',
  typeFilter: 'ALL',
  sortKey: 'ALPHABETICAL',
  sortDirection: 'ASC',
  groupByRealm: false,
}

function parseSortDirection(rawValue: string | null): CollectionSortDirection {
  return rawValue === 'DESC' ? 'DESC' : DATABASE_BROWSE_DEFAULTS.sortDirection
}

function parseGroupByRealm(rawValue: string | null): boolean {
  return rawValue === '1'
}

export function parseDatabaseBrowseState(searchParams: URLSearchParams): DatabaseBrowseState {
  return {
    query: normalizeBrowseQuery(searchParams.get('q')),
    realmFilter: parseEnumSearchParam(
      searchParams.get('realm'),
      DATABASE_REALM_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.realmFilter,
    ),
    rarityFilter: parseEnumSearchParam(
      searchParams.get('rarity'),
      DATABASE_RARITY_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.rarityFilter,
    ),
    typeFilter: parseEnumSearchParam(
      searchParams.get('type'),
      DATABASE_TYPE_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.typeFilter,
    ),
    sortKey: parseEnumSearchParam(
      searchParams.get('sort'),
      DATABASE_SORT_OPTIONS,
      DATABASE_BROWSE_DEFAULTS.sortKey,
    ),
    sortDirection: parseSortDirection(searchParams.get('dir')),
    groupByRealm: parseGroupByRealm(searchParams.get('group')),
  }
}

export function patchDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<DatabaseBrowseState>,
): URLSearchParams {
  return patchSearchParams(
    searchParams,
    patch,
    parseDatabaseBrowseState,
    (nextParams, nextState) => {
      setSearchParam(nextParams, 'q', normalizeBrowseQuery(nextState.query))
      setSearchParam(
        nextParams,
        'realm',
        nextState.realmFilter === DATABASE_BROWSE_DEFAULTS.realmFilter
          ? undefined
          : nextState.realmFilter,
      )
      setSearchParam(
        nextParams,
        'rarity',
        nextState.rarityFilter === DATABASE_BROWSE_DEFAULTS.rarityFilter
          ? undefined
          : nextState.rarityFilter,
      )
      setSearchParam(
        nextParams,
        'type',
        nextState.typeFilter === DATABASE_BROWSE_DEFAULTS.typeFilter
          ? undefined
          : nextState.typeFilter,
      )
      setSearchParam(
        nextParams,
        'sort',
        nextState.sortKey === DATABASE_BROWSE_DEFAULTS.sortKey ? undefined : nextState.sortKey,
      )
      setSearchParam(
        nextParams,
        'dir',
        nextState.sortDirection === DATABASE_BROWSE_DEFAULTS.sortDirection
          ? undefined
          : nextState.sortDirection,
      )
      setSearchParam(
        nextParams,
        'group',
        nextState.groupByRealm === DATABASE_BROWSE_DEFAULTS.groupByRealm ? undefined : '1',
      )
    },
  )
}
