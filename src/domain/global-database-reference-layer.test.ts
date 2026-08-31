import {describe, expect, it, vi} from 'vitest'

import {
  resolveDatabaseReferenceInfo,
  resolveDatabaseReferenceInfoByKindAndName,
} from './database-reference-info'
import {
  buildDatabaseDerivedSkillReferenceInfo,
  buildDatabaseOverlayReferenceInfo,
  type DatabaseReferenceInfo,
} from './database-reference-layer'
import {parseDatabaseRichDescription} from './database-rich-text'
import {resolveDescriptionTemplate} from './description-args'
import {
  buildCovenantDatabaseDescriptionRecord,
  buildGlobalDatabaseReferenceLayer,
  buildPosseDatabaseDescriptionRecord,
  buildPosseReferenceEntries,
  hydrateGlobalDatabaseReferenceInfo,
} from './global-database-reference-layer'
import * as publicDetailRecordAdapters from './public-detail-record-adapters'
import type {RichSegment} from './rich-text'
import {buildWheelDatabaseDescriptionRecord} from './wheels-database-reference-layer'

function getSegmentText(segment: RichSegment): string {
  switch (segment.type) {
    case 'text':
      return segment.value
    case 'descriptionArg':
      return `[${segment.argKey}]`
    case 'argPlural':
      return `{plural:${segment.argKey}}`
    case 'formatting':
      return segment.segments.map(getSegmentText).join('')
    case 'scaling':
      return segment.values.join('~')
    default:
      return 'name' in segment ? segment.name : ''
  }
}

