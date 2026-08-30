import {describe, expect, it} from 'vitest'

import pickmanSkillJson from '@/data/public-v3/records/skills/skill.pickman.truth-in-delusion.json'
import tinctSkillJson from '@/data/public-v3/records/skills/skill.tinct.voices-from-beyond.json'

import {
  getDefaultOrisonVariant,
  getOrisons,
  loadOrisonRecordById,
  publicOrisonRecordSchema,
} from './orisons'
import {searchOrisons} from './orisons-search'
import {
  adaptPublicV3SkillRecord,
  parsePublicV3SkillRecord,
} from './public-v3-awakener-record-adapters'

describe('public Orison families', () => {
  it('loads every generated family and all nested variants', async () => {
    const orisons = getOrisons()
    expect(orisons).toHaveLength(24)

    const records = await Promise.all(orisons.map((orison) => loadOrisonRecordById(orison.id)))
    expect(records.every(Boolean)).toBe(true)
    expect(records.reduce((sum, record) => sum + (record?.variants.length ?? 0), 0)).toBe(46)

    for (const record of records) {
      const parsed = publicOrisonRecordSchema.parse(record)
      expect(getDefaultOrisonVariant(parsed).id).toBe(parsed.defaultVariantId)
      expect(parsed.variants).toHaveLength(parsed.variantCount)
    }
  })

  it('searches generated names and facets', () => {
    const orisons = getOrisons()
    expect(searchOrisons(orisons, 'advanced')).toHaveLength(22)
    expect(
      searchOrisons(orisons, 'special').every((orison) => orison.orisonType === 'SPECIAL'),
    ).toBe(true)
    expect(searchOrisons(orisons, 'finesse').map((orison) => orison.name)).toContain('Finesse')
  })

  it('preserves collectible and temporary application semantics on skills', () => {
    const pickman = adaptPublicV3SkillRecord(parsePublicV3SkillRecord(pickmanSkillJson))
    const tinct = adaptPublicV3SkillRecord(parsePublicV3SkillRecord(tinctSkillJson))
    const collectible = pickman.orisonApplications?.[0]
    const temporary = tinct.orisonApplications?.[0]

    expect(collectible?.applicationMode).toBe('EXACT_VARIANT_POOL')
    expect(collectible?.members).toHaveLength(8)
    expect(
      collectible?.members.every((member) => member.defaultVariantId && member.upgradedVariantId),
    ).toBe(true)
    expect(temporary?.applicationMode).toBe('TEMPORARY_ANALOG')
    expect(temporary?.expires).toBe('BATTLE_END')
    expect(
      temporary?.members.every((member) => !member.defaultVariantId && !member.upgradedVariantId),
    ).toBe(true)
  })
})
