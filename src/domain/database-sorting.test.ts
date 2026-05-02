import {describe, expect, it} from 'vitest'

import type {Awakener} from './awakeners'
import {compareAwakenersForDatabaseSort} from './database-sorting'

function makeAwakener(overrides: Partial<Awakener>): Awakener {
  return {
    id: 'awakener-0001',
    numericId: 1,
    name: 'Alpha',
    faction: 'Test',
    realm: 'AEQUOR',
    rarity: 'SSR',
    type: 'ASSAULT',
    aliases: ['Alpha'],
    tags: [],
    lineupToken: 'a',
    stats: {
      CON: 100,
      ATK: 100,
      DEF: 100,
    },
    ...overrides,
  }
}

describe('compareAwakenersForDatabaseSort', () => {
  it('groups by realm without losing the selected stat order inside each realm', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Chaos Low',
        realm: 'CHAOS',
        stats: {CON: 100, ATK: 10, DEF: 50},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Aequor High',
        realm: 'AEQUOR',
        stats: {CON: 100, ATK: 90, DEF: 50},
      }),
      makeAwakener({
        id: 'awakener-0003',
        name: 'Chaos High',
        realm: 'CHAOS',
        stats: {CON: 100, ATK: 80, DEF: 50},
      }),
      makeAwakener({
        id: 'awakener-0004',
        name: 'Aequor Low',
        realm: 'AEQUOR',
        stats: {CON: 100, ATK: 20, DEF: 50},
      }),
    ]

    const sorted = [...awakeners].sort((left, right) =>
      compareAwakenersForDatabaseSort(left, right, {
        key: 'ATK',
        direction: 'DESC',
        groupByRealm: true,
      }),
    )

    expect(sorted.map((awakener) => awakener.name)).toEqual([
      'Chaos High',
      'Chaos Low',
      'Aequor High',
      'Aequor Low',
    ])
  })

  it('sorts rarity buckets with alphabetical fallback inside the same rarity', () => {
    const awakeners = [
      makeAwakener({id: 'awakener-0001', name: 'Gamma SSR', rarity: 'SSR'}),
      makeAwakener({id: 'awakener-0002', name: 'Beta Genesis', rarity: 'Genesis'}),
      makeAwakener({id: 'awakener-0003', name: 'Alpha Genesis', rarity: 'Genesis'}),
      makeAwakener({id: 'awakener-0004', name: 'Omega SR', rarity: 'SR'}),
    ]

    const sorted = [...awakeners].sort((left, right) =>
      compareAwakenersForDatabaseSort(left, right, {
        key: 'RARITY',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )

    expect(sorted.map((awakener) => awakener.name)).toEqual([
      'Alpha Genesis',
      'Beta Genesis',
      'Gamma SSR',
      'Omega SR',
    ])
  })
})