describe('hydrateGlobalDatabaseReferenceInfo', () => {
  it('hydrates catalog-backed Orison and Relic family stubs', async () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer()
    const orison = resolveDatabaseReferenceInfoByKindAndName(referenceLayer, 'orison', 'Finesse')
    const relic = resolveDatabaseReferenceInfoByKindAndName(
      referenceLayer,
      'relic',
      'Malignant Child',
    )

    expect(orison).not.toBeNull()
    expect(relic).not.toBeNull()
    if (!orison || !relic) {
      throw new Error('Expected catalog-backed Orison and Relic references.')
    }

    const [hydratedOrison, hydratedRelic] = await Promise.all([
      hydrateGlobalDatabaseReferenceInfo(orison),
      hydrateGlobalDatabaseReferenceInfo(relic),
    ])

    expect(hydratedOrison.description).not.toBe('')
    expect(hydratedRelic.description).not.toBe('')
  })

  it('hydrates the exact Orison and Relic variants selected by compact references', async () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer()
    const orison = resolveDatabaseReferenceInfoByKindAndName(
      referenceLayer,
      'orison',
      'Computation',
    )
    const relic = resolveDatabaseReferenceInfoByKindAndName(
      referenceLayer,
      'relic',
      'Malignant Child',
    )
    if (!orison || !relic) {
      throw new Error('Expected exact-variant family references.')
    }

    const [hydratedOrison, hydratedRelic] = await Promise.all([
      hydrateGlobalDatabaseReferenceInfo({...orison, variantId: 'orison-variant-0004'}),
      hydrateGlobalDatabaseReferenceInfo({...relic, variantId: 'relic-variant-0341'}),
    ])

    expect(hydratedOrison).toMatchObject({
      id: 'orison-0002',
      variantId: 'orison-variant-0004',
      description: 'When played, gain 2 Arithmetica.',
    })
    expect(hydratedRelic).toMatchObject({
      id: 'relic-0207',
      variantId: 'relic-variant-0341',
    })
    expect(hydratedRelic.description).toContain('inflict 2 stacks of')
    expect(hydratedRelic.description).toContain('+30%')
  })

  it('hydrates Pickman overlay descriptions with the E2 exact-variant replacements', async () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer()
    const orisons = resolveDatabaseReferenceInfoByKindAndName(
      referenceLayer,
      'overlay',
      'Painted Orisons',
    )
    const relics = resolveDatabaseReferenceInfoByKindAndName(
      referenceLayer,
      'overlay',
      'Painted Relics',
    )
    if (!orisons || !relics) {
      throw new Error('Expected Pickman overlay references.')
    }

    const [baseOrisons, e2Orisons, baseRelics, e2Relics] = await Promise.all([
      hydrateGlobalDatabaseReferenceInfo(orisons),
      hydrateGlobalDatabaseReferenceInfo(orisons, undefined, null, 'E2'),
      hydrateGlobalDatabaseReferenceInfo(relics),
      hydrateGlobalDatabaseReferenceInfo(relics, undefined, null, 'E2'),
    ])

    expect(baseOrisons.description).toContain('{orison:0002@v-0003|Computation}')
    expect(e2Orisons.description).toContain('{orison:0002@v-0004|Computation}')
    expect(baseRelics.description).toContain('{relic:0207@v-0340|Malignant Child}')
    expect(e2Relics.description).toContain('{relic:0207@v-0341|Malignant Child}')
  })

  it('hydrates wheel descriptions through per-record detail loading', async () => {
    const loadPublicWheelDetailById = vi.spyOn(
      publicDetailRecordAdapters,
      'loadPublicWheelDetailById',
    )
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'wheel',
      id: 'wheel-0001',
      name: 'Dark Star',
      label: 'Wheel · SSR · Caro',
      record: buildWheelDatabaseDescriptionRecord({
        id: 'wheel-0001',
        name: 'Dark Star',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })

    expect(loadPublicWheelDetailById).toHaveBeenCalledWith('wheel-0001')
    expect(info.description).not.toBe('')
    expect(info.kind).toBe('wheel')
  })

  it('hydrates catalog-backed overlay descriptions through per-record detail loading', async () => {
    const loadPublicOverlayDetailById = vi.spyOn(
      publicDetailRecordAdapters,
      'loadPublicOverlayDetailById',
    )
    const info = await hydrateGlobalDatabaseReferenceInfo(
      buildDatabaseOverlayReferenceInfo({
        id: 'overlay.global.counter',
        displayName: 'Counter',
        overlayType: 'mechanic',
        aliases: [],
        iconId: 'IconS_Buff_019',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
    )

    expect(loadPublicOverlayDetailById).toHaveBeenCalledWith('overlay.global.counter')
    expect(info.description).toContain('When taking Active DMG')
    expect(
      resolveDescriptionTemplate(info.record.descriptionTemplate, info.record.descriptionArgs),
    ).toContain('{Pure DMG}')
    expect(info.kind).toBe('overlay')
  })

  it('hydrates catalog-backed derived skill descriptions through per-record detail loading', async () => {
    const loadPublicDerivedSkillDetailById = vi.spyOn(
      publicDetailRecordAdapters,
      'loadPublicDerivedSkillDetailById',
    )
    const info: DatabaseReferenceInfo = {
      kind: 'derived-skill',
      id: 'derived.arachne.guiding-strings',
      name: 'Guiding Strings',
      label: 'Derived · Guiding Strings',
      record: {
        id: 'derived.arachne.guiding-strings',
        displayName: 'Guiding Strings',
        aliases: [],
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        childDerivedSkillIds: [],
        variants: [],
      },
      description: '',
      keywordFooterText: undefined,
      descriptionRank: 1,
      descriptionMaxRank: 6,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }

    const hydrated = await hydrateGlobalDatabaseReferenceInfo(info)

    expect(loadPublicDerivedSkillDetailById).toHaveBeenCalledWith('derived.arachne.guiding-strings')
    expect(hydrated.description).toContain('Lose 2% of Max HP')
    expect(hydrated.kind).toBe('derived-skill')
  })

  it('preserves wheel refinement when hydrating a derived skill from a catalog stub', async () => {
    const info: DatabaseReferenceInfo = {
      kind: 'derived-skill',
      id: 'derived.global.falling-upward',
      name: 'Falling Upward',
      label: 'Card · Derived · Cost —',
      record: {
        id: 'derived.global.falling-upward',
        displayName: 'Falling Upward',
        aliases: [],
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        childDerivedSkillIds: [],
        variants: [],
      },
      description: '',
      keywordFooterText: undefined,
      descriptionRank: 1,
      descriptionMaxRank: 6,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }

    const hydrated = await hydrateGlobalDatabaseReferenceInfo(info, {
      wheelRefinementLevel: 3,
    })

    expect(hydrated.description).toContain('100 fixed Aliemus')
    expect(hydrated.descriptionRank).toBe(4)
  })

  it('hydrates posse descriptions through per-record detail loading', async () => {
    const loadPublicPosseDetailById = vi.spyOn(
      publicDetailRecordAdapters,
      'loadPublicPosseDetailById',
    )
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'posse',
      id: 'posse-0001',
      name: 'Flora',
      label: 'Posse · Aequor',
      record: buildPosseDatabaseDescriptionRecord({
        id: 'posse-0001',
        name: 'Flora',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })

    expect(loadPublicPosseDetailById).toHaveBeenCalledWith('posse-0001')
    expect(info.description).not.toBe('')
    expect(info.kind).toBe('posse')
  })

  it('hydrates every covenant set effect into reference descriptions', async () => {
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'covenant',
      id: 'covenant-0001',
      name: 'Deus Ex Machina',
      label: 'Covenant',
      record: buildCovenantDatabaseDescriptionRecord({
        id: 'covenant-0001',
        name: 'Deus Ex Machina',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })

    expect(info.description).toContain('3 Set')
    expect(info.description).toContain('Realm Mastery +12')
    expect(info.description).toContain('6 Set')
    expect(info.description).toContain('Gain 1 Arithmetica')
  })

  it('keeps hydrated covenant set effects when parsed for rich-text rendering', async () => {
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'covenant',
      id: 'covenant-0001',
      name: 'Deus Ex Machina',
      label: 'Covenant',
      record: buildCovenantDatabaseDescriptionRecord({
        id: 'covenant-0001',
        name: 'Deus Ex Machina',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })
    const renderedText = parseDatabaseRichDescription({
      text: info.description,
      record: info.record,
    })
      .map(getSegmentText)
      .join('')

    expect(renderedText).toContain('3 Set')
    expect(renderedText).toContain('6 Set')
    expect(renderedText).toContain('Gain 1 Arithmetica')
  })
})

