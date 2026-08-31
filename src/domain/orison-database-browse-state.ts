import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  patchSearchParams,
  setSearchParam,
} from './browse-state-search-params'
import {
  ORISON_TYPES,
  ORISON_VARIANT_TIERS,
  type OrisonType,
  type OrisonVariantTier,
} from './orisons'

export type OrisonTypeFilter = 'ALL' | OrisonType
export type OrisonTierFilter = 'ALL' | OrisonVariantTier

export interface OrisonDatabaseBrowseState {
  query: string
  typeFilter: OrisonTypeFilter
  tierFilter: OrisonTierFilter
}

export const ORISON_DATABASE_DEFAULTS: OrisonDatabaseBrowseState = {
  query: '',
  typeFilter: 'ALL',
  tierFilter: 'ALL',
}

const TYPE_FILTERS = ['ALL', ...ORISON_TYPES] as const
const TIER_FILTERS = ['ALL', ...ORISON_VARIANT_TIERS] as const

export function parseOrisonDatabaseBrowseState(params: URLSearchParams): OrisonDatabaseBrowseState {
  return {
    query: normalizeBrowseQuery(params.get('q')),
    typeFilter: parseEnumSearchParam(params.get('type'), TYPE_FILTERS, 'ALL'),
    tierFilter: parseEnumSearchParam(params.get('tier'), TIER_FILTERS, 'ALL'),
  }
}

export function patchOrisonDatabaseBrowseState(
  params: URLSearchParams,
  patch: Partial<OrisonDatabaseBrowseState>,
): URLSearchParams {
  return patchSearchParams(params, patch, parseOrisonDatabaseBrowseState, (next, state) => {
    setSearchParam(next, 'q', normalizeBrowseQuery(state.query))
    setSearchParam(next, 'type', state.typeFilter === 'ALL' ? undefined : state.typeFilter)
    setSearchParam(next, 'tier', state.tierFilter === 'ALL' ? undefined : state.tierFilter)
  })
}
