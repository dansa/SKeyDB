import {describe, expect, it} from 'vitest'

import {getCardNamesFromFull, parseRichDescription} from './rich-text'

const EMPTY_CARDS = new Set<string>()

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
    )
    expect(result[0]).toEqual({type: 'text', value: 'Casiah gains '})
    expect(result[1]).toEqual({
      type: 'scaling',
      values: [25, 30, 35, 40, 45, 50],
      suffix: '',
      stat: null,
    })
    expect(result[2]).toEqual({type: 'text', value: ' Aliemus. '})
    expect(result[3]).toEqual({type: 'mechanic', name: 'Rouse'})
    expect(result[4]).toEqual({type: 'text', value: ': Gain '})
    expect(result[5]).toEqual({
      type: 'scaling',
      values: [8, 9.6, 11.2, 12.8, 14.4, 16],
      suffix: '%',
      stat: 'ATK',
    })
    expect(result[6]).toEqual({type: 'text', value: ' Temporary '})
    expect(result[7]).toEqual({type: 'stat', name: 'STR'})
    expect(result[8]).toEqual({type: 'text', value: ' for each card played this turn.'})
  })
})

describe('getCardNamesFromFull', () => {
  it('collects card, exalt, talent, and enlighten names', () => {
    const awakener = {
      cards: {
        C1: {name: 'Opening Act'},
        C2: {name: 'Strike'},
      },
      exalts: {
        exalt: {name: 'Magic Carnival'},
        over_exalt: {name: 'Unfettered Mirth'},
      },
      talents: {
        T1: {name: 'Master of Magic'},
        T2: {name: 'Madness Omen'},
      },
      enlightens: {
        E1: {name: 'Hysteria'},
      },
    }
    const names = getCardNamesFromFull(awakener)
    expect(names).toContain('Opening Act')
    expect(names).toContain('Strike')
    expect(names).toContain('Magic Carnival')
    expect(names).toContain('Unfettered Mirth')
    expect(names).toContain('Master of Magic')
    expect(names).toContain('Madness Omen')
    expect(names).toContain('Hysteria')
  })

  it('skips Innate: None talents', () => {
    const awakener = {
      cards: {C1: {name: 'Strike'}},
      exalts: {exalt: {name: 'Ex'}, over_exalt: {name: 'Ox'}},
      talents: {T1: {name: 'None'}},
      enlightens: {},
    }
    const names = getCardNamesFromFull(awakener)
    expect(names).not.toContain('None')
    expect(names).not.toContain('Innate: None')
  })
})
