import Fuse from 'fuse.js'

import {getAwakeners} from './awakeners'
import type {Posse} from './posses'
import {getRealmLabel} from './realms'
import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  normalizeForSearch,
  type SearchFieldMatchKind,
} from './search-utils'

interface IndexedPosseRecord {
  posse: Posse
  normalizedName: string
  normalizedId: string
  normalizedLinkedAwakenerName: string
  normalizedLinkedAwakenerAliases: string[]
  normalizedSupplemental: string[]
}

const realmLabelById: Record<string, string> = {
  AEQUOR: 'Aequor',
  CARO: 'Caro',
  CHAOS: 'Chaos',
  ULTRA: 'Ultra',
  NEUTRAL: 'Neutral',
  OTHER: 'Other',
}

const awakeners = getAwakeners()
const awakenerByName = new Map(awakeners.map((awakener) => [awakener.name, awakener]))
const indexedPosseCache = new WeakMap<Posse[], IndexedPosseRecord[]>()
const possesFuseCache = new WeakMap<Posse[], Fuse<IndexedPosseRecord>>()

function getRealmLabels(posse: Posse): string[] {
  if (posse.isFadedLegacy) {
    return ['Faded Legacy']
  }

  const normalizedRealm = posse.realm.trim().toUpperCase()
  return [realmLabelById[normalizedRealm] ?? getRealmLabel(posse.realm)]
}

export function searchPosses(posses: Posse[], query: string): Posse[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return posses
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  if (normalizedQuery.length === 0) {
    return posses
  }

  const queryLength = normalizedQuery.length
  const indexedPosses = getIndexedPosses(posses)
  const directMatches = indexedPosses
    .map((record) => ({
      record,
      priority: getPosseSearchPriority(record, normalizedQuery, queryLength),
    }))
    .filter(
      (match): match is {record: IndexedPosseRecord; priority: number} => match.priority !== null,
    )
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority
      }
      return left.record.posse.name.localeCompare(right.record.posse.name, undefined, {
        sensitivity: 'base',
      })
    })
    .map((match) => match.record.posse)

  if (queryLength < 3) {
    return directMatches
  }

  const fuse = getPossesFuse(posses)
  const cutoff = 0.52
  const fuzzyMatches = fuse
    .search(normalizedQuery)
    .filter((result) => (result.score ?? 1) <= cutoff)
    .map((result) => result.item.posse)

  if (directMatches.length === 0) {
    return fuzzyMatches
  }

  const directMatchIds = new Set(directMatches.map((posse) => posse.id))
  return [...directMatches, ...fuzzyMatches.filter((posse) => !directMatchIds.has(posse.id))]
}

function getIndexedPosses(posses: Posse[]): IndexedPosseRecord[] {
  const cached = indexedPosseCache.get(posses)
  if (cached) {
    return cached
  }

  const indexedPosses = posses.map((posse) => {
    const linkedAwakener = posse.awakenerName ? awakenerByName.get(posse.awakenerName) : undefined
    const supplementalValues = [posse.realm, ...getRealmLabels(posse)]

    return {
      posse,
      normalizedName: normalizeForSearch(posse.name),
      normalizedId: normalizeForSearch(posse.id),
      normalizedLinkedAwakenerName: posse.awakenerName
        ? normalizeForSearch(posse.awakenerName)
        : '',
      normalizedLinkedAwakenerAliases: getNormalizedSearchValues(linkedAwakener?.aliases ?? []),
      normalizedSupplemental: getNormalizedSearchValues(supplementalValues),
    }
  })

  indexedPosseCache.set(posses, indexedPosses)
  return indexedPosses
}

function getPossesFuse(posses: Posse[]): Fuse<IndexedPosseRecord> {
  const cached = possesFuseCache.get(posses)
  if (cached) {
    return cached
  }

  const fuse = new Fuse(getIndexedPosses(posses), {
    threshold: 0.6,
    ignoreLocation: true,
    ignoreFieldNorm: false,
    includeScore: true,
    minMatchCharLength: 2,
    keys: [
      {name: 'normalizedName', weight: 0.25},
      {name: 'normalizedLinkedAwakenerName', weight: 0.15},
      {name: 'normalizedLinkedAwakenerAliases', weight: 0.15},
      {name: 'normalizedId', weight: 0.05},
      {name: 'normalizedSupplemental', weight: 0.4},
    ],
  })

  possesFuseCache.set(posses, fuse)
  return fuse
}

function getPosseSearchPriority(
  record: IndexedPosseRecord,
  normalizedQuery: string,
  queryLength: number,
): number | null {
  const linkedAwakener = record.posse.awakenerName
    ? awakenerByName.get(record.posse.awakenerName)
    : undefined

  const nameMatch = getBestSearchFieldMatch([record.posse.name], normalizedQuery)
  const idMatch =
    queryLength >= 2 ? getBestSearchFieldMatch([record.posse.id], normalizedQuery) : null
  const linkedNameMatch = record.posse.awakenerName
    ? getBestSearchFieldMatch([record.posse.awakenerName], normalizedQuery)
    : null
  const linkedAliasMatch = getBestSearchFieldMatch(linkedAwakener?.aliases ?? [], normalizedQuery)
  const supplementalMatch =
    queryLength >= 3
      ? getBestSearchFieldMatch(
          [record.posse.realm, ...getRealmLabels(record.posse)],
          normalizedQuery,
        )
      : null

  const priorities = [
    toPriority(nameMatch, getPrimaryPriorityMap(queryLength)),
    toPriority(idMatch, {
      exact: 3,
      prefix: 7,
      wordPrefix: 7,
      contains: 8,
    }),
    toPriority(linkedNameMatch, getLinkedPriorityMap(queryLength)),
    toPriority(linkedAliasMatch, getLinkedPriorityMap(queryLength)),
    toPriority(supplementalMatch, {
      exact: 10,
      prefix: 11,
      wordPrefix: 12,
      contains: 13,
    }),
  ].filter((priority): priority is number => priority !== null)

  if (priorities.length === 0) {
    return null
  }

  return Math.min(...priorities)
}

function getPrimaryPriorityMap(queryLength: number): Record<SearchFieldMatchKind, number> {
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
    contains: 6,
  }
}

function getLinkedPriorityMap(queryLength: number): Record<SearchFieldMatchKind, number> {
  if (queryLength === 1) {
    return {
      exact: 4,
      prefix: 5,
      wordPrefix: 5,
      contains: 99,
    }
  }

  return {
    exact: 4,
    prefix: 5,
    wordPrefix: 5,
    contains: 9,
  }
}

function toPriority(
  match: {kind: SearchFieldMatchKind} | null,
  priorities: Record<SearchFieldMatchKind, number>,
): number | null {
  return match ? priorities[match.kind] : null
}
