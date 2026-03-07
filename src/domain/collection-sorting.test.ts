import {describe, expect, it} from 'vitest'

import {
  compareAwakenersForCollectionSort,
  comparePossesForCollectionDefaultSort,
  compareWheelsForCollectionDefaultSort,
  DEFAULT_AWAKENER_SORT_CONFIG,
  resolveAwakenerSortKey,
  resolveGroupByRealm,
  resolveSortDirection,
  type AwakenerSortConfig,
  type SortableCollectionEntry,
} from './collection-sorting'

const baseAwakener = (overrides: Partial<SortableCollectionEntry>): SortableCollectionEntry => ({
  label: 'x',
  index: 1,
  enlighten: 0,
  level: 60,
  ...overrides,
})

describe('compareAwakenersForCollectionSort', () => {
  it('sorts by level with configured direction and tie-breakers', () => {
    const entries = [
      baseAwakener({label: 'B', level: 70, enlighten: 2, index: 2}),
      baseAwakener({label: 'A', level: 70, enlighten: 5, index: 1}),
      baseAwakener({label: 'C', level: 80, enlighten: 0, index: 3}),
    ]

    const sorted = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'LEVEL',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )

    expect(sorted.map((entry) => entry.label)).toEqual(['C', 'A', 'B'])
  })

  it('sorts by alphabetical and respects direction', () => {
    const entries = [
      baseAwakener({label: 'C'}),
      baseAwakener({label: 'A'}),
      baseAwakener({label: 'B'}),
    ]
    const asc = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'ALPHABETICAL',
        direction: 'ASC',
        groupByRealm: false,
      }),
    )
    const desc = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'ALPHABETICAL',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )

    expect(asc.map((entry) => entry.label)).toEqual(['A', 'B', 'C'])
    expect(desc.map((entry) => entry.label)).toEqual(['C', 'B', 'A'])
  })

  it('always sorts unowned awakeners after owned awakeners', () => {
    const entries = [
      baseAwakener({label: 'Owned Low', owned: true, level: 1}),
      baseAwakener({label: 'Unowned High', owned: false, level: 90, enlighten: 15}),
      baseAwakener({label: 'Owned High', owned: true, level: 80}),
    ]
    const sorted = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'LEVEL',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )
    expect(sorted.map((entry) => entry.label)).toEqual(['Owned High', 'Owned Low', 'Unowned High'])
  })

  it('sorts by rarity using Genesis > SSR > SR and respects direction', () => {
    const entries = [
      baseAwakener({label: 'SSR', rarity: 'SSR'}),
      baseAwakener({label: 'Genesis', rarity: 'Genesis'}),
      baseAwakener({label: 'SR', rarity: 'SR'}),
    ]

    const highFirst = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'RARITY',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )
    const lowFirst = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'RARITY',
        direction: 'ASC',
        groupByRealm: false,
      }),
    )

    expect(highFirst.map((entry) => entry.label)).toEqual(['Genesis', 'SSR', 'SR'])
    expect(lowFirst.map((entry) => entry.label)).toEqual(['SR', 'SSR', 'Genesis'])
  })

  it('uses rarity tie-breakers as level first, then realm, then enlighten when grouping is enabled', () => {
    const entries = [
      baseAwakener({label: 'Aequor High', rarity: 'SSR', realm: 'AEQUOR', level: 90, enlighten: 1}),
      baseAwakener({label: 'Chaos Mid', rarity: 'SSR', realm: 'CHAOS', level: 80, enlighten: 0}),
      baseAwakener({label: 'Chaos Low', rarity: 'SSR', realm: 'CHAOS', level: 60, enlighten: 12}),
    ]

    const sorted = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'RARITY',
        direction: 'DESC',
        groupByRealm: true,
      }),
    )

    expect(sorted.map((entry) => entry.label)).toEqual(['Aequor High', 'Chaos Mid', 'Chaos Low'])
  })
})

describe('compareWheelsForCollectionDefaultSort', () => {
  it('sorts by rarity then realm then enlighten', () => {
    const entries: SortableCollectionEntry[] = [
      {label: 'SR A', index: 2, enlighten: 12, rarity: 'SR', realm: 'CHAOS'},
      {label: 'SSR B', index: 1, enlighten: 1, rarity: 'SSR', realm: 'AEQUOR'},
      {label: 'SSR A', index: 3, enlighten: 5, rarity: 'SSR', realm: 'CHAOS'},
    ]
    const sorted = [...entries].sort(compareWheelsForCollectionDefaultSort)
    expect(sorted.map((entry) => entry.label)).toEqual(['SSR A', 'SSR B', 'SR A'])
  })

  it('always sorts unowned wheels after owned wheels', () => {
    const entries: SortableCollectionEntry[] = [
      {label: 'Owned SR', index: 2, owned: true, enlighten: 0, rarity: 'SR', realm: 'CHAOS'},
      {label: 'Unowned SSR', index: 1, owned: false, enlighten: 15, rarity: 'SSR', realm: 'AEQUOR'},
    ]
    const sorted = [...entries].sort(compareWheelsForCollectionDefaultSort)
    expect(sorted.map((entry) => entry.label)).toEqual(['Owned SR', 'Unowned SSR'])
  })
})

