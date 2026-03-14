import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {useFilteredSortedList} from './useFilteredSortedList'

interface TestItem {
  name: string
  realm: string
  owned: boolean
  level: number
}

const items: TestItem[] = [
  {name: 'Alpha', realm: 'CHAOS', owned: true, level: 80},
  {name: 'Bravo', realm: 'AEQUOR', owned: false, level: 60},
  {name: 'Charlie', realm: 'CHAOS', owned: true, level: 90},
  {name: 'Delta', realm: 'CARO', owned: false, level: 70},
  {name: 'Echo', realm: 'AEQUOR', owned: true, level: 50},
]

const matchesSearch = (item: TestItem, query: string) => item.name.toLowerCase().includes(query)

const byLevelDesc = (a: TestItem, b: TestItem) => b.level - a.level

describe('useFilteredSortedList', () => {
  it('returns all items sorted when no search or filters', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: '',
        matchesSearch,
        filters: [],
        comparator: byLevelDesc,
      }),
    )
    expect(result.current.result.map((i) => i.name)).toEqual([
      'Charlie',
      'Alpha',
      'Delta',
      'Bravo',
      'Echo',
    ])
    expect(result.current.totalCount).toBe(5)
    expect(result.current.filteredCount).toBe(5)
  })

  it('filters by search query', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: 'cha',
        matchesSearch,
        filters: [],
        comparator: byLevelDesc,
      }),
    )
    expect(result.current.result.map((i) => i.name)).toEqual(['Charlie'])
    expect(result.current.filteredCount).toBe(1)
  })

  it('applies filter predicates', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: '',
        matchesSearch,
        filters: [(item) => item.realm === 'CHAOS'],
        comparator: byLevelDesc,
      }),
    )
    expect(result.current.result.map((i) => i.name)).toEqual(['Charlie', 'Alpha'])
  })

  it('applies multiple filters (AND logic)', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: '',
        matchesSearch,
        filters: [(item) => item.realm === 'CHAOS', (item) => item.level >= 85],
        comparator: byLevelDesc,
      }),
    )
    expect(result.current.result.map((i) => i.name)).toEqual(['Charlie'])
  })

  it('combines search and filters', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: 'a',
        matchesSearch,
        filters: [(item) => item.owned],
        comparator: byLevelDesc,
      }),
    )
    expect(result.current.result.map((i) => i.name)).toEqual(['Charlie', 'Alpha'])
  })

  it('partitions owned to front when partitionBy is provided', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: '',
        matchesSearch,
        filters: [],
        comparator: byLevelDesc,
        partitionBy: (item) => item.owned,
      }),
    )
    const names = result.current.result.map((i) => i.name)
    expect(names).toEqual(['Charlie', 'Alpha', 'Echo', 'Delta', 'Bravo'])
  })

  it('preserves sort order within each partition', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: '',
        matchesSearch,
        filters: [],
        comparator: byLevelDesc,
        partitionBy: (item) => item.owned,
      }),
    )
    const owned = result.current.result.filter((i) => i.owned)
    const unowned = result.current.result.filter((i) => !i.owned)
    expect(owned.map((i) => i.level)).toEqual([90, 80, 50])
    expect(unowned.map((i) => i.level)).toEqual([70, 60])
  })

  it('returns empty result for no matches', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items,
        searchQuery: 'zzz',
        matchesSearch,
        filters: [],
        comparator: byLevelDesc,
      }),
    )
    expect(result.current.result).toEqual([])
    expect(result.current.filteredCount).toBe(0)
    expect(result.current.totalCount).toBe(5)
  })

  it('handles empty items array', () => {
    const {result} = renderHook(() =>
      useFilteredSortedList<TestItem>({
        items: [],
        searchQuery: '',
        matchesSearch,
        filters: [],
        comparator: byLevelDesc,
      }),
    )
    expect(result.current.result).toEqual([])
    expect(result.current.totalCount).toBe(0)
  })

  it('skips partitioning when all items match the predicate', () => {
    const ownedItems = items.filter((i) => i.owned)
    const {result} = renderHook(() =>
      useFilteredSortedList({
        items: ownedItems,
        searchQuery: '',
        matchesSearch,
        filters: [],
        comparator: byLevelDesc,
        partitionBy: (item) => item.owned,
      }),
    )
    expect(result.current.result.map((i) => i.name)).toEqual(['Charlie', 'Alpha', 'Echo'])
  })
})
