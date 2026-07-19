import type {RelicDatabaseBrowseState} from '@/domain/relic-database-browse-state'
import {getRelicTierValue} from '@/domain/relic-database-browse-state'
import {
  isRelicInDisplayScopes,
  RELIC_DATABASE_DISPLAY_SCOPE_IDS,
  type RelicDatabaseDisplayScopeId,
} from '@/domain/relic-database-display-scopes'
import type {Relic} from '@/domain/relics'
import {searchRelicResults} from '@/domain/relics-search'

const RELIC_NAME_COLLATOR = new Intl.Collator('en', {numeric: true, sensitivity: 'base'})

function compareValues(left: number, right: number, direction: 'ASC' | 'DESC'): number {
  return direction === 'ASC' ? left - right : right - left
}

function compareNames(left: Relic, right: Relic, direction: 'ASC' | 'DESC'): number {
  const normalizedLeft = left.name.replace(/^[\s\p{P}]+/u, '')
  const normalizedRight = right.name.replace(/^[\s\p{P}]+/u, '')
  const result =
    RELIC_NAME_COLLATOR.compare(normalizedLeft, normalizedRight) ||
    RELIC_NAME_COLLATOR.compare(left.name, right.name) ||
    left.id.localeCompare(right.id)
  return direction === 'ASC' ? result : -result
}

function matchesRelicBrowseFilters(
  relic: Relic,
  activeCategory: Relic['categories'][number] | null,
  activeTier: Relic['variantTiers'][number] | null,
): boolean {
  if (activeCategory && activeTier) {
    return relic.variantCategoryTiers.some(
      (facet) => facet.category === activeCategory && facet.tier === activeTier,
    )
  }
  if (activeCategory) return relic.categories.includes(activeCategory)
  if (activeTier) return relic.variantTiers.includes(activeTier)
  return true
}

export interface RelicDatabaseViewResult {
  hiddenByDisplay: Relic[]
  hiddenByDisplayCount: number
  relics: Relic[]
}

export function buildRelicDatabaseViewResult(
  relics: readonly Relic[],
  state: RelicDatabaseBrowseState,
  {
    displayScopes = RELIC_DATABASE_DISPLAY_SCOPE_IDS,
  }: {
    displayScopes?: readonly RelicDatabaseDisplayScopeId[]
  } = {},
): RelicDatabaseViewResult {
  const searchResults = searchRelicResults([...relics], state.query)
  const relevanceIndex = new Map(searchResults.map((result, index) => [result.entity.id, index]))
  const activeCategory = state.categoryFilter === 'ALL' ? null : state.categoryFilter
  const activeTier = state.tierFilter === 'ALL' ? null : getRelicTierValue(state.tierFilter)
  const filtered = searchResults.flatMap((result) => {
    const relic = result.entity
    return matchesRelicBrowseFilters(relic, activeCategory, activeTier) ? [relic] : []
  })

  const sorted = filtered.toSorted((left, right) => {
    if (state.sortKey === 'BEST_MATCH') {
      if (state.query.trim()) {
        const relevance =
          (relevanceIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (relevanceIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER)
        return relevance !== 0 ? relevance : compareNames(left, right, 'ASC')
      }
      return compareNames(left, right, 'ASC')
    }
    if (state.sortKey === 'ALPHABETICAL') {
      return compareNames(left, right, state.sortDirection)
    }
    const variantCount = compareValues(left.variantCount, right.variantCount, state.sortDirection)
    return variantCount !== 0 ? variantCount : compareNames(left, right, 'ASC')
  })

  const visible: Relic[] = []
  const hiddenByDisplay: Relic[] = []
  for (const relic of sorted) {
    if (isRelicInDisplayScopes(relic, displayScopes)) visible.push(relic)
    else hiddenByDisplay.push(relic)
  }

  return {
    hiddenByDisplay,
    hiddenByDisplayCount: hiddenByDisplay.length,
    relics: visible,
  }
}
