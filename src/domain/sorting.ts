export type SortDirection = 'ASC' | 'DESC'

export function chainComparators<T>(
  ...comparators: ((left: T, right: T) => number)[]
): (left: T, right: T) => number {
  return (left, right) => {
    for (const comparator of comparators) {
      const result = comparator(left, right)
      if (result !== 0) {
        return result
      }
    }
    return 0
  }
}

export function compareNumber(left: number, right: number, direction: SortDirection): number {
  if (left === right) {
    return 0
  }
  return direction === 'ASC' ? left - right : right - left
}

export function compareText(left: string, right: string, direction: SortDirection): number {
  const normalizedLeft = left.trim().toLowerCase()
  const normalizedRight = right.trim().toLowerCase()
  const result = normalizedLeft.localeCompare(normalizedRight)
  return direction === 'ASC' ? result : -result
}

export function compareMappedRank<T>(
  left: T,
  right: T,
  rankMap: Record<string, number>,
  accessor: (item: T) => string | undefined,
): number {
  const leftKey = accessor(left)?.trim().toUpperCase() ?? ''
  const rightKey = accessor(right)?.trim().toUpperCase() ?? ''
  const leftRank = rankMap[leftKey] ?? Number.MAX_SAFE_INTEGER
  const rightRank = rankMap[rightKey] ?? Number.MAX_SAFE_INTEGER
  return leftRank - rightRank
}
