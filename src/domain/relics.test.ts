import {describe, expect, it} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/recordRepository'

import {getAwakeners} from './awakeners'
import {resolveDescriptionTemplate} from './description-args'
import type {PublicDescriptionArg} from './public-description-args'
import {
  getDefaultRelicVariant,
  getPortraitRelicByAwakenerId,
  getPortraitRelics,
  getRelics,
  getRelicVariantById,
  loadRelicDescriptionById,
  loadRelicRecordById,
  publicRelicCatalogRecordSchema,
  publicRelicRecordSchema,
  resolvePreferredRelicVariant,
} from './relics'

function renderPublicRecordDescription(record: Awaited<ReturnType<typeof loadPublicRecord>>) {
  if (typeof record?.descriptionTemplate !== 'string') {
    return ''
  }

  const descriptionArgs =
    record.descriptionArgs && typeof record.descriptionArgs === 'object'
      ? (record.descriptionArgs as Record<string, PublicDescriptionArg>)
      : {}
  return resolveDescriptionTemplate(record.descriptionTemplate, descriptionArgs)
}

describe('getRelics', () => {
  it('returns parsed public V3 relics with stable ids', () => {
    const relics = getRelics()
    expect(relics.length).toBeGreaterThan(0)
    expect(relics[0]).toMatchObject({
      id: expect.stringMatching(/^relic-\d{4}$/),
      kind: expect.stringMatching(/^(PORTRAIT|GENERIC)$/),
      relicType: expect.any(String),
      categories: expect.any(Array),
      rarity: expect.any(String),
      aliases: expect.any(Array),
      variantCount: expect.any(Number),
      variantTiers: expect.any(Array),
      defaultVariantId: expect.stringMatching(/^relic-variant-\d{4}$/),
      ownerAwakenerId: expect.stringMatching(/^awakener-\d{4}$/),
      ownerAwakenerName: expect.any(String),
      assetId: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
    })
  })

  it('exposes family variant tiers in the lightweight catalog', () => {
    const relics = getRelics()
    expect(relics.every((relic) => relic.variantTiers.length > 0)).toBe(true)
    expect(relics.filter((relic) => relic.variantTiers.includes('Silver')).length).toBeGreaterThan(
      100,
    )
    expect(relics.filter((relic) => relic.variantTiers.includes('Cursed')).length).toBeGreaterThan(
      15,
    )
  })

  it('requires a non-empty variant category/tier projection at the catalog boundary', () => {
    const valid = getRelics()[0]
    const catalogRecord = {
      ...valid,
      assets: {},
      kind: 'relic' as const,
    }
    const {variantCategoryTiers: _omitted, ...missingProjection} = catalogRecord

    expect(publicRelicCatalogRecordSchema.safeParse(catalogRecord).success).toBe(true)
    expect(publicRelicCatalogRecordSchema.safeParse(missingProjection).success).toBe(false)
    expect(
      publicRelicCatalogRecordSchema.safeParse({...catalogRecord, variantCategoryTiers: []})
        .success,
    ).toBe(false)
  })

  it('enforces unique relic ids at the public relic boundary', () => {
    const relics = getRelics()
    const uniqueRelicIds = new Set(relics.map((relic) => relic.id))

    expect(uniqueRelicIds.size).toBe(relics.length)
  })

  it('resolves public relic icon assets at the boundary', () => {
    expect(getRelics().every((relic) => relic.assetId.trim().length > 0)).toBe(true)
  })

  it('does not leak unresolved source placeholders or wrappers into generated descriptions', () => {
    const relics = getRelics()
    expect(relics.every((relic) => !relic.description.includes('[Arg'))).toBe(true)
    expect(relics.every((relic) => !relic.description.includes('<'))).toBe(true)
  })
})

