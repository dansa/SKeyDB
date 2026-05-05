import Fuse from 'fuse.js'

import type {Awakener} from './awakeners'
import {collectDirectMatches, mergeDirectAndFuzzyMatches, toPriority} from './entities/search'
import {getPublicSearchAliases, getPublicSearchSupplementalValues} from './public-search-values'
import {getRealmLabel} from './realms'
import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  normalizeForSearch,
  type SearchFieldMatchKind,
} from './search-utils'

interface IndexedAwakenerRecord {
  awakener: Awakener
  normalizedName: string
  normalizedAliases: string[]
  normalizedSupplemental: string[]
}

const indexedAwakenerCache = new WeakMap<Awakener[], IndexedAwakenerRecord[]>()
const awakenersFuseCache = new WeakMap<Awakener[], Fuse<IndexedAwakenerRecord>>()

export function searchAwakeners(awakeners: Awakener[], query: string): Awakener[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return awakeners
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  if (normalizedQuery.length === 0) {
    return awakeners
  }

  const queryLength = normalizedQuery.length
  const indexedAwakeners = getIndexedAwakeners(awakeners)
  const directMatches = collectDirectMatches({
    records: indexedAwakeners,
    getPriority: (record) => getAwakenerSearchPriority(record, normalizedQuery, queryLength),
    getDisplayName: (record) => record.awakener.name,
    getEntity: (record) => record.awakener,
  })

  if (queryLength < 3) {
    return directMatches
  }

  const fuse = getAwakenersFuse(awakeners)
  const cutoff = 0.52
  const fuzzyMatches = fuse
    .search(normalizedQuery)
    .filter((result) =>
      isRelevantAwakenerFuzzyMatch(result.item, normalizedQuery, trimmedQuery, result.score ?? 1),
    )
    .filter((result) => (result.score ?? 1) <= cutoff)
    .map((result) => result.item.awakener)

  if (directMatches.length === 0) {
    return fuzzyMatches
  }

  return mergeDirectAndFuzzyMatches(directMatches, fuzzyMatches, (awakener) => awakener.id)
}

function getIndexedAwakeners(awakeners: Awakener[]): IndexedAwakenerRecord[] {
  const cached = indexedAwakenerCache.get(awakeners)
  if (cached) {
    return cached
  }

  const indexedAwakeners = awakeners.map((awakener) => {
    const aliasValues = [
      ...getAwakenerAliases(awakener),
      ...getPublicSearchAliases('awakeners', awakener.id),
    ].filter((alias) => alias !== awakener.name)
    const supplementalValues = [
      ...getPublicSearchSupplementalValues('awakeners', awakener.id),
      ...getAwakenerTags(awakener),
      awakener.realm,
      getRealmLabel(awakener.realm),
      ...(awakener.type ? [awakener.type] : []),
    ]

    return {
      awakener,
      normalizedName: normalizeForSearch(awakener.name),
      normalizedAliases: getNormalizedSearchValues(aliasValues),
      normalizedSupplemental: getNormalizedSearchValues(supplementalValues),
    }
  })

  indexedAwakenerCache.set(awakeners, indexedAwakeners)
  return indexedAwakeners
}

function getAwakenersFuse(awakeners: Awakener[]): Fuse<IndexedAwakenerRecord> {
  const cached = awakenersFuseCache.get(awakeners)
  if (cached) {
    return cached
  }

  const fuse = new Fuse(getIndexedAwakeners(awakeners), {
    threshold: 0.6,
    ignoreLocation: true,
    ignoreFieldNorm: false,
    includeScore: true,
    minMatchCharLength: 2,
    keys: [
      {name: 'normalizedName', weight: 0.5},
      {name: 'normalizedAliases', weight: 0.35},
      {name: 'normalizedSupplemental', weight: 0.15},
    ],
  })

  awakenersFuseCache.set(awakeners, fuse)
  return fuse
}

function getAwakenerSearchPriority(
  record: IndexedAwakenerRecord,
  normalizedQuery: string,
  queryLength: number,
): number | null {
  const nameMatch = getBestSearchFieldMatch([record.awakener.name], normalizedQuery)
  const aliasMatch = getBestSearchFieldMatch(
    [
      ...getAwakenerAliases(record.awakener),
      ...getPublicSearchAliases('awakeners', record.awakener.id),
    ].filter((alias) => alias !== record.awakener.name),
    normalizedQuery,
  )
  const supplementalMatch =
    queryLength >= 3
      ? getBestSearchFieldMatch(
          [
            ...getPublicSearchSupplementalValues('awakeners', record.awakener.id),
            ...getAwakenerTags(record.awakener),
            record.awakener.realm,
            getRealmLabel(record.awakener.realm),
            ...(record.awakener.type ? [record.awakener.type] : []),
          ],
          normalizedQuery,
        )
      : null

  const priorities = [
    toPriority(nameMatch, getNamePriorityMap(queryLength)),
    toPriority(aliasMatch, getAliasPriorityMap(queryLength)),
    toPriority(supplementalMatch, {
      exact: 6,
      prefix: 9,
      wordPrefix: 10,
      contains: 11,
    }),
  ].filter((priority): priority is number => priority !== null)

  if (priorities.length === 0) {
    return null
  }

  return Math.min(...priorities)
}

function getNamePriorityMap(queryLength: number): Record<SearchFieldMatchKind, number> {
  if (queryLength === 1) {
    return {
      exact: 0,
      prefix: 1,
      wordPrefix: 2,
      contains: 99,
    }
  }

  return {
    exact: 0,
    prefix: 1,
    wordPrefix: 2,
    contains: 7,
  }
}

function getAliasPriorityMap(queryLength: number): Record<SearchFieldMatchKind, number> {
  if (queryLength === 1) {
    return {
      exact: 3,
      prefix: 4,
      wordPrefix: 5,
      contains: 99,
    }
  }

  return {
    exact: 3,
    prefix: 4,
    wordPrefix: 5,
    contains: 8,
  }
}

function isRelevantAwakenerFuzzyMatch(
  record: IndexedAwakenerRecord,
  normalizedQuery: string,
  rawQuery: string,
  score: number,
): boolean {
  if (/\s/.test(rawQuery)) {
    return true
  }

  const primaryFields = [record.normalizedName, ...record.normalizedAliases]
  return primaryFields.some((field) =>
    isSingleTokenFuzzyFieldCandidate(field, normalizedQuery, score),
  )
}

function isSingleTokenFuzzyFieldCandidate(
  field: string,
  normalizedQuery: string,
  _score: number,
): boolean {
  if (field.length === 0 || normalizedQuery.length === 0) {
    return false
  }

  const queryPrefixLength = normalizedQuery.length >= 4 ? 2 : 1
  const queryInitial = normalizedQuery.slice(0, queryPrefixLength)
  return field.startsWith(queryInitial)
}

function getAwakenerAliases(awakener: Awakener): string[] {
  return Array.isArray(awakener.aliases) ? awakener.aliases : []
}

function getAwakenerTags(awakener: Awakener): string[] {
  return Array.isArray(awakener.tags) ? awakener.tags : []
}
