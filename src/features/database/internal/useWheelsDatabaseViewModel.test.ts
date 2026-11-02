import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {getWheels, type Wheel} from '@/domain/wheels'
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
  it('includes published event and ownership-gated BP exchange wheels', () => {
    const {result} = renderHook(() =>
      useWheelsDatabaseViewModel(getWheels(), makeBrowseState({availabilityFilter: 'WELFARE'})),
    )
    expect(result.current.wheels.map((wheel) => wheel.name)).toEqual(
      expect.arrayContaining(['35mm Magic', 'The Gaze of Isarawu', 'Spring in Yakutsk']),
    )
    expect(result.current.wheels.every((wheel) => wheel.hasShopSource)).toBe(true)
    expect(result.current.wheels.some((wheel) => wheel.name === "Imago's Clinic")).toBe(false)
  })

  it('includes standing shop routes independently of original release type', () => {
    const wheels = [
      makeWheel({id: 'welfare', availabilityType: 'WELFARE', hasShopSource: true}),
      makeWheel({id: 'event-shop', availabilityType: 'EVENT', hasShopSource: true}),
      makeWheel({id: 'bp-shop', availabilityType: 'BATTLE_PASS', hasShopSource: true}),
      makeWheel({id: 'banner-shop', availabilityType: 'PERMANENT', hasShopSource: true}),
      makeWheel({
        id: 'limited-shop',
        availabilityType: 'LIMITED_ASTRAL_REIGN',
        hasShopSource: true,
      }),
      makeWheel({id: 'event-only', availabilityType: 'EVENT', hasShopSource: false}),
      makeWheel({id: 'no-proof', availabilityType: 'UNKNOWN'}),
      makeWheel({id: 'legacy-welfare', availabilityType: 'WELFARE'}),
      makeWheel({id: 'explicit-no-shop', availabilityType: 'WELFARE', hasShopSource: false}),
    ]
    const {result} = renderHook(() =>
      useWheelsDatabaseViewModel(wheels, makeBrowseState({availabilityFilter: 'WELFARE'})),
    )
    expect(result.current.wheels.map((wheel) => wheel.id).sort()).toEqual(
      ['welfare', 'event-shop', 'bp-shop', 'banner-shop', 'limited-shop', 'legacy-welfare'].sort(),
    )
  })

  it('preserves release filters when a wheel also has a shop route', () => {
    const wheels = [
      makeWheel({id: 'event', availabilityType: 'EVENT', hasShopSource: true}),
      makeWheel({id: 'bp', availabilityType: 'BATTLE_PASS', hasShopSource: true}),
      makeWheel({id: 'faded', availabilityType: 'LIMITED_FADED_LEGACY', hasShopSource: true}),
      makeWheel({id: 'permanent', availabilityType: 'PERMANENT', hasShopSource: true}),
    ]
    const {result} = renderHook(() =>
      useWheelsDatabaseViewModel(wheels, makeBrowseState({availabilityFilter: 'PERMANENT'})),
    )
    expect(result.current.wheels.map((wheel) => wheel.id)).toEqual(['permanent'])
  })

  it('combines shop routes with rarity, realm and mainstat', () => {
    const wheels = [
      makeWheel({id: 'match', availabilityType: 'EVENT', hasShopSource: true, rarity: 'SR'}),
      makeWheel({id: 'no-shop', availabilityType: 'EVENT', hasShopSource: false, rarity: 'SR'}),
      makeWheel({id: 'ssr', hasShopSource: true}),
      makeWheel({id: 'chaos', hasShopSource: true, rarity: 'SR', realm: 'CHAOS'}),
      makeWheel({id: 'crit', hasShopSource: true, rarity: 'SR', mainstatKey: 'CRIT_RATE'}),
    ]
    const {result} = renderHook(() =>
      useWheelsDatabaseViewModel(
        wheels,
        makeBrowseState({
          availabilityFilter: 'WELFARE',
          rarityFilter: 'SR',
          realmFilter: 'AEQUOR',
          mainstatFilter: 'KEYFLARE_REGEN',
        }),
      ),
    )
    expect(result.current.wheels.map((wheel) => wheel.id)).toEqual(['match'])
  })

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
