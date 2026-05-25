import {describe, expect, it} from 'vitest'

import type {AwakenerBuild} from '@/domain/awakener-builds'
import type {Awakener} from '@/domain/awakeners'
import type {Covenant} from '@/domain/covenants'
import type {Posse} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'

import type {Team, TeamSlot, WheelUsageLocation} from '../builder/types'
import {
  createBuilderV2AwakenerOptions,
  createBuilderV2CovenantOptions,
  createBuilderV2PosseOptions,
  createBuilderV2WheelOptions,
  createWheelRecommendationMetaById,
} from './builder-v2-picker-options'

const emptySlot = (slotId: string): TeamSlot => ({slotId, wheels: [null, null]})

function createAwakener(overrides: Partial<Awakener> & Pick<Awakener, 'id' | 'name'>): Awakener {
  return {
    faction: 'Test',
    realm: 'CHAOS',
    aliases: [],
    tags: [],
    lineupToken: overrides.name.toLowerCase(),
    ...overrides,
  }
}

function createWheel(overrides: Partial<Wheel> & Pick<Wheel, 'id' | 'name'>): Wheel {
  return {
    assetId: overrides.id,
    rarity: 'SSR',
    realm: 'CHAOS',
    awakener: '',
    aliases: [overrides.name],
    tags: [],
    mainstatKey: 'CRIT_RATE',
    lineupToken: overrides.name.toLowerCase(),
    ...overrides,
  }
}

function createCovenant(overrides: Partial<Covenant> & Pick<Covenant, 'id' | 'name'>): Covenant {
  return {
    assetId: overrides.id,
    lineupToken: overrides.name.toLowerCase(),
    ...overrides,
  }
}

function createPosse(overrides: Partial<Posse> & Pick<Posse, 'id' | 'name'>): Posse {
  return {
    index: 1,
    realm: 'CHAOS',
    isFadedLegacy: false,
    lineupToken: overrides.name.toLowerCase(),
    ...overrides,
  }
}

