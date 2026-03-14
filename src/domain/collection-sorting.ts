import {chainComparators, compareMappedRank, compareNumber, compareText} from './sorting'

export type CollectionSortDirection = 'ASC' | 'DESC'
export type AwakenerSortKey =
  | 'LEVEL'
  | 'RARITY'
  | 'ENLIGHTEN'
  | 'ALPHABETICAL'
  | 'ATK'
  | 'DEF'
  | 'CON'

export interface SortableCollectionEntry {
  label: string
  index: number
  owned?: boolean
  enlighten: number
  level?: number
  rarity?: string
  realm?: string
}

export interface AwakenerSortConfig {
  key: AwakenerSortKey
  direction: CollectionSortDirection
  groupByRealm: boolean
}

export const DEFAULT_AWAKENER_SORT_CONFIG: AwakenerSortConfig = {
  key: 'LEVEL',
  direction: 'DESC',
  groupByRealm: false,
}

const VALID_SORT_KEYS: ReadonlySet<string> = new Set<AwakenerSortKey>([
  'LEVEL',
  'RARITY',
  'ENLIGHTEN',
  'ALPHABETICAL',
  'ATK',
  'DEF',
  'CON',
])

export function resolveAwakenerSortKey(
  key: unknown,
  defaults: AwakenerSortConfig = DEFAULT_AWAKENER_SORT_CONFIG,
): AwakenerSortKey {
  return typeof key === 'string' && VALID_SORT_KEYS.has(key)
    ? (key as AwakenerSortKey)
    : defaults.key
}

export function resolveSortDirection(
  direction: unknown,
  defaults: AwakenerSortConfig = DEFAULT_AWAKENER_SORT_CONFIG,
): CollectionSortDirection {
  return direction === 'ASC' || direction === 'DESC' ? direction : defaults.direction
}

export function resolveGroupByRealm(
  parsed: Partial<AwakenerSortConfig> & {groupByFaction?: boolean},
  defaults: AwakenerSortConfig = DEFAULT_AWAKENER_SORT_CONFIG,
): boolean {
  if (typeof parsed.groupByRealm === 'boolean') {
    return parsed.groupByRealm
  }

  if (typeof parsed.groupByFaction === 'boolean') {
    return parsed.groupByFaction
  }

  return defaults.groupByRealm
}

const REALM_RANK: Record<string, number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
  NEUTRAL: 4,
  OTHER: 5,
}

const RARITY_RANK: Record<string, number> = {
  GENESIS: 0,
  SSR: 1,
  SR: 2,
  R: 3,
}

const compareRarity = (l: SortableCollectionEntry, r: SortableCollectionEntry) =>
  compareMappedRank(l, r, RARITY_RANK, (e) => e.rarity)

const compareRealm = (l: SortableCollectionEntry, r: SortableCollectionEntry) =>
  compareMappedRank(l, r, REALM_RANK, (e) => e.realm)

const compareIndex = (l: SortableCollectionEntry, r: SortableCollectionEntry) => l.index - r.index

function compareOwnedFirst(left: SortableCollectionEntry, right: SortableCollectionEntry): number {
  const leftOwned = left.owned !== false
  const rightOwned = right.owned !== false
  if (leftOwned === rightOwned) {
    return 0
  }
  return leftOwned ? -1 : 1
}

export function compareAwakenersForCollectionSort(
  left: SortableCollectionEntry,
  right: SortableCollectionEntry,
  config: AwakenerSortConfig,
): number {
  const realmTail = config.groupByRealm ? [compareRealm] : []

  if (config.key === 'ENLIGHTEN') {
    return chainComparators<SortableCollectionEntry>(
      compareOwnedFirst,
      (l, r) => compareNumber(l.enlighten, r.enlighten, config.direction),
      (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, 'DESC'),
      compareRarity,
      ...realmTail,
      compareIndex,
      (l, r) => compareText(l.label, r.label, 'ASC'),
    )(left, right)
  }

  if (config.key === 'RARITY') {
    return chainComparators<SortableCollectionEntry>(
      compareOwnedFirst,
      (l, r) => (config.direction === 'DESC' ? compareRarity(l, r) : compareRarity(r, l)),
      (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, 'DESC'),
      ...realmTail,
      (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
      compareIndex,
      (l, r) => compareText(l.label, r.label, 'ASC'),
    )(left, right)
  }

  if (config.key === 'ALPHABETICAL') {
    return chainComparators<SortableCollectionEntry>(
      compareOwnedFirst,
      (l, r) => compareText(l.label, r.label, config.direction),
      (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, 'DESC'),
      compareRarity,
      ...realmTail,
      (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
      compareIndex,
    )(left, right)
  }

  return chainComparators<SortableCollectionEntry>(
    compareOwnedFirst,
    (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, config.direction),
    compareRarity,
    ...realmTail,
    (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
    compareIndex,
    (l, r) => compareText(l.label, r.label, 'ASC'),
  )(left, right)
}

export const compareWheelsForCollectionDefaultSort = chainComparators<SortableCollectionEntry>(
  compareOwnedFirst,
  compareRarity,
  compareRealm,
  (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
  compareIndex,
  (l, r) => compareText(l.label, r.label, 'ASC'),
)

export const comparePossesForCollectionDefaultSort = chainComparators<SortableCollectionEntry>(
  compareOwnedFirst,
  compareIndex,
  (l, r) => compareText(l.label, r.label, 'ASC'),
)
