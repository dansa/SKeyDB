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

const realmPriorityByName: Record<string, number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
  NEUTRAL: 4,
  OTHER: 5,
}

const rarityPriorityByName: Record<string, number> = {
  GENESIS: 0,
  SSR: 1,
  SR: 2,
  R: 3,
}

function compareNumber(left: number, right: number, direction: CollectionSortDirection): number {
  if (left === right) {
    return 0
  }
  return direction === 'ASC' ? left - right : right - left
}

function compareText(left: string, right: string, direction: CollectionSortDirection): number {
  const normalizedLeft = left.trim().toLowerCase()
  const normalizedRight = right.trim().toLowerCase()
  const comparison = normalizedLeft.localeCompare(normalizedRight)
  return direction === 'ASC' ? comparison : -comparison
}

function compareRarity(left: SortableCollectionEntry, right: SortableCollectionEntry): number {
  const leftRank =
    rarityPriorityByName[left.rarity?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  const rightRank =
    rarityPriorityByName[right.rarity?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  return leftRank - rightRank
}

function compareRealm(left: SortableCollectionEntry, right: SortableCollectionEntry): number {
  const leftRank =
    realmPriorityByName[left.realm?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  const rightRank =
    realmPriorityByName[right.realm?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  return leftRank - rightRank
}

function compareIndex(left: SortableCollectionEntry, right: SortableCollectionEntry): number {
  return left.index - right.index
}

function compareOwnedFirst(left: SortableCollectionEntry, right: SortableCollectionEntry): number {
  const leftOwned = left.owned !== false
  const rightOwned = right.owned !== false
  if (leftOwned === rightOwned) {
    return 0
  }
  return leftOwned ? -1 : 1
}

function compareByPriority(
  left: SortableCollectionEntry,
  right: SortableCollectionEntry,
  comparators: ((left: SortableCollectionEntry, right: SortableCollectionEntry) => number)[],
): number {
  for (const comparator of comparators) {
    const result = comparator(left, right)
    if (result !== 0) {
      return result
    }
  }
  return 0
}

export function compareAwakenersForCollectionSort(
  left: SortableCollectionEntry,
  right: SortableCollectionEntry,
  config: AwakenerSortConfig,
): number {
  const withOptionalRealm = (
    comparators: ((left: SortableCollectionEntry, right: SortableCollectionEntry) => number)[],
  ) => (config.groupByRealm ? [...comparators, compareRealm] : comparators)

  if (config.key === 'ENLIGHTEN') {
    return compareByPriority(left, right, [
      compareOwnedFirst,
      (l, r) => compareNumber(l.enlighten, r.enlighten, config.direction),
      (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, 'DESC'),
      compareRarity,
      ...withOptionalRealm([]),
      compareIndex,
      (l, r) => compareText(l.label, r.label, 'ASC'),
    ])
  }

  if (config.key === 'RARITY') {
    return compareByPriority(left, right, [
      compareOwnedFirst,
      (l, r) => (config.direction === 'DESC' ? compareRarity(l, r) : compareRarity(r, l)),
      (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, 'DESC'),
      ...withOptionalRealm([]),
      (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
      compareIndex,
      (l, r) => compareText(l.label, r.label, 'ASC'),
    ])
  }

  if (config.key === 'ALPHABETICAL') {
    return compareByPriority(left, right, [
      compareOwnedFirst,
      (l, r) => compareText(l.label, r.label, config.direction),
      (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, 'DESC'),
      compareRarity,
      ...withOptionalRealm([]),
      (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
      compareIndex,
    ])
  }

  return compareByPriority(left, right, [
    compareOwnedFirst,
    (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, config.direction),
    compareRarity,
    ...withOptionalRealm([]),
    (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
    compareIndex,
    (l, r) => compareText(l.label, r.label, 'ASC'),
  ])
}

export function compareWheelsForCollectionDefaultSort(
  left: SortableCollectionEntry,
  right: SortableCollectionEntry,
): number {
  return compareByPriority(left, right, [
    compareOwnedFirst,
    compareRarity,
    compareRealm,
    (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
    compareIndex,
    (l, r) => compareText(l.label, r.label, 'ASC'),
  ])
}

export function comparePossesForCollectionDefaultSort(
  left: SortableCollectionEntry,
  right: SortableCollectionEntry,
): number {
  return compareByPriority(left, right, [
    compareOwnedFirst,
    compareIndex,
    (l, r) => compareText(l.label, r.label, 'ASC'),
  ])
}
