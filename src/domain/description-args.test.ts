import {describe, expect, it} from 'vitest'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'
import {PUBLIC_DATA_SCOPES, type PublicDataScope} from '@/data-access/public-data/contract'
import {loadPublicRecord} from '@/data-access/public-data/repository'

import type {AwakenerSkillRecord} from './awakener-source-schema'
import {resolveAwakenerFullRecord} from './awakeners-full-resolver'
import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  getDescriptionArgProgression,
  resolveDescriptionArg,
  resolveDescriptionArgs,
  resolveDescriptionTemplate,
} from './description-args'
import {
  createDescriptionArgTokenPattern,
  createPluralMacroPattern,
} from './description-token-grammar'
import type {PublicDescriptionArg} from './public-description-args'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'
import {adaptPublicV3TalentRecord} from './public-v3-awakener-record-adapters'

const DETAIL_DESCRIPTION_SCOPES: PublicDataScope[] = [...PUBLIC_DATA_SCOPES]
const DESCRIPTION_ARG_TOKEN_PATTERN = createDescriptionArgTokenPattern('g')
const PLURAL_MACRO_PATTERN = createPluralMacroPattern('g')

async function loadResolvedSkill(
  awakenerId: number,
  skillId: string,
): Promise<AwakenerSkillRecord> {
  const record = await loadPublicAwakenerDetailById(awakenerId)
  expect(record).toBeDefined()
  if (!record) {
    throw new Error(`Missing awakener ${String(awakenerId)}`)
  }

  const resolvedRecord = resolveAwakenerFullRecord(record).record
  const cards = [
    resolvedRecord.cards.C1,
    resolvedRecord.cards.C2,
    resolvedRecord.cards.C3,
    resolvedRecord.cards.C4,
    resolvedRecord.cards.C5,
    resolvedRecord.cards.Exalt,
    ...(resolvedRecord.cards.OverExalt ? [resolvedRecord.cards.OverExalt] : []),
  ]
  const skill = cards.find((entry) => entry.id === skillId)
  expect(skill).toBeDefined()
  if (!skill) {
    throw new Error(`Missing resolved skill ${skillId}`)
  }

  return skill
}

