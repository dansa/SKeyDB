import {describe, expect, it} from 'vitest'

import {chainComparators, compareMappedRank, compareNumber, compareText} from './sorting'

describe('compareNumber', () => {
  it('returns 0 for equal values', () => {
    expect(compareNumber(5, 5, 'ASC')).toBe(0)
    expect(compareNumber(5, 5, 'DESC')).toBe(0)
  })

  it('sorts ascending: smaller first', () => {
    expect(compareNumber(1, 10, 'ASC')).toBeLessThan(0)
    expect(compareNumber(10, 1, 'ASC')).toBeGreaterThan(0)
  })

  it('sorts descending: larger first', () => {
    expect(compareNumber(10, 1, 'DESC')).toBeLessThan(0)
    expect(compareNumber(1, 10, 'DESC')).toBeGreaterThan(0)
  })
})

describe('compareText', () => {
  it('sorts ascending: A before B', () => {
    expect(compareText('Apple', 'Banana', 'ASC')).toBeLessThan(0)
    expect(compareText('Banana', 'Apple', 'ASC')).toBeGreaterThan(0)
  })

  it('sorts descending: B before A', () => {
    expect(compareText('Apple', 'Banana', 'DESC')).toBeGreaterThan(0)
    expect(compareText('Banana', 'Apple', 'DESC')).toBeLessThan(0)
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(compareText('  apple ', 'APPLE', 'ASC')).toBe(0)
  })

  it('returns 0 for equal strings', () => {
    expect(compareText('same', 'same', 'ASC')).toBe(0)
  })
})

describe('compareMappedRank', () => {
  const rarityMap: Record<string, number> = {GENESIS: 0, SSR: 1, SR: 2, R: 3}

  it('sorts by mapped rank', () => {
    expect(compareMappedRank('SSR', 'SR', rarityMap, (v) => v)).toBeLessThan(0)
    expect(compareMappedRank('SR', 'SSR', rarityMap, (v) => v)).toBeGreaterThan(0)
  })

  it('returns 0 for equal ranks', () => {
    expect(compareMappedRank('SSR', 'SSR', rarityMap, (v) => v)).toBe(0)
  })

  it('sends unknown values to the end', () => {
    expect(compareMappedRank('SSR', 'UNKNOWN', rarityMap, (v) => v)).toBeLessThan(0)
    expect(compareMappedRank('UNKNOWN', 'SSR', rarityMap, (v) => v)).toBeGreaterThan(0)
  })

  it('normalizes case and trims whitespace', () => {
    expect(compareMappedRank('  ssr ', 'SSR', rarityMap, (v) => v)).toBe(0)
  })

  it('works with object accessor', () => {
    interface Item {
      rarity: string
    }
    const a: Item = {rarity: 'SSR'}
    const b: Item = {rarity: 'SR'}
    expect(compareMappedRank(a, b, rarityMap, (item) => item.rarity)).toBeLessThan(0)
  })
})

describe('chainComparators', () => {
  interface Entry {
    name: string
    level: number
  }

  it('applies comparators in order, stopping at first non-zero', () => {
    const byLevel = (a: Entry, b: Entry) => b.level - a.level
    const byName = (a: Entry, b: Entry) => a.name.localeCompare(b.name)
    const combined = chainComparators(byLevel, byName)

    const items: Entry[] = [
      {name: 'B', level: 50},
      {name: 'A', level: 80},
      {name: 'C', level: 80},
    ]
    const sorted = [...items].sort(combined)
    expect(sorted.map((i) => i.name)).toEqual(['A', 'C', 'B'])
  })

  it('returns 0 when all comparators return 0', () => {
    const alwaysZero = () => 0
    const combined = chainComparators(alwaysZero, alwaysZero)
    expect(combined({name: 'x', level: 1}, {name: 'y', level: 2})).toBe(0)
  })

  it('works with a single comparator', () => {
    const byLevel = (a: Entry, b: Entry) => a.level - b.level
    const combined = chainComparators(byLevel)
    expect(combined({name: 'x', level: 1}, {name: 'y', level: 2})).toBeLessThan(0)
  })

  it('works with no comparators', () => {
    const combined = chainComparators<Entry>()
    expect(combined({name: 'x', level: 1}, {name: 'y', level: 2})).toBe(0)
  })
})
