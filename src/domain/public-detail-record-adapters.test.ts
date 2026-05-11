import {afterEach, describe, expect, it, vi} from 'vitest'

import type {EntityKind, PublicDataScope, PublicRecord} from '@/data-access/public-data/contract'
import {loadPublicRecord} from '@/data-access/public-data/repository'

import {
  loadPublicAwakenerDetailById,
  loadPublicCovenantDetailById,
  loadPublicDerivedSkillDetailById,
  loadPublicEnlightenDetailById,
  loadPublicOverlayDetailById,
  loadPublicPosseDetailById,
  loadPublicSkillDetailById,
  loadPublicTalentDetailById,
  loadPublicWheelDetailById,
} from './public-detail-record-adapters'

type PublicDetailAdapters = typeof import('./public-detail-record-adapters')

async function importAdaptersWithPublicRecordMock(
  loadPublicRecordMock: (scope: PublicDataScope, id: string) => Promise<PublicRecord | undefined>,
): Promise<PublicDetailAdapters> {
  vi.resetModules()
  vi.doMock('@/data-access/public-data/recordRepository', () => ({
    loadPublicRecord: loadPublicRecordMock,
  }))

  return import('./public-detail-record-adapters')
}

describe('public-detail-record-adapters', () => {
  afterEach(() => {
    vi.doUnmock('@/data-access/public-data/recordRepository')
    vi.resetModules()
  })

  it('loads individual records from public chunks by canonical id', async () => {
    const publicRecord = await loadPublicRecord('awakeners', 'awakener-0001')

    await expect(loadPublicAwakenerDetailById('awakener-0001')).resolves.toMatchObject({
      id: publicRecord?.numericId,
      displayName: publicRecord?.name,
      stats: expect.objectContaining({
        CON: '52',
        ATK: '66',
        DEF: '30',
      }),
    })
  })

  it('composes public detail records with cards, talents, enlightens, and upgrades', async () => {
    const thais = await loadPublicAwakenerDetailById('awakener-0048')

    expect(thais?.cards.C4.id).toBe('skill.thais.ancient-caress')
    expect(thais?.stats).toMatchObject({
      CON: '49',
      ATK: '47',
      DEF: '44',
      CritRate: '5%',
      CritDamage: '50%',
      AliemusRegen: '2.4',
      KeyflareRegen: '29.4',
    })
    expect(thais?.substatScaling).toEqual({
      AliemusRegen: '0.4',
      KeyflareRegen: '2.4',
    })
    expect(thais?.cards.OverExalt?.id).toBe('skill.thais.sacred-relics-perpetuity')
    expect(thais?.talents.T2?.id).toBe('talent.thais.madness-omen')
    expect(thais?.talents.T3?.id).toBe('talent.thais.soulforge-aptitude')
    expect(thais?.enlightens.AbsoluteAxiom?.id).toBe('enlighten.thais.the-birthing-deep')
    expect(thais?.cards.C4.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          upgraderId: 'enlighten.thais.forests-embrace',
          operation: 'override_args',
        }),
      ]),
    )
    expect(thais?.derivedSkills.map((entry) => entry.id)).toContain('derived.thais.blood-of-fear')
  })

  it('maps promoted derived cards into the existing promoted extras surface', async () => {
    const castor = await loadPublicAwakenerDetailById('awakener-0008')

    expect(castor?.cards.promotedExtras.map((entry) => entry.id)).toEqual([
      'derived.castor.onyx-plume',
    ])
    expect(castor?.derivedSkills.map((entry) => entry.id)).not.toContain(
      'derived.castor.onyx-plume',
    )
  })

  it('keeps card keyword upgrades on the upgraded target record', async () => {
    const arachne = await loadPublicAwakenerDetailById('awakener-0056')

    expect(arachne?.cards.C5.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          upgraderId: 'enlighten.arachne.universe-as-i-conceive',
          operation: 'override_card_keywords',
          patch: expect.objectContaining({
            cardKeywords: [{id: 'mechanic.prepare', value: 1}, {id: 'mechanic.retain'}],
          }),
        }),
      ]),
    )
  })

  it('keeps overlay upgrades on the upgraded overlay record', async () => {
    const xu = await loadPublicAwakenerDetailById('awakener-0054')

    const spellbound = xu?.overlays?.find((overlay) => overlay.id === 'overlay.xu.spellbound')
    expect(spellbound?.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          upgraderId: 'enlighten.xu.nirvanas-kiss',
          operation: 'override_args',
          patch: expect.objectContaining({
            descriptionArgs: expect.objectContaining({
              DescArg2: {
                kind: 'fixed',
                value: '10',
              },
            }),
          }),
        }),
      ]),
    )
  })

  it('keeps full overlay descriptions on lazily loaded detail records', async () => {
    const hameln = await loadPublicAwakenerDetailById('awakener-0022')

    const marvelousDebuff = hameln?.overlays?.find(
      (overlay) => overlay.id === 'overlay.hameln.marvelous-debuff',
    )
    expect(marvelousDebuff).toMatchObject({
      descriptionTemplate:
        'Effects: {Bleed} (150% DMG), {Poison} (75% DMG), apply 1 {Weakness}, apply 1 {Vulnerable}, Temp. {STR⯆} -[DescArg1].',
      descriptionArgs: {
        DescArg1: expect.objectContaining({
          kind: 'computed',
        }),
      },
    })
  })

  it('keeps link-only talent influences on the upgraded target record', async () => {
    const agrippa = await loadPublicAwakenerDetailById('awakener-0002')

    expect(agrippa?.talents.T1?.id).toBe('talent.agrippa.seal-of-the-pact')
    expect(agrippa?.cards.Exalt.upgrades).toEqual([
      expect.objectContaining({
        operation: 'link_only',
        upgraderId: 'talent.agrippa.seal-of-the-pact',
      }),
    ])
  })

  it('loads individual records from public chunks by numeric awakener id', async () => {
    await expect(loadPublicAwakenerDetailById(1)).resolves.toMatchObject({
      displayName: '"24"',
    })
  })

  it('returns undefined when no public record exists for an id', async () => {
    await expect(loadPublicAwakenerDetailById(99999)).resolves.toBeUndefined()
  })

  it('loads wheel detail records with adapted asset, aliases, and mainstat series defaults', async () => {
    await expect(loadPublicWheelDetailById('wheel-0102')).resolves.toMatchObject({
      id: 'wheel-0102',
      name: 'Slumber Beneath the Glacier',
      assetId: 'Weapon_Full_SR26',
      aliases: ['Slumber Beneath the Glacier'],
      awakener: undefined,
      mainstatKey: 'KEYFLARE_REGEN',
      mainstatSeriesKey: 'SR:KEYFLARE_REGEN',
      rarity: 'SR',
      realm: 'NEUTRAL',
      searchTags: [],
    })
  })

  it('loads posse detail records with icon, crystal, and badge asset ids', async () => {
    await expect(loadPublicPosseDetailById('posse-0001')).resolves.toMatchObject({
      id: 'posse-0001',
      name: 'Encounter in Pure White',
      assetId: 'KeyToken_Skill_01',
      assetCrystalId: 'KeyToken_Crystal_01',
      assetBadgeId: 'KeyToken_Props_01',
      acquisitionSource: 'Clear Operation: Faded Legacy - Ch. 3 - Beware of Hounds',
      realm: 'FADED_LEGACY',
      descriptionTemplate: 'Discard your hand, then draw that many cards plus 2.',
      descriptionArgs: {},
    })
  })

  it('loads covenant detail records with adapted asset id and set effects', async () => {
    await expect(loadPublicCovenantDetailById('covenant-0001')).resolves.toMatchObject({
      id: 'covenant-0001',
      name: 'Deus Ex Machina',
      assetId: 'covenant-icon-001',
      acquisitionSource: 'Clear Interlude - Verboten Covenant: City of Big Smoke',
      setEffects: [
        {
          set: 3,
          descriptionTemplate: 'Realm Mastery +[Arg1]',
          descriptionArgs: {
            Arg1: {
              kind: 'fixed',
              value: '12',
            },
          },
        },
        {
          set: 6,
          descriptionArgs: {},
        },
      ],
    })
  })

  it('returns undefined for missing or malformed public wheel, posse, and covenant ids', async () => {
    await expect(loadPublicWheelDetailById('wheel-9999')).resolves.toBeUndefined()
    await expect(loadPublicWheelDetailById('not-a-wheel')).resolves.toBeUndefined()
    await expect(loadPublicPosseDetailById('posse-9999')).resolves.toBeUndefined()
    await expect(loadPublicPosseDetailById('not-a-posse')).resolves.toBeUndefined()
    await expect(loadPublicCovenantDetailById('covenant-9999')).resolves.toBeUndefined()
    await expect(loadPublicCovenantDetailById('not-a-covenant')).resolves.toBeUndefined()
  })

  it('caches public wheel, posse, and covenant detail loads by canonical id', async () => {
    const records: Partial<Record<PublicDataScope, PublicRecord>> = {
      wheels: {
        schemaVersion: 3,
        kind: 'wheel',
        id: 'wheel-0001',
        name: 'Cached Wheel',
        rarity: 'R',
        realm: 'OTHER',
        mainstatKey: 'KEYFLARE_REGEN',
        descriptionTemplate: 'Wheel text',
        descriptionArgs: {},
      },
      posses: {
        schemaVersion: 3,
        kind: 'posse',
        id: 'posse-0001',
        name: 'Cached Posse',
        realm: 'OTHER',
        descriptionTemplate: 'Posse text',
        descriptionArgs: {},
      },
      covenants: {
        schemaVersion: 3,
        kind: 'covenant',
        id: 'covenant-0001',
        name: 'Cached Covenant',
        setEffects: [],
      },
    }
    const loadPublicRecordMock = vi.fn((scope: PublicDataScope) => Promise.resolve(records[scope]))
    const adapters = await importAdaptersWithPublicRecordMock(loadPublicRecordMock)

    const [firstWheel, secondWheel] = await Promise.all([
      adapters.loadPublicWheelDetailById('wheel-0001'),
      adapters.loadPublicWheelDetailById('wheel-0001'),
    ])
    const [firstPosse, secondPosse] = await Promise.all([
      adapters.loadPublicPosseDetailById('posse-0001'),
      adapters.loadPublicPosseDetailById('posse-0001'),
    ])
    const [firstCovenant, secondCovenant] = await Promise.all([
      adapters.loadPublicCovenantDetailById('covenant-0001'),
      adapters.loadPublicCovenantDetailById('covenant-0001'),
    ])

    expect(firstWheel).toBe(secondWheel)
    expect(firstPosse).toBe(secondPosse)
    expect(firstCovenant).toBe(secondCovenant)
    expect(loadPublicRecordMock).toHaveBeenCalledTimes(3)
    expect(loadPublicRecordMock).toHaveBeenCalledWith('wheels', 'wheel-0001')
    expect(loadPublicRecordMock).toHaveBeenCalledWith('posses', 'posse-0001')
    expect(loadPublicRecordMock).toHaveBeenCalledWith('covenants', 'covenant-0001')
  })

  it('rejects public wheel, posse, and covenant detail records that fail detail parsing', async () => {
    const invalidRecordKinds: Partial<Record<PublicDataScope, EntityKind>> = {
      wheels: 'wheel',
      posses: 'posse',
      covenants: 'covenant',
    }
    const loadPublicRecordMock = vi.fn((scope: PublicDataScope, id: string) =>
      Promise.resolve({
        schemaVersion: 3 as const,
        kind: invalidRecordKinds[scope] ?? 'wheel',
        id,
        name: `Invalid ${scope}`,
      }),
    )
    const adapters = await importAdaptersWithPublicRecordMock(loadPublicRecordMock)

    await expect(adapters.loadPublicWheelDetailById('wheel-0002')).rejects.toThrow()
    await expect(adapters.loadPublicPosseDetailById('posse-0002')).rejects.toThrow()
    await expect(adapters.loadPublicCovenantDetailById('covenant-0002')).rejects.toThrow()
  })

  it('loads public child detail records with current adapter defaults', async () => {
    await expect(loadPublicSkillDetailById('skill.thais.ancient-caress')).resolves.toMatchObject({
      id: 'skill.thais.ancient-caress',
      displayName: 'Ancient Caress',
      kind: 'command',
      ownerAwakenerId: 48,
      cardKeywords: expect.any(Array),
      variants: [],
    })
    await expect(loadPublicTalentDetailById('talent.thais.madness-omen')).resolves.toMatchObject({
      id: 'talent.thais.madness-omen',
      displayName: 'Madness Omen',
      ownerAwakenerId: 48,
    })
    await expect(
      loadPublicEnlightenDetailById('enlighten.thais.the-birthing-deep'),
    ).resolves.toMatchObject({
      id: 'enlighten.thais.the-birthing-deep',
      displayName: 'The Birthing Deep',
      ownerAwakenerId: 48,
    })
    await expect(
      loadPublicDerivedSkillDetailById('derived.thais.blood-of-fear'),
    ).resolves.toMatchObject({
      id: 'derived.thais.blood-of-fear',
      displayName: 'Blood of Fear',
      ownerAwakenerId: 48,
      childDerivedSkillIds: [],
      variants: [],
    })
    await expect(loadPublicOverlayDetailById('overlay.xu.spellbound')).resolves.toMatchObject({
      id: 'overlay.xu.spellbound',
      displayName: 'Spellbound',
      ownerAwakenerId: 54,
      aliases: expect.any(Array),
    })
  })

  it('returns undefined for missing or malformed public child detail ids', async () => {
    await expect(loadPublicSkillDetailById('skill.missing')).resolves.toBeUndefined()
    await expect(loadPublicSkillDetailById('not-a-skill')).resolves.toBeUndefined()
    await expect(loadPublicTalentDetailById('talent.missing')).resolves.toBeUndefined()
    await expect(loadPublicTalentDetailById('not-a-talent')).resolves.toBeUndefined()
    await expect(loadPublicEnlightenDetailById('enlighten.missing')).resolves.toBeUndefined()
    await expect(loadPublicEnlightenDetailById('not-an-enlighten')).resolves.toBeUndefined()
    await expect(loadPublicDerivedSkillDetailById('derived.missing')).resolves.toBeUndefined()
    await expect(loadPublicDerivedSkillDetailById('not-a-derived')).resolves.toBeUndefined()
    await expect(loadPublicOverlayDetailById('overlay.missing')).resolves.toBeUndefined()
    await expect(loadPublicOverlayDetailById('not-an-overlay')).resolves.toBeUndefined()
  })

  it('caches public child detail loads by canonical id', async () => {
    const records: Partial<Record<PublicDataScope, PublicRecord>> = {
      skills: {
        schemaVersion: 3,
        kind: 'skill',
        id: 'skill.cached.rouse',
        name: 'Cached Skill',
        ownerAwakenerId: 'awakener-0001',
        slot: 'Rouse',
      },
      talents: {
        schemaVersion: 3,
        kind: 'talent',
        id: 'talent.cached.passive',
        name: 'Cached Talent',
        ownerAwakenerId: 'awakener-0001',
      },
      enlightens: {
        schemaVersion: 3,
        kind: 'enlighten',
        id: 'enlighten.cached.one',
        name: 'Cached Enlighten',
        ownerAwakenerId: 'awakener-0001',
        slot: 'E1',
      },
      'derived-skills': {
        schemaVersion: 3,
        kind: 'derivedSkill',
        id: 'derived.cached.extra',
        name: 'Cached Derived',
        ownerAwakenerId: 'awakener-0001',
      },
      overlays: {
        schemaVersion: 3,
        kind: 'overlay',
        id: 'overlay.cached.mark',
        name: 'Cached Overlay',
        ownerAwakenerId: 'awakener-0001',
        overlayType: 'tag',
      },
    }
    const loadPublicRecordMock = vi.fn((scope: PublicDataScope) => Promise.resolve(records[scope]))
    const adapters = await importAdaptersWithPublicRecordMock(loadPublicRecordMock)

    const [firstSkill, secondSkill] = await Promise.all([
      adapters.loadPublicSkillDetailById('skill.cached.rouse'),
      adapters.loadPublicSkillDetailById('skill.cached.rouse'),
    ])
    const [firstTalent, secondTalent] = await Promise.all([
      adapters.loadPublicTalentDetailById('talent.cached.passive'),
      adapters.loadPublicTalentDetailById('talent.cached.passive'),
    ])
    const [firstEnlighten, secondEnlighten] = await Promise.all([
      adapters.loadPublicEnlightenDetailById('enlighten.cached.one'),
      adapters.loadPublicEnlightenDetailById('enlighten.cached.one'),
    ])
    const [firstDerived, secondDerived] = await Promise.all([
      adapters.loadPublicDerivedSkillDetailById('derived.cached.extra'),
      adapters.loadPublicDerivedSkillDetailById('derived.cached.extra'),
    ])
    const [firstOverlay, secondOverlay] = await Promise.all([
      adapters.loadPublicOverlayDetailById('overlay.cached.mark'),
      adapters.loadPublicOverlayDetailById('overlay.cached.mark'),
    ])

    expect(firstSkill).toStrictEqual(secondSkill)
    expect(firstSkill).not.toBe(secondSkill)
    expect(firstTalent).toStrictEqual(secondTalent)
    expect(firstTalent).not.toBe(secondTalent)
    expect(firstEnlighten).toStrictEqual(secondEnlighten)
    expect(firstEnlighten).not.toBe(secondEnlighten)
    expect(firstDerived).toStrictEqual(secondDerived)
    expect(firstDerived).not.toBe(secondDerived)
    expect(firstOverlay).toStrictEqual(secondOverlay)
    expect(firstOverlay).not.toBe(secondOverlay)
    expect(loadPublicRecordMock).toHaveBeenCalledTimes(5)
    expect(loadPublicRecordMock).toHaveBeenCalledWith('skills', 'skill.cached.rouse')
    expect(loadPublicRecordMock).toHaveBeenCalledWith('talents', 'talent.cached.passive')
    expect(loadPublicRecordMock).toHaveBeenCalledWith('enlightens', 'enlighten.cached.one')
    expect(loadPublicRecordMock).toHaveBeenCalledWith('derived-skills', 'derived.cached.extra')
    expect(loadPublicRecordMock).toHaveBeenCalledWith('overlays', 'overlay.cached.mark')
  })

  it('rejects public child detail records that fail adaptation parsing', async () => {
    const invalidRecordKinds: Partial<Record<PublicDataScope, EntityKind>> = {
      skills: 'skill',
      talents: 'talent',
      enlightens: 'enlighten',
      'derived-skills': 'derivedSkill',
      overlays: 'overlay',
    }
    const loadPublicRecordMock = vi.fn((scope: PublicDataScope, id: string) =>
      Promise.resolve({
        schemaVersion: 3 as const,
        kind: invalidRecordKinds[scope] ?? 'skill',
        id,
        name: 42,
      } as unknown as PublicRecord),
    )
    const adapters = await importAdaptersWithPublicRecordMock(loadPublicRecordMock)

    await expect(adapters.loadPublicSkillDetailById('skill.invalid.record')).rejects.toThrow()
    await expect(adapters.loadPublicTalentDetailById('talent.invalid.record')).rejects.toThrow()
    await expect(
      adapters.loadPublicEnlightenDetailById('enlighten.invalid.record'),
    ).rejects.toThrow()
    await expect(
      adapters.loadPublicDerivedSkillDetailById('derived.invalid.record'),
    ).rejects.toThrow()
    await expect(adapters.loadPublicOverlayDetailById('overlay.invalid.record')).rejects.toThrow()
  })
})
