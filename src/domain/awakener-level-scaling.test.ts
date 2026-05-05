import {describe, expect, it} from 'vitest'

import {
  clampAwakenerDatabaseLevel,
  clampAwakenerDatabasePsycheSurgeOffset,
  resolveAwakenerStatsForLevel,
} from './awakener-level-scaling'
import {getAwakeners} from './awakeners'
import {type AwakenerFullRecord} from './awakeners-full'
import {getAwakenersLite} from './awakeners-lite'
import {resolveDescribedRecord} from './description-records'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'

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

type StatScaledAwakener = Pick<
  AwakenerFullRecord,
  'displayName' | 'stats' | 'primaryScalingBase' | 'statScaling' | 'substatScaling'
> & {
  talents: {displayName: string; descriptionTemplate: string}[]
}

function makeAwakener(overrides?: Partial<StatScaledAwakener>): StatScaledAwakener {
  return {
    displayName: 'test awakener',
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
    talents: [],
    ...overrides,
  }
}

async function loadAwakenersFullV2(): Promise<AwakenerFullRecord[]> {
  return Promise.all(
    getAwakenersLite().map(async (awakener) => {
      const record = await loadPublicAwakenerDetailById(awakener.id)
      if (!record) {
        throw new Error(`Missing public V2 awakener ${String(awakener.id)}`)
      }
      return record
    }),
  )
}

function findAwakenerByName(
  awakeners: AwakenerFullRecord[],
  displayName: string,
): AwakenerFullRecord | undefined {
  const normalizedName = displayName.toLowerCase()
  return awakeners.find((awakener) => awakener.displayName.toLowerCase() === normalizedName)
}