describe('buildPosseReferenceEntries', () => {
  it('resolves catalog descriptions for related-reference previews', () => {
    const [info] = buildPosseReferenceEntries(
      [
        {
          id: 'posse-memory-test',
          index: 999,
          name: 'Primordial Memory·Catalyst',
          realm: 'OTHER',
          isFadedLegacy: false,
          lineupToken: 'I',
          descriptionTemplate: 'All Awakeners gain [Arg1] Aliemus.',
          descriptionArgs: {Arg1: {kind: 'fixed', value: '5'}},
        },
      ],
      {primordiaAllChaosTeam: true},
    )

    expect(info.description).toBe('All Awakeners gain 5 Aliemus.')
  })
})

describe('buildDatabaseDerivedSkillReferenceInfo', () => {
  const record = {
    id: 'derived.global.falling-upward',
    displayName: 'Falling Upward',
    aliases: [],
    descriptionTemplate: 'Gain Aliemus.',
    descriptionArgs: {},
    cardFamily: 'command',
    cardTypes: ['derived'],
    countsAs: [],
    cardKeywords: [],
    childDerivedSkillIds: [],
    variants: [],
  }

  it.each([
    ['0', 'Cost 0 · Command · Derived'],
    ['3', 'Cost 3 · Command · Derived'],
  ])('includes cost %s without repeating the card name', (cost, expectedLabel) => {
    expect(buildDatabaseDerivedSkillReferenceInfo({...record, cost}).label).toBe(expectedLabel)
  })

  it('labels synthetic groups without presenting a fake cost', () => {
    expect(buildDatabaseDerivedSkillReferenceInfo({...record, nodeKind: 'group'}).label).toBe(
      'Group · Command · Derived',
    )
  })
})