describe('description-args', () => {
  it('keeps public description arg tokens aligned with detail record args', async () => {
    const issues: string[] = []

    for (const scope of DETAIL_DESCRIPTION_SCOPES) {
      const records = await Promise.all(
        getPublicCatalogRecords(scope).map((entry) => loadPublicRecord(scope, entry.id)),
      )

      for (const record of records) {
        if (!record || typeof record.descriptionTemplate !== 'string') {
          continue
        }

        const descriptionArgs =
          typeof record.descriptionArgs === 'object'
            ? (record.descriptionArgs as Record<string, unknown>)
            : {}
        for (const match of record.descriptionTemplate.matchAll(DESCRIPTION_ARG_TOKEN_PATTERN)) {
          const argKey = match.groups?.argKey
          if (argKey && !Object.hasOwn(descriptionArgs, argKey)) {
            issues.push(`${record.id}: missing description arg ${argKey} for ${match[0]}`)
          }
        }

        let pluralIndex = record.descriptionTemplate.indexOf('{plural:')
        while (pluralIndex >= 0) {
          PLURAL_MACRO_PATTERN.lastIndex = pluralIndex
          const match = PLURAL_MACRO_PATTERN.exec(record.descriptionTemplate)
          if (match?.index !== pluralIndex) {
            issues.push(
              `${record.id}: malformed plural macro near ${record.descriptionTemplate.slice(pluralIndex, pluralIndex + 80)}`,
            )
          }
          pluralIndex = record.descriptionTemplate.indexOf('{plural:', pluralIndex + 1)
        }
      }
    }

    expect(issues).toEqual([])
  })

  it('resolves named public arg keys inside plural macros', async () => {
    const delayedSacrifice = await loadPublicRecord('overlays', 'overlay.global.delayed-sacrifice')
    expect(delayedSacrifice).toBeDefined()
    if (!delayedSacrifice) {
      throw new Error('Missing overlay.global.delayed-sacrifice')
    }

    const rendered = resolveDescriptionTemplate(
      delayedSacrifice.descriptionTemplate as string,
      delayedSacrifice.descriptionArgs as Record<string, PublicDescriptionArg>,
    )

    expect(rendered).toContain('gaining X stacks of the {Sacrifice} state')
    expect(rendered).not.toContain('plural:')
    expect(rendered).not.toContain('[Layer]')
  })

  it('resolves linear talent ladders across non-skill max levels', async () => {
    const talentRecord = await loadPublicRecord('talents', 'talent.xu.soulforge-aptitude')
    const talent = talentRecord ? adaptPublicV3TalentRecord(talentRecord) : undefined
    expect(talent).toBeDefined()
    if (!talent) {
      throw new Error('Missing talent.xu.soulforge-aptitude')
    }

    const resolvedArgs = resolveDescriptionArgs(talent.descriptionArgs, {rank: 4})

    expect(resolvedArgs.Arg1.totalValue).toBe(12)
    expect(resolvedArgs.Arg2.totalValue).toBe(200)
    expect(resolvedArgs.Arg3.totalValue).toBe(11)
    expect(
      resolveDescriptionTemplate(talent.descriptionTemplate, talent.descriptionArgs, {rank: 4}),
    ).toContain("This Awakener's CON, ATK, and DEF +12%")
    expect(
      resolveDescriptionTemplate(talent.descriptionTemplate, talent.descriptionArgs, {rank: 4}),
    ).toContain('they gain 200 Keyflare')
    expect(
      resolveDescriptionTemplate(talent.descriptionTemplate, talent.descriptionArgs, {rank: 4}),
    ).toContain("All Awakeners' {Poison} Trigger effect +11%.")
    expect(formatDescriptionArgProgression(talent.descriptionArgs.Arg1, {maxRank: 10})).toBe(
      '3 (+3/Lv)',
    )
    expect(
      getDescriptionArgProgression(talent.descriptionArgs.Arg3).map((entry) => entry.totalValue),
    ).toEqual([5, 7, 9, 11, 13, 15, 17, 19, 21, 25])
  })

  it('resolves substat-only args using the substat suffix when no base suffix exists', async () => {
    const skill = await loadResolvedSkill(9, 'skill.celeste.strike')

    const resolvedArg = resolveDescriptionArg(skill.descriptionArgs.Arg3, {
      stats: {
        RealmMastery: '120',
      },
    })

    expect(resolvedArg.baseValue).toBe(0)
    expect(resolvedArg.substatBonusValue).toBe(60)
    expect(resolvedArg.formattedTotalValue).toBe('60%')
    expect(
      resolveDescriptionTemplate(skill.descriptionTemplate, skill.descriptionArgs, {
        stats: {RealmMastery: '120'},
      }),
    ).toContain('dealing 60% {Tentacle DMG}.')
  })

  it('defaults ladder-backed percent effects to base scaling when substats enhance the base effect', async () => {
    const skill = await loadResolvedSkill(52, 'skill.wanda.necropolis-of-dreams')

    const resolvedArg = resolveDescriptionArg(skill.descriptionArgs.Arg2, {
      rank: 2,
      stats: {
        DamageAmplification: '20%',
        ATK: '140',
      },
    })

    expect(resolvedArg.baseValue).toBe(54)
    expect(resolvedArg.substatBonusValue).toBeCloseTo(8.1, 6)
    expect(resolvedArg.totalValue).toBeCloseTo(62.1, 6)
    expect(resolvedArg.formattedTotalValue).toBe('62.1% {ATK}')
    expect(resolvedArg.absoluteValue).toBe(87)
    expect(formatDescriptionArgProgression(skill.descriptionArgs.Arg2, {maxRank: 6})).toBe(
      '45% (+9%/Lv) {ATK}',
    )
    expect(
      buildDescriptionArgHover(skill.descriptionArgs.Arg2, {
        maxRank: 2,
        stats: {
          DamageAmplification: '20%',
          ATK: '140',
        },
      }),
    ).toBe(
      'Lv1: 51.8% ATK = 73 (45% ATK × 115% from Damage Amplification)\nLv2: 62.1% ATK = 87 (54% ATK × 115% from Damage Amplification)',
    )
  })

  it('supports multiplicative base scaling alongside additive flat substat expressions', async () => {
    const skill = await loadResolvedSkill(42, 'skill.ramona.queens-sword')

    const damageArg = resolveDescriptionArg(skill.descriptionArgs.Arg1, {
      rank: 1,
      stats: {
        KeyflareRegen: '30',
      },
    })
    const realmMasteryArg = resolveDescriptionArg(skill.descriptionArgs.Arg7, {
      stats: {
        KeyflareRegen: '30',
      },
    })

    expect(damageArg.totalValue).toBe(19.5)
    expect(damageArg.formattedTotalValue).toBe('19.5% {ATK}')
    expect(realmMasteryArg.totalValue).toBe(22.5)
    expect(realmMasteryArg.formattedTotalValue).toBe('23')
    expect(
      resolveDescriptionTemplate(skill.descriptionTemplate, skill.descriptionArgs, {
        rank: 1,
        stats: {KeyflareRegen: '30'},
      }),
    ).toContain('Deal 19.5% {ATK} DMG 2 times.')
    expect(
      resolveDescriptionTemplate(skill.descriptionTemplate, skill.descriptionArgs, {
        rank: 1,
        stats: {KeyflareRegen: '30'},
      }),
    ).toContain('Gain 23 Temporary Realm Mastery.')
  })

  it('uses a single formula hover for fixed args with substat scaling', async () => {
    const skill = await loadResolvedSkill(6, 'skill.caecus.strike')

    expect(
      buildDescriptionArgHover(skill.descriptionArgs.Arg3, {
        rank: 1,
        stats: {SigilYield: '14.4%'},
      }),
    ).toBe('Sigil Yield × 1%')
  })

  it('ceil-displays pure substat-only fixed args while keeping formula hover intact', () => {
    const resolvedArg = resolveDescriptionArg(
      {
        kind: 'fixed',
        value: '0',
        suffix: '%',
        substatBonus: {
          substat: 'KeyflareRegen',
          multiplier: '0.2',
        },
      },
      {
        stats: {
          KeyflareRegen: '46',
        },
      },
    )

    expect(resolvedArg.totalValue).toBeCloseTo(9.2, 6)
    expect(resolvedArg.formattedTotalValue).toBe('10%')
    expect(
      buildDescriptionArgHover(
        {
          kind: 'fixed',
          value: '0',
          substatBonus: {
            substat: 'KeyflareRegen',
            multiplier: '0.2',
          },
        },
        {
          stats: {
            KeyflareRegen: '46',
          },
        },
      ),
    ).toBe('Keyflare Regen × 0.2')
  })

  it('ceil-displays fixed scale-base passive effects while keeping formula hover precise', () => {
    const arg: PublicDescriptionArg = {
      kind: 'fixed',
      value: '20',
      suffix: '%',
      substatBonus: {
        substat: 'DeathResistance',
        multiplier: '0.1',
        mode: 'scale_base',
      },
    }

    const resolvedArg = resolveDescriptionArg(arg, {
      stats: {
        DeathResistance: '33.6%',
      },
    })

    expect(resolvedArg.totalValue).toBeCloseTo(20.672, 6)
    expect(resolvedArg.formattedTotalValue).toBe('21%')
    expect(
      buildDescriptionArgHover(arg, {
        stats: {
          DeathResistance: '33.6%',
        },
      }),
    ).toBe('20% × 103.4% from Death Resistance')
  })

  it('ceil-displays Sanga talent-enhanced Aliemus scaling', async () => {
    const skill = await loadResolvedSkill(45, 'skill.sanga.strike')

    const rendered = resolveDescriptionTemplate(skill.descriptionTemplate, skill.descriptionArgs, {
      rank: 1,
      stats: {
        DeathResistance: '33.6%',
      },
    })

    expect(rendered).toContain('Sanga obtains 7 Aliemus.')
  })

  it('supports additive-factor substat bonuses from Arachne enlighten patches', async () => {
    const record = await loadPublicAwakenerDetailById(56)
    expect(record).toBeDefined()
    if (!record) {
      throw new Error('Missing Arachne public V3 record')
    }

    const resolvedRecord = resolveAwakenerFullRecord(record, {
      selectedEnlightenSlot: 'E3',
    }).record

    const rendered = resolveDescriptionTemplate(
      resolvedRecord.cards.Exalt.descriptionTemplate,
      resolvedRecord.cards.Exalt.descriptionArgs,
      {
        rank: 5,
        stats: {
          RealmMastery: '24',
        },
      },
    )

    expect(rendered).toContain('Gain +125% Temporary DMG Amplification')
  })

  it('renders Agrippa T1 skill-side substat bonuses on Pale Blessing', async () => {
    const skill = await loadResolvedSkill(2, 'skill.agrippa.pale-blessing')

    const rendered = resolveDescriptionTemplate(skill.descriptionTemplate, skill.descriptionArgs, {
      rank: 1,
      stats: {
        SigilYield: '3.6%',
      },
    })

    expect(rendered).toContain('Gain 40.7% {DEF} Shield.')
    expect(rendered).toContain('Inflict 77.7% {ATK} stacks of {Poison} on all enemies.')
  })

  it('renders public detail upgrade patch templates with resolved arg totals', async () => {
    const xu = await loadPublicAwakenerDetailById(54)
    if (!xu) {
      throw new Error('Missing Xu public V3 record')
    }

    const bonesick = xu.cards.C4
    const upgrade = bonesick.upgrades?.find(
      (entry) => entry.upgraderId === 'enlighten.xu.enmity-of-the-heart',
    )
    const descriptionArgs = upgrade?.patch?.descriptionArgs
    const descriptionTemplate = upgrade?.patch?.descriptionTemplate
    expect(descriptionArgs).toBeDefined()
    expect(descriptionTemplate).toBeDefined()
    if (
      typeof descriptionTemplate !== 'string' ||
      typeof descriptionArgs !== 'object' ||
      !descriptionArgs
    ) {
      throw new Error('Missing Xu E3 patch payload')
    }

    const rendered = resolveDescriptionTemplate(
      descriptionTemplate,
      descriptionArgs as Parameters<typeof resolveDescriptionTemplate>[1],
      {
        stats: {
          DamageAmplification: '25%',
        },
      },
    )

    expect(rendered).toContain('{Embryo Fusion}+ 20.')
  })

  it('preserves symbolic placeholder args instead of crashing the resolver', () => {
    const rendered = resolveDescriptionTemplate(
      'Gain [Arg1] Tentacle DMG and [Arg2] Shield.',
      {
        Arg1: {
          kind: 'fixed',
          value: 'X',
          suffix: '%',
        },
        Arg2: {
          kind: 'fixed',
          value: 'X',
        },
      },
      {},
    )

    const resolvedArg = resolveDescriptionArg({
      kind: 'fixed',
      value: 'X',
      suffix: '%',
    })

    expect(rendered).toBe('Gain X% Tentacle DMG and X Shield.')
    expect(resolvedArg.baseValue).toBeNull()
    expect(resolvedArg.totalValue).toBeNull()
    expect(resolvedArg.formattedTotalValue).toBe('X%')
    expect(formatDescriptionArgProgression({kind: 'fixed', value: 'X'})).toBe('X')
  })

  it('omits stat braces in interactive hover text', () => {
    expect(
      buildDescriptionArgHover(
        {
          kind: 'scaling',
          values: ['14.4', '28.8'],
          suffix: '%',
          stat: 'ATK',
        },
        {
          stats: {
            ATK: '104',
          },
        },
      ),
    ).toContain('Lv2: 28.8% ATK = 30')
  })

  it('resolves public V3 braced-channel args and text macros in fallback descriptions', () => {
    const rendered = resolveDescriptionTemplate(
      'Inflict [{Poison}:Arg1] {plural:[{Poison}:Arg1]|stack|stacks} on the {ordinal:3rd} play.',
      {
        Arg1: {
          kind: 'fixed',
          value: '2',
        },
      },
    )

    expect(rendered).toBe('Inflict 2 stacks on the 3rd play.')
  })

  it('leaves unknown and malformed public V3 arg tokens unchanged', () => {
    const rendered = resolveDescriptionTemplate(
      'Gain [Missing] and [Bad-Key]. {plural:[Missing]|stack|stacks}',
      {
        Arg1: {
          kind: 'fixed',
          value: '2',
        },
      },
    )

    expect(rendered).toBe('Gain [Missing] and [Bad-Key]. {plural:[Missing]|stack|stacks}')
  })

  it('resolves adjacent description arg tokens without swallowing separators', () => {
    const rendered = resolveDescriptionTemplate('[Arg1][Arg2] [Arg1]% [Arg3]%', {
      Arg1: {
        kind: 'fixed',
        value: '5',
        suffix: '%',
      },
      Arg2: {
        kind: 'fixed',
        value: 'X',
      },
      Arg3: {
        kind: 'fixed',
        value: '10',
        suffix: '%',
      },
    })

    expect(rendered).toBe('5%X 5% 10%')
  })

  it('chooses plural macros from absolute stat-scaled values', () => {
    const rendered = resolveDescriptionTemplate(
      'Inflict [Arg1] {plural:[Arg1]|stack|stacks}.',
      {
        Arg1: {
          kind: 'fixed',
          value: '1',
          suffix: '%',
          stat: 'ATK',
        },
      },
      {
        stats: {
          ATK: '200',
        },
      },
    )

    expect(rendered).toBe('Inflict 1% {ATK} stacks.')
  })

  it('explains scaled computed formula hovers with player-facing math labels', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'scaled',
      baseFormula: 'occultResearchDepth',
      multiplier: 0.045,
      inputs: ['accountLevel', 'ownedPosseCount'],
    }

    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {
          accountLevel: 75,
          ownedPosseCount: 42,
        },
      }),
    ).toBe(
      [
        'Forbidden Lore Scaling',
        'Base (Account Lv 75): Occult Research 3,579 × 4.5% = 162',
        'Astral Reign: 42 Posses add +42% to Research → 229',
      ].join('\n'),
    )
  })

  it('shows the normal value first and Astral Reign value second for Forbidden Lore scaling', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'scaled',
      baseFormula: 'esotericResearchDepth',
      multiplier: 0.04,
      inputs: ['accountLevel', 'ownedPosseCount'],
    }

    const context = {
      formulaContext: {
        accountLevel: 67,
        ownedPosseCount: 28,
      },
    }

    expect(resolveDescriptionTemplate('{Steal} [Arg1] {STR}', {Arg1: arg}, context)).toBe(
      '{Steal} 36 (46) {STR}',
    )
    expect(buildDescriptionArgHover(arg, context)).toBe(
      [
        'Forbidden Lore Scaling',
        'Base (Account Lv 67): Esoteric Research 897 × 4% = 36',
        'Astral Reign: 28 Posses add +28% to Research → 46',
      ].join('\n'),
    )
  })

  it('explains Forbidden Lore research conversions without percent-looking multipliers', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'scaled',
      baseFormula: 'somaticResearchHpMultiplier',
      multiplier: 100,
      inputs: ['accountLevel'],
    }

    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {
          accountLevel: 67,
        },
      }),
    ).toBe(
      [
        'Forbidden Lore Scaling',
        'Account Lv 67: Somatic Research 2.5',
        'Effect multiplier: ×100',
        '',
        '2.5 × 100 = 250',
      ].join('\n'),
    )
  })

  it('keeps the scaled formula explanation generic when there is no posse bonus', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'scaled',
      baseFormula: 'accountStageGrowth',
      multiplier: 0.045,
      inputs: ['accountLevel'],
    }

    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {
          accountLevel: 75,
          ownedPosseCount: 42,
        },
      }),
    ).toBe(
      [
        'Account Growth Bonus',
        'Account Lv 75: 1,011 base growth',
        'Effect multiplier: 4.5%',
        '',
        '1,011 × 4.5% = 46',
      ].join('\n'),
    )
  })
})
