import Fuse from 'fuse.js'

import type {Covenant} from './covenants'
import {collectDirectMatches, mergeDirectAndFuzzyMatches, toPriority} from './entities/search'
import {getPublicSearchAliases, getPublicSearchSupplementalValues} from './public-search-values'
import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  normalizeForSearch,
} from './search-utils'

interface IndexedCovenantRecord {
  covenant: Covenant
  normalizedName: string
  normalizedId: string
  normalizedSupplemental: string[]
}

const indexedCovenantCache = new WeakMap<Covenant[], IndexedCovenantRecord[]>()
const covenantsFuseCache = new WeakMap<Covenant[], Fuse<IndexedCovenantRecord>>()

export function searchCovenants(covenants: Covenant[], query: string): Covenant[] {
  const normalizedQuery = normalizeForSearch(query)
  if (!normalizedQuery) {
    return covenants
  }

  const directMatches = collectDirectMatches({
    records: getIndexedCovenants(covenants),
    getPriority: (record) => getCovenantSearchPriority(record, normalizedQuery),
    getDisplayName: (record) => record.covenant.name,
    getEntity: (record) => record.covenant,
  })

  if (normalizedQuery.length < 3) {
    return directMatches
  }

  const fuzzyMatches = getCovenantsFuse(covenants)
    .search(normalizedQuery)
    .filter((result) => (result.score ?? 1) <= 0.52)
    .map((result) => result.item.covenant)

  return mergeDirectAndFuzzyMatches(directMatches, fuzzyMatches, (covenant) => covenant.id)
}

function getIndexedCovenants(covenants: Covenant[]): IndexedCovenantRecord[] {
  const cached = indexedCovenantCache.get(covenants)
  if (cached) {
    return cached
  }

  const indexed = covenants.map((covenant) => ({
    covenant,
    normalizedName: normalizeForSearch(covenant.name),
    normalizedId: normalizeForSearch(covenant.id),
    normalizedSupplemental: getNormalizedSearchValues([
      ...getPublicSearchAliases('covenants', covenant.id),
      ...getPublicSearchSupplementalValues('covenants', covenant.id),
    ]),
  }))
  indexedCovenantCache.set(covenants, indexed)
  return indexed
}

function getCovenantsFuse(covenants: Covenant[]): Fuse<IndexedCovenantRecord> {
  const cached = covenantsFuseCache.get(covenants)
  if (cached) {
    return cached
  }

  const fuse = new Fuse(getIndexedCovenants(covenants), {
    threshold: 0.6,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
    keys: [
      {name: 'normalizedName', weight: 0.85},
      {name: 'normalizedId', weight: 0.1},
      {name: 'normalizedSupplemental', weight: 0.05},
    ],
  })
  covenantsFuseCache.set(covenants, fuse)
  return fuse
}

function getCovenantSearchPriority(
  record: IndexedCovenantRecord,
  normalizedQuery: string,
): number | null {
  const nameMatch = getBestSearchFieldMatch([record.covenant.name], normalizedQuery)
  const idMatch = getBestSearchFieldMatch([record.covenant.id], normalizedQuery)
  const supplementalMatch = getBestSearchFieldMatch(
    [
      ...getPublicSearchAliases('covenants', record.covenant.id),
      ...getPublicSearchSupplementalValues('covenants', record.covenant.id),
    ],
    normalizedQuery,
  )
  const priorities = [
    toPriority(nameMatch, {exact: 0, prefix: 1, wordPrefix: 2, contains: 6}),
    toPriority(idMatch, {exact: 3, prefix: 7, wordPrefix: 7, contains: 8}),
    toPriority(supplementalMatch, {exact: 9, prefix: 10, wordPrefix: 10, contains: 11}),
  ].filter((priority): priority is number => priority !== null)

  return priorities.length > 0 ? Math.min(...priorities) : null
}
