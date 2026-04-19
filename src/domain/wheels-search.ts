import Fuse from 'fuse.js'

import {getMainstatByKey} from './mainstats'
import {getRealmLabel} from './realms'
import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  normalizeForSearch,
  type SearchFieldMatchKind,
} from './search-utils'
import type {Wheel} from './wheels'

interface IndexedWheelRecord {
  wheel: Wheel
  normalizedName: string
  normalizedAliases: string[]
  normalizedSupplemental: string[]
}

const indexedWheelCache = new WeakMap<Wheel[], IndexedWheelRecord[]>()
const wheelsFuseCache = new WeakMap<Wheel[], Fuse<IndexedWheelRecord>>()

export function searchWheels(wheels: Wheel[], query: string): Wheel[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return wheels
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  if (normalizedQuery.length === 0) {
    return wheels
  }

  const queryLength = normalizedQuery.length
  const indexedWheels = getIndexedWheels(wheels)
  const directMatches = indexedWheels
    .map((record) => ({
      record,
      priority: getWheelSearchPriority(record, normalizedQuery, queryLength),
    }))
    .filter(
      (match): match is {record: IndexedWheelRecord; priority: number} => match.priority !== null,
    )
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority
      }
      return left.record.wheel.name.localeCompare(right.record.wheel.name, undefined, {
        sensitivity: 'base',
      })
    })
    .map((match) => match.record.wheel)

  if (queryLength < 3) {
    return directMatches
  }

  const fuse = getWheelsFuse(wheels)
  const fuzzyMatches = fuse
    .search(normalizedQuery)
    .filter((result) =>
      isRelevantWheelFuzzyMatch(result.item, normalizedQuery, trimmedQuery, result.score ?? 1),
    )
    .filter((result) => (result.score ?? 1) <= 0.45)
    .map((result) => result.item.wheel)

  if (directMatches.length === 0) {
    return fuzzyMatches
  }

  const directMatchIds = new Set(directMatches.map((wheel) => wheel.id))
  return [...directMatches, ...fuzzyMatches.filter((wheel) => !directMatchIds.has(wheel.id))]
}

function getIndexedWheels(wheels: Wheel[]): IndexedWheelRecord[] {
  const cached = indexedWheelCache.get(wheels)
  if (cached) {
    return cached
  }

  const indexedWheels = wheels.map((wheel) => {
    const aliasValues = wheel.aliases.filter((alias) => alias !== wheel.name)
    const supplementalValues = [
      wheel.realm,
      getRealmLabel(wheel.realm),
      getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey,
      ...(wheel.awakener ? [wheel.awakener] : []),
      ...(wheel.ownerAwakenerName ? [wheel.ownerAwakenerName] : []),
      ...wheel.tags,
    ]

    return {
      wheel,
      normalizedName: normalizeForSearch(wheel.name),
      normalizedAliases: getNormalizedSearchValues(aliasValues),
      normalizedSupplemental: getNormalizedSearchValues(supplementalValues),
    }
  })

  indexedWheelCache.set(wheels, indexedWheels)
  return indexedWheels
}

function getWheelsFuse(wheels: Wheel[]): Fuse<IndexedWheelRecord> {
  const cached = wheelsFuseCache.get(wheels)
  if (cached) {
    return cached
  }

  const fuse = new Fuse(getIndexedWheels(wheels), {
    threshold: 0.55,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
    keys: [
      {name: 'normalizedName', weight: 0.45},
      {name: 'normalizedAliases', weight: 0.25},
      {name: 'normalizedSupplemental', weight: 0.3},
    ],
  })

  wheelsFuseCache.set(wheels, fuse)
  return fuse
}

function getWheelSearchPriority(
  record: IndexedWheelRecord,
  normalizedQuery: string,
  queryLength: number,
): number | null {
  const nameMatch = getBestSearchFieldMatch([record.wheel.name], normalizedQuery)
  const aliasMatch = getBestSearchFieldMatch(record.wheel.aliases, normalizedQuery)
  const supplementalMatch =
    queryLength >= 2
      ? getBestSearchFieldMatch(
          [
            record.wheel.realm,
            getRealmLabel(record.wheel.realm),
            getMainstatByKey(record.wheel.mainstatKey)?.label ?? record.wheel.mainstatKey,
            ...(record.wheel.awakener ? [record.wheel.awakener] : []),
            ...(record.wheel.ownerAwakenerName ? [record.wheel.ownerAwakenerName] : []),
            ...record.wheel.tags,
          ],
          normalizedQuery,
        )
      : null

  const priorities = [
    toPriority(nameMatch, getNamePriorityMap(queryLength)),
    toPriority(aliasMatch, getAliasPriorityMap(queryLength)),
    toPriority(supplementalMatch, {
      exact: 8,
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

function toPriority(
  match: {kind: SearchFieldMatchKind} | null,
  priorities: Record<SearchFieldMatchKind, number>,
): number | null {
  if (!match) {
    return null
  }

  const priority = priorities[match.kind]
  return priority >= 99 ? null : priority
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
    contains: 6,
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
    contains: 7,
  }
}

function isRelevantWheelFuzzyMatch(
  record: IndexedWheelRecord,
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
  score: number,
): boolean {
  if (field.length === 0 || normalizedQuery.length === 0) {
    return false
  }

  const queryInitial = normalizedQuery.slice(0, 1)
  if (field.startsWith(queryInitial)) {
    return true
  }

  return score <= 0.25
}
