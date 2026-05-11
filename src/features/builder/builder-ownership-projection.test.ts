import {describe, expect, it} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {CollectionOwnershipState} from '@/domain/collection-ownership'
import type {Posse} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'

import {createBuilderOwnershipProjection} from './builder-ownership-projection'

const awakeners = [
  {
    id: 'awakener-0001',
    numericId: 1,
    name: 'ramona',
    faction: 'alpha',
    realm: 'CHAOS',
    aliases: [],
    tags: [],
    lineupToken: 'ramona',
  },
  {
    id: 'awakener-0002',
    numericId: 2,
    name: 'ramona: timeworn',
    faction: 'alpha',
    realm: 'CHAOS',
    aliases: [],
    tags: [],
    lineupToken: 'ramona-timeworn',
  },
  {
    id: 'awakener-0003',
    numericId: 3,
    name: 'mika',
    faction: 'beta',
    realm: 'AEQUOR',
    aliases: [],
    tags: [],
    lineupToken: 'mika',
  },
] satisfies Awakener[]

const wheels = [
  {
    id: 'wheel-0001',
    assetId: 'wheel-0001',
    name: 'Owned Wheel',
    rarity: 'SSR',
    realm: 'CHAOS',
    awakener: 'ramona',
    aliases: [],
    tags: [],
    mainstatKey: 'CRIT_RATE',
    lineupToken: 'owned-wheel',
  },
  {
    id: 'wheel-0002',
    assetId: 'wheel-0002',
    name: 'Unowned Wheel',
    rarity: 'SR',
    realm: 'AEQUOR',
    awakener: 'mika',
    aliases: [],
    tags: [],
    mainstatKey: 'CRIT_DMG',
    lineupToken: 'unowned-wheel',
  },
] satisfies Wheel[]

const posses = [
  {
    id: 'posse-0001',
    index: 1,
    name: 'Owned Posse',
    realm: 'CHAOS',
    isFadedLegacy: false,
    lineupToken: 'owned-posse',
  },
  {
    id: 'posse-0002',
    index: 2,
    name: 'Unowned Posse',
    realm: 'AEQUOR',
    isFadedLegacy: false,
    lineupToken: 'unowned-posse',
  },
] satisfies Posse[]

function createOwnership(
  overrides: Partial<CollectionOwnershipState> = {},
): CollectionOwnershipState {
  return {
    ownedAwakeners: {},
    awakenerLevels: {},
    ownedWheels: {},
    ownedPosses: {},
    displayUnowned: true,
    ...overrides,
  }
}

describe('builder ownership projection', () => {
  it('projects awakener ownership and level maps by display name', () => {
    const projection = createBuilderOwnershipProjection({
      awakeners,
      wheels,
      posses,
      ownership: createOwnership({
        ownedAwakeners: {'awakener-0001': 5, 'awakener-0002': 5},
        awakenerLevels: {'awakener-0001': 80},
      }),
    })

    expect(projection.ownedAwakenerLevelByName.get('ramona')).toBe(5)
    expect(projection.ownedAwakenerLevelByName.get('ramona: timeworn')).toBe(5)
    expect(projection.ownedAwakenerLevelByName.get('mika')).toBeNull()
    expect(projection.awakenerLevelByName.get('ramona')).toBe(80)
    expect(projection.awakenerLevelByName.get('mika')).toBe(60)
    expect(projection.isAwakenerOwnedByName('ramona')).toBe(true)
    expect(projection.isAwakenerOwnedByName('mika')).toBe(false)
    expect(projection.isAwakenerOwnedByName('missing')).toBe(false)
  })

  it('treats zero ownership levels as owned and missing ids as unowned', () => {
    const projection = createBuilderOwnershipProjection({
      awakeners,
      wheels,
      posses,
      ownership: createOwnership({
        ownedAwakeners: {'awakener-0003': 0},
        ownedWheels: {'wheel-0001': 0},
        ownedPosses: {'posse-0001': 0},
      }),
    })

    expect(projection.ownedAwakenerLevelByName.get('mika')).toBe(0)
    expect(projection.isAwakenerOwnedByName('mika')).toBe(true)
    expect(projection.ownedWheelLevelById.get('wheel-0001')).toBe(0)
    expect(projection.ownedWheelLevelById.get('wheel-0002')).toBeNull()
    expect(projection.isWheelOwnedById('wheel-0001')).toBe(true)
    expect(projection.isWheelOwnedById('wheel-0002')).toBe(false)
    expect(projection.ownedPosseLevelById.get('posse-0001')).toBe(0)
    expect(projection.ownedPosseLevelById.get('posse-0002')).toBeNull()
    expect(projection.isPosseOwnedById('posse-0001')).toBe(true)
    expect(projection.isPosseOwnedById('posse-0002')).toBe(false)
  })
})
