import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import type {Wheel} from '@/domain/wheels'
import type {WheelsDatabaseBrowseState} from '@/domain/wheels-database-browse-state'

import {useWheelsDatabaseViewModel} from './useWheelsDatabaseViewModel'

function makeWheel(overrides: Partial<Wheel>): Wheel {
  return {
    id: 'wheel-0001',
    assetId: 'Weapon_Full_Test',
    name: 'Alpha',
    rarity: 'SSR',
    realm: 'AEQUOR',
    awakener: 'alpha',
    ownerAwakenerName: 'Alpha',
    aliases: ['Alpha'],
    tags: [],
    mainstatKey: 'KEYFLARE_REGEN',
    lineupToken: 'a',
    ...overrides,
  }
}

function makeBrowseState(
  overrides: Partial<WheelsDatabaseBrowseState> = {},
): WheelsDatabaseBrowseState {
  return {
    query: '',
    availabilityFilter: 'ALL',
    realmFilter: 'ALL',
    rarityFilter: 'ALL',
    mainstatFilter: 'ALL',
    sortKey: 'RARITY',
    sortDirection: 'DESC',
    ...overrides,
  }
}

describe('useWheelsDatabaseViewModel', () => {
  it.each([
    ['ALL', ['faded', 'astral', 'event', 'bp']],
    ['LIMITED', ['faded', 'astral']],
    ['LIMITED_FADED_LEGACY', ['faded']],
    ['LIMITED_ASTRAL_REIGN', ['astral']],
    ['EVENT', ['event']],
    ['BATTLE_PASS', ['bp']],
  ] as const)(
    'filters source %s without inferring it from ownership',
    (availabilityFilter, expected) => {
      const wheels = [
        makeWheel({id: 'faded', name: 'Faded', availabilityType: 'LIMITED_FADED_LEGACY'}),
        makeWheel({id: 'astral', name: 'Astral', availabilityType: 'LIMITED_ASTRAL_REIGN'}),
        makeWheel({id: 'event', name: 'Event', availabilityType: 'EVENT'}),
        makeWheel({id: 'bp', name: 'BP', availabilityType: 'BATTLE_PASS'}),
      ]
      const {result} = renderHook(() =>
        useWheelsDatabaseViewModel(wheels, makeBrowseState({availabilityFilter})),
      )
      expect(result.current.wheels.map((wheel) => wheel.id).sort()).toEqual([...expected].sort())
    },
  )

  it('combines source, rarity and realm filters', () => {
    const wheels = [
      makeWheel({id: 'event-sr', availabilityType: 'EVENT', rarity: 'SR'}),
      makeWheel({id: 'event-ssr', availabilityType: 'EVENT', rarity: 'SSR'}),
      makeWheel({id: 'permanent-sr', availabilityType: 'PERMANENT', rarity: 'SR'}),
    ]
    const {result} = renderHook(() =>
      useWheelsDatabaseViewModel(
        wheels,
        makeBrowseState({availabilityFilter: 'EVENT', rarityFilter: 'SR', realmFilter: 'AEQUOR'}),
      ),
    )
    expect(result.current.wheels.map((wheel) => wheel.id)).toEqual(['event-sr'])
  })
  it('keeps active search relevance ahead of the selected sort', () => {
    const wheels = [
      makeWheel({
        id: 'wheel-0001',
        name: 'Aegis',
        aliases: ['Aegis'],
        rarity: 'SSR',
        tags: ['vuln'],
      }),
      makeWheel({
        id: 'wheel-0002',
        name: 'Vulcan Gear',
        aliases: ['Vulcan Gear'],
        rarity: 'R',
        tags: [],
      }),
    ]

    const {result} = renderHook(() =>
      useWheelsDatabaseViewModel(
        wheels,
        makeBrowseState({query: 'vul', sortKey: 'RARITY', sortDirection: 'DESC'}),
      ),
    )

    expect(result.current.wheels.map((wheel) => wheel.name)).toEqual(['Vulcan Gear', 'Aegis'])
  })

  it('uses the selected sort inside equal relevance buckets', () => {
    const wheels = [
      makeWheel({
        id: 'wheel-0001',
        name: 'Alpha',
        aliases: ['Alpha'],
        tags: ['Draw'],
      }),
      makeWheel({
        id: 'wheel-0002',
        name: 'Beta',
        aliases: ['Beta'],
        tags: ['Draw'],
      }),
    ]

    const {result} = renderHook(() =>
      useWheelsDatabaseViewModel(
        wheels,
        makeBrowseState({query: 'draw', sortKey: 'ALPHABETICAL', sortDirection: 'DESC'}),
      ),
    )

    expect(result.current.wheels.map((wheel) => wheel.name)).toEqual(['Beta', 'Alpha'])
  })
})
