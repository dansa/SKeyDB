import {
  AWAKENER_SCALING_SUBSTAT_ROLE_FILTER_IDS,
  type AwakenerScalingSubstatRoleFilter,
} from '@/domain/awakener-scaling-substats'
import {SUBSTAT_SCALING_KEYS, type SubstatScalingKey} from '@/domain/awakener-source-schema'
import {
  normalizeBrowseQuery,
  parseEnumListSearchParam,
  parseEnumSearchParam,
  patchSearchParams,
  setSearchParam,
} from '@/domain/browse-state-search-params'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'

export type {DatabaseSortKey} from '@/domain/database-sorting'
export type {SubstatScalingKey} from '@/domain/awakener-source-schema'
export type {AwakenerScalingSubstatRoleFilter} from '@/domain/awakener-scaling-substats'

export const DATABASE_REALM_FILTER_IDS = ['ALL', 'AEQUOR', 'CARO', 'CHAOS', 'ULTRA'] as const
export type RealmFilterId = (typeof DATABASE_REALM_FILTER_IDS)[number]
export const DATABASE_RARITY_FILTER_IDS = ['ALL', 'Genesis', 'SSR', 'SR'] as const
export type RarityFilterId = (typeof DATABASE_RARITY_FILTER_IDS)[number]
export const DATABASE_TYPE_FILTER_IDS = ['ALL', 'ASSAULT', 'WARDEN', 'CHORUS'] as const
export type TypeFilterId = (typeof DATABASE_TYPE_FILTER_IDS)[number]
export const DATABASE_AVAILABILITY_FILTER_IDS = [
  'ALL',
  'PERMANENT',
  'WELFARE',
  'LIMITED',
  'LIMITED_FADED_LEGACY',
  'LIMITED_ASTRAL_REIGN',
] as const
export type AvailabilityFilterId = (typeof DATABASE_AVAILABILITY_FILTER_IDS)[number]
export const DATABASE_GAMEPLAY_FACTION_FILTER_IDS = ['Lemurian'] as const
export type GameplayFactionFilterId = (typeof DATABASE_GAMEPLAY_FACTION_FILTER_IDS)[number]

export function getAvailabilityFilterLabel(id: AvailabilityFilterId): string {
  switch (id) {
    case 'ALL':
      return 'All'
    case 'PERMANENT':
      return 'Permanent'
    case 'WELFARE':
      return 'Welfare'
    case 'LIMITED':
      return 'Limited'
    case 'LIMITED_FADED_LEGACY':
      return 'Faded Legacy'
    case 'LIMITED_ASTRAL_REIGN':
      return 'Astral Reign'
  }
}

export function formatAwakenerAvailabilityLabel(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const normalized = value.trim().toUpperCase()
  if (normalized === 'LIMITED_FADED_LEGACY') {
    return getAvailabilityFilterLabel('LIMITED_FADED_LEGACY')
  }
  if (normalized === 'LIMITED_ASTRAL_REIGN') {
    return getAvailabilityFilterLabel('LIMITED_ASTRAL_REIGN')
  }
  if (DATABASE_AVAILABILITY_FILTER_IDS.includes(normalized as AvailabilityFilterId)) {
    return getAvailabilityFilterLabel(normalized as AvailabilityFilterId)
  }
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

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
  'RELEASE_DATE',
  'ATK',
  'DEF',
  'CON',
]

export interface DatabaseBrowseState {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  availabilityFilter: AvailabilityFilterId
  gameplayFactionFilters: GameplayFactionFilterId[]
  scalingSubstatFilters: SubstatScalingKey[]
  scalingSubstatRoleFilter: AwakenerScalingSubstatRoleFilter
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
}

export const DATABASE_BROWSE_DEFAULTS: DatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
  rarityFilter: 'ALL',
  typeFilter: 'ALL',
  availabilityFilter: 'ALL',
  gameplayFactionFilters: [],
  scalingSubstatFilters: [],
  scalingSubstatRoleFilter: 'ANY',
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
    availabilityFilter: parseEnumSearchParam(
      searchParams.get('availability'),
      DATABASE_AVAILABILITY_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.availabilityFilter,
    ),
    gameplayFactionFilters: parseEnumListSearchParam(
      searchParams.get('faction'),
      DATABASE_GAMEPLAY_FACTION_FILTER_IDS,
    ),
    scalingSubstatFilters: parseEnumListSearchParam(
      searchParams.get('scaling'),
      SUBSTAT_SCALING_KEYS,
    ),
    scalingSubstatRoleFilter: parseEnumSearchParam(
      searchParams.get('scalingRole'),
      AWAKENER_SCALING_SUBSTAT_ROLE_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.scalingSubstatRoleFilter,
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
        'availability',
        nextState.availabilityFilter === DATABASE_BROWSE_DEFAULTS.availabilityFilter
          ? undefined
          : nextState.availabilityFilter,
      )
      setSearchParam(
        nextParams,
        'faction',
        nextState.gameplayFactionFilters.length > 0
          ? nextState.gameplayFactionFilters.join(',')
          : undefined,
      )
      setSearchParam(
        nextParams,
        'scaling',
        nextState.scalingSubstatFilters.length > 0
          ? nextState.scalingSubstatFilters.join(',')
          : undefined,
      )
      setSearchParam(
        nextParams,
        'scalingRole',
        nextState.scalingSubstatRoleFilter === DATABASE_BROWSE_DEFAULTS.scalingSubstatRoleFilter
          ? undefined
          : nextState.scalingSubstatRoleFilter,
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
