import {describe, expect, it, vi} from 'vitest'

import {
  buildDatabaseOverlayReferenceInfo,
  type DatabaseReferenceInfo,
} from './database-reference-layer'
import {parseDatabaseRichDescription} from './database-rich-text'
import {resolveDescriptionTemplate} from './description-args'
import {
  buildCovenantDatabaseDescriptionRecord,
  buildPosseDatabaseDescriptionRecord,
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
    case 'scaling':
      return segment.values.join('~')
    default:
      return 'name' in segment ? segment.name : ''
  }
}

describe('hydrateGlobalDatabaseReferenceInfo', () => {
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
    expect(info.description).toContain('When attacked')
    expect(
      resolveDescriptionTemplate(info.record.descriptionTemplate, info.record.descriptionArgs),
    ).toContain('{Counter}')
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
    expect(hydrated.description).toContain('Lose 2% Max HP')
    expect(hydrated.kind).toBe('derived-skill')
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
