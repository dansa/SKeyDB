import {describe, expect, it} from 'vitest'

import {
  getAwakenerDatabaseControls,
  getDefaultAwakenerDatabaseSelection,
  normalizeAwakenerDatabaseSelection,
  normalizeAwakenerDatabaseSelectionForRecord,
  patchAwakenerDatabaseSelection,
  resolveAwakenerDatabaseState,
} from './awakener-database-state'
import type {AwakenerOverlayRecord} from './awakener-source-schema'
import {type AwakenerFullRecord} from './awakeners-full'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'

describe('awakener-database-state', () => {
  it('normalizes and clamps database selection inputs', () => {
    expect(
      normalizeAwakenerDatabaseSelection({
        awakenerLevel: 999,
        psycheSurgeOffset: -2,
        skillLevel: 99,
        soulforgeLevel: 4,
        gnosticPotentialLevel: -3,
      }),
    ).toEqual({
      awakenerLevel: 90,
      psycheSurgeOffset: 0,
      skillLevel: 6,
      selectedEnlightenSlot: null,
      soulforgeLevel: 4,
      gnosticPotentialLevel: 0,
    })
  })

  it('resolves stats and described view from one selection object', async () => {
    const thais = await loadPublicAwakenerDetailById(48)
    expect(thais).toBeDefined()
    if (!thais) {
      throw new Error('Missing canonical Thais current record')
    }

    const resolved = resolveAwakenerDatabaseState(
      thais,
      {
        awakenerLevel: 90,
        psycheSurgeOffset: 1,
        skillLevel: 6,
        selectedEnlightenSlot: 'E3',
      },
      {},
      [],
      [],
    )

    expect(resolved.selection).toEqual({
      awakenerLevel: 90,
      psycheSurgeOffset: 1,
      skillLevel: 6,
      selectedEnlightenSlot: 'E3',
      soulforgeLevel: 0,
      gnosticPotentialLevel: 5,
    })
    expect(resolved.controls.enlightenOptions).toEqual([
      {value: null, label: 'E0'},
      {value: 'E1', label: 'E1'},
      {value: 'E2', label: 'E2'},
      {value: 'E3', label: 'E3'},
      {value: 'AbsoluteAxiom', label: 'AA'},
    ])
    expect(resolved.stats.CON).not.toBe(thais.stats.CON)
    expect(resolved.shellView.activeEnlightenIds).toEqual([
      'enlighten.thais.forests-embrace',
      'enlighten.thais.seed-of-chaos',
      'enlighten.thais.everlasting-cycle',
    ])
    expect(resolved.shellView.commandCards[0]?.resolved.description).toContain('Thais gains')
    expect(resolved.referenceLayer.referenceInfoByName.size).toBeGreaterThan(0)
  })

  it('passes soulforge level through to the described view contract', () => {
    const fakeRecord = buildSoulforgeFixture()
    const resolved = resolveAwakenerDatabaseState(
      fakeRecord,
      {
        soulforgeLevel: 2,
      },
      {},
      buildOverlayRecords(),
      [],
    )

    const soulforge = resolved.shellView.talents.find(
      (entry) => entry.record.id === 'talent.test.soulforge-aptitude',
    )
    expect(soulforge?.resolved.description).toBe('Soulforge 20.')
  })

  it('applies soulforge stat bonuses on top of level-scaled primary stats', () => {
    const fakeRecord = buildSoulforgeFixture()

    const baseState = resolveAwakenerDatabaseState(fakeRecord, {
      awakenerLevel: 60,
      soulforgeLevel: 0,
    })
    const soulforgeState = resolveAwakenerDatabaseState(fakeRecord, {
      awakenerLevel: 60,
      soulforgeLevel: 2,
    })

    expect(baseState.stats.CON).toBe('80')
    expect(baseState.stats.ATK).toBe('80')
    expect(baseState.stats.DEF).toBe('80')
    expect(soulforgeState.stats.CON).toBe('96')
    expect(soulforgeState.stats.ATK).toBe('96')
    expect(soulforgeState.stats.DEF).toBe('96')
  })

  it('layers adjustable Gnostic Potential stat levels into normal level scaling', () => {
    const fakeRecord = buildGnosticFixture({defaultMaxed: false})

    const offState = resolveAwakenerDatabaseState(fakeRecord, {
      awakenerLevel: 60,
      gnosticPotentialLevel: 0,
    })
    const defaultState = resolveAwakenerDatabaseState(fakeRecord, {
      awakenerLevel: 60,
    })
    const levelThreeState = resolveAwakenerDatabaseState(fakeRecord, {
      awakenerLevel: 60,
      gnosticPotentialLevel: 3,
    })

    expect(offState.stats).toMatchObject({
      CON: '80',
      ATK: '80',
      DEF: '80',
    })
    expect(defaultState.selection.gnosticPotentialLevel).toBe(0)
    expect(defaultState.stats).toMatchObject({
      CON: '80',
      ATK: '80',
      DEF: '80',
    })
    expect(levelThreeState.stats).toMatchObject({
      CON: '86',
      ATK: '86',
      DEF: '86',
    })
    expect(levelThreeState.controls).toMatchObject({
      hasGnosticPotentialTalent: true,
      canAdjustGnosticPotential: true,
      gnosticPotentialLevelMin: 0,
      gnosticPotentialLevelMax: 5,
    })
  })

  it('keeps default-maxed Gnostic Potential at max without exposing an adjustable control', () => {
    const fakeRecord = buildGnosticFixture({defaultMaxed: true})

    const resolved = resolveAwakenerDatabaseState(fakeRecord, {
      awakenerLevel: 60,
      gnosticPotentialLevel: 0,
    })

    expect(resolved.selection.gnosticPotentialLevel).toBe(5)
    expect(resolved.stats).toMatchObject({
      CON: '90',
      ATK: '90',
      DEF: '90',
    })
    expect(resolved.controls).toMatchObject({
      hasGnosticPotentialTalent: true,
      canAdjustGnosticPotential: false,
      gnosticPotentialLevelMin: null,
      gnosticPotentialLevelMax: 5,
    })
  })

  it('describes the available database controls from canonical current data', () => {
    const fakeRecord = buildSoulforgeFixture()

    expect(getAwakenerDatabaseControls(fakeRecord)).toEqual({
      enlightenOptions: [
        {value: null, label: 'E0'},
        {value: 'E1', label: 'E1'},
        {value: 'E2', label: 'E2'},
        {value: 'E3', label: 'E3'},
      ],
      canAdjustPsycheSurge: false,
      psycheSurgeOffsetMin: 0,
      psycheSurgeOffsetMax: 12,
      hasSoulforgeTalent: true,
      hasGnosticPotentialTalent: false,
      canAdjustGnosticPotential: false,
      skillLevelMin: 1,
      skillLevelMax: 6,
      soulforgeLevelMin: 0,
      soulforgeLevelMax: 3,
      gnosticPotentialLevelMin: null,
      gnosticPotentialLevelMax: null,
    })
  })

  it('detects soulforge aptitude from public V3 T-slots, not just extra talents', async () => {
    const twentyFour = await loadPublicAwakenerDetailById(1)
    expect(twentyFour).toBeDefined()
    if (!twentyFour) {
      throw new Error('Missing canonical 24 current record')
    }

    const controls = getAwakenerDatabaseControls(twentyFour)

    expect(twentyFour.talents.T3?.id).toBe('talent.24.soulforge-aptitude')
    expect(controls.hasSoulforgeTalent).toBe(true)
    expect(controls.soulforgeLevelMax).toBe(10)
  })

  it('keeps public V3 overlay upgrade badges on overlay popover references', async () => {
    const xu = await loadPublicAwakenerDetailById('awakener-0054')
    expect(xu).toBeDefined()
    if (!xu) {
      throw new Error('Missing public V3 Xu record')
    }

    const resolved = resolveAwakenerDatabaseState(xu, {
      selectedEnlightenSlot: 'E3',
    })
    const spellbound = resolved.referenceLayer.referenceInfoById.get('overlay.xu.spellbound')

    expect(spellbound?.description).toContain('Stacks up to 10')
    expect(spellbound?.influenceBadges).toEqual([
      expect.objectContaining({
        kind: 'enlighten',
        label: 'E3',
        referenceName: "Nirvana's Kiss",
        slot: 'E3',
      }),
    ])
  })

  it('keeps public V3 link-only talent influence badges on affected skills', async () => {
    const agrippa = await loadPublicAwakenerDetailById('awakener-0002')
    expect(agrippa).toBeDefined()
    if (!agrippa) {
      throw new Error('Missing public V3 Agrippa record')
    }

    const resolved = resolveAwakenerDatabaseState(agrippa)
    const paleBlessing = resolved.shellView.exalts.find(
      (entry) => entry.record.id === 'skill.agrippa.pale-blessing',
    )

    expect(agrippa.cards.Exalt.upgrades).toEqual([
      expect.objectContaining({
        operation: 'link_only',
        upgraderId: 'talent.agrippa.seal-of-the-pact',
      }),
    ])
    expect(paleBlessing?.influenceBadges).toEqual([
      expect.objectContaining({
        kind: 'talent',
        label: 'T1',
        referenceName: 'Seal of the Pact',
      }),
    ])
  })

  it('builds concrete default selection values for upcoming database controls', () => {
    expect(getDefaultAwakenerDatabaseSelection()).toEqual({
      awakenerLevel: 60,
      psycheSurgeOffset: 0,
      skillLevel: 1,
      selectedEnlightenSlot: null,
      soulforgeLevel: 0,
      gnosticPotentialLevel: 0,
    })
  })

  it('normalizes selection against the actual awakener contract', () => {
    const fakeRecord = buildSoulforgeFixture()

    expect(
      normalizeAwakenerDatabaseSelectionForRecord(fakeRecord, {
        selectedEnlightenSlot: 'AbsoluteAxiom',
        soulforgeLevel: 99,
      }),
    ).toEqual({
      awakenerLevel: 60,
      psycheSurgeOffset: 0,
      skillLevel: 1,
      selectedEnlightenSlot: 'E3',
      soulforgeLevel: 3,
      gnosticPotentialLevel: 0,
    })
  })

  it('patches selection updates against record defaults and bounds', () => {
    const fakeRecord = buildSoulforgeFixture()

    expect(
      patchAwakenerDatabaseSelection(
        fakeRecord,
        {
          awakenerLevel: 90,
          selectedEnlightenSlot: 'E2',
        },
        {
          selectedEnlightenSlot: 'AbsoluteAxiom',
          soulforgeLevel: 99,
        },
      ),
    ).toEqual({
      awakenerLevel: 90,
      psycheSurgeOffset: 0,
      skillLevel: 1,
      selectedEnlightenSlot: 'E3',
      soulforgeLevel: 3,
      gnosticPotentialLevel: 0,
    })
  })
})

