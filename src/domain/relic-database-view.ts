import type {RelicDatabaseBrowseState} from '@/domain/relic-database-browse-state'
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

export function buildRelicDatabaseView(
  relics: readonly Relic[],
  state: RelicDatabaseBrowseState,
): Relic[] {
  const searchResults = searchRelicResults([...relics], state.query)
  const relevanceIndex = new Map(searchResults.map((result, index) => [result.entity.id, index]))
  const filtered = searchResults
    .map((result) => result.entity)
    .filter(
      (relic) => state.categoryFilter === 'ALL' || relic.categories.includes(state.categoryFilter),
    )

  return filtered.toSorted((left, right) => {
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
}