describe('comparePossesForCollectionDefaultSort', () => {
  it('sorts by owned first then index then label', () => {
    const entries: SortableCollectionEntry[] = [
      {label: 'B', index: 2, owned: true, enlighten: 0},
      {label: 'A', index: 2, owned: true, enlighten: 0},
      {label: 'Owned First', index: 1, owned: true, enlighten: 0},
      {label: 'Unowned Early', index: 0, owned: false, enlighten: 0},
    ]
    const sorted = [...entries].sort(comparePossesForCollectionDefaultSort)
    expect(sorted.map((entry) => entry.label)).toEqual(['Owned First', 'A', 'B', 'Unowned Early'])
  })
})

describe('resolveAwakenerSortKey', () => {
  it('returns valid sort keys unchanged', () => {
    expect(resolveAwakenerSortKey('LEVEL')).toBe('LEVEL')
    expect(resolveAwakenerSortKey('RARITY')).toBe('RARITY')
    expect(resolveAwakenerSortKey('ENLIGHTEN')).toBe('ENLIGHTEN')
    expect(resolveAwakenerSortKey('ALPHABETICAL')).toBe('ALPHABETICAL')
    expect(resolveAwakenerSortKey('ATK')).toBe('ATK')
    expect(resolveAwakenerSortKey('DEF')).toBe('DEF')
    expect(resolveAwakenerSortKey('CON')).toBe('CON')
  })

  it('returns default key for invalid input', () => {
    expect(resolveAwakenerSortKey('INVALID')).toBe(DEFAULT_AWAKENER_SORT_CONFIG.key)
    expect(resolveAwakenerSortKey(null)).toBe(DEFAULT_AWAKENER_SORT_CONFIG.key)
    expect(resolveAwakenerSortKey(undefined)).toBe(DEFAULT_AWAKENER_SORT_CONFIG.key)
    expect(resolveAwakenerSortKey(42)).toBe(DEFAULT_AWAKENER_SORT_CONFIG.key)
  })

  it('uses custom defaults when provided', () => {
    const custom: AwakenerSortConfig = {key: 'RARITY', direction: 'ASC', groupByRealm: true}
    expect(resolveAwakenerSortKey('UNKNOWN', custom)).toBe('RARITY')
  })
})

describe('resolveSortDirection', () => {
  it('returns valid directions unchanged', () => {
    expect(resolveSortDirection('ASC')).toBe('ASC')
    expect(resolveSortDirection('DESC')).toBe('DESC')
  })

  it('returns default direction for invalid input', () => {
    expect(resolveSortDirection('INVALID')).toBe(DEFAULT_AWAKENER_SORT_CONFIG.direction)
    expect(resolveSortDirection(null)).toBe(DEFAULT_AWAKENER_SORT_CONFIG.direction)
    expect(resolveSortDirection(undefined)).toBe(DEFAULT_AWAKENER_SORT_CONFIG.direction)
  })

  it('uses custom defaults when provided', () => {
    const custom: AwakenerSortConfig = {key: 'LEVEL', direction: 'ASC', groupByRealm: false}
    expect(resolveSortDirection('UNKNOWN', custom)).toBe('ASC')
  })
})

describe('resolveGroupByRealm', () => {
  it('returns groupByRealm when present', () => {
    expect(resolveGroupByRealm({groupByRealm: true})).toBe(true)
    expect(resolveGroupByRealm({groupByRealm: false})).toBe(false)
  })

  it('falls back to legacy groupByFaction', () => {
    expect(resolveGroupByRealm({groupByFaction: true})).toBe(true)
    expect(resolveGroupByRealm({groupByFaction: false})).toBe(false)
  })

  it('prefers groupByRealm over groupByFaction', () => {
    expect(resolveGroupByRealm({groupByRealm: false, groupByFaction: true})).toBe(false)
  })

  it('returns default when neither is present', () => {
    expect(resolveGroupByRealm({})).toBe(DEFAULT_AWAKENER_SORT_CONFIG.groupByRealm)
  })

  it('uses custom defaults when provided', () => {
    const custom: AwakenerSortConfig = {key: 'LEVEL', direction: 'DESC', groupByRealm: true}
    expect(resolveGroupByRealm({}, custom)).toBe(true)
  })
})
