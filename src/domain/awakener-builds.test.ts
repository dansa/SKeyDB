import {describe, expect, it} from 'vitest'

import {
  compareCovenantsForBuildRecommendation,
  compareWheelsForBuildRecommendation,
  getAwakenerBuildEntryById,
  getPrimaryAwakenerBuild,
  loadAwakenerBuildEntries,
  type AwakenerBuild,
} from './awakener-builds'
import {getCovenants} from './covenants'
import {getMainstatByKey} from './mainstats'
import {getPosses} from './posses'
import {compareWheelsForUi} from './wheel-sort'
import {getWheels} from './wheels'

function buildFixtureBuild(): AwakenerBuild {
  return {
    id: 'dps',
    label: 'DPS',
    substatPriorityGroups: [['CRIT_DMG'], ['DMG_AMP', 'CRIT_RATE']],
    recommendedWheelMainstats: ['KEYFLARE_REGEN', 'ALIEMUS_REGEN'],
    recommendedWheels: [
      {tier: 'BIS_SSR', wheelIds: ['wheel-0028']},
      {tier: 'ALT_SSR', wheelIds: ['wheel-0121']},
      {tier: 'BIS_SR', wheelIds: ['wheel-0116']},
      {tier: 'GOOD', wheelIds: ['wheel-0087', 'wheel-0080']},
    ],
    recommendedCovenantIds: ['covenant-0004', 'covenant-0008'],
  }
}

function getGoodWheelIds(build: AwakenerBuild | undefined): string[] {
  return build?.recommendedWheels.find((group) => group.tier === 'GOOD')?.wheelIds ?? []
}