function buildGnosticFixture({defaultMaxed}: {defaultMaxed: boolean}): AwakenerFullRecord {
  const record = buildSoulforgeFixture()

  return {
    ...record,
    talents: {
      ...record.talents,
      T3: undefined,
      T4: {
        id: 'talent.test.gnostic-potential',
        ownerAwakenerId: 999,
        displayName: 'Gnostic Potential',
        descriptionTemplate:
          'This Awakener gains [Arg1] Levels of Base Attributes. CON +[Talent_Attr_Lv_physique], ATK +[Talent_Attr_Lv_atk], DEF +[Talent_Attr_Lv_def].',
        descriptionArgs: {
          Arg1: {
            kind: 'linear',
            base: '2',
            gainPerLevel: '2',
          },
          Talent_Attr_Lv_physique: {
            kind: 'linear',
            base: '3',
            gainPerLevel: '3',
          },
          Talent_Attr_Lv_atk: {
            kind: 'linear',
            base: '5',
            gainPerLevel: '4',
          },
          Talent_Attr_Lv_def: {
            kind: 'linear',
            base: '3',
            gainPerLevel: '2',
          },
        },
        family: 'gnostic_potential',
        hasLevelScaledDescription: true,
        maxLevel: 5,
        ...(defaultMaxed ? {defaultMaxed: true} : {}),
      },
    },
  }
}

