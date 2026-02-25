export type CollectionSortDirection = 'ASC' | 'DESC'
export type AwakenerSortKey = 'LEVEL' | 'ENLIGHTEN' | 'ALPHABETICAL'

export type SortableCollectionEntry = {
  label: string
  index: number
  owned?: boolean
  enlighten: number
  level?: number
  rarity?: string
  faction?: string
}

export type AwakenerSortConfig = {
  key: AwakenerSortKey
  direction: CollectionSortDirection
  groupByFaction: boolean
}

export const DEFAULT_AWAKENER_SORT_CONFIG: AwakenerSortConfig = {
  key: 'LEVEL',
  direction: 'DESC',
  groupByFaction: false,
}

const factionPriorityByName: Record<string, number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
  NEUTRAL: 4,
}

const rarityPriorityByName: Record<string, number> = {
  SSR: 0,
  SR: 1,
  R: 2,
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
  const leftRank = rarityPriorityByName[left.rarity?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  const rightRank = rarityPriorityByName[right.rarity?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  return leftRank - rightRank
}

function compareFaction(left: SortableCollectionEntry, right: SortableCollectionEntry): number {
  const leftRank = factionPriorityByName[left.faction?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
  const rightRank = factionPriorityByName[right.faction?.trim().toUpperCase() ?? ''] ?? Number.MAX_SAFE_INTEGER
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
  comparators: Array<(left: SortableCollectionEntry, right: SortableCollectionEntry) => number>,
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
  const withOptionalFaction = (
    comparators: Array<(left: SortableCollectionEntry, right: SortableCollectionEntry) => number>,
  ) => (config.groupByFaction ? [...comparators, compareFaction] : comparators)

  if (config.key === 'ENLIGHTEN') {
    return compareByPriority(left, right, [
      compareOwnedFirst,
      (l, r) => compareNumber(l.enlighten, r.enlighten, config.direction),
      (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, 'DESC'),
      compareRarity,
      ...withOptionalFaction([]),
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
      ...withOptionalFaction([]),
      (l, r) => compareNumber(l.enlighten, r.enlighten, 'DESC'),
      compareIndex,
    ])
  }

  return compareByPriority(left, right, [
    compareOwnedFirst,
    (l, r) => compareNumber(l.level ?? 0, r.level ?? 0, config.direction),
    compareRarity,
    ...withOptionalFaction([]),
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
    compareFaction,
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
