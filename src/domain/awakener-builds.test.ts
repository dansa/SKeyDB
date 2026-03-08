import {describe, expect, it} from 'vitest'

// @ts-expect-error Build script is a typed runtime module imported for schema-generation verification.
import {buildAwakenerBuildsSchema} from '../../scripts/generate-awakener-builds-schema.mjs'
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
import {compareWheelsForUi} from './wheel-sort'
import {getWheels} from './wheels'

interface SchemaChoiceContainer {
  $defs: {
    wheelId: unknown
    covenantId: unknown
    awakenerId: unknown
  }
}

function buildFixtureBuild(): AwakenerBuild {
  return {
    id: 'dps',
    label: 'DPS',
    substatPriorityGroups: [['CRIT_DMG'], ['DMG_AMP', 'CRIT_RATE']],
    recommendedWheelMainstats: ['KEYFLARE_REGEN', 'ALIEMUS_REGEN'],
    recommendedWheels: [
      {tier: 'BIS_SSR', wheelIds: ['C16']},
      {tier: 'ALT_SSR', wheelIds: ['ZL02']},
      {tier: 'BIS_SR', wheelIds: ['SR43']},
      {tier: 'GOOD', wheelIds: ['SR11', 'SR04']},
    ],
    recommendedCovenantIds: ['005', '010'],
  }
}

describe('awakener builds', () => {
  it('loads seeded build entries and caches the parsed array', async () => {
    const first = await loadAwakenerBuildEntries()
    const second = await loadAwakenerBuildEntries()

    expect(second).toBe(first)

    const dollInferno = getAwakenerBuildEntryById(18, first)
    const kathiguRa = getAwakenerBuildEntryById(27, first)

    expect(dollInferno?.builds).toHaveLength(1)
    expect(kathiguRa?.builds).toHaveLength(2)
    expect(kathiguRa?.primaryBuildId).toBe('dps')
  })

  it('resolves the primary build and preserves grouped substat priorities', async () => {
    const entries = await loadAwakenerBuildEntries()
    const ramona = getAwakenerBuildEntryById(42, entries)
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
      .filter((wheel) => ['C16', 'ZL02', 'SR43', 'SR11', 'SR04', 'B04'].includes(wheel.id))
      .sort((left, right) =>
        compareWheelsForBuildRecommendation(left, right, {
          build,
          fallbackCompare: compareWheelsForUi,
          promoteMainstats: false,
        }),
      )
      .map((wheel) => wheel.id)

    expect(rankedIds).toEqual(['C16', 'ZL02', 'SR43', 'SR04', 'SR11', 'B04'])
  })

  it('adds ordered mainstat promotion buckets without replacing fallback wheel ordering', () => {
    const build = buildFixtureBuild()
    const rankedIds = [...getWheels()]
      .filter((wheel) => ['C16', 'B01', 'B12', 'O05', 'B04'].includes(wheel.id))
      .sort((left, right) =>
        compareWheelsForBuildRecommendation(left, right, {
          build,
          fallbackCompare: compareWheelsForUi,
          promoteMainstats: true,
        }),
      )
      .map((wheel) => wheel.id)

    expect(rankedIds).toEqual(['C16', 'B01', 'B12', 'O05', 'B04'])
  })

  it('promotes recommended covenants in configured order before alphabetical fallback', () => {
    const build = buildFixtureBuild()
    const rankedIds = [...getCovenants()]
      .filter((covenant) => ['005', '010', '001', '002'].includes(covenant.id))
      .sort((left, right) =>
        compareCovenantsForBuildRecommendation(left, right, build, {
          fallbackCompare: (a, b) => a.id.localeCompare(b.id),
        }),
      )
      .map((covenant) => covenant.id)

    expect(rankedIds).toEqual(['005', '010', '001', '002'])
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

  it('builds schema autocomplete with readable metadata for curated ids', () => {
    const schema = (buildAwakenerBuildsSchema as () => SchemaChoiceContainer)()
    const wheelOptions = getSchemaChoices(schema.$defs.wheelId)
    const covenantOptions = getSchemaChoices(schema.$defs.covenantId)
    const awakenerOptions = getSchemaChoices(schema.$defs.awakenerId)

    expect(wheelOptions).toContainEqual(
      expect.objectContaining({
        const: 'C16',
        title: 'Amber-Tinted Death',
        description: expect.stringContaining('kathigu-ra'),
      }),
    )
    expect(covenantOptions).toContainEqual(
      expect.objectContaining({
        const: '005',
        title: 'Crimson Pulse',
      }),
    )
    expect(awakenerOptions).toContainEqual(
      expect.objectContaining({
        const: 18,
        title: 'doll: inferno',
      }),
    )
  })
})

function getSchemaChoices(definition: unknown): unknown[] {
  if (
    definition &&
    typeof definition === 'object' &&
    'oneOf' in definition &&
    Array.isArray(definition.oneOf)
  ) {
    return definition.oneOf
  }

  throw new Error('Expected schema definition with oneOf choices')
}
