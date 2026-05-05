import {describe, expect, it} from 'vitest'

import {collectAwakenerDatabaseCardNames} from './awakeners-database-view'
import {type AwakenerFullRecord} from './awakeners-full'
import {getAwakenersLite} from './awakeners-lite'
import {resolveDescribedRecord} from './description-records'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'
import {parseRichDescription} from './rich-text'

const EMPTY_CARDS = new Set<string>()

async function loadAwakenerByName(name: string): Promise<AwakenerFullRecord> {
  const liteAwakener = getAwakenersLite().find(
    (entry) => entry.name.toLowerCase() === name.toLowerCase(),
  )
  expect(liteAwakener).toBeDefined()
  if (!liteAwakener) {
    throw new Error(`Missing awakener fixture: ${name}`)
  }

  const awakener = await loadPublicAwakenerDetailById(liteAwakener.id)
  expect(awakener).toBeDefined()
  if (!awakener) {
    throw new Error(`Missing awakener fixture: ${name}`)
  }
  return awakener
}

describe('parseRichDescription', () => {
  it('returns plain text when no tokens', () => {
    const result = parseRichDescription('Deal DMG to all enemies.', EMPTY_CARDS)
    expect(result).toEqual([{type: 'text', value: 'Deal DMG to all enemies.'}])
  })

  it('parses a stat token', () => {
    const result = parseRichDescription('Gain {ATK} bonus.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'stat', name: 'ATK'},
      {type: 'text', value: ' bonus.'},
    ])
  })

  it('parses multiple stat tokens', () => {
    const result = parseRichDescription('{CON}, {ATK}, and {DEF}', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'stat', name: 'CON'},
      {type: 'text', value: ', '},
      {type: 'stat', name: 'ATK'},
      {type: 'text', value: ', and '},
      {type: 'stat', name: 'DEF'},
    ])
  })

  it('parses a skill token when card name matches', () => {
    const cards = new Set(['Poof!'])
    const result = parseRichDescription('{Poof!}: Casiah gains 3 Aliemus.', cards)
    expect(result).toEqual([
      {type: 'skill', name: 'Poof!'},
      {type: 'text', value: ': Casiah gains 3 Aliemus.'},
    ])
  })

  it('parses a skill token case-insensitively and preserves canonical card name', () => {
    const cards = new Set(['Vortex! Shell!'])
    const result = parseRichDescription('{vortex! shell!} triggers.', cards)
    expect(result).toEqual([
      {type: 'skill', name: 'Vortex! Shell!'},
      {type: 'text', value: ' triggers.'},
    ])
  })

  it('classifies unknown tokens as mechanic', () => {
    const result = parseRichDescription('Inflict {Vulnerable} on all enemies.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Inflict '},
      {type: 'mechanic', name: 'Vulnerable'},
      {type: 'text', value: ' on all enemies.'},
    ])
  })

  it('parses scaling pattern with stat', () => {
    const result = parseRichDescription('Deal (10/12/14/16/18/20% {ATK}) DMG.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Deal '},
      {type: 'scaling', values: [10, 12, 14, 16, 18, 20], suffix: '%', stat: 'ATK'},
      {type: 'text', value: ' DMG.'},
    ])
  })

  it('parses scaling pattern without stat', () => {
    const result = parseRichDescription('Gain (5/6/7/8/9/10) Aliemus.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'scaling', values: [5, 6, 7, 8, 9, 10], suffix: '', stat: null},
      {type: 'text', value: ' Aliemus.'},
    ])
  })

  it('parses scaling with decimal values', () => {
    const result = parseRichDescription(
      'Deal (12.5/15/17.5/20/22.5/25% {DEF}) Shield.',
      EMPTY_CARDS,
    )
    expect(result).toEqual([
      {type: 'text', value: 'Deal '},
      {type: 'scaling', values: [12.5, 15, 17.5, 20, 22.5, 25], suffix: '%', stat: 'DEF'},
      {type: 'text', value: ' Shield.'},
    ])
  })

  it('handles scaling before bracket tokens in the same string', () => {
    const result = parseRichDescription(
      'Deal (10/12/14/16/18/20% {ATK}) DMG. Inflict {Poison}.',
      EMPTY_CARDS,
    )
    expect(result).toEqual([
      {type: 'text', value: 'Deal '},
      {type: 'scaling', values: [10, 12, 14, 16, 18, 20], suffix: '%', stat: 'ATK'},
      {type: 'text', value: ' DMG. Inflict '},
      {type: 'mechanic', name: 'Poison'},
      {type: 'text', value: '.'},
    ])
  })

  it('handles unclosed bracket gracefully as plain text', () => {
    const result = parseRichDescription('Broken {token text', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Broken '},
      {type: 'text', value: '{token text'},
    ])
  })

  it('handles empty brackets as plain text', () => {
    const result = parseRichDescription('Empty {} here.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Empty '},
      {type: 'text', value: '{}'},
      {type: 'text', value: ' here.'},
    ])
  })

  it('skill takes priority over mechanic for matching card names', () => {
    const cards = new Set(['Strike', 'Defend'])
    const result = parseRichDescription('{Strike} and {Defend}', cards)
    expect(result).toEqual([
      {type: 'skill', name: 'Strike'},
      {type: 'text', value: ' and '},
      {type: 'skill', name: 'Defend'},
    ])
  })

  it('can suppress self skill aliases so they fall back to mechanics', () => {
    const cards = new Set(['Rouse'])
    const result = parseRichDescription('Gain {Rouse}.', cards, undefined, {
      excludedSkillNames: ['rouse'],
      overlayMechanicNames: ['rouse'],
    })

    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'mechanic', name: 'Rouse'},
      {type: 'text', value: '.'},
    ])
  })

  it('prefers overlay mechanics over stat styling when a matching overlay is available', () => {
    const result = parseRichDescription(
      'Gain {Death Resistance} and {Tentacle DMG}.',
      EMPTY_CARDS,
      undefined,
      {
        overlayMechanicNames: ['Death Resistance', 'Tentacle DMG'],
      },
    )

    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'mechanic', name: 'Death Resistance'},
      {type: 'text', value: ' and '},
      {type: 'mechanic', name: 'Tentacle DMG'},
      {type: 'text', value: '.'},
    ])
  })

  it('promotes bare multi-word overlay names in prose into mechanic segments', () => {
    const result = parseRichDescription(
      'Gain Tentacle DMG and Death Resistance.',
      EMPTY_CARDS,
      undefined,
      {
        overlayMechanicNames: ['Tentacle DMG', 'Death Resistance'],
      },
    )

    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'mechanic', name: 'Tentacle DMG'},
      {type: 'text', value: ' and '},
      {type: 'mechanic', name: 'Death Resistance'},
      {type: 'text', value: '.'},
    ])
  })

  it('renders excluded self skill refs as non-interactive references when no overlay exists', () => {
    const cards = new Set(['Colorless Spiral'])
    const result = parseRichDescription('Transform into {Colorless Spiral}.', cards, undefined, {
      excludedSkillNames: ['colorless spiral'],
    })

    expect(result).toEqual([
      {type: 'text', value: 'Transform into '},
      {type: 'reference', name: 'Colorless Spiral'},
      {type: 'text', value: '.'},
    ])
  })

  it('parses STR as a stat even though it is not a mainstat key', () => {
    const result = parseRichDescription('Gain {STR} equal to 8%.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'stat', name: 'STR'},
      {type: 'text', value: ' equal to 8%.'},
    ])
  })

  it('parses temporary stat-prefixed tokens as stats', () => {
    const result = parseRichDescription(
      'Gain {Temporary Crit Rate} and {Temporary STR}.',
      EMPTY_CARDS,
    )
    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'stat', name: 'Temporary Crit Rate'},
      {type: 'text', value: ' and '},
      {type: 'stat', name: 'Temporary STR'},
      {type: 'text', value: '.'},
    ])
  })

  it('parses prose scaling "X% of {STAT}" pattern', () => {
    const result = parseRichDescription('Deal 7.5% of {CON} as DMG.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Deal '},
      {type: 'scaling', values: [7.5], suffix: '%', stat: 'CON'},
      {type: 'text', value: ' as DMG.'},
    ])
  })

  it('parses prose scaling with integer value', () => {
    const result = parseRichDescription('Restore 10% of {DEF} as Shield.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Restore '},
      {type: 'scaling', values: [10], suffix: '%', stat: 'DEF'},
      {type: 'text', value: ' as Shield.'},
    ])
  })

  it('does NOT parse prose scaling for non-computable stats', () => {
    const result = parseRichDescription('Gain 1% of {Death Resistance} bonus.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Gain 1% of '},
      {type: 'stat', name: 'Death Resistance'},
      {type: 'text', value: ' bonus.'},
    ])
  })

  it('does NOT parse prose scaling for mechanic-type stats', () => {
    const result = parseRichDescription('Deal 50% of {Poison} DMG.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'text', value: 'Deal 50% of '},
      {type: 'mechanic', name: 'Poison'},
      {type: 'text', value: ' DMG.'},
    ])
  })

  it('classifies realm tokens as realm segments', () => {
    const result = parseRichDescription('{Chaos} realm bonus.', EMPTY_CARDS)
    expect(result).toEqual([
      {type: 'realm', name: 'Chaos'},
      {type: 'text', value: ' realm bonus.'},
    ])
  })

  it('parses a complex real-world description', () => {
    const cards = new Set(['Opening Act', 'Strike', 'Defend', 'Telekinesis', 'Poof!'])
    const result = parseRichDescription(
      'Casiah gains (25/30/35/40/45/50) Aliemus. {Rouse}: Gain (8/9.6/11.2/12.8/14.4/16% {ATK}) Temporary {STR} for each card played this turn.',
      cards,
      undefined,
      {enableFollowupLineBreaks: true},
    )
    expect(result[0]).toEqual({type: 'text', value: 'Casiah gains '})
    expect(result[1]).toEqual({
      type: 'scaling',
      values: [25, 30, 35, 40, 45, 50],
      suffix: '',
      stat: null,
    })
    expect(result[2]).toEqual({type: 'text', value: ' Aliemus. '})
    expect(result[3]).toEqual({type: 'text', value: '\n'})
    expect(result[4]).toEqual({type: 'mechanic', name: 'Rouse'})
    expect(result[5]).toEqual({type: 'text', value: ': Gain '})
    expect(result[6]).toEqual({
      type: 'scaling',
      values: [8, 9.6, 11.2, 12.8, 14.4, 16],
      suffix: '%',
      stat: 'ATK',
    })
    expect(result[7]).toEqual({type: 'text', value: ' Temporary '})
    expect(result[8]).toEqual({type: 'stat', name: 'STR'})
    expect(result[9]).toEqual({type: 'text', value: ' for each card played this turn.'})
  })

  it('inserts a line break before tagged follow-up mechanics like Aftershock', () => {
    const result = parseRichDescription(
      'Gain [Block:Arg1] Shield. {Aftershock}: Gain [Power:Arg2] {STR}.',
      EMPTY_CARDS,
      {
        Arg1: {
          kind: 'fixed',
          value: '10',
          suffix: '%',
          stat: 'DEF',
        },
        Arg2: {
          kind: 'fixed',
          value: '2.8',
          suffix: '%',
          stat: 'ATK',
        },
      },
      {enableFollowupLineBreaks: true},
    )

    expect(result).toEqual([
      {type: 'text', value: 'Gain '},
      {type: 'descriptionArg', argKey: 'Arg1', channel: 'Block'},
      {type: 'text', value: ' Shield. '},
      {type: 'text', value: '\n'},
      {type: 'mechanic', name: 'Aftershock'},
      {type: 'text', value: ': Gain '},
      {type: 'descriptionArg', argKey: 'Arg2', channel: 'Power'},
      {type: 'text', value: ' '},
      {type: 'stat', name: 'STR'},
      {type: 'text', value: '.'},
    ])
  })

  it('does not add duplicate line breaks when the tagged follow-up already starts on a new line', () => {
    const result = parseRichDescription(
      'Gain Shield.\n{Leap}: Gain {Counter}.',
      EMPTY_CARDS,
      undefined,
      {
        enableFollowupLineBreaks: true,
      },
    )

    expect(result).toEqual([
      {type: 'text', value: 'Gain Shield.\n'},
      {type: 'mechanic', name: 'Leap'},
      {type: 'text', value: ': Gain '},
      {type: 'mechanic', name: 'Counter'},
      {type: 'text', value: '.'},
    ])
  })

  it('inserts a line break after bracketed headings like Devour blocks', () => {
    const result = parseRichDescription(
      '[Devour: Obtain {STR} and {Alert}.] Obtain Shield.',
      EMPTY_CARDS,
      undefined,
      {enableFollowupLineBreaks: true},
    )

    expect(result).toEqual([
      {type: 'text', value: '[Devour: Obtain '},
      {type: 'stat', name: 'STR'},
      {type: 'text', value: ' and '},
      {type: 'mechanic', name: 'Alert'},
      {type: 'text', value: '.]\nObtain Shield.'},
    ])
  })

  it('inserts a line break before tagged Rouse follow-ups', () => {
    const result = parseRichDescription(
      'Agrippa obtains 25 Aliemus. {Rouse}: Poison inflicted by Agrippa +50%.',
      EMPTY_CARDS,
      undefined,
      {enableFollowupLineBreaks: true},
    )

    expect(result).toEqual([
      {type: 'text', value: 'Agrippa obtains 25 Aliemus. '},
      {type: 'text', value: '\n'},
      {type: 'mechanic', name: 'Rouse'},
      {type: 'text', value: ': Poison inflicted by Agrippa +50%.'},
    ])
  })

  it('keeps the Rouse line break when a self reference is forced to plain text', () => {
    const result = parseRichDescription(
      'Agrippa obtains 25 Aliemus. {Rouse}: Poison inflicted by Agrippa +50%.',
      EMPTY_CARDS,
      undefined,
      {
        enableFollowupLineBreaks: true,
        plainTextMechanicNames: ['rouse'],
        overlayMechanicNames: ['rouse'],
      },
    )

    expect(result).toEqual([
      {type: 'text', value: 'Agrippa obtains 25 Aliemus. '},
      {type: 'text', value: '\n'},
      {type: 'text', value: 'Rouse'},
      {type: 'text', value: ': Poison inflicted by Agrippa +50%.'},
    ])
  })

  it('does not insert follow-up line breaks unless explicitly enabled', () => {
    const result = parseRichDescription(
      'Gain Shield. {Aftershock}: Gain {Counter}.',
      EMPTY_CARDS,
      undefined,
      {
        overlayMechanicNames: ['Aftershock', 'Counter'],
      },
    )

    expect(result).toEqual([
      {type: 'text', value: 'Gain Shield. '},
      {type: 'mechanic', name: 'Aftershock'},
      {type: 'text', value: ': Gain '},
      {type: 'mechanic', name: 'Counter'},
      {type: 'text', value: '.'},
    ])
  })

  it('parses resolved public V2 descriptions without leaking raw arg tokens', async () => {
    const cases = [
      {
        awakenerName: 'kathigu-ra',
        slot: 'C1',
      },
      {
        awakenerName: 'kathigu-ra',
        slot: 'C2',
      },
      {
        awakenerName: 'kathigu-ra',
        slot: 'C3',
      },
      {
        awakenerName: 'murphy: fauxborn',
        slot: 'C1',
      },
      {
        awakenerName: 'pickman',
        slot: 'C1',
      },
      {
        awakenerName: 'pickman',
        slot: 'C2',
      },
      {
        awakenerName: 'pickman',
        slot: 'C3',
      },
      {
        awakenerName: 'pollux',
        slot: 'C1',
      },
    ] as const

    for (const testCase of cases) {
      const awakener = await loadAwakenerByName(testCase.awakenerName)
      const card = awakener.cards[testCase.slot]
      const resolvedDescription = resolveDescribedRecord(card, {rank: 6}, {maxRank: 6}).description
      const result = parseRichDescription(
        resolvedDescription,
        collectAwakenerDatabaseCardNames(awakener),
      )

      expect(result.some((segment) => segment.type === 'scaling')).toBe(false)
      expect(result.some((segment) => segment.type === 'text' && segment.value.includes('['))).toBe(
        false,
      )
    }
  })

  it('consumes template percent signs when description args already supply a percent suffix', () => {
    const result = parseRichDescription('Deal [Arg1]% bonus.', EMPTY_CARDS, {
      Arg1: {
        kind: 'fixed',
        substatBonus: {
          substat: 'SigilYield',
          multiplier: '1',
          suffix: '%',
        },
      },
    })

    expect(result).toEqual([
      {type: 'text', value: 'Deal '},
      {type: 'descriptionArg', argKey: 'Arg1', channel: null},
      {type: 'text', value: ' bonus.'},
    ])
  })

  it('parses public V2 description args with braced mechanic channels', () => {
    const result = parseRichDescription('Inflict [{Poison}:Arg1] {Poison}.', EMPTY_CARDS, {
      Arg1: {
        kind: 'fixed',
        value: '1',
      },
    })

    expect(result).toEqual([
      {type: 'text', value: 'Inflict '},
      {type: 'descriptionArg', argKey: 'Arg1', channel: 'Poison'},
      {type: 'text', value: ' '},
      {type: 'mechanic', name: 'Poison'},
      {type: 'text', value: '.'},
    ])
  })

  it('parses public V2 plural macros without leaking macro text', () => {
    const result = parseRichDescription(
      'Draw [Arg1] {plural:[Arg1]|card|cards}. Inflict [{Poison}:Arg2] {plural:[{Poison}:Arg2]|stack|stacks}.',
      EMPTY_CARDS,
      {
        Arg1: {
          kind: 'fixed',
          value: '1',
        },
        Arg2: {
          kind: 'fixed',
          value: '2',
        },
      },
    )

    expect(result).toEqual([
      {type: 'text', value: 'Draw '},
      {type: 'descriptionArg', argKey: 'Arg1', channel: null},
      {type: 'text', value: ' '},
      {type: 'argPlural', argKey: 'Arg1', channel: null, singular: 'card', plural: 'cards'},
      {type: 'text', value: '. Inflict '},
      {type: 'descriptionArg', argKey: 'Arg2', channel: 'Poison'},
      {type: 'text', value: ' '},
      {type: 'argPlural', argKey: 'Arg2', channel: 'Poison', singular: 'stack', plural: 'stacks'},
      {type: 'text', value: '.'},
    ])
  })

  it('collapses public V2 ordinal macros to display text', () => {
    const result = parseRichDescription('On the {ordinal:3rd} play.', EMPTY_CARDS)

    expect(result).toEqual([
      {type: 'text', value: 'On the '},
      {type: 'text', value: '3rd'},
      {type: 'text', value: ' play.'},
    ])
    expect(result.some((segment) => segment.type === 'mechanic')).toBe(false)
  })
})
