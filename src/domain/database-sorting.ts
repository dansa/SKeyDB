import type {Awakener} from './awakeners'
import type {AwakenerSortKey, CollectionSortDirection} from './collection-sorting'

export type DatabaseSortKey = Extract<
  AwakenerSortKey,
  'ALPHABETICAL' | 'RARITY' | 'ATK' | 'DEF' | 'CON'
>

export interface DatabaseSortConfig {
  key: DatabaseSortKey
  direction: CollectionSortDirection
  groupByRealm: boolean
}

const REALM_PRIORITY_BY_ID: Record<string, number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
}

const RARITY_PRIORITY_BY_ID: Record<string, number> = {
  GENESIS: 0,
  SSR: 1,
  SR: 2,
}

function compareNumber(left: number, right: number, direction: CollectionSortDirection): number {
  if (left === right) {
    return 0
  }
  return direction === 'ASC' ? left - right : right - left
}

function compareText(left: string, right: string, direction: CollectionSortDirection): number {
  const result = left.localeCompare(right)
  return direction === 'ASC' ? result : -result
}

function compareRealm(left: Awakener, right: Awakener): number {
  const leftRank = REALM_PRIORITY_BY_ID[left.realm] ?? Number.MAX_SAFE_INTEGER
  const rightRank = REALM_PRIORITY_BY_ID[right.realm] ?? Number.MAX_SAFE_INTEGER
  return leftRank - rightRank
}

function compareRarity(
  left: Awakener,
  right: Awakener,
  direction: CollectionSortDirection,
): number {
  const leftRank =
    RARITY_PRIORITY_BY_ID[left.rarity?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  const rightRank =
    RARITY_PRIORITY_BY_ID[right.rarity?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  return direction === 'DESC' ? leftRank - rightRank : rightRank - leftRank
}

function compareStat(
  left: Awakener,
  right: Awakener,
  statKey: 'ATK' | 'DEF' | 'CON',
  direction: CollectionSortDirection,
): number {
  return compareNumber(left.stats?.[statKey] ?? 0, right.stats?.[statKey] ?? 0, direction)
}

function compareByPriority(
  left: Awakener,
  right: Awakener,
  comparators: ((left: Awakener, right: Awakener) => number)[],
): number {
  for (const comparator of comparators) {
    const result = comparator(left, right)
    if (result !== 0) {
      return result
    }
  }
  return 0
}

export function compareAwakenersForDatabaseSort(
  left: Awakener,
  right: Awakener,
  config: DatabaseSortConfig,
): number {
  const comparators: ((left: Awakener, right: Awakener) => number)[] = []

  if (config.groupByRealm) {
    comparators.push(compareRealm)
  }

  if (config.key === 'RARITY') {
    comparators.push((innerLeft, innerRight) =>
      compareRarity(innerLeft, innerRight, config.direction),
    )
  } else if (config.key === 'ATK' || config.key === 'DEF' || config.key === 'CON') {
    const statKey = config.key
    comparators.push((innerLeft, innerRight) =>
      compareStat(innerLeft, innerRight, statKey, config.direction),
    )
  } else {
    comparators.push((innerLeft, innerRight) =>
      compareText(innerLeft.name, innerRight.name, config.direction),
    )
  }

  comparators.push((innerLeft, innerRight) => compareText(innerLeft.name, innerRight.name, 'ASC'))
  comparators.push((innerLeft, innerRight) => innerLeft.id - innerRight.id)

  return compareByPriority(left, right, comparators)
}
