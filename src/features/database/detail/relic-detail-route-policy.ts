import {
  getRelicTierValue,
  parseRelicDatabaseBrowseState,
} from '@/domain/relic-database-browse-state'
import {resolvePreferredRelicVariant, type PublicRelicRecord} from '@/domain/relics'

import type {DatabaseDetailRouteItemByKind} from './dbDetailRegistry'

interface RelicDetailRouteLocation {
  hash: string
  pathname: string
  search: string
}

interface ResolveRelicDetailRoutePolicyOptions {
  location: RelicDetailRouteLocation
  record: PublicRelicRecord
  routeItem: DatabaseDetailRouteItemByKind['relic']
}

export interface RelicDetailRouteResolution {
  renderItem: DatabaseDetailRouteItemByKind['relic']
  replaceTarget: RelicDetailRouteLocation | null
}

export function resolveRelicDetailRoutePolicy({
  location,
  record,
  routeItem,
}: ResolveRelicDetailRoutePolicyOptions): RelicDetailRouteResolution {
  const browseState = parseRelicDatabaseBrowseState(new URLSearchParams(location.search))
  const selectedVariant = routeItem.variantId
    ? record.variants.find((variant) => variant.id === routeItem.variantId)
    : resolvePreferredRelicVariant(record, {
        category: browseState.categoryFilter === 'ALL' ? null : browseState.categoryFilter,
        tier: browseState.tierFilter === 'ALL' ? null : getRelicTierValue(browseState.tierFilter),
      })
  const canonicalVariantId = selectedVariant?.id ?? record.defaultVariantId
  const renderItem = {...routeItem, variantId: canonicalVariantId}

  if (routeItem.variantId === canonicalVariantId) {
    return {renderItem, replaceTarget: null}
  }

  const canonicalSearch = new URLSearchParams(location.search)
  canonicalSearch.set('variant', canonicalVariantId)
  return {
    renderItem,
    replaceTarget: {
      hash: location.hash,
      pathname: location.pathname,
      search: `?${canonicalSearch.toString()}`,
    },
  }
}
