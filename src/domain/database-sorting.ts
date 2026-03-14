import type {Awakener} from './awakeners'
import type {AwakenerSortKey, CollectionSortDirection} from './collection-sorting'
import {chainComparators, compareMappedRank, compareNumber, compareText} from './sorting'

export type DatabaseSortKey = Extract<
  AwakenerSortKey,
  'ALPHABETICAL' | 'RARITY' | 'ATK' | 'DEF' | 'CON'
>

export interface DatabaseSortConfig {
  key: DatabaseSortKey
  direction: CollectionSortDirection
  groupByRealm: boolean
}

const REALM_RANK: Record<string, number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
}

const RARITY_RANK: Record<string, number> = {
  GENESIS: 0,
  SSR: 1,
  SR: 2,
}

const compareRealm = (l: Awakener, r: Awakener) =>
  compareMappedRank(l, r, REALM_RANK, (a) => a.realm)

const compareRarity = (l: Awakener, r: Awakener, direction: CollectionSortDirection) => {
  const result = compareMappedRank(l, r, RARITY_RANK, (a) => a.rarity)
  return direction === 'DESC' ? result : -result
}

export function compareAwakenersForDatabaseSort(
  left: Awakener,
  right: Awakener,
  config: DatabaseSortConfig,
): number {
  const head: ((l: Awakener, r: Awakener) => number)[] = []

  if (config.groupByRealm) {
    head.push(compareRealm)
  }

  if (config.key === 'RARITY') {
    head.push((l, r) => compareRarity(l, r, config.direction))
  } else if (config.key === 'ATK' || config.key === 'DEF' || config.key === 'CON') {
    const statKey = config.key
    head.push((l, r) =>
      compareNumber(l.stats?.[statKey] ?? 0, r.stats?.[statKey] ?? 0, config.direction),
    )
  } else {
    head.push((l, r) => compareText(l.name, r.name, config.direction))
  }

  return chainComparators<Awakener>(
    ...head,
    (l, r) => compareText(l.name, r.name, 'ASC'),
    (l, r) => l.id - r.id,
  )(left, right)
}
