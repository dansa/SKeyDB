import {describe, expect, it} from 'vitest'

import type {AwakenerOverlayRecord, DerivedSkillRecord} from './awakener-source-schema'
import {
  resolveDatabaseOverlay,
  resolveDatabaseReferenceInfo,
  resolveDatabaseReferenceInfoById,
  resolveDatabaseReferenceInfoByKindAndName,
} from './database-reference-info'
import {buildWheelDatabaseReferenceLayer} from './wheels-database-reference-layer'
import type {WheelFullRecord} from './wheels-full'

function buildWheelRecord(): WheelFullRecord {
  return {
    id: 'wheel-0001',
    assetId: 'Weapon_Full_B01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'CARO',
    ownerAwakenerId: 'awakener-0999',
    ownerAwakenerName: 'Tester',
    awakener: 'Tester',
    aliases: ['Merciful Nurturing'],
    searchTags: [],
    mainstatKey: 'KEYFLARE_REGEN',
    mainstatSeriesKey: 'SSR:KEYFLARE_REGEN',
    descriptionTemplate: 'Gain {Status Alias}.',
    descriptionArgs: {},
  }
}

function buildOverlayRecords(): AwakenerOverlayRecord[] {
  return [
    {
      id: 'overlay.global.status',
      displayName: 'Status',
      ownerAwakenerId: 999,
      overlayType: 'mechanic',
      aliases: ['Status Alias'],
      descriptionTemplate: 'Status overlay text.',
      descriptionArgs: {},
    },
  ]
}

function buildDerivedSkillRecords(): DerivedSkillRecord[] {
  return [
    {
      id: 'derived.global.embryo',
      displayName: 'Embryo',
      aliases: ['Seed'],
      descriptionTemplate: '{Caro} Awakeners consume this on Exalt.',
      descriptionArgs: {},
      cardKeywords: [],
      childDerivedSkillIds: [],
      variants: [],
    },
  ]
}

function buildWheelVariantDerivedSkillRecord(
  scalingContext?: 'wheelRefinement',
): DerivedSkillRecord {
  return {
    id: scalingContext ? 'derived.global.falling-upward' : 'derived.global.plain-scaling',
    displayName: scalingContext ? 'Falling Upward' : 'Plain Scaling',
    aliases: [],
    descriptionTemplate: 'The wielder gains [Arg1] Aliemus.',
    descriptionArgs: {
      Arg1: {
        kind: 'scaling',
        values: ['70', '80', '90', '100'],
        ...(scalingContext ? {scalingContext} : {}),
      },
    },
    cardKeywords: [],
    childDerivedSkillIds: [],
    variants: [],
  }
}

