import {describe, expect, it} from 'vitest'

import type {Awakener} from './awakeners'
import {compareAwakenersForDatabaseSort} from './database-sorting'

function makeAwakener(overrides: Partial<Awakener>): Awakener {
  return {
    id: 1,
    name: 'Alpha',
    faction: 'Test',
    realm: 'AEQUOR',
    rarity: 'SSR',
    type: 'ASSAULT',
    aliases: ['Alpha'],
    tags: [],
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
      makeAwakener({id: 1, name: 'Chaos Low', realm: 'CHAOS', stats: {CON: 100, ATK: 10, DEF: 50}}),
      makeAwakener({
        id: 2,
        name: 'Aequor High',
        realm: 'AEQUOR',
        stats: {CON: 100, ATK: 90, DEF: 50},
      }),
      makeAwakener({
        id: 3,
        name: 'Chaos High',
        realm: 'CHAOS',
        stats: {CON: 100, ATK: 80, DEF: 50},
      }),
      makeAwakener({
        id: 4,
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
      makeAwakener({id: 1, name: 'Gamma SSR', rarity: 'SSR'}),
      makeAwakener({id: 2, name: 'Beta Genesis', rarity: 'Genesis'}),
      makeAwakener({id: 3, name: 'Alpha Genesis', rarity: 'Genesis'}),
      makeAwakener({id: 4, name: 'Omega SR', rarity: 'SR'}),
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