describe('relic family variants', () => {
  it('requires a non-empty variant category/tier projection at the detail boundary', async () => {
    const rawRecord = await loadPublicRecord('relics', 'relic-0207')
    expect(rawRecord).toBeDefined()
    if (!rawRecord) return

    expect(publicRelicRecordSchema.safeParse(rawRecord).success).toBe(false)
    expect(
      publicRelicRecordSchema.safeParse({...rawRecord, variantCategoryTiers: []}).success,
    ).toBe(false)

    const parsedRecord = await loadRelicRecordById('relic-0207')
    expect(parsedRecord).toBeDefined()
    expect(publicRelicRecordSchema.safeParse(parsedRecord).success).toBe(true)
  })

  it('validates the catalog default descriptor against the exact default variant', async () => {
    const record = await loadRelicRecordById('relic-0207')
    expect(record).toBeDefined()
    if (!record) return

    expect(
      publicRelicRecordSchema.safeParse({
        ...record,
        variantCategoryTiers: [{category: 'FADED_LEGACY', tier: 'Silver'}],
      }).success,
    ).toBe(false)
  })

  it('parses every lazy family detail with globally unique variants', async () => {
    const variantIds = new Set<string>()

    for (const family of getRelics()) {
      const record = await loadRelicRecordById(family.id)
      expect(record, family.id).toBeDefined()
      expect(record?.variants, family.id).toHaveLength(family.variantCount)

      for (const variant of record?.variants ?? []) {
        expect(variantIds.has(variant.id), variant.id).toBe(false)
        variantIds.add(variant.id)
      }
    }

    expect(variantIds.size).toBe(568)
  })

  it('loads grouped family variants with a valid default', async () => {
    const malignantChild = await loadRelicRecordById('relic-0207')

    expect(malignantChild).toMatchObject({
      id: 'relic-0207',
      name: 'Malignant Child',
      categories: ['ASTRAL_REIGN', 'FADED_LEGACY'],
      variantCount: 5,
    })
    expect(malignantChild?.variants).toHaveLength(5)
    expect(malignantChild && getDefaultRelicVariant(malignantChild).id).toBe(
      malignantChild?.defaultVariantId,
    )
  })

  it.each([
    ['relic-0067', 'Argent Return', 7, ['relic-variant-0074', 'relic-variant-0080']],
    ['relic-0161', 'Faded Photo', 2, ['relic-variant-0232', 'relic-variant-0233']],
    ['relic-0200', "Little N's Camera", 3, ['relic-variant-0325', 'relic-variant-0327']],
    ['relic-0209', 'Medal of Rescue', 5, ['relic-variant-0343', 'relic-variant-0347']],
    ['relic-0244', 'Pure Silver Core', 7, ['relic-variant-0416', 'relic-variant-0422']],
  ])(
    'loads consolidated family %s without changing exact variant identity',
    async (familyId, name, variantCount, boundaryVariantIds) => {
      const family = await loadRelicRecordById(familyId)

      expect(family).toMatchObject({id: familyId, name, variantCount})
      expect(family?.variants).toHaveLength(variantCount)
      expect(family?.variants.map((variant) => variant.id)).toEqual(
        expect.arrayContaining(boundaryVariantIds),
      )
    },
  )

  it('keeps tightened blessed and sinful variants under Omen Ritual Bird', async () => {
    const omenRitualBird = await loadRelicRecordById('relic-0229')

    expect(omenRitualBird?.variants).toHaveLength(4)
    expect(omenRitualBird?.variants.map((variant) => variant.name)).toEqual(
      expect.arrayContaining([
        'Omen Ritual Bird',
        'Blessed: Omen Ritual Bird',
        'Sinful: Omen Ritual Bird',
      ]),
    )
  })

  it('resolves exact variants within a family', async () => {
    const prophetsLamp = await loadRelicRecordById('relic-0241')

    expect(prophetsLamp && getRelicVariantById(prophetsLamp, 'relic-variant-0411')).toMatchObject({
      id: 'relic-variant-0411',
      name: "Prophet's Lamp+",
      category: 'ASTRAL_REIGN',
      tier: 'Gold',
    })
  })

  it('resolves the preferred variant from active tier and category filters', async () => {
    const malignantChild = await loadRelicRecordById('relic-0207')
    expect(malignantChild).toBeDefined()
    if (!malignantChild) return

    expect(
      resolvePreferredRelicVariant(malignantChild, {
        category: 'ASTRAL_REIGN',
        tier: 'Silver',
      }),
    ).toMatchObject({category: 'ASTRAL_REIGN', tier: 'Silver'})
    expect(
      resolvePreferredRelicVariant(malignantChild, {
        category: 'FADED_LEGACY',
        tier: 'Silver',
      }),
    ).toMatchObject({category: 'FADED_LEGACY', tier: 'Silver'})
  })
})

