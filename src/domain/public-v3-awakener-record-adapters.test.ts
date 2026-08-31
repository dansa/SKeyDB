import {describe, expect, it} from 'vitest'

import {
  adaptPublicV3SkillRecord,
  parsePublicV3DerivedSkillCatalogRecord,
  parsePublicV3DerivedSkillRecord,
  parsePublicV3EnlightenCatalogRecord,
  parsePublicV3OverlayCatalogRecord,
  parsePublicV3OverlayRecord,
  parsePublicV3SkillCatalogRecord,
  parsePublicV3SkillRecord,
  parsePublicV3TalentCatalogRecord,
  parsePublicV3TalentRecord,
} from './public-v3-awakener-record-adapters'

describe('public V3 awakener record adapters', () => {
  it('parses child catalog records without detail schema metadata', () => {
    expect(
      parsePublicV3SkillCatalogRecord({
        kind: 'skill',
        id: 'skill.cached.rouse',
        name: 'Cached Rouse',
        ownerAwakenerId: 'awakener-0001',
        slot: 'Rouse',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3TalentCatalogRecord({
        kind: 'talent',
        id: 'talent.cached.passive',
        name: 'Cached Passive',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3EnlightenCatalogRecord({
        kind: 'enlighten',
        id: 'enlighten.cached.one',
        name: 'Cached Enlighten',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3DerivedSkillCatalogRecord({
        kind: 'derivedSkill',
        id: 'derived.cached.extra',
        name: 'Cached Derived',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3OverlayCatalogRecord({
        kind: 'overlay',
        id: 'overlay.cached.mark',
        name: 'Cached Overlay',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
  })

  it('rejects malformed child catalog records before adaptation', () => {
    expect(() =>
      parsePublicV3SkillCatalogRecord({
        kind: 'talent',
        id: 'skill.cached.rouse',
        name: 'Cached Rouse',
      }),
    ).toThrow()
    expect(() =>
      parsePublicV3OverlayCatalogRecord({
        kind: 'overlay',
        id: 'overlay.cached.mark',
      }),
    ).toThrow()
  })

  it('keeps detail record parsing stricter than catalog parsing', () => {
    expect(() =>
      parsePublicV3SkillRecord({
        kind: 'skill',
        id: 'skill.cached.rouse',
        name: 'Cached Rouse',
      }),
    ).toThrow()
  })

  it('validates description args at the public V3 child parse boundary', () => {
    expect(() =>
      parsePublicV3TalentRecord({
        schemaVersion: 3,
        kind: 'talent',
        id: 'talent.cached.passive',
        name: 'Cached Passive',
        ownerAwakenerId: 'awakener-0001',
        descriptionArgs: {
          Arg1: {
            kind: 'fixed',
          },
        },
      }),
    ).toThrow()

    expect(() =>
      parsePublicV3OverlayRecord({
        schemaVersion: 3,
        kind: 'overlay',
        id: 'overlay.cached.mark',
        name: 'Cached Overlay',
        descriptionArgs: [],
      }),
    ).toThrow()
  })

  it('validates card keywords at the public V3 child parse boundary', () => {
    expect(() =>
      parsePublicV3SkillRecord({
        schemaVersion: 3,
        kind: 'skill',
        id: 'skill.cached.rouse',
        name: 'Cached Rouse',
        ownerAwakenerId: 'awakener-0001',
        cardKeywords: [{id: ''}],
      }),
    ).toThrow()

    expect(() =>
      parsePublicV3DerivedSkillRecord({
        schemaVersion: 3,
        kind: 'derivedSkill',
        id: 'derived.cached.extra',
        name: 'Cached Derived',
        ownerAwakenerId: 'awakener-0001',
        cardKeywords: {id: 'counter'},
      }),
    ).toThrow()
  })

  it('requires mode-specific Orison application member fields', () => {
    const record = {
      schemaVersion: 3,
      kind: 'skill',
      id: 'skill.cached.rouse',
      name: 'Cached Rouse',
      ownerAwakenerId: 'awakener-0001',
    }

    expect(() =>
      parsePublicV3SkillRecord({
        ...record,
        orisonApplications: [
          {
            id: 'orison-application.cached.exact',
            displayName: 'Exact pool',
            applicationMode: 'EXACT_VARIANT_POOL',
            members: [{orisonId: 'orison-0001'}],
          },
        ],
      }),
    ).toThrow()

    expect(() =>
      parsePublicV3SkillRecord({
        ...record,
        orisonApplications: [
          {
            id: 'orison-application.cached.temporary',
            displayName: 'Temporary effects',
            applicationMode: 'TEMPORARY_ANALOG',
            members: [{orisonId: 'orison-0001'}],
          },
        ],
      }),
    ).toThrow()
  })

  it('keeps missing description fields defaulted during adaptation and preserves loose metadata', () => {
    const parsed = parsePublicV3SkillRecord({
      schemaVersion: 3,
      kind: 'skill',
      id: 'skill.cached.rouse',
      name: 'Cached Rouse',
      ownerAwakenerId: 'awakener-0001',
      slot: 'Rouse',
      cardFamily: 'rouse',
      cardTypes: ['rouse'],
      countsAs: [],
      publicOnly: 'kept',
    })

    expect(parsed).toHaveProperty('publicOnly', 'kept')
    expect(adaptPublicV3SkillRecord(parsed)).toEqual(
      expect.objectContaining({
        cardKeywords: [],
        cardFamily: 'rouse',
        cardTypes: ['rouse'],
        countsAs: [],
        descriptionArgs: {},
        descriptionTemplate: '',
      }),
    )
  })
})
