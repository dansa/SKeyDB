import {describe, expect, it} from 'vitest'

import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  resolveDescriptionArg,
  resolveDescriptionTemplate,
} from './description-args'
import {evaluatePublicFormulaExpression, type PublicDescriptionArg} from './public-description-args'

describe('public-description-args', () => {
  it('renders fixed args through the public arg contract', () => {
    const arg: PublicDescriptionArg = {
      kind: 'fixed',
      value: '12',
      suffix: '%',
      stat: 'ATK',
    }

    expect(resolveDescriptionArg(arg).formattedTotalValue).toBe('12% {ATK}')
    expect(resolveDescriptionTemplate('Deal [Arg1] DMG.', {Arg1: arg})).toBe('Deal 12% {ATK} DMG.')
    expect(buildDescriptionArgHover(arg)).toBe('')
  })

  it('uses fixed arg display formulas as hover text', () => {
    const arg: PublicDescriptionArg = {
      kind: 'fixed',
      value: 'X',
      displayFormula: 'Max HP * 0.2%',
    }

    expect(resolveDescriptionArg(arg).formattedTotalValue).toBe('X')
    expect(buildDescriptionArgHover(arg)).toBe('Max HP * 0.2%')
  })

  it('ceils displayed totals when substat bonuses affect public args', () => {
    const arg: PublicDescriptionArg = {
      kind: 'scaling',
      values: ['200'],
      suffix: '%',
      substatBonus: {
        substat: 'DeathResistance',
        multiplier: '2',
        mode: 'additive',
      },
    }

    expect(
      resolveDescriptionArg(arg, {stats: {DeathResistance: '33.6%'}}).formattedTotalValue,
    ).toBe('268%')
  })

  it('renders linear args through the public arg contract', () => {
    const arg: PublicDescriptionArg = {
      kind: 'linear',
      base: '5',
      gainPerLevel: '3',
      suffix: '%',
    }

    expect(resolveDescriptionArg(arg, {rank: 4}).formattedTotalValue).toBe('14%')
    expect(formatDescriptionArgProgression(arg, {maxRank: 3})).toBe('5% (+3%/Lv)')
    expect(buildDescriptionArgHover(arg, {maxRank: 2})).toBe('Lv1: 5%\nLv2: 8%')
  })

  it('renders scaling args through the public arg contract', () => {
    const arg: PublicDescriptionArg = {
      kind: 'scaling',
      values: ['10', '20', '35'],
      suffix: '%',
      stat: 'DEF',
    }

    expect(resolveDescriptionArg(arg, {rank: 2}).formattedTotalValue).toBe('20% {DEF}')
    expect(formatDescriptionArgProgression(arg)).toBe('10/20/35% {DEF}')
    expect(buildDescriptionArgHover(arg, {maxRank: 2})).toBe('Lv1: 10% DEF\nLv2: 20% DEF')
  })

  it('resolves scaled computed args from gameplay metadata account curves', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'scaled',
      baseFormula: 'accountStageGrowth',
      multiplier: 0.0125,
      rounding: 'ceil',
      inputs: ['accountLevel'],
      suffix: '%',
    }

    expect(
      evaluatePublicFormulaExpression(arg, {accountLevel: 33, ownedPosseCount: 0}),
    ).toStrictEqual({
      resolved: true,
      value: 4,
    })
    expect(
      resolveDescriptionTemplate(
        'Increase final DMG by [Arg1].',
        {Arg1: arg},
        {
          formulaContext: {accountLevel: 33, ownedPosseCount: 0},
        },
      ),
    ).toBe('Increase final DMG by 4%.')
    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {accountLevel: 33, ownedPosseCount: 0},
        maxRank: 6,
      }),
    ).toBe(
      [
        'Account Growth Bonus',
        'Account Lv 33: 243 base growth',
        'Effect multiplier: 1.3%',
        '',
        '243 × 1.3% = 4%',
      ].join('\n'),
    )
  })

  it('derives normal occult research while explaining its Astral Reign value', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'scaled',
      baseFormula: 'occultResearchDepth',
      rounding: 'ceil',
      inputs: ['accountLevel', 'ownedPosseCount'],
    }

    expect(
      evaluatePublicFormulaExpression(arg, {accountLevel: 1, ownedPosseCount: 100}),
    ).toStrictEqual({
      resolved: true,
      value: 71,
    })
    expect(
      resolveDescriptionArg(arg, {formulaContext: {accountLevel: 1, ownedPosseCount: 100}}),
    ).toMatchObject({
      formattedTotalValue: '71 (106)',
    })
    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {accountLevel: 1, ownedPosseCount: 100},
        maxRank: 6,
      }),
    ).toBe(
      [
        'Forbidden Lore Scaling',
        'Base (Account Lv 1): Occult Research 70.1 = 71',
        'Astral Reign: 50 Posses add +50% to Research → 106',
      ].join('\n'),
    )
  })

  it('resolves wheel refinement linear computed args from wheel refinement level', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'wheelRefinementLinear',
      baseValue: 5,
      perLevel: 1.5,
      inputs: ['wheelRefinementLevel'],
      suffix: '%',
    }

    expect(
      evaluatePublicFormulaExpression(arg, {
        accountLevel: 100,
        ownedPosseCount: 0,
        wheelRefinementLevel: 3,
      }),
    ).toStrictEqual({resolved: true, value: 9.5})
    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {accountLevel: 100, ownedPosseCount: 0, wheelRefinementLevel: 3},
      }),
    ).toBe(
      [
        'Wheel Enlighten Bonus',
        'Current Enlighten tier: 3',
        'Base value: 5%',
        'Per tier: +1.5%',
        '',
        '5% + (3 × 1.5%) = 9.5%',
      ].join('\n'),
    )
  })

  it('falls back gracefully when computed arg context is missing', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'wheelRefinementLinear',
      baseValue: 5,
      perLevel: 1.5,
      inputs: ['wheelRefinementLevel'],
      suffix: '%',
    }

    const resolved = resolveDescriptionArg(arg)

    expect(evaluatePublicFormulaExpression(arg)).toStrictEqual({
      resolved: false,
      value: null,
    })
    expect(resolved.resolved).toBe(false)
    expect(resolved.baseValue).toBeNull()
    expect(resolved.totalValue).toBeNull()
    expect(resolved.formattedTotalValue).toBe('—%')
    expect(resolveDescriptionTemplate('Increase final DMG by [Arg1].', {Arg1: arg})).toBe(
      'Increase final DMG by [Arg1].',
    )
  })

  it('treats unknown computed formula keys as unresolved', () => {
    expect(
      evaluatePublicFormulaExpression({kind: 'computed', formulaKey: 'unknown'} as never),
    ).toStrictEqual({
      resolved: false,
      value: null,
    })
  })
})
