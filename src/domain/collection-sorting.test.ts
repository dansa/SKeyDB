import { describe, expect, it } from 'vitest'
import {
  compareAwakenersForCollectionSort,
  comparePossesForCollectionDefaultSort,
  compareWheelsForCollectionDefaultSort,
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
      baseAwakener({ label: 'B', level: 70, enlighten: 2, index: 2 }),
      baseAwakener({ label: 'A', level: 70, enlighten: 5, index: 1 }),
      baseAwakener({ label: 'C', level: 80, enlighten: 0, index: 3 }),
    ]

    const sorted = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'LEVEL',
        direction: 'DESC',
        groupByFaction: false,
      }),
    )

    expect(sorted.map((entry) => entry.label)).toEqual(['C', 'A', 'B'])
  })

  it('sorts by alphabetical and respects direction', () => {
    const entries = [baseAwakener({ label: 'C' }), baseAwakener({ label: 'A' }), baseAwakener({ label: 'B' })]
    const asc = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'ALPHABETICAL',
        direction: 'ASC',
        groupByFaction: false,
      }),
    )
    const desc = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'ALPHABETICAL',
        direction: 'DESC',
        groupByFaction: false,
      }),
    )

    expect(asc.map((entry) => entry.label)).toEqual(['A', 'B', 'C'])
    expect(desc.map((entry) => entry.label)).toEqual(['C', 'B', 'A'])
  })

  it('always sorts unowned awakeners after owned awakeners', () => {
    const entries = [
      baseAwakener({ label: 'Owned Low', owned: true, level: 1 }),
      baseAwakener({ label: 'Unowned High', owned: false, level: 90, enlighten: 15 }),
      baseAwakener({ label: 'Owned High', owned: true, level: 80 }),
    ]
    const sorted = [...entries].sort((l, r) =>
      compareAwakenersForCollectionSort(l, r, {
        key: 'LEVEL',
        direction: 'DESC',
        groupByFaction: false,
      }),
    )
    expect(sorted.map((entry) => entry.label)).toEqual(['Owned High', 'Owned Low', 'Unowned High'])
  })
})

describe('compareWheelsForCollectionDefaultSort', () => {
  it('sorts by rarity then faction then enlighten', () => {
    const entries: SortableCollectionEntry[] = [
      { label: 'SR A', index: 2, enlighten: 12, rarity: 'SR', faction: 'CHAOS' },
      { label: 'SSR B', index: 1, enlighten: 1, rarity: 'SSR', faction: 'AEQUOR' },
      { label: 'SSR A', index: 3, enlighten: 5, rarity: 'SSR', faction: 'CHAOS' },
    ]
    const sorted = [...entries].sort(compareWheelsForCollectionDefaultSort)
    expect(sorted.map((entry) => entry.label)).toEqual(['SSR A', 'SSR B', 'SR A'])
  })

  it('always sorts unowned wheels after owned wheels', () => {
    const entries: SortableCollectionEntry[] = [
      { label: 'Owned SR', index: 2, owned: true, enlighten: 0, rarity: 'SR', faction: 'CHAOS' },
      { label: 'Unowned SSR', index: 1, owned: false, enlighten: 15, rarity: 'SSR', faction: 'AEQUOR' },
    ]
    const sorted = [...entries].sort(compareWheelsForCollectionDefaultSort)
    expect(sorted.map((entry) => entry.label)).toEqual(['Owned SR', 'Unowned SSR'])
  })
})

describe('comparePossesForCollectionDefaultSort', () => {
  it('sorts by owned first then index then label', () => {
    const entries: SortableCollectionEntry[] = [
      { label: 'B', index: 2, owned: true, enlighten: 0 },
      { label: 'A', index: 2, owned: true, enlighten: 0 },
      { label: 'Owned First', index: 1, owned: true, enlighten: 0 },
      { label: 'Unowned Early', index: 0, owned: false, enlighten: 0 },
    ]
    const sorted = [...entries].sort(comparePossesForCollectionDefaultSort)
    expect(sorted.map((entry) => entry.label)).toEqual(['Owned First', 'A', 'B', 'Unowned Early'])
  })
})