describe('wheels-database-reference-layer', () => {
  it('resolves overlay aliases through the neutral reference contract with shared labels', () => {
    const referenceLayer = buildWheelDatabaseReferenceLayer({
      activeWheelId: 'wheel-0001',
      derivedSkills: buildDerivedSkillRecords(),
      overlays: buildOverlayRecords(),
      wheelRecords: [buildWheelRecord()],
    })

    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Status Alias')).toEqual(
      expect.objectContaining({
        kind: 'overlay',
        id: 'overlay.global.status',
        label: 'Mechanic',
        description: 'Status overlay text.',
      }),
    )
    expect(resolveDatabaseOverlay(referenceLayer, 'Status Alias')).toEqual(
      expect.objectContaining({
        id: 'overlay.global.status',
        displayName: 'Status',
      }),
    )
  })

  it('resolves global derived cards referenced from wheel descriptions', () => {
    const referenceLayer = buildWheelDatabaseReferenceLayer({
      activeWheelId: 'wheel-0001',
      derivedSkills: buildDerivedSkillRecords(),
      overlays: buildOverlayRecords(),
      wheelRecords: [
        {
          ...buildWheelRecord(),
          descriptionTemplate: 'Consume {Embryo}.',
        },
      ],
    })

    expect(referenceLayer.cardNames.has('Embryo')).toBe(true)
    expect(referenceLayer.cardNames.has('Seed')).toBe(true)
    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Embryo')).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.global.embryo',
        name: 'Embryo',
      }),
    )
    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Seed')).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.global.embryo',
      }),
    )
  })

  it('uses the active wheel refinement for source-variant derived cards only', () => {
    const records = [
      buildWheelVariantDerivedSkillRecord('wheelRefinement'),
      buildWheelVariantDerivedSkillRecord(),
    ]
    const baseReferenceLayer = buildWheelDatabaseReferenceLayer({
      activeDescriptionRank: 1,
      activeWheelId: 'wheel-0001',
      derivedSkills: records,
      overlays: [],
      wheelRecords: [buildWheelRecord()],
    })
    const maxReferenceLayer = buildWheelDatabaseReferenceLayer({
      activeDescriptionRank: 4,
      activeWheelId: 'wheel-0001',
      derivedSkills: records,
      overlays: [],
      wheelRecords: [buildWheelRecord()],
    })

    expect(resolveDatabaseReferenceInfo(baseReferenceLayer, 'Falling Upward')).toEqual(
      expect.objectContaining({
        description: 'The wielder gains 70 Aliemus.',
        descriptionRank: 1,
      }),
    )
    expect(resolveDatabaseReferenceInfo(maxReferenceLayer, 'Falling Upward')).toEqual(
      expect.objectContaining({
        description: 'The wielder gains 100 Aliemus.',
        descriptionRank: 4,
      }),
    )
    expect(resolveDatabaseReferenceInfo(maxReferenceLayer, 'Plain Scaling')).toEqual(
      expect.objectContaining({
        description: 'The wielder gains 70 Aliemus.',
        descriptionRank: 1,
      }),
    )
  })

  it('can disambiguate generated card references from same-named wheels', () => {
    const referenceLayer = buildWheelDatabaseReferenceLayer({
      activeWheelId: 'wheel-0001',
      derivedSkills: [
        {
          id: 'derived.global.insight',
          displayName: 'Insight',
          aliases: [],
          descriptionTemplate: 'Draw 1 card.',
          descriptionArgs: {},
          cardKeywords: [],
          childDerivedSkillIds: [],
          variants: [],
        },
      ],
      overlays: [],
      wheelRecords: [
        buildWheelRecord(),
        {
          ...buildWheelRecord(),
          id: 'wheel-0076',
          name: 'Insight',
        },
      ],
    })

    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Insight')).toEqual(
      expect.objectContaining({
        kind: 'wheel',
        id: 'wheel-0076',
      }),
    )
    expect(
      resolveDatabaseReferenceInfoByKindAndName(referenceLayer, 'derived-skill', 'Insight'),
    ).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.global.insight',
      }),
    )
  })

  it('does not pull owner-specific overlays into ownerless wheel reference layers by alias alone', () => {
    const referenceLayer = buildWheelDatabaseReferenceLayer({
      activeWheelId: 'wheel-0001',
      derivedSkills: buildDerivedSkillRecords(),
      overlays: [
        {
          id: 'overlay.pickman.painted-orisons',
          displayName: 'Painted Orisons',
          ownerAwakenerId: 40,
          overlayType: 'mechanic',
          aliases: ['Orisons'],
          descriptionTemplate: 'Painted Orisons text.',
          descriptionArgs: {},
        },
      ],
      wheelRecords: [
        {
          ...buildWheelRecord(),
          ownerAwakenerId: undefined,
          descriptionTemplate: 'Team Unique: Increase available {Orisons}.',
        },
      ],
    })

    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Orisons')).toBeNull()
  })

  it('keeps wheel references ahead of later overlays and derived records for duplicate names and ids', () => {
    const referenceLayer = buildWheelDatabaseReferenceLayer({
      activeWheelId: 'wheel-0001',
      derivedSkills: [
        {
          ...buildDerivedSkillRecords()[0],
          id: 'wheel-0001',
          displayName: 'Merciful Nurturing',
        },
      ],
      overlays: [
        {
          ...buildOverlayRecords()[0],
          displayName: 'Merciful Nurturing',
          aliases: ['Status Alias'],
        },
      ],
      wheelRecords: [buildWheelRecord()],
    })

    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Merciful Nurturing')).toEqual(
      expect.objectContaining({
        kind: 'wheel',
        id: 'wheel-0001',
      }),
    )
    expect(resolveDatabaseReferenceInfoById(referenceLayer, 'wheel-0001')).toEqual(
      expect.objectContaining({
        kind: 'wheel',
        name: 'Merciful Nurturing',
      }),
    )
  })

  it('keeps overlay display names and aliases first-writer-wins', () => {
    const referenceLayer = buildWheelDatabaseReferenceLayer({
      activeWheelId: 'wheel-0001',
      derivedSkills: [],
      overlays: [
        ...buildOverlayRecords(),
        {
          id: 'overlay.global.status-later',
          displayName: 'Status Alias',
          ownerAwakenerId: 999,
          overlayType: 'mechanic',
          aliases: ['Status'],
          descriptionTemplate: 'Later status text.',
          descriptionArgs: {},
        },
      ],
      wheelRecords: [buildWheelRecord()],
    })

    expect(resolveDatabaseOverlay(referenceLayer, 'Status Alias')).toEqual(
      expect.objectContaining({
        id: 'overlay.global.status',
        displayName: 'Status',
      }),
    )
    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Status Alias')).toEqual(
      expect.objectContaining({
        id: 'overlay.global.status',
        name: 'Status',
      }),
    )
  })
})