function buildSoulforgeFixture(): AwakenerFullRecord {
  return {
    id: 999,
    key: 'tester',
    displayName: 'Tester',
    aliases: ['tester'],
    faction: 'Test',
    realm: 'ULTRA',
    rarity: 'SSR',
    type: 'ASSAULT',
    stats: {
      CON: '100',
      ATK: '100',
      DEF: '100',
      CritRate: '5%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    },
    primaryScalingBase: 20,
    statScaling: {
      CON: 1,
      ATK: 1,
      DEF: 1,
    },
    substatScaling: {},
    assets: {
      portraitKey: 'tester',
      iconKey: 'tester',
    },
    searchTags: [],
    cards: {
      C1: {
        id: 'skill.test.rouse',
        ownerAwakenerId: 999,
        kind: 'rouse',
        displayName: 'Rouse',
        descriptionTemplate: 'Rouse base',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C2: {
        id: 'skill.test.strike',
        ownerAwakenerId: 999,
        kind: 'strike',
        displayName: 'Strike',
        descriptionTemplate: 'Strike base',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C3: {
        id: 'skill.test.defense',
        ownerAwakenerId: 999,
        kind: 'defense',
        displayName: 'Defense',
        descriptionTemplate: 'Defense base',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C4: {
        id: 'skill.test.command-1',
        ownerAwakenerId: 999,
        kind: 'command',
        displayName: 'Command 1',
        cost: '1',
        descriptionTemplate: 'Command 1 base',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C5: {
        id: 'skill.test.command-2',
        ownerAwakenerId: 999,
        kind: 'command',
        displayName: 'Command 2',
        cost: '1',
        descriptionTemplate: 'Command 2 base',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      Exalt: {
        id: 'skill.test.exalt',
        ownerAwakenerId: 999,
        kind: 'exalt',
        displayName: 'Exalt',
        descriptionTemplate: 'Exalt base',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      promotedExtras: [],
    },
    talents: {
      T1: undefined,
      T2: undefined,
      T3: {
        id: 'talent.test.soulforge-aptitude',
        ownerAwakenerId: 999,
        displayName: 'Soulforge Aptitude',
        descriptionTemplate: 'Soulforge [Arg1].',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['10', '20', '30'],
          },
        },
        hasLevelScaledDescription: true,
        maxLevel: 3,
      },
      T4: undefined,
      extraTalents: [],
    },
    enlightens: {
      E1: {
        id: 'enlighten.test.e1',
        ownerAwakenerId: 999,
        slot: 'E1',
        displayName: 'E1',
        descriptionTemplate: 'E1 desc',
        descriptionArgs: {},
      },
      E2: {
        id: 'enlighten.test.e2',
        ownerAwakenerId: 999,
        slot: 'E2',
        displayName: 'E2',
        descriptionTemplate: 'E2 desc',
        descriptionArgs: {},
      },
      E3: {
        id: 'enlighten.test.e3',
        ownerAwakenerId: 999,
        slot: 'E3',
        displayName: 'E3',
        descriptionTemplate: 'E3 desc',
        descriptionArgs: {},
      },
      AbsoluteAxiom: undefined,
    },
    derivedSkills: [],
  }
}

function buildOverlayRecords(): AwakenerOverlayRecord[] {
  return [
    {
      id: 'overlay.test.status',
      ownerAwakenerId: 999,
      displayName: 'Status',
      overlayType: 'mechanic',
      aliases: [],
      descriptionTemplate: 'Status base',
      descriptionArgs: {},
    },
  ]
}