describe('getPortraitRelics', () => {
  it('returns portrait relics linked by public awakener id', () => {
    const portraits = getPortraitRelics()
    expect(portraits.length).toBeGreaterThan(0)
    expect(portraits.every((relic) => relic.ownerAwakenerId.trim().length > 0)).toBe(true)
  })

  it('does not silently drop portrait relics missing owner links', () => {
    expect(getRelics().filter((relic) => relic.kind === 'PORTRAIT')).toHaveLength(
      getPortraitRelics().length,
    )
  })

  it('enforces unique public awakener ids for portrait relic linkage', () => {
    const portraits = getPortraitRelics()
    const uniqueAwakenerIds = new Set(portraits.map((relic) => relic.ownerAwakenerId))
    expect(uniqueAwakenerIds.size).toBe(portraits.length)
  })

  it('only links portrait relics to known public awakeners', () => {
    const knownAwakenerIds = new Set(getAwakeners().map((awakener) => awakener.id))
    const portraits = getPortraitRelics()
    expect(portraits.every((relic) => knownAwakenerIds.has(relic.ownerAwakenerId))).toBe(true)
  })

  it('keeps portrait relic asset ids aligned with owner ingame ids', () => {
    const awakenerById = new Map(getAwakeners().map((awakener) => [awakener.id, awakener]))
    const mismatches = getPortraitRelics()
      .map((relic) => {
        const awakener = awakenerById.get(relic.ownerAwakenerId)
        const expectedAssetId = awakener?.ingameId
          ? `Icon_Creation_Unique_${awakener.ingameId}`
          : undefined
        return expectedAssetId && relic.assetId !== expectedAssetId
          ? `${relic.id}: expected ${expectedAssetId}, got ${relic.assetId}`
          : null
      })
      .filter((message): message is string => Boolean(message))

    expect(mismatches).toEqual([])
  })
})

describe('getPortraitRelicByAwakenerId', () => {
  it('resolves portrait relic lookup by public awakener id', () => {
    const arachne = getPortraitRelicByAwakenerId('awakener-0056')

    expect(arachne).toMatchObject({
      id: 'relic-0056',
      assetId: 'Icon_Creation_Unique_D10',
      name: 'Dimensional Image: Arachne',
      ownerAwakenerId: 'awakener-0056',
    })
  })

  it('keeps key relic references in canonical tagged form for the database UI', async () => {
    const agrippaRelic = await loadPublicRecord('relics', 'relic-0002')
    const tawilRelic = await loadPublicRecord('relics', 'relic-0047')
    const murphyRelic = await loadPublicRecord('relics', 'relic-0033')

    expect(renderPublicRecordDescription(agrippaRelic)).toContain('{Reluctant Alms}')
    expect(renderPublicRecordDescription(tawilRelic)).toContain('{derived:Silver Key Dawn}')
    expect(renderPublicRecordDescription(murphyRelic)).toContain('Temporary Strike')
    expect(getPortraitRelicByAwakenerId('awakener-0002')?.description).toBe('')
    expect(getPortraitRelicByAwakenerId('awakener-0047')?.description).toBe('')
    expect(getPortraitRelicByAwakenerId('awakener-0033')?.description).toBe('')
  })

  it('loads portrait relic descriptions from per-record detail JSON on demand', async () => {
    await expect(loadRelicDescriptionById('relic-0002')).resolves.toContain('{Reluctant Alms}')
    await expect(loadRelicDescriptionById('relic-0047')).resolves.toContain(
      '{derived:Silver Key Dawn}',
    )
  })
})