describe('builder-v2 picker option queries', () => {
  it('keeps awakener ownership sinking and duplicate block labels stable', () => {
    const awakeners = [
      createAwakener({id: 'awakener-9001', name: 'Aster', numericId: 1}),
      createAwakener({id: 'awakener-9002', name: 'Beryl', numericId: 2}),
    ]
    const activeTeamSlots = [
      {
        slotId: 'slot-1',
        awakenerId: 'awakener-9001',
        realm: 'CHAOS',
        wheels: [null, null] as [string | null, string | null],
      },
      emptySlot('slot-2'),
    ]

    const options = createBuilderV2AwakenerOptions({
      allAwakeners: awakeners,
      searchQuery: '',
      filter: 'ALL',
      displayUnowned: true,
      sinkUnownedToBottom: true,
      allowDuplicateAwakenerIdentities: false,
      sortKey: 'ALPHABETICAL',
      sortDirection: 'ASC',
      sortGroupByRealm: false,
      activeTeamSlots,
      usedAwakenerIdentityKeys: new Set(['awakener-9001']),
      usageAwakenerByIdentityKey: new Map([['awakener-9001', {teamOrder: 1}]]),
      ownedAwakenerLevelByName: new Map([['Aster', 3]]),
      awakenerLevelByName: new Map([['Aster', 76]]),
      isAwakenerOwnedByName: (name) => name === 'Aster',
    })

    expect(options.map((option) => option.name)).toEqual(['Aster', 'Beryl'])
    expect(options[0]).toMatchObject({
      inUse: true,
      inUseLabel: 'Team 2',
      owned: true,
      level: 76,
      enlightenLevel: 3,
      blocked: true,
      blockReason: 'In use',
    })
    expect(options[1]).toMatchObject({owned: false, blocked: false})
  })

  it('keeps wheel recommendation labels, mainstat metadata, and usage labels stable', () => {
    const wheels = [
      createWheel({id: 'wheel-9001', name: 'BiS Wheel', mainstatKey: 'CRIT_RATE'}),
      createWheel({id: 'wheel-9002', name: 'Mainstat Wheel', mainstatKey: 'KEYFLARE_REGEN'}),
      createWheel({id: 'wheel-9003', name: 'Plain Wheel', mainstatKey: 'CRIT_DMG'}),
    ]
    const build: AwakenerBuild = {
      id: 'build-test',
      label: 'Test',
      substatPriorityGroups: [['ATK']],
      recommendedWheelMainstats: ['KEYFLARE_REGEN'],
      recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['wheel-9001']}],
      recommendedCovenantIds: ['covenant-9001'],
    }
    const recommendationById = createWheelRecommendationMetaById(build, wheels)
    const usage: WheelUsageLocation = {
      teamOrder: 2,
      teamId: 'team-3',
      slotId: 'slot-2',
      wheelIndex: 1,
    }

    const options = createBuilderV2WheelOptions({
      allWheels: wheels,
      searchQuery: '',
      rarityFilter: 'ALL',
      mainstatFilter: 'ALL',
      displayUnowned: true,
      sinkUnownedToBottom: false,
      promoteRecommendedGear: true,
      promoteMatchingWheelMainstats: true,
      sortKey: 'ALPHABETICAL',
      sortDirection: 'ASC',
      recommendationById,
      usedWheelIds: new Set(['wheel-9001']),
      usedWheelByTeamOrder: new Map([['wheel-9001', usage]]),
      ownedWheelLevelById: new Map([
        ['wheel-9001', 3],
        ['wheel-9002', 12],
      ]),
      isWheelOwnedById: (wheelId) => wheelId !== 'wheel-9003',
    })

    expect(options.map((option) => option.id)).toEqual(['wheel-9001', 'wheel-9002', 'wheel-9003'])
    expect(options[0]).toMatchObject({
      inUse: true,
      inUseLabel: 'Team 3',
      recommendationLabel: 'BiS',
      recommendedMainstatKey: null,
      enlightenLevel: 3,
    })
    expect(options[1]).toMatchObject({
      recommended: true,
      recommendationLabel: null,
      recommendedMainstatKey: 'KEYFLARE_REGEN',
      enlightenLevel: 12,
    })
  })

  it('keeps covenant recommendation labels and active-team usage stable', () => {
    const covenants = [
      createCovenant({id: 'covenant-9002', name: 'Second'}),
      createCovenant({id: 'covenant-9001', name: 'First'}),
    ]
    const build: AwakenerBuild = {
      id: 'build-test',
      label: 'Test',
      substatPriorityGroups: [['ATK']],
      recommendedWheels: [{tier: 'GOOD', wheelIds: ['wheel-9001']}],
      recommendedCovenantIds: ['covenant-9001', 'covenant-9002'],
    }

    const options = createBuilderV2CovenantOptions({
      allCovenants: covenants,
      searchQuery: '',
      activeBuild: build,
      activeTeamSlots: [{slotId: 'slot-1', covenantId: 'covenant-9002', wheels: [null, null]}],
      promoteRecommendedGear: true,
    })

    expect(options.map((option) => option.id)).toEqual(['covenant-9001', 'covenant-9002'])
    expect(options[0]).toMatchObject({recommended: true, recommendationLabel: '#1'})
    expect(options[1]).toMatchObject({inUse: true, recommendationLabel: '#2'})
  })

  it('keeps posse status priority as active, blocked team, unowned, then recommended', () => {
    const activeTeam: Team = {
      id: 'team-1',
      name: 'Team 1',
      posseId: 'posse-9001',
      slots: [emptySlot('slot-1')],
    }
    const posses = [
      createPosse({id: 'posse-9001', name: 'Active Posse'}),
      createPosse({id: 'posse-9002', name: 'Blocked Posse'}),
      createPosse({id: 'posse-9003', name: 'Recommended Posse'}),
      createPosse({id: 'posse-9004', name: 'Unowned Posse'}),
    ]

    const options = createBuilderV2PosseOptions({
      allPosses: posses,
      searchQuery: '',
      filter: 'ALL',
      activeTeam,
      allowDuplicateAwakenerIdentities: false,
      displayUnowned: true,
      sinkUnownedToBottom: false,
      promoteRecommendedGear: false,
      recommendedPosseIds: new Set(['posse-9003']),
      usedPosseByTeamOrder: new Map([
        ['posse-9001', 0],
        ['posse-9002', 1],
      ]),
      isPosseOwnedById: (posseId) => posseId !== 'posse-9004',
    })

    expect(options.map((option) => [option.id, option.statusLabel])).toEqual([
      ['posse-9001', 'Active'],
      ['posse-9002', 'Team 2'],
      ['posse-9003', 'Rec'],
      ['posse-9004', 'Unowned'],
    ])
  })
})
