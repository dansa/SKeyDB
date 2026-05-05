import type {SearchFieldMatchKind} from '../search-utils'

interface ToPriorityOptions {
  ignorePriorityAtOrAbove?: number
}

export function toPriority(
  match: {kind: SearchFieldMatchKind} | null,
  priorities: Record<SearchFieldMatchKind, number>,
  options: ToPriorityOptions = {},
): number | null {
  if (!match) {
    return null
  }

  const priority = priorities[match.kind]
  if (
    options.ignorePriorityAtOrAbove !== undefined &&
    priority >= options.ignorePriorityAtOrAbove
  ) {
    return null
  }

  return priority
}

export function collectDirectMatches<TRecord, TEntity>({
  records,
  getPriority,
  getDisplayName,
  getEntity,
}: {
  records: readonly TRecord[]
  getPriority: (record: TRecord) => number | null
  getDisplayName: (record: TRecord) => string
  getEntity: (record: TRecord) => TEntity
}): TEntity[] {
  return records
    .map((record) => ({
      record,
      priority: getPriority(record),
    }))
    .filter((match): match is {record: TRecord; priority: number} => match.priority !== null)
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority
      }

      return getDisplayName(left.record).localeCompare(getDisplayName(right.record), undefined, {
        sensitivity: 'base',
      })
    })
    .map((match) => getEntity(match.record))
}

export function mergeDirectAndFuzzyMatches<TEntity>(
  directMatches: readonly TEntity[],
  fuzzyMatches: readonly TEntity[],
  getId: (entity: TEntity) => string,
): TEntity[] {
  if (directMatches.length === 0) {
    return [...fuzzyMatches]
  }

  const directMatchIds = new Set(directMatches.map(getId))
  return [...directMatches, ...fuzzyMatches.filter((entity) => !directMatchIds.has(getId(entity)))]
}