describe('awakener builds', () => {
  it('loads seeded build entries and caches the parsed array', async () => {
    const first = await loadAwakenerBuildEntries()
    const second = await loadAwakenerBuildEntries()

    expect(second).toBe(first)

    const dollInferno = getAwakenerBuildEntryById('awakener-0018', first)
    const kathiguRa = getAwakenerBuildEntryById('awakener-0027', first)

    expect(dollInferno?.builds).toHaveLength(1)
    expect(kathiguRa?.builds).toHaveLength(2)
    expect(kathiguRa?.primaryBuildId).toBe('dps')
    expect(kathiguRa?.awakenerId).toBe('awakener-0027')
    expect(kathiguRa?.recommendedPosseIds).toEqual(['posse-0038'])
  })

  it('resolves the primary build and preserves grouped substat priorities', async () => {
    const entries = await loadAwakenerBuildEntries()
    const ramona = getAwakenerBuildEntryById('awakener-0042', entries)
    const primaryBuild = getPrimaryAwakenerBuild(ramona)

    expect(primaryBuild?.id).toBe('standard')
    expect(primaryBuild?.substatPriorityGroups).toEqual([
      ['KEYFLARE_REGEN'],
      ['DMG_AMP', 'ALIEMUS_REGEN'],
    ])
  })

  it('promotes recommended wheels ahead of fallback order while preserving comparator tie-breaks', () => {
    const build = buildFixtureBuild()
    const rankedIds = [...getWheels()]
      .filter((wheel) =>
        [
          'wheel-0028',
          'wheel-0121',
          'wheel-0116',
          'wheel-0087',
          'wheel-0080',
          'wheel-0004',
        ].includes(wheel.id),
      )
      .sort((left, right) =>
        compareWheelsForBuildRecommendation(left, right, {
          build,
          fallbackCompare: compareWheelsForUi,
          promoteMainstats: false,
        }),
      )
      .map((wheel) => wheel.id)

    expect(rankedIds).toEqual([
      'wheel-0028',
      'wheel-0121',
      'wheel-0116',
      'wheel-0080',
      'wheel-0087',
      'wheel-0004',
    ])
  })

  it('adds ordered mainstat promotion buckets without replacing fallback wheel ordering', () => {
    const build = buildFixtureBuild()
    const rankedIds = [...getWheels()]
      .filter((wheel) =>
        ['wheel-0028', 'wheel-0001', 'wheel-0012', 'wheel-0056', 'wheel-0004'].includes(wheel.id),
      )
      .sort((left, right) =>
        compareWheelsForBuildRecommendation(left, right, {
          build,
          fallbackCompare: compareWheelsForUi,
          promoteMainstats: true,
        }),
      )
      .map((wheel) => wheel.id)

    expect(rankedIds).toEqual([
      'wheel-0028',
      'wheel-0001',
      'wheel-0012',
      'wheel-0056',
      'wheel-0004',
    ])
  })

  it('promotes recommended covenants in configured order before alphabetical fallback', () => {
    const build = buildFixtureBuild()
    const rankedIds = [...getCovenants()]
      .filter((covenant) =>
        ['covenant-0004', 'covenant-0008', 'covenant-0001', 'covenant-0002'].includes(covenant.id),
      )
      .sort((left, right) =>
        compareCovenantsForBuildRecommendation(left, right, build, {
          fallbackCompare: (a, b) => a.id.localeCompare(b.id),
        }),
      )
      .map((covenant) => covenant.id)

    expect(rankedIds).toEqual(['covenant-0004', 'covenant-0008', 'covenant-0001', 'covenant-0002'])
  })

  it('keeps referenced wheel mainstats linked to canonical mainstat metadata', async () => {
    const entries = await loadAwakenerBuildEntries()

    entries.forEach((entry) => {
      entry.builds.forEach((build) => {
        build.recommendedWheelMainstats?.forEach((key) => {
          expect(getMainstatByKey(key)).toBeDefined()
        })
      })
    })
  })

  it('preserves selected migrated recommendations in the curated data', async () => {
    const entries = await loadAwakenerBuildEntries()

    expect(getGoodWheelIds(getAwakenerBuildEntryById('awakener-0003', entries)?.builds[0])).toEqual(
      expect.arrayContaining(['wheel-0104']),
    )
    expect(getGoodWheelIds(getAwakenerBuildEntryById('awakener-0014', entries)?.builds[0])).toEqual(
      expect.arrayContaining(['wheel-0028', 'wheel-0137']),
    )
    expect(
      getAwakenerBuildEntryById('awakener-0054', entries)?.builds[0].recommendedCovenantIds,
    ).toEqual(['covenant-0006', 'covenant-0007', 'covenant-0005', 'covenant-0001'])
    expect(
      getAwakenerBuildEntryById('awakener-0033', entries)?.builds[0].recommendedCovenantIds,
    ).toEqual(['covenant-0014', 'covenant-0017', 'covenant-0004'])
    expect(getAwakenerBuildEntryById('awakener-0004', entries)?.primaryBuildId).toBe(
      'standard-support',
    )
  })

  it('uses canonical public V3 ids for curated build references', async () => {
    const entries = await loadAwakenerBuildEntries()
    const wheelIds = new Set(getWheels().map((wheel) => wheel.id))
    const covenantIds = new Set(getCovenants().map((covenant) => covenant.id))
    const posseIds = new Set(getPosses().map((posse) => posse.id))

    entries.forEach((entry) => {
      expect(entry.awakenerId).toMatch(/^awakener-\d{4}$/)
      entry.recommendedPosseIds?.forEach((posseId) => {
        expect(posseId).toMatch(/^posse-\d{4}$/)
        expect(posseIds.has(posseId)).toBe(true)
      })
      entry.builds.forEach((build) => {
        build.recommendedWheels.forEach((group) => {
          group.wheelIds.forEach((wheelId) => {
            expect(wheelId).toMatch(/^wheel-\d{4}$/)
            expect(wheelIds.has(wheelId)).toBe(true)
          })
        })
        build.recommendedCovenantIds.forEach((covenantId) => {
          expect(covenantId).toMatch(/^covenant-\d{4}$/)
          expect(covenantIds.has(covenantId)).toBe(true)
        })
      })
    })
  })
})
