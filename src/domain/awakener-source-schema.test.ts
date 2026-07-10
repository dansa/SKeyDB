import {describe, expect, it} from 'vitest'

import {getAwakenerEnlightens} from './awakener-enlightens'
import {getAwakenerKits} from './awakener-kits'
import {getAwakenerOverlays} from './awakener-overlays'
import {getAwakenerRoster} from './awakener-roster'
import {getAwakenerSkills} from './awakener-skills'
import {
  awakenerEnlightensDatasetSchema,
  awakenerKitsDatasetSchema,
  awakenerOverlaysDatasetSchema,
  awakenerRosterDatasetSchema,
  awakenerSkillsDatasetSchema,
  awakenerTalentsDatasetSchema,
  descriptionArgSchema,
  derivedSkillsDatasetSchema,
} from './awakener-source-schema'
import {getAwakenerTalents} from './awakener-talents'
import {getDerivedSkills} from './derived-skills'

describe('awakener-source-schema', () => {
  it('accepts source-backed ceil-then-multiply description args', () => {
    expect(
      descriptionArgSchema.parse({
        kind: 'computed',
        formulaKey: 'scaledCeilThenMultiply',
        baseFormula: 'occultResearchDepth',
        multiplier: 0.06,
        divisor: 3,
        postMultiplier: 3,
        inputs: ['accountLevel', 'ownedPosseCount'],
      }),
    ).toMatchObject({formulaKey: 'scaledCeilThenMultiply', divisor: 3, postMultiplier: 3})
  })

  it('accepts public V3-backed runtime records', () => {
    const parsedRoster = awakenerRosterDatasetSchema.parse(getAwakenerRoster())
    const parsedKits = awakenerKitsDatasetSchema.parse(getAwakenerKits())
    const parsedEnlightens = awakenerEnlightensDatasetSchema.parse(getAwakenerEnlightens())
    const parsedTalents = awakenerTalentsDatasetSchema.parse(getAwakenerTalents())
    const parsedSkills = awakenerSkillsDatasetSchema.parse(getAwakenerSkills())
    const parsedOverlays = awakenerOverlaysDatasetSchema.parse(getAwakenerOverlays())

    expect(parsedRoster.length).toBeGreaterThan(0)
    expect(parsedKits.length).toBeGreaterThan(0)
    expect(parsedEnlightens.length).toBeGreaterThan(0)
    expect(parsedTalents.length).toBeGreaterThan(0)
    expect(parsedSkills.length).toBeGreaterThan(0)
    expect(derivedSkillsDatasetSchema.parse(getDerivedSkills()).length).toBeGreaterThan(0)
    expect(parsedOverlays.length).toBeGreaterThan(0)
    expect(parsedOverlays.length).toBeGreaterThan(90)
    expect(parsedOverlays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'overlay.global.ultra-space',
          displayName: 'Ultra Space',
          overlayType: 'mechanic',
        }),
        expect.objectContaining({
          id: 'overlay.global.exhaust',
          displayName: 'Exhaust',
          overlayType: 'mechanic',
        }),
        expect.objectContaining({
          id: 'overlay.24.realm-and-persona',
          ownerAwakenerId: 1,
          displayName: 'Realm and Persona',
          overlayType: 'tag',
        }),
        expect.objectContaining({
          id: 'overlay.horla.metaphor',
          ownerAwakenerId: 24,
          displayName: 'Metaphor',
          overlayType: 'mechanic',
        }),
        expect.objectContaining({
          id: 'overlay.murphy-fauxborn.life-seal',
          ownerAwakenerId: 35,
          displayName: 'Life Seal',
          overlayType: 'mechanic',
        }),
      ]),
    )
  })

  it('represents a roster record with stats, scaling, and assets', () => {
    const parsed = awakenerRosterDatasetSchema.parse([
      {
        id: 24,
        key: '24',
        displayName: '24',
        ingameId: '24',
        faction: 'Outsider',
        realm: 'Chaos',
        rarity: 'SSR',
        type: 'CHORUS',
        aliases: ['24'],
        searchTags: ['Fixed DMG', 'Vulnerability'],
        stats: {
          CON: '149',
          ATK: '189',
          DEF: '86',
          CritRate: '14.6%',
          CritDamage: '50%',
          AliemusRegen: '2.4',
          KeyflareRegen: '15',
          RealmMastery: '0',
          SigilYield: '0%',
          DamageAmplification: '0%',
          DeathResistance: '0%',
        },
        primaryScalingBase: 30,
        statScaling: {
          CON: 1.65,
          ATK: 2.1,
          DEF: 0.95,
        },
        substatScaling: {
          CritRate: '1.6%',
          AliemusRegen: '0.4',
        },
        assets: {
          portraitKey: '24',
          iconKey: '24',
        },
      },
    ])

    expect(parsed[0]?.displayName).toBe('24')
    expect(parsed[0]?.assets.portraitKey).toBe('24')
    expect(parsed[0]?.searchTags).toEqual(['Fixed DMG', 'Vulnerability'])
  })

  it('defaults omitted derived child ids and variants for lean generated records', () => {
    const parsed = derivedSkillsDatasetSchema.parse([
      {
        id: 'derived.global.insight',
        displayName: 'Insight',
        descriptionTemplate: 'Obtain 1 Arithmetica, and draw 1 card.',
        descriptionArgs: {},
        cost: '0',
        cardKeywords: [{id: 'mechanic.retain'}, {id: 'mechanic.exhaust'}],
      },
    ])

    expect(parsed[0]?.ownerAwakenerId).toBeUndefined()
    expect(parsed[0]?.childDerivedSkillIds).toEqual([])
    expect(parsed[0]?.variants).toEqual([])
  })

  it('represents a skill with an enlighten-driven variant and optional continuation refs', () => {
    const parsed = awakenerSkillsDatasetSchema.parse([
      {
        id: 'skill.24.mediating-personalities',
        ownerAwakenerId: 24,
        kind: 'rouse',
        displayName: 'Mediating Personalities',
        cost: '2',
        descriptionTemplate:
          '"24" Obtain [Energy:Arg1] Aliemus. {Rouse}:\n{Chaos}: The Crit. Rate and Crit. DMG of "24" +[StateArg4]%.',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['25', '30', '35'],
          },
        },
        continuationRefs: [
          {
            sourceType: 'state',
            displayName: 'Realm Effect',
            sourceField: 'Desc',
            roleScope: 'blank',
          },
          {
            sourceType: 'other',
            literalText:
              '{Depressed Persona}: Gain an additional 5 Aliemus. {Manic Persona}: Deal 1 additional instance of DMG.',
          },
        ],
        cardKeywords: [
          {
            id: 'mechanic.retain',
          },
          {
            id: 'mechanic.prepare',
            value: 1,
          },
        ],
        variants: [
          {
            id: 'skill.24.mediating-personalities.e2',
            unlockEnlightenSlot: 'E2',
            descriptionTemplate:
              '"24" Obtain [Energy:Arg1] Aliemus. {Rouse}:\n{Chaos}: The Crit. Rate and Crit. DMG of "24" +[StateArg4]%. Shuffle 1 {Insight} into the Discard Pile at turn end, Hand Limit +2.',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['25', '30', '35'],
              },
              StateArg4: {
                kind: 'scaling',
                values: ['15%', '16%', '17%'],
              },
            },
            cardKeywords: [
              {
                id: 'mechanic.exhaust',
              },
            ],
          },
        ],
      },
    ])

    expect(parsed[0]?.variants).toHaveLength(1)
    expect(parsed[0]?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
      {id: 'mechanic.prepare', value: 1},
    ])
    expect(parsed[0]?.variants[0]?.cardKeywords).toEqual([{id: 'mechanic.exhaust'}])
    expect(parsed[0]?.variants[0]?.descriptionArgs.StateArg4).toBeDefined()
    expect(parsed[0]?.continuationRefs?.[0]?.displayName).toBe('Realm Effect')
    expect(parsed[0]?.continuationRefs?.[0]?.sourceField).toBe('Desc')
    expect(parsed[0]?.continuationRefs?.[0]?.roleScope).toBe('blank')
    expect(parsed[0]?.continuationRefs?.[1]?.literalText).toContain('Gain an additional 5 Aliemus')
  })

  it('represents a talent with optional future Soulforge level metadata', () => {
    const parsed = awakenerTalentsDatasetSchema.parse([
      {
        id: 'talent.xu.soulforge-aptitude',
        ownerAwakenerId: 38,
        displayName: 'Soulforge Aptitude',
        descriptionTemplate: "Each stack deals Fixed DMG equal to 9% of target's Max HP.",
        descriptionArgs: {},
        maxLevel: 10,
        hasLevelScaledDescription: true,
      },
    ])

    expect(parsed[0]?.hasLevelScaledDescription).toBe(true)
    expect(parsed[0]?.maxLevel).toBe(10)
    expect(parsed[0]).not.toHaveProperty('upgradeTargetIds')
    expect(parsed[0]).not.toHaveProperty('upgradePatches')
  })

  it('accepts compiled fixed, linear, and scaling arg metadata', () => {
    const parsed = awakenerSkillsDatasetSchema.parse([
      {
        id: 'skill.celeste.strike',
        ownerAwakenerId: 17,
        kind: 'strike',
        displayName: 'Strike',
        descriptionTemplate: 'Deal [Damage:Arg1] DMG.',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['110', '132', '154', '176', '198', '220'],
            suffix: '%',
            stat: 'ATK',
            substatBonus: {
              substat: 'DamageAmplification',
              multiplier: '0.75',
              suffix: '%',
            },
          },
          Arg2: {
            kind: 'fixed',
            value: '1',
          },
          Arg3: {
            kind: 'linear',
            base: '10',
            gainPerLevel: '5',
            suffix: '%',
            stat: 'ATK',
          },
          Arg4: {
            kind: 'fixed',
            value: '10',
            suffix: '%',
            stat: 'ATK',
          },
          Arg5: {
            kind: 'fixed',
            substatBonus: {
              substat: 'RealmMastery',
              multiplier: '0.5',
            },
          },
          Arg6: {
            kind: 'linear',
            base: '15',
            gainPerLevel: '3',
            substatBonus: {
              substat: 'KeyflareRegen',
              multiplier: '0.2',
              suffix: '%',
            },
          },
        },
        cardKeywords: [],
      },
    ])

    expect(parsed[0]?.descriptionArgs.Arg1).toEqual({
      kind: 'scaling',
      values: ['110', '132', '154', '176', '198', '220'],
      suffix: '%',
      stat: 'ATK',
      substatBonus: {
        substat: 'DamageAmplification',
        multiplier: '0.75',
        suffix: '%',
      },
    })
    expect(parsed[0]?.descriptionArgs.Arg2).toEqual({
      kind: 'fixed',
      value: '1',
    })
    expect(parsed[0]?.descriptionArgs.Arg3).toEqual({
      kind: 'linear',
      base: '10',
      gainPerLevel: '5',
      suffix: '%',
      stat: 'ATK',
    })
    expect(parsed[0]?.descriptionArgs.Arg4).toEqual({
      kind: 'fixed',
      value: '10',
      suffix: '%',
      stat: 'ATK',
    })
    expect(parsed[0]?.descriptionArgs.Arg5).toEqual({
      kind: 'fixed',
      substatBonus: {
        substat: 'RealmMastery',
        multiplier: '0.5',
      },
    })
    expect(parsed[0]?.descriptionArgs.Arg6).toEqual({
      kind: 'linear',
      base: '15',
      gainPerLevel: '3',
      substatBonus: {
        substat: 'KeyflareRegen',
        multiplier: '0.2',
        suffix: '%',
      },
    })
    expect(parsed[0]?.variants).toEqual([])
  })

  it('represents enlighten descriptions without target-side upgrade patch ownership', () => {
    const parsed = awakenerEnlightensDatasetSchema.parse([
      {
        id: 'enlighten.celeste.e2',
        ownerAwakenerId: 17,
        slot: 'E2',
        displayName: 'Tintless Dream Retains',
        descriptionTemplate:
          '{Tintless Dream} retains for each turn; the next time it is played, it will restore an additional amount of HP equal to [Arg1]% of CON.',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['10', '12', '14'],
            suffix: '%',
          },
        },
      },
    ])

    expect(parsed[0]?.slot).toBe('E2')
    expect(parsed[0]).not.toHaveProperty('upgradeTargetIds')
    expect(parsed[0]).not.toHaveProperty('upgradePatches')
  })

  it('represents derived-skill parent-child chains and derived variants', () => {
    const parsed = derivedSkillsDatasetSchema.parse([
      {
        id: 'derived.hameln.symphony-of-harmony',
        ownerAwakenerId: 22,
        nodeKind: 'group',
        displayName: 'Symphony of Harmony',
        cost: '0',
        descriptionTemplate:
          'Choose: {Ascending Scale} or {Descending Scale}. {Exhaust}. {Retain}.',
        descriptionArgs: {},
        derivedFromId: 'skill.laudable-masterpiece',
        rootSkillId: 'skill.laudable-masterpiece',
        childDerivedSkillIds: ['derived.hameln.ascending-scale', 'derived.hameln.descending-scale'],
        cardKeywords: [
          {
            id: 'mechanic.retain',
          },
          {
            id: 'mechanic.exhaust',
          },
        ],
        variants: [
          {
            id: 'derived.hameln.symphony-of-harmony.e2',
            unlockEnlightenSlot: 'E2',
            descriptionTemplate:
              'Choose: {Ascending Scale} or {Descending Scale}. {Exhaust}. {Retain}. Obtain [Arg1] Keyflare.',
            descriptionArgs: {
              Arg1: {
                kind: 'fixed',
                value: '1',
              },
            },
            cardKeywords: [
              {
                id: 'mechanic.retain',
              },
            ],
          },
        ],
      },
    ])

    expect(parsed[0]?.nodeKind).toBe('group')
    expect(parsed[0]?.childDerivedSkillIds).toHaveLength(2)
    expect(parsed[0]?.cardKeywords).toEqual([{id: 'mechanic.retain'}, {id: 'mechanic.exhaust'}])
    expect(parsed[0]?.variants).toHaveLength(1)
  })

  it('requires explicit card metadata arrays on card-like records', () => {
    const parsedSkills = awakenerSkillsDatasetSchema.parse([
      {
        id: 'skill.celeste.strike',
        ownerAwakenerId: 17,
        kind: 'strike',
        displayName: 'Strike',
        descriptionTemplate: 'Deal [Damage:Arg1] DMG.',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
    ])
    const parsedDerived = derivedSkillsDatasetSchema.parse([
      {
        id: 'derived.castor.onyx-plume',
        ownerAwakenerId: 8,
        displayName: 'Onyx Plume',
        descriptionTemplate: 'Deal [Damage:Arg1] DMG.',
        descriptionArgs: {},
        childDerivedSkillIds: [],
        cardKeywords: [],
        variants: [],
      },
    ])

    expect(parsedSkills[0]?.cardKeywords).toEqual([])
    expect(parsedDerived[0]?.cardKeywords).toEqual([])
    expect(parsedDerived[0]?.variants).toEqual([])
  })

  it('represents overlays separately from derived cards', () => {
    const parsed = awakenerOverlaysDatasetSchema.parse([
      {
        id: 'overlay.24.realm-effects',
        ownerAwakenerId: 24,
        displayName: 'Realm Effects',
        overlayType: 'realm',
        aliases: ['Realm Effect'],
        iconId: 'realm-effect',
        descriptionTemplate: '',
        descriptionArgs: {},
      },
    ])

    expect(parsed[0]?.overlayType).toBe('realm')
    expect(parsed[0]?.aliases).toEqual(['Realm Effect'])
    expect(parsed[0]?.iconId).toBe('realm-effect')
    expect(parsed[0]?.descriptionTemplate).toBe('')
  })

  it('represents explicit kit bindings separately from card identity', () => {
    const parsed = awakenerKitsDatasetSchema.parse([
      {
        awakenerId: 17,
        cards: {
          C1: 'skill.strike',
          C2: 'skill.defense',
          C3: 'skill.tintless-dream',
          C4: 'skill.undying-bird-of-paradise',
          C5: 'skill.some-future-card',
          Exalt: 'skill.celeste.exalt',
          promotedExtras: ['derived.daffodil.thousand-mirage'],
        },
        talents: {
          T1: 'talent.celeste.t1',
          T2: 'talent.celeste.t2',
          T3: 'talent.celeste.t3',
          extraTalentIds: [],
        },
        enlightens: {
          E1: 'enlighten.celeste.e1',
          E2: 'enlighten.celeste.e2',
          E3: 'enlighten.celeste.e3',
        },
      },
    ])

    expect(parsed[0]?.cards.C3).toBe('skill.tintless-dream')
    expect(parsed[0]?.talents.T2).toBe('talent.celeste.t2')
  })
})
