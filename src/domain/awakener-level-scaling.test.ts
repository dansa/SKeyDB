import {describe, expect, it} from 'vitest'

import {
  clampAwakenerDatabaseLevel,
  clampAwakenerDatabasePsycheSurgeOffset,
  resolveAwakenerStatsForLevel,
} from './awakener-level-scaling'
import {loadAwakenersFull, type AwakenerFull} from './awakeners-full'

const CANONICAL_LEVEL_ONE_SUBSTATS = {
  CritRate: '5%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '15',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
} as const

const CANONICAL_SUBSTAT_SUFFIXES = {
  CritRate: '%',
  CritDamage: '%',
  AliemusRegen: '',
  KeyflareRegen: '',
  RealmMastery: '',
  SigilYield: '%',
  DamageAmplification: '%',
  DeathResistance: '%',
} as const

const CANONICAL_MADNESS_OMEN_DESCRIPTION =
  '(Max level: 12) Obtain (5 per talent level) Aliemus after the start of exploration.'

function makeAwakener(overrides?: Partial<AwakenerFull>): AwakenerFull {
  return {
    id: 999,
    name: 'test awakener',
    aliases: ['test awakener'],
    faction: 'Test',
    realm: 'CHAOS',
    rarity: 'SSR',
    type: 'ASSAULT',
    tags: [],
    stats: {
      CON: '140',
      ATK: '135',
      DEF: '126',
      CritRate: '14.6%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    },
    primaryScalingBase: 30,
    statScaling: {
      CON: 1.55,
      ATK: 1.5,
      DEF: 1.4,
    },
    substatScaling: {
      CritRate: '1.6%',
    },
    cards: {},
    exalts: {
      exalt: {name: 'Exalt', description: 'x'},
      over_exalt: {name: 'Over Exalt', description: 'x'},
    },
    talents: {},
    enlightens: {},
    ...overrides,
  } as AwakenerFull
}

describe('clampAwakenerDatabaseLevel', () => {
  it('clamps database levels to the 1-90 range', () => {
    expect(clampAwakenerDatabaseLevel(-5)).toBe(1)
    expect(clampAwakenerDatabaseLevel(1)).toBe(1)
    expect(clampAwakenerDatabaseLevel(60)).toBe(60)
    expect(clampAwakenerDatabaseLevel(90)).toBe(90)
    expect(clampAwakenerDatabaseLevel(999)).toBe(90)
  })
})

describe('clampAwakenerDatabasePsycheSurgeOffset', () => {
  it('clamps database Psyche Surge offsets to the E3+0 to E3+12 range', () => {
    expect(clampAwakenerDatabasePsycheSurgeOffset(-3)).toBe(0)
    expect(clampAwakenerDatabasePsycheSurgeOffset(0)).toBe(0)
    expect(clampAwakenerDatabasePsycheSurgeOffset(7)).toBe(7)
    expect(clampAwakenerDatabasePsycheSurgeOffset(12)).toBe(12)
    expect(clampAwakenerDatabasePsycheSurgeOffset(99)).toBe(12)
  })
})

describe('resolveAwakenerStatsForLevel', () => {
  it('computes primary stats from the explicit scaling base and rewinds substats by 10-level steps', () => {
    const awakener = makeAwakener()

    expect(resolveAwakenerStatsForLevel(awakener, 90)).toEqual({
      CON: '186',
      ATK: '180',
      DEF: '168',
      CritRate: '14.6%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    })

    expect(resolveAwakenerStatsForLevel(awakener, 1)).toEqual({
      CON: '49',
      ATK: '47',
      DEF: '44',
      CritRate: '5%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    })
  })

  it('caps substat step gains after level 60', () => {
    const awakener = makeAwakener({
      stats: {
        CON: '140',
        ATK: '135',
        DEF: '126',
        CritRate: '5%',
        CritDamage: '50%',
        AliemusRegen: '2.4',
        KeyflareRegen: '15',
        RealmMastery: '0',
        SigilYield: '0%',
        DamageAmplification: '0%',
        DeathResistance: '0%',
      },
      substatScaling: {
        AliemusRegen: '0.4',
      },
    })

    expect(resolveAwakenerStatsForLevel(awakener, 60).AliemusRegen).toBe('2.4')
    expect(resolveAwakenerStatsForLevel(awakener, 90).AliemusRegen).toBe('2.4')
    expect(resolveAwakenerStatsForLevel(awakener, 1).AliemusRegen).toBe('0')
  })

  it('applies Psyche Surge offsets on top of the level-based substat steps', () => {
    const awakener = makeAwakener()

    expect(resolveAwakenerStatsForLevel(awakener, 60, 0).CritRate).toBe('14.6%')
    expect(resolveAwakenerStatsForLevel(awakener, 60, 12).CritRate).toBe('33.8%')
    expect(resolveAwakenerStatsForLevel(awakener, 1, 12).CritRate).toBe('24.2%')
    expect(resolveAwakenerStatsForLevel(awakener, 60, 12).CON).toBe('140')
  })
})

describe('awakeners full data', () => {
  it('stores explicit level scaling metadata instead of embedding growth hints in stat strings', async () => {
    const data = await loadAwakenersFull()

    for (const awakener of data) {
      const typedAwakener = awakener as AwakenerFull & {
        primaryScalingBase?: number
        statScaling?: {CON: number; ATK: number; DEF: number}
        substatScaling?: Record<string, string>
      }

      expect(typedAwakener.primaryScalingBase).toBeDefined()
      expect([20, 30]).toContain(typedAwakener.primaryScalingBase)
      expect(typedAwakener.statScaling).toEqual({
        CON: expect.any(Number),
        ATK: expect.any(Number),
        DEF: expect.any(Number),
      })
      expect(typedAwakener.substatScaling).toEqual(expect.any(Object))
      expect(Object.values(typedAwakener.stats).some((value) => value.includes('(+'))).toBe(false)
    }
  })

  it('keeps every stored Lv. 60 primary stat aligned with the scaling base formula', async () => {
    const data = await loadAwakenersFull()

    for (const awakener of data) {
      const resolvedAt60 = resolveAwakenerStatsForLevel(awakener, 60)

      expect(resolvedAt60.CON).toBe(awakener.stats.CON)
      expect(resolvedAt60.ATK).toBe(awakener.stats.ATK)
      expect(resolvedAt60.DEF).toBe(awakener.stats.DEF)
    }
  })

  it('fills the remaining mouchette and vortice substat scaling gaps with sane Lv. 1 values', async () => {
    const data = await loadAwakenersFull()
    const mouchette = data.find((awakener) => awakener.name === 'mouchette')
    const vortice = data.find((awakener) => awakener.name === 'vortice')

    expect(mouchette?.substatScaling).toEqual({
      AliemusRegen: '0.4',
      DeathResistance: '5.6%',
    })
    expect(vortice?.substatScaling).toEqual({
      KeyflareRegen: '1.2',
      RealmMastery: '4',
    })

    expect(mouchette ? resolveAwakenerStatsForLevel(mouchette, 1) : null).toEqual(
      expect.objectContaining({
        AliemusRegen: '0',
        DeathResistance: '0%',
      }),
    )
    expect(vortice ? resolveAwakenerStatsForLevel(vortice, 1) : null).toEqual(
      expect.objectContaining({
        KeyflareRegen: '15',
        RealmMastery: '0',
      }),
    )
  })

  it('matches ingame-confirmed Lv. 1 and Lv. 60 primary stats for clementine, pollux, and wanda', async () => {
    const data = await loadAwakenersFull()
    const clementine = data.find((awakener) => awakener.name === 'clementine')
    const pollux = data.find((awakener) => awakener.name === 'pollux')
    const wanda = data.find((awakener) => awakener.name === 'wanda')

    expect(clementine ? resolveAwakenerStatsForLevel(clementine, 1) : null).toEqual(
      expect.objectContaining({
        CON: '44',
        ATK: '52',
        DEF: '42',
      }),
    )
    expect(clementine?.stats).toEqual(
      expect.objectContaining({
        CON: '126',
        ATK: '149',
        DEF: '122',
      }),
    )

    expect(pollux ? resolveAwakenerStatsForLevel(pollux, 1) : null).toEqual(
      expect.objectContaining({
        CON: '49',
        ATK: '55',
        DEF: '47',
      }),
    )
    expect(pollux?.stats).toEqual(
      expect.objectContaining({
        CON: '140',
        ATK: '158',
        DEF: '135',
      }),
    )

    expect(wanda ? resolveAwakenerStatsForLevel(wanda, 1) : null).toEqual(
      expect.objectContaining({
        CON: '55',
        ATK: '35',
        DEF: '64',
      }),
    )
    expect(wanda?.stats).toEqual(
      expect.objectContaining({
        CON: '158',
        ATK: '99',
        DEF: '185',
      }),
    )
  })

  it('matches confirmed 10-level Pollux and Wanda stat progressions', async () => {
    const data = await loadAwakenersFull()
    const pollux = data.find((awakener) => awakener.name === 'pollux')
    const wanda = data.find((awakener) => awakener.name === 'wanda')
    if (!pollux || !wanda) {
      throw new Error('Expected Pollux and Wanda in awakener full data')
    }

    expect(pollux.statScaling.ATK).toBe(1.75)
    expect(
      [1, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(
        (level) => resolveAwakenerStatsForLevel(pollux, level).ATK,
      ),
    ).toEqual(['55', '70', '88', '105', '123', '140', '158', '175', '193', '210'])

    expect(wanda.statScaling.ATK).toBe(1.1)
    expect(
      [1, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(
        (level) => resolveAwakenerStatsForLevel(wanda, level).ATK,
      ),
    ).toEqual(['35', '44', '55', '66', '77', '88', '99', '110', '121', '132'])
  })

  it('rewinds every secondary stat back to the canonical Lv. 1 defaults', async () => {
    const data = await loadAwakenersFull()
    const mismatches: string[] = []

    for (const awakener of data) {
      const resolvedAtLevelOne = resolveAwakenerStatsForLevel(awakener, 1)

      for (const [key, expectedValue] of Object.entries(CANONICAL_LEVEL_ONE_SUBSTATS)) {
        const statKey = key as keyof typeof CANONICAL_LEVEL_ONE_SUBSTATS
        if (resolvedAtLevelOne[statKey] !== expectedValue) {
          mismatches.push(
            `${awakener.name}.${statKey}: ${resolvedAtLevelOne[statKey]} != ${expectedValue}`,
          )
        }
      }
    }

    expect(mismatches).toEqual([])
  })

  it('keeps stored substat values and growth metadata aligned with their canonical units', async () => {
    const data = await loadAwakenersFull()
    const mismatches: string[] = []

    for (const awakener of data) {
      for (const [key, expectedSuffix] of Object.entries(CANONICAL_SUBSTAT_SUFFIXES)) {
        const statKey = key as keyof typeof CANONICAL_SUBSTAT_SUFFIXES
        const statValue = awakener.stats[statKey]
        const growthValue = awakener.substatScaling[statKey]

        if (!statValue.endsWith(expectedSuffix)) {
          mismatches.push(`${awakener.name}.stats.${statKey}: ${statValue}`)
        }
        if (growthValue && !growthValue.endsWith(expectedSuffix)) {
          mismatches.push(`${awakener.name}.substatScaling.${statKey}: ${growthValue}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })

  it('keeps Salvador talent data and Madness Omen descriptions aligned with the canon text', async () => {
    const data = await loadAwakenersFull()
    const salvador = data.find((awakener) => awakener.name === 'salvador')
    const mismatches: string[] = []

    expect(salvador?.talents.T4).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        description: expect.any(String),
      }),
    )

    for (const awakener of data) {
      for (const [key, talent] of Object.entries(awakener.talents)) {
        if (talent.name !== 'Madness Omen') {
          continue
        }
        if (talent.description !== CANONICAL_MADNESS_OMEN_DESCRIPTION) {
          mismatches.push(`${awakener.name}.${key}: ${talent.description}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })

  it('strips redundant innate prefixes from talent descriptions', async () => {
    const data = await loadAwakenersFull()
    const mismatches: string[] = []

    for (const awakener of data) {
      for (const [key, talent] of Object.entries(awakener.talents)) {
        if (talent.description.startsWith('(Max level: 1)')) {
          mismatches.push(`${awakener.name}.${key}: ${talent.description}`)
          continue
        }
        if (talent.description.startsWith('Innate:')) {
          mismatches.push(`${awakener.name}.${key}: ${talent.description}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })
})
