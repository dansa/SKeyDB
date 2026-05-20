import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {DatabaseBrowseState} from '@/domain/database-browse-state'

import {filterAwakenersForDatabase, useDatabaseViewModel} from './useDatabaseViewModel'

function makeAwakener(overrides: Partial<Awakener>): Awakener {
  return {
    id: 'awakener-0001',
    numericId: 1,
    name: 'Alpha',
    faction: 'Test',
    realm: 'AEQUOR',
    rarity: 'SSR',
    type: 'ASSAULT',
    availabilityType: 'PERMANENT',
    releaseDate: '2023-11-29',
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

function makeBrowseState(overrides: Partial<DatabaseBrowseState> = {}): DatabaseBrowseState {
  return {
    query: '',
    realmFilter: 'ALL',
    rarityFilter: 'ALL',
    typeFilter: 'ALL',
    availabilityFilter: 'ALL',
    gameplayFactionFilters: [],
    scalingSubstatFilters: [],
    scalingSubstatRoleFilter: 'ANY',
    sortKey: 'ALPHABETICAL',
    sortDirection: 'ASC',
    groupByRealm: false,
    ...overrides,
  }
}

describe('filterAwakenersForDatabase', () => {
  it('filters limited as both Faded Legacy and Astral Reign availability types', () => {
    const awakeners = [
      makeAwakener({id: 'awakener-0001', name: 'Permanent', availabilityType: 'PERMANENT'}),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Faded',
        availabilityType: 'LIMITED_FADED_LEGACY',
      }),
      makeAwakener({
        id: 'awakener-0003',
        name: 'Astral',
        availabilityType: 'LIMITED_ASTRAL_REIGN',
      }),
      makeAwakener({id: 'awakener-0004', name: 'Welfare', availabilityType: 'WELFARE'}),
    ]

    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'LIMITED').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Faded', 'Astral'])
  })

  it('filters exact permanent, welfare, and limited banner availability types', () => {
    const awakeners = [
      makeAwakener({id: 'awakener-0001', name: 'Permanent', availabilityType: 'PERMANENT'}),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Faded',
        availabilityType: 'LIMITED_FADED_LEGACY',
      }),
      makeAwakener({
        id: 'awakener-0003',
        name: 'Astral',
        availabilityType: 'LIMITED_ASTRAL_REIGN',
      }),
      makeAwakener({id: 'awakener-0004', name: 'Welfare', availabilityType: 'WELFARE'}),
    ]

    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'PERMANENT').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Permanent'])
    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'WELFARE').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Welfare'])
    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'LIMITED_FADED_LEGACY').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Faded'])
    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'LIMITED_ASTRAL_REIGN').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Astral'])
  })

  it('filters gameplay faction tags and scaling substats', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Full Match',
        tags: ['Lemurian'],
        substatScaling: {KeyflareRegen: 1, DamageAmplification: 0.5},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Wrong Faction',
        tags: [],
        substatScaling: {KeyflareRegen: 1, DamageAmplification: 0.5},
      }),
      makeAwakener({
        id: 'awakener-0003',
        name: 'Missing Scaling',
        tags: ['Lemurian'],
        substatScaling: {KeyflareRegen: 1, DamageAmplification: 0},
      }),
    ]

    expect(
      filterAwakenersForDatabase(
        awakeners,
        'ALL',
        'ALL',
        'ALL',
        'ALL',
        ['Lemurian'],
        ['KeyflareRegen', 'DamageAmplification'],
      ).map((awakener) => awakener.name),
    ).toEqual(['Full Match'])
  })

  it('distinguishes main and sub scaling substat filters', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Main Scaling',
        substatScaling: {DamageAmplification: 1.6},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Sub Scaling',
        substatScaling: {DamageAmplification: 0.8},
      }),
      makeAwakener({
        id: 'awakener-0003',
        name: 'No Scaling',
        substatScaling: {DamageAmplification: 0},
      }),
    ]

    expect(
      filterAwakenersForDatabase(
        awakeners,
        'ALL',
        'ALL',
        'ALL',
        'ALL',
        [],
        ['DamageAmplification'],
        'ANY',
      ).map((awakener) => awakener.name),
    ).toEqual(['Main Scaling', 'Sub Scaling'])
    expect(
      filterAwakenersForDatabase(
        awakeners,
        'ALL',
        'ALL',
        'ALL',
        'ALL',
        [],
        ['DamageAmplification'],
        'MAIN',
      ).map((awakener) => awakener.name),
    ).toEqual(['Main Scaling'])
    expect(
      filterAwakenersForDatabase(
        awakeners,
        'ALL',
        'ALL',
        'ALL',
        'ALL',
        [],
        ['DamageAmplification'],
        'SUB',
      ).map((awakener) => awakener.name),
    ).toEqual(['Sub Scaling'])
  })
})

describe('useDatabaseViewModel', () => {
  it('keeps active search relevance ahead of the selected sort', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Alpha',
        aliases: ['Alpha'],
        tags: ['vuln'],
        stats: {CON: 100, ATK: 200, DEF: 100},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Vulcan',
        aliases: ['Vulcan'],
        tags: [],
        stats: {CON: 100, ATK: 50, DEF: 100},
      }),
    ]

    const {result} = renderHook(() =>
      useDatabaseViewModel(
        awakeners,
        makeBrowseState({query: 'vul', sortKey: 'ATK', sortDirection: 'DESC'}),
      ),
    )

    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual(['Vulcan', 'Alpha'])
  })

  it('keeps active search relevance ahead of realm grouping', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Alpha',
        aliases: ['Alpha'],
        realm: 'CHAOS',
        tags: ['vuln'],
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Vulcan',
        aliases: ['Vulcan'],
        realm: 'CARO',
        tags: [],
      }),
    ]

    const {result} = renderHook(() =>
      useDatabaseViewModel(awakeners, makeBrowseState({query: 'vul', groupByRealm: true})),
    )

    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual(['Vulcan', 'Alpha'])
  })

  it('uses the selected sort inside equal relevance buckets', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Lower ATK',
        aliases: ['Lower ATK'],
        tags: ['Draw'],
        stats: {CON: 100, ATK: 50, DEF: 100},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Higher ATK',
        aliases: ['Higher ATK'],
        tags: ['Draw'],
        stats: {CON: 100, ATK: 200, DEF: 100},
      }),
    ]

    const {result} = renderHook(() =>
      useDatabaseViewModel(
        awakeners,
        makeBrowseState({query: 'draw', sortKey: 'ATK', sortDirection: 'DESC'}),
      ),
    )

    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual([
      'Higher ATK',
      'Lower ATK',
    ])
  })

  it('uses realm grouping inside equal relevance buckets', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Able',
        aliases: ['Able'],
        realm: 'CARO',
        tags: ['Draw'],
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Zed',
        aliases: ['Zed'],
        realm: 'CHAOS',
        tags: ['Draw'],
      }),
    ]

    const {result} = renderHook(() =>
      useDatabaseViewModel(awakeners, makeBrowseState({query: 'draw', groupByRealm: true})),
    )

    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual(['Zed', 'Able'])
  })
})
