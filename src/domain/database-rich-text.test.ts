import {describe, expect, it} from 'vitest'

import type {AwakenerOverlayRecord} from './awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from './database-reference-layer'
import {buildDatabaseRichTextParseOptions, parseDatabaseRichDescription} from './database-rich-text'

const TEST_OVERLAY: AwakenerOverlayRecord = {
  id: 'overlay.test.counter',
  displayName: 'Counter',
  overlayType: 'mechanic',
  aliases: ['Counter Buff'],
  descriptionTemplate: 'Record text',
  descriptionArgs: {},
}

describe('database-rich-text', () => {
  it('builds database parse options from record and view lookups', () => {
    const options = buildDatabaseRichTextParseOptions(
      {
        id: 'skill.test.rouse',
        ownerAwakenerId: 1,
        kind: 'rouse',
        displayName: 'Strike',
        descriptionTemplate: 'Deal damage.',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      {
        referenceInfoByName: new Map([
          ['strike', {kind: 'skill', id: 'skill.test.rouse'}],
          ['counter', {kind: 'overlay', id: 'overlay.test.counter'}],
        ]) as ResolvedDatabaseReferenceLayer['referenceInfoByName'],
        accessibleOverlays: [TEST_OVERLAY],
        cardNames: new Set<string>(),
        referenceInfoById: new Map(),
        overlayByName: new Map(),
      } satisfies ResolvedDatabaseReferenceLayer,
    )

    expect(options).toEqual({
      excludedSkillNames: new Set(['strike']),
      plainTextMechanicNames: new Set(['Rouse']),
      overlayMechanicNames: new Set(['Counter', 'Counter Buff']),
      enableFollowupLineBreaks: true,
    })
  })

  it('parses database rich text using record text ahead of fallback text and appends footer text', () => {
    expect(
      parseDatabaseRichDescription({
        text: 'Fallback text',
        record: TEST_OVERLAY,
        keywordFooterText: 'Footer text',
        cardNames: new Set<string>(),
      }),
    ).toEqual([{type: 'text', value: 'Record text\nFooter text'}])
  })

  it('falls back to database view card names when callers omit them', () => {
    expect(
      parseDatabaseRichDescription({
        text: 'Gain {Strike} and {Counter}.',
        referenceLayer: {
          cardNames: new Set(['Strike']),
          accessibleOverlays: [TEST_OVERLAY],
          referenceInfoByName: new Map(),
          referenceInfoById: new Map(),
          overlayByName: new Map(),
        } satisfies ResolvedDatabaseReferenceLayer,
      }),
    ).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'skill', name: 'Strike'},
      {type: 'text', value: ' and '},
      {type: 'mechanic', name: 'Counter'},
      {type: 'text', value: '.'},
    ])
  })

  it('parses derived card aliases from the reference layer as skill references', () => {
    expect(
      parseDatabaseRichDescription({
        text: 'Count as 2 {Gaunt} cards.',
        referenceLayer: {
          cardNames: new Set(['Gaunts', 'Gaunt']),
          accessibleOverlays: [TEST_OVERLAY],
          referenceInfoByName: new Map(),
          referenceInfoById: new Map(),
          overlayByName: new Map(),
        } satisfies ResolvedDatabaseReferenceLayer,
      }),
    ).toEqual([
      {type: 'text', value: 'Count as 2 '},
      {type: 'skill', name: 'Gaunt'},
      {type: 'text', value: ' cards.'},
    ])
  })

  it('keeps same-record aliases clickable while suppressing exact self-name links', () => {
    const referenceLayer = {
      cardNames: new Set(['Gaunts', 'Gaunt']),
      accessibleOverlays: [TEST_OVERLAY],
      referenceInfoByName: new Map([
        ['gaunts', {kind: 'derived-skill', id: 'derived.pontos.gaunts'}],
        ['gaunt', {kind: 'derived-skill', id: 'derived.pontos.gaunts'}],
      ]) as ResolvedDatabaseReferenceLayer['referenceInfoByName'],
      referenceInfoById: new Map(),
      overlayByName: new Map(),
    } satisfies ResolvedDatabaseReferenceLayer

    expect(
      parseDatabaseRichDescription({
        record: {
          id: 'derived.pontos.gaunts',
          displayName: 'Gaunts',
          aliases: [],
          descriptionTemplate: 'Count as 2 {Gaunt} cards. {Gaunts} stay grouped.',
          descriptionArgs: {},
          cardKeywords: [],
          childDerivedSkillIds: [],
          nodeKind: 'group',
          variants: [],
        },
        referenceLayer,
      }),
    ).toEqual([
      {type: 'text', value: 'Count as 2 '},
      {type: 'skill', name: 'Gaunt'},
      {type: 'text', value: ' cards. '},
      {type: 'reference', name: 'Gaunts'},
      {type: 'text', value: ' stay grouped.'},
    ])
  })

  it('parses named public arg keys inside plural macros', () => {
    expect(
      parseDatabaseRichDescription({
        record: {
          id: 'overlay.global.delayed-sacrifice',
          displayName: 'Delayed Sacrifice',
          overlayType: 'mechanic',
          aliases: [],
          descriptionTemplate:
            'Gaining [Layer] {plural:[Layer]|stack|stacks} of the {Sacrifice} state.',
          descriptionArgs: {
            Layer: {
              kind: 'fixed',
              value: 'X',
            },
          },
        },
        cardNames: new Set<string>(),
      }),
    ).toEqual([
      {type: 'text', value: 'Gaining '},
      {type: 'descriptionArg', argKey: 'Layer', channel: null},
      {type: 'text', value: ' '},
      {type: 'argPlural', argKey: 'Layer', channel: null, singular: 'stack', plural: 'stacks'},
      {type: 'text', value: ' of the '},
      {type: 'mechanic', name: 'Sacrifice'},
      {type: 'text', value: ' state.'},
    ])
  })

  it('parses formatted description args next to mechanic references', () => {
    expect(
      parseDatabaseRichDescription({
        record: {
          id: 'wheel.test.fragrant-morphogenesis',
          kind: 'wheel',
          displayName: 'Fragrant Morphogenesis',
          descriptionTemplate: 'Cause +[Float:StateArg2]% {Embryo Fusion}.',
          descriptionArgs: {
            StateArg2: {
              kind: 'scaling',
              values: ['0.9', '1.1', '1.3', '1.5'],
            },
          },
        },
        referenceLayer: {
          cardNames: new Set<string>(),
          accessibleOverlays: [
            {
              id: 'overlay.global.embryo-fusion',
              displayName: 'Embryo Fusion',
              overlayType: 'mechanic',
              aliases: [],
              descriptionTemplate: 'Embryo Fusion text.',
              descriptionArgs: {},
            },
          ],
          referenceInfoByName: new Map(),
          referenceInfoById: new Map(),
          overlayByName: new Map(),
        },
      }),
    ).toEqual([
      {type: 'text', value: 'Cause +'},
      {type: 'descriptionArg', argKey: 'StateArg2', channel: 'Float'},
      {type: 'text', value: '% '},
      {type: 'mechanic', name: 'Embryo Fusion'},
      {type: 'text', value: '.'},
    ])
  })
})
