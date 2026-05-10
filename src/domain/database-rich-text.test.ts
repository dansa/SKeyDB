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
})