function getTalentEntries(awakener: Pick<AwakenerFullRecord, 'talents'>): {
  key: string
  displayName: string
  descriptionTemplate: string
  talent: NonNullable<AwakenerFullRecord['talents']['T1']>
}[] {
  const entries: {
    key: string
    displayName: string
    descriptionTemplate: string
    talent: NonNullable<AwakenerFullRecord['talents']['T1']>
  }[] = []

  for (const [slot, talent] of [
    ['T1', awakener.talents.T1],
    ['T2', awakener.talents.T2],
    ['T3', awakener.talents.T3],
    ['T4', awakener.talents.T4],
  ] as const) {
    if (talent) {
      entries.push({
        key: slot,
        displayName: talent.displayName,
        descriptionTemplate: talent.descriptionTemplate,
        talent,
      })
    }
  }

  for (const [index, talent] of awakener.talents.extraTalents.entries()) {
    entries.push({
      key: `extraTalents[${String(index)}]`,
      displayName: talent.displayName,
      descriptionTemplate: talent.descriptionTemplate,
      talent,
    })
  }

  return entries
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

describe('awakeners full v2 data', () => {
  it('stores explicit level scaling metadata instead of embedding growth hints in stat strings', async () => {
    const data = await loadAwakenersFullV2()

    for (const awakener of data) {
      expect(awakener.primaryScalingBase).toBeDefined()
      expect([20, 30]).toContain(awakener.primaryScalingBase)
      expect(awakener.statScaling).toEqual({
        CON: expect.any(Number),
        ATK: expect.any(Number),
        DEF: expect.any(Number),
      })
      expect(awakener.substatScaling).toEqual(expect.any(Object))
      expect(Object.values(awakener.stats).some((value) => value.includes('(+'))).toBe(false)
    }
  })

  it('keeps every stored Lv. 1 primary stat aligned with the scaling base formula', async () => {
    const data = await loadAwakenersFullV2()

    for (const awakener of data) {
      const resolvedAtLevelOne = resolveAwakenerStatsForLevel(awakener, 1)

      expect(resolvedAtLevelOne.CON).toBe(awakener.stats.CON)
      expect(resolvedAtLevelOne.ATK).toBe(awakener.stats.ATK)
      expect(resolvedAtLevelOne.DEF).toBe(awakener.stats.DEF)
    }
  })

  it('keeps lite and public awakener identity aligned by id and name', async () => {
    const fullData = await loadAwakenersFullV2()
    const liteData = getAwakeners()
    const liteById = new Map(liteData.map((awakener) => [awakener.numericId, awakener]))
    const mismatches: string[] = []

    for (const fullAwakener of fullData) {
      const liteAwakener = liteById.get(fullAwakener.id)
      if (!liteAwakener) {
        mismatches.push(`${String(fullAwakener.id)}:${fullAwakener.displayName} missing in lite`)
        continue
      }
      if (!liteAwakener.aliases.includes(fullAwakener.displayName)) {
        mismatches.push(
          `${String(fullAwakener.id)} display alias missing ${fullAwakener.displayName} from ${liteAwakener.name}`,
        )
      }
    }

    expect(mismatches).toEqual([])
  })

  it('keeps lite and public primary CON/ATK/DEF stats aligned by awakener id', async () => {
    const fullData = await loadAwakenersFullV2()
    const liteData = getAwakeners()
    const liteById = new Map(liteData.map((awakener) => [awakener.numericId, awakener]))
    const mismatches: string[] = []

    for (const fullAwakener of fullData) {
      const liteAwakener = liteById.get(fullAwakener.id)
      if (!liteAwakener?.stats) {
        mismatches.push(`${String(fullAwakener.id)}:${fullAwakener.displayName} missing lite stats`)
        continue
      }

      if (fullAwakener.stats.CON !== String(liteAwakener.stats.CON)) {
        mismatches.push(
          `${String(fullAwakener.id)}:${fullAwakener.displayName} CON ${fullAwakener.stats.CON} != ${String(liteAwakener.stats.CON)}`,
        )
      }
      if (fullAwakener.stats.ATK !== String(liteAwakener.stats.ATK)) {
        mismatches.push(
          `${String(fullAwakener.id)}:${fullAwakener.displayName} ATK ${fullAwakener.stats.ATK} != ${String(liteAwakener.stats.ATK)}`,
        )
      }
      if (fullAwakener.stats.DEF !== String(liteAwakener.stats.DEF)) {
        mismatches.push(
          `${String(fullAwakener.id)}:${fullAwakener.displayName} DEF ${fullAwakener.stats.DEF} != ${String(liteAwakener.stats.DEF)}`,
        )
      }
    }

    expect(mismatches).toEqual([])
  })

  it('fills the remaining mouchette and vortice substat scaling gaps with sane Lv. 1 values', async () => {
    const data = await loadAwakenersFullV2()
    const mouchette = findAwakenerByName(data, 'Mouchette')
    const vortice = findAwakenerByName(data, 'Vortice')

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
    const data = await loadAwakenersFullV2()
    const clementine = findAwakenerByName(data, 'Clementine')
    const pollux = findAwakenerByName(data, 'Pollux')
    const wanda = findAwakenerByName(data, 'Wanda')

    expect(clementine ? resolveAwakenerStatsForLevel(clementine, 1) : null).toEqual(
      expect.objectContaining({
        CON: '44',
        ATK: '52',
        DEF: '42',
      }),
    )
    expect(clementine ? resolveAwakenerStatsForLevel(clementine, 60) : null).toEqual(
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
    expect(pollux ? resolveAwakenerStatsForLevel(pollux, 60) : null).toEqual(
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
    expect(wanda ? resolveAwakenerStatsForLevel(wanda, 60) : null).toEqual(
      expect.objectContaining({
        CON: '158',
        ATK: '99',
        DEF: '185',
      }),
    )
  })

  it('matches confirmed 10-level Pollux and Wanda stat progressions', async () => {
    const data = await loadAwakenersFullV2()
    const pollux = findAwakenerByName(data, 'Pollux')
    const wanda = findAwakenerByName(data, 'Wanda')
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
    const data = await loadAwakenersFullV2()
    const mismatches: string[] = []

    for (const awakener of data) {
      const resolvedAtLevelOne = resolveAwakenerStatsForLevel(awakener, 1)

      for (const [key, expectedValue] of Object.entries(CANONICAL_LEVEL_ONE_SUBSTATS)) {
        const statKey = key as keyof typeof CANONICAL_LEVEL_ONE_SUBSTATS
        if (resolvedAtLevelOne[statKey] !== expectedValue) {
          mismatches.push(
            `${awakener.displayName}.${statKey}: ${resolvedAtLevelOne[statKey]} != ${expectedValue}`,
          )
        }
      }
    }

    expect(mismatches).toEqual([])
  })

  it('keeps stored substat values and growth metadata aligned with their canonical units', async () => {
    const data = await loadAwakenersFullV2()
    const mismatches: string[] = []

    for (const awakener of data) {
      for (const [key, expectedSuffix] of Object.entries(CANONICAL_SUBSTAT_SUFFIXES)) {
        const statKey = key as keyof typeof CANONICAL_SUBSTAT_SUFFIXES
        const statValue = awakener.stats[statKey]
        const growthValue = awakener.substatScaling[statKey]

        if (!statValue.endsWith(expectedSuffix)) {
          mismatches.push(`${awakener.displayName}.stats.${statKey}: ${statValue}`)
        }
        if (growthValue && !growthValue.endsWith(expectedSuffix)) {
          mismatches.push(`${awakener.displayName}.substatScaling.${statKey}: ${growthValue}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })

  it('keeps Salvador talent data and Madness Omen ladders aligned with the public template model', async () => {
    const data = await loadAwakenersFullV2()
    const salvador = findAwakenerByName(data, 'Salvador')
    const mismatches: string[] = []

    expect(salvador?.talents.T2).toEqual(
      expect.objectContaining({
        id: 'talent.salvador.madness-omen',
        displayName: expect.any(String),
        descriptionTemplate: expect.any(String),
      }),
    )

    for (const awakener of data) {
      for (const talentEntry of getTalentEntries(awakener)) {
        const {key, displayName, descriptionTemplate, talent} = talentEntry
        if (displayName !== 'Madness Omen') {
          continue
        }
        const resolvedAtLevelOne = resolveDescribedRecord(talent, {
          rank: 1,
        }).description
        const resolvedAtMaxLevel = resolveDescribedRecord(talent, {
          rank: talent.maxLevel ?? 1,
        }).description

        if (
          talent.maxLevel !== 12 ||
          !descriptionTemplate.includes('[Arg1]') ||
          !resolvedAtLevelOne.includes('5 Aliemus') ||
          !resolvedAtMaxLevel.includes('60 Aliemus')
        ) {
          mismatches.push(
            `${awakener.displayName}.${key}: ${descriptionTemplate} | ${resolvedAtLevelOne} | ${resolvedAtMaxLevel}`,
          )
        }
      }
    }

    expect(mismatches).toEqual([])
  })

  it('does not synthesize private talent description cleanup in the website', async () => {
    const data = await loadAwakenersFullV2()
    const mismatches: string[] = []

    for (const awakener of data) {
      for (const {key, descriptionTemplate} of getTalentEntries(awakener)) {
        if (descriptionTemplate.startsWith('(Max level: 1)')) {
          mismatches.push(`${awakener.displayName}.${key}: ${descriptionTemplate}`)
          continue
        }
        if (descriptionTemplate.startsWith('Innate:')) {
          mismatches.push(`${awakener.displayName}.${key}: ${descriptionTemplate}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })
})
