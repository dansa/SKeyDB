import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  setSearchParam,
} from '@/domain/browse-state-search-params'

export const POSSE_DATABASE_REALM_FILTER_IDS = [
  'ALL',
  'AEQUOR',
  'CARO',
  'CHAOS',
  'ULTRA',
  'FADED_LEGACY',
  'OTHER',
] as const
export type PosseDatabaseRealmFilterId = (typeof POSSE_DATABASE_REALM_FILTER_IDS)[number]
export const POSSE_DATABASE_TYPE_FILTER_IDS = ['ALL', 'NORMAL', 'PRIMORDIAL_MEMORY'] as const
export type PosseDatabaseTypeFilterId = (typeof POSSE_DATABASE_TYPE_FILTER_IDS)[number]

export interface PosseDatabaseBrowseState {
  query: string
  realmFilter: PosseDatabaseRealmFilterId
  typeFilter: PosseDatabaseTypeFilterId
}

export const POSSE_DATABASE_BROWSE_DEFAULTS: PosseDatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
  typeFilter: 'ALL',
}

export interface CovenantDatabaseBrowseState {
  query: string
}

export const COVENANT_DATABASE_BROWSE_DEFAULTS: CovenantDatabaseBrowseState = {
  query: '',
}

interface SimpleArtifactDatabaseBrowseState {
  query: string
}

function patchSimpleArtifactDatabaseBrowseState<TState extends SimpleArtifactDatabaseBrowseState>(
  searchParams: URLSearchParams,
  patch: Partial<TState>,
  parseState: (searchParams: URLSearchParams) => TState,
  writeAdditionalParams?: (nextParams: URLSearchParams, nextState: TState) => void,
): URLSearchParams {
  const nextState = {...parseState(searchParams), ...patch}
  const nextParams = new URLSearchParams()

  setSearchParam(nextParams, 'q', normalizeBrowseQuery(nextState.query))
  writeAdditionalParams?.(nextParams, nextState)

  return nextParams
}

export function getPosseDatabaseRealmFilterLabel(realmFilter: PosseDatabaseRealmFilterId): string {
  switch (realmFilter) {
    case 'ALL':
      return 'All'
    case 'FADED_LEGACY':
      return 'Faded Legacy'
    case 'AEQUOR':
      return 'Aequor'
    case 'CARO':
      return 'Caro'
    case 'CHAOS':
      return 'Chaos'
    case 'ULTRA':
      return 'Ultra'
    case 'OTHER':
      return 'Other'
  }

  return realmFilter
}

export function getPosseDatabaseTypeFilterLabel(typeFilter: PosseDatabaseTypeFilterId): string {
  switch (typeFilter) {
    case 'NORMAL':
      return 'Normal Posses'
    case 'PRIMORDIAL_MEMORY':
      return 'Primordial Memories'
    case 'ALL':
      return 'All'
  }
}

export function parsePosseDatabaseBrowseState(
  searchParams: URLSearchParams,
): PosseDatabaseBrowseState {
  return {
    query: normalizeBrowseQuery(searchParams.get('q')),
    realmFilter: parseEnumSearchParam(
      searchParams.get('realm'),
      POSSE_DATABASE_REALM_FILTER_IDS,
      POSSE_DATABASE_BROWSE_DEFAULTS.realmFilter,
    ),
    typeFilter: parseEnumSearchParam(
      searchParams.get('type'),
      POSSE_DATABASE_TYPE_FILTER_IDS,
      POSSE_DATABASE_BROWSE_DEFAULTS.typeFilter,
    ),
  }
}

export function patchPosseDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<PosseDatabaseBrowseState>,
): URLSearchParams {
  return patchSimpleArtifactDatabaseBrowseState(
    searchParams,
    patch,
    parsePosseDatabaseBrowseState,
    (nextParams, nextState) => {
      setSearchParam(
        nextParams,
        'realm',
        nextState.realmFilter === POSSE_DATABASE_BROWSE_DEFAULTS.realmFilter
          ? undefined
          : nextState.realmFilter,
      )
      setSearchParam(
        nextParams,
        'type',
        nextState.typeFilter === POSSE_DATABASE_BROWSE_DEFAULTS.typeFilter
          ? undefined
          : nextState.typeFilter,
      )
    },
  )
}

export function parseCovenantDatabaseBrowseState(
  searchParams: URLSearchParams,
): CovenantDatabaseBrowseState {
  return {
    query: normalizeBrowseQuery(searchParams.get('q')),
  }
}

export function patchCovenantDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<CovenantDatabaseBrowseState>,
): URLSearchParams {
  return patchSimpleArtifactDatabaseBrowseState(
    searchParams,
    patch,
    parseCovenantDatabaseBrowseState,
  )
}