describe('buildGlobalDatabaseReferenceLayer', () => {
  it('uses canonical card metadata in skill popovers', () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer({
      awakenerSkills: [
        {
          id: 'skill.test.mortal-blast',
          ownerAwakenerId: 999,
          kind: 'command',
          displayName: 'Mortal Blast',
          cost: '1',
          cardFamily: 'command',
          cardTypes: ['skill'],
          countsAs: ['strike'],
          descriptionTemplate: 'Deal damage.',
          descriptionArgs: {},
          cardKeywords: [],
          variants: [],
        },
      ],
      covenants: [],
      derivedSkills: [],
      overlays: [],
      posses: [],
      wheels: [],
    })

    expect(referenceLayer.referenceInfoById.get('skill.test.mortal-blast')?.label).toBe(
      'Cost 1 · Command · Skill · Counts as Strike',
    )
  })

  it('keeps same-named overlays ahead of skills and derived records', () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer({
      awakenerSkills: [
        {
          id: 'skill.test.counter',
          ownerAwakenerId: 999,
          kind: 'strike',
          displayName: 'Counter',
          descriptionTemplate: 'Counter skill.',
          descriptionArgs: {},
          cardKeywords: [],
          variants: [],
        },
      ],
      covenants: [],
      derivedSkills: [
        {
          id: 'derived.test.counter',
          displayName: 'Counter',
          aliases: [],
          descriptionTemplate: 'Counter derived.',
          descriptionArgs: {},
          cardKeywords: [],
          childDerivedSkillIds: [],
          variants: [],
        },
      ],
      overlays: [
        {
          id: 'overlay.test.counter',
          displayName: 'Counter',
          overlayType: 'mechanic',
          aliases: [],
          descriptionTemplate: 'Counter overlay.',
          descriptionArgs: {},
        },
      ],
      posses: [],
      wheels: [],
    })

    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Counter')).toEqual(
      expect.objectContaining({
        kind: 'overlay',
        id: 'overlay.test.counter',
      }),
    )
    expect(referenceLayer.referenceInfoById.get('skill.test.counter')).toBeUndefined()
    expect(referenceLayer.referenceInfoById.get('derived.test.counter')).toBeUndefined()
  })

  it('indexes derived skill aliases for global artifact descriptions', () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer({
      awakenerSkills: [],
      covenants: [],
      derivedSkills: [
        {
          id: 'derived.pontos.gaunts',
          ownerAwakenerId: 58,
          displayName: 'Gaunts',
          aliases: ['Gaunt'],
          descriptionTemplate: 'Count as 2 {Gaunt} cards.',
          descriptionArgs: {},
          cardKeywords: [],
          childDerivedSkillIds: [],
          variants: [],
        },
      ],
      overlays: [],
      posses: [],
      wheels: [],
    })

    expect(referenceLayer.cardNames.has('Gaunt')).toBe(true)
    expect(resolveDatabaseReferenceInfo(referenceLayer, 'Gaunt')).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.pontos.gaunts',
      }),
    )
    expect(
      parseDatabaseRichDescription({
        text: 'When playing a {Gaunt} card, consume 1 stack.',
        referenceLayer,
      }),
    ).toContainEqual({type: 'skill', name: 'Gaunt'})
  })

  it('resolves typed global Insight references to the utility card over same-name owner cards', () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer({
      awakenerSkills: [],
      covenants: [],
      derivedSkills: [
        {
          id: 'derived.daffodil.thousand-mirage-effect-insight',
          ownerAwakenerId: 12,
          displayName: 'Insight',
          aliases: [],
          descriptionTemplate: 'Daffodil-specific Insight.',
          descriptionArgs: {},
          cardKeywords: [],
          childDerivedSkillIds: [],
          variants: [],
        },
        {
          id: 'derived.global.insight',
          displayName: 'Insight',
          aliases: [],
          descriptionTemplate: 'Draw 1 card.',
          descriptionArgs: {},
          cardKeywords: [],
          childDerivedSkillIds: [],
          variants: [],
        },
      ],
      overlays: [],
      posses: [
        {
          id: 'posse-0028',
          index: 28,
          name: 'Symphony Fourth',
          realm: 'CHAOS',
          isFadedLegacy: false,
          lineupToken: 'I',
        },
      ],
      wheels: [],
    })

    expect(
      resolveDatabaseReferenceInfoByKindAndName(referenceLayer, 'derived-skill', 'Insight'),
    ).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.global.insight',
      }),
    )
    expect(
      parseDatabaseRichDescription({
        text: 'Create 4 {derived:Insight}.',
        referenceLayer,
      }),
    ).toContainEqual({type: 'skill', name: 'Insight', referenceKind: 'derived-skill'})
  })

  it('indexes Relic families for typed rich-text references', () => {
    const referenceLayer = buildGlobalDatabaseReferenceLayer({
      awakenerSkills: [],
      covenants: [],
      derivedSkills: [],
      orisons: [],
      overlays: [],
      posses: [],
      relics: [
        {
          id: 'relic-0207',
          kind: 'GENERIC',
          relicType: 'Relic',
          categories: ['ASTRAL_REIGN'],
          rarity: 'N',
          aliases: ['Painted Malignant Child'],
          variantCount: 5,
          variantCategoryTiers: [{category: 'ASTRAL_REIGN', tier: 'Silver'}],
          variantTiers: ['Silver', 'Gold'],
          defaultVariantCategory: 'ASTRAL_REIGN',
          defaultVariantId: 'relic-variant-0338',
          route: {slug: 'malignant-child', canonicalPath: '/database/relics/malignant-child'},
          assetId: 'Icon_Creation_066',
          name: 'Malignant Child',
          description: 'Inflict Weakness.',
        },
      ],
      wheels: [],
    })

    expect(
      resolveDatabaseReferenceInfoByKindAndName(referenceLayer, 'relic', 'Malignant Child'),
    ).toEqual(
      expect.objectContaining({
        kind: 'relic',
        id: 'relic-0207',
      }),
    )
    expect(
      parseDatabaseRichDescription({
        text: 'Choose {relic:Malignant Child}.',
        referenceLayer,
      }),
    ).toContainEqual({type: 'skill', name: 'Malignant Child', referenceKind: 'relic'})
  })
})
