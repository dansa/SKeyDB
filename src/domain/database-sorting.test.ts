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

  it('sorts rarity and source buckets with alphabetical fallback inside the same bucket', () => {
    const awakeners = [
      makeAwakener({
        availabilityType: 'WELFARE',
        id: 'awakener-0001',
        name: 'Zeta SSR Welfare',
        rarity: 'SSR',
      }),
      makeAwakener({id: 'awakener-0002', name: 'Beta Genesis', rarity: 'Genesis'}),
      makeAwakener({
        availabilityType: 'LIMITED_FADED_LEGACY',
        id: 'awakener-0003',
        name: 'Gamma SSR Limited',
        rarity: 'SSR',
      }),
      makeAwakener({
        availabilityType: 'WELFARE',
        id: 'awakener-0004',
        name: 'Omega SR Welfare',
        rarity: 'SR',
      }),
      makeAwakener({
        availabilityType: 'PERMANENT',
        id: 'awakener-0005',
        name: 'Alpha SSR Permanent',
        rarity: 'SSR',
      }),
    ]

    const sorted = [...awakeners].sort((left, right) =>
      compareAwakenersForDatabaseSort(left, right, {
        key: 'RARITY',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )

    expect(sorted.map((awakener) => awakener.name)).toEqual([
      'Beta Genesis',
      'Gamma SSR Limited',
      'Alpha SSR Permanent',
      'Zeta SSR Welfare',
      'Omega SR Welfare',
    ])
  })

  it('sorts by release date with alphabetical fallback inside the same date', () => {
    const awakeners = [
      makeAwakener({id: 'awakener-0001', name: 'Gamma', releaseDate: '2024-04-27'}),
      makeAwakener({id: 'awakener-0002', name: 'Beta', releaseDate: '2023-11-29'}),
      makeAwakener({id: 'awakener-0003', name: 'Alpha', releaseDate: '2023-11-29'}),
    ]

    const ascending = [...awakeners].sort((left, right) =>
      compareAwakenersForDatabaseSort(left, right, {
        key: 'RELEASE_DATE',
        direction: 'ASC',
        groupByRealm: false,
      }),
    )
    const descending = [...awakeners].sort((left, right) =>
      compareAwakenersForDatabaseSort(left, right, {
        key: 'RELEASE_DATE',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )

    expect(ascending.map((awakener) => awakener.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(descending.map((awakener) => awakener.name)).toEqual(['Gamma', 'Alpha', 'Beta'])
  })

  it('sorts stat columns by effective browse stats including default primary bonuses', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Base Higher',
        stats: {CON: 100, ATK: 120, DEF: 100},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Gnostic Higher',
        stats: {CON: 20, ATK: 20, DEF: 20},
        primaryScalingBase: 20,
        statScaling: {CON: 1, ATK: 1, DEF: 1},
        defaultPrimaryStatBonusLevel: 45,
      }),
    ]

    const sorted = [...awakeners].sort((left, right) =>
      compareAwakenersForDatabaseSort(left, right, {
        key: 'ATK',
        direction: 'DESC',
        groupByRealm: false,
      }),
    )

    expect(sorted.map((awakener) => awakener.name)).toEqual(['Gnostic Higher', 'Base Higher'])
  })
})
