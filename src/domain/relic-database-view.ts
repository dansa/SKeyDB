import type {RelicDatabaseBrowseState} from '@/domain/relic-database-browse-state'
import type {Relic} from '@/domain/relics'
import {searchRelicResults} from '@/domain/relics-search'

const RARITY_RANK: Record<NonNullable<Relic['rarity']>, number> = {
  N: 1,
  SR: 2,
  SSR: 3,
}

function compareValues(left: number, right: number, direction: 'ASC' | 'DESC'): number {
  return direction === 'ASC' ? left - right : right - left
}

function compareNames(left: Relic, right: Relic, direction: 'ASC' | 'DESC'): number {
  const result = left.name.localeCompare(right.name)
  return direction === 'ASC' ? result : -result
}

export function buildRelicDatabaseView(
  relics: readonly Relic[],
  state: RelicDatabaseBrowseState,
): Relic[] {
  const searchResults = searchRelicResults([...relics], state.query)
  const relevanceIndex = new Map(searchResults.map((result, index) => [result.entity.id, index]))
  const filtered = searchResults
    .map((result) => result.entity)
    .filter(
      (relic) =>
        (state.categoryFilter === 'ALL' || relic.categories.includes(state.categoryFilter)) &&
        (state.rarityFilter === 'ALL' || relic.rarity === state.rarityFilter),
    )

  return filtered.toSorted((left, right) => {
    if (state.sortKey === 'BEST_MATCH') {
      if (state.query.trim()) {
        const relevance =
          (relevanceIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (relevanceIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER)
        return relevance !== 0 ? relevance : left.name.localeCompare(right.name)
      }
      return left.name.localeCompare(right.name)
    }
    if (state.sortKey === 'ALPHABETICAL') {
      return compareNames(left, right, state.sortDirection)
    }
    if (state.sortKey === 'RARITY') {
      const rarity = compareValues(
        left.rarity ? RARITY_RANK[left.rarity] : 0,
        right.rarity ? RARITY_RANK[right.rarity] : 0,
        state.sortDirection,
      )
      return rarity !== 0 ? rarity : left.name.localeCompare(right.name)
    }
    const variantCount = compareValues(left.variantCount, right.variantCount, state.sortDirection)
    return variantCount !== 0 ? variantCount : left.name.localeCompare(right.name)
  })
}
