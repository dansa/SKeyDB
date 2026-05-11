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

export interface PosseDatabaseBrowseState {
  query: string
  realmFilter: PosseDatabaseRealmFilterId
}

export const POSSE_DATABASE_BROWSE_DEFAULTS: PosseDatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
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
