import {describe, expect, it} from 'vitest'

import type {AwakenerSkillRecord} from './awakener-source-schema'
import {getAwakenerTalentById, getAwakenerTalents} from './awakener-talents'
import {resolveAwakenerFullRecord} from './awakeners-full-resolver'
import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  getDescriptionArgProgression,
  resolveDescriptionArg,
  resolveDescriptionArgs,
  resolveDescriptionTemplate,
} from './description-args'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'

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
  it('resolves linear talent ladders across non-skill max levels', () => {
    const talent = getAwakenerTalentById('talent.xu.soulforge-aptitude', getAwakenerTalents())
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

    expect(resolvedArg.baseValue).toBe(36)
    expect(resolvedArg.substatBonusValue).toBeCloseTo(5.4, 6)
    expect(resolvedArg.totalValue).toBeCloseTo(41.4, 6)
    expect(resolvedArg.formattedTotalValue).toBe('41.4% {ATK}')
    expect(resolvedArg.absoluteValue).toBe(58)
    expect(formatDescriptionArgProgression(skill.descriptionArgs.Arg2, {maxRank: 6})).toBe(
      '30% (+6%/Lv) {ATK}',
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
      'Lv1: 34.5% ATK = 49 (30% ATK × 115% from Damage Amplification)\nLv2: 41.4% ATK = 58 (36% ATK × 115% from Damage Amplification)',
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
      throw new Error('Missing Arachne public V2 record')
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

    expect(rendered).toContain('Temporary DMG Amplification +125%')
  })

  it('renders Agrippa T1 skill-side substat bonuses on Pale Blessing', async () => {
    const skill = await loadResolvedSkill(2, 'skill.agrippa.pale-blessing')

    const rendered = resolveDescriptionTemplate(skill.descriptionTemplate, skill.descriptionArgs, {
      rank: 1,
      stats: {
        SigilYield: '3.6%',
      },
    })

    expect(rendered).toContain('Gain 33.1% {DEF} Shield.')
    expect(rendered).toContain('Inflict 51.8% {ATK} stacks of {Poison} on all enemies.')
  })

  it('renders public detail upgrade patch templates with resolved arg totals', async () => {
    const xu = await loadPublicAwakenerDetailById(54)
    if (!xu) {
      throw new Error('Missing Xu public V2 record')
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

    expect(rendered).toContain('{Embryo Fusion} +20%.')
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

  it('resolves public V2 braced-channel args and text macros in fallback descriptions', () => {
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
})
