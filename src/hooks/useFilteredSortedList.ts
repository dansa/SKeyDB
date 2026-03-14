import {useMemo} from 'react'

import {normalizeForSearch} from '@/domain/search-utils'

export interface UseFilteredSortedListOptions<T> {
  items: T[]
  searchQuery: string
  matchesSearch: (item: T, normalizedQuery: string) => boolean
  filters: ((item: T) => boolean)[]
  comparator: (a: T, b: T) => number
  partitionBy?: (item: T) => boolean
}

export interface UseFilteredSortedListResult<T> {
  result: T[]
  totalCount: number
  filteredCount: number
}

export function useFilteredSortedList<T>(
  options: UseFilteredSortedListOptions<T>,
): UseFilteredSortedListResult<T> {
  const {items, searchQuery, matchesSearch, filters, comparator, partitionBy} = options

  return useMemo(() => {
    const normalizedQuery = normalizeForSearch(searchQuery)

    let filtered: T[]
    if (normalizedQuery.length === 0 && filters.length === 0) {
      filtered = items
    } else {
      filtered = items.filter((item) => {
        if (normalizedQuery.length > 0 && !matchesSearch(item, normalizedQuery)) {
          return false
        }
        for (const filter of filters) {
          if (!filter(item)) {
            return false
          }
        }
        return true
      })
    }

    const sorted = filtered.length <= 1 ? filtered : [...filtered].sort(comparator)

    const result = partitionBy ? partitionToFront(sorted, partitionBy) : sorted

    return {
      result,
      totalCount: items.length,
      filteredCount: result.length,
    }
  }, [items, searchQuery, matchesSearch, filters, comparator, partitionBy])
}

function partitionToFront<T>(items: T[], predicate: (item: T) => boolean): T[] {
  const front: T[] = []
  const back: T[] = []
  for (const item of items) {
    if (predicate(item)) {
      front.push(item)
    } else {
      back.push(item)
    }
  }
  return front.length === items.length || back.length === items.length ? items : [...front, ...back]
}
