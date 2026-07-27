import {describe, expect, it} from 'vitest'

import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  resolveDescriptionArg,
  resolveDescriptionTemplate,
} from './description-args'
import {evaluatePublicFormulaExpression, type PublicDescriptionArg} from './public-description-args'
import {publicDescriptionArgsSchema} from './public-description-args.schema'

describe('public-description-args', () => {
  it('validates public generated description args through the public schema', () => {
    const args = publicDescriptionArgsSchema.parse({
      DescArg1: {
        kind: 'computed',
        formulaKey: 'wheelRefinementLinear',
        baseValue: 5,
        perLevel: 1.5,
        inputs: ['wheelRefinementLevel'],
        suffix: '%',
      },
    })

    expect(
      evaluatePublicFormulaExpression(args.DescArg1, {
        wheelRefinementLevel: 2,
      }),
    ).toEqual({
      resolved: true,
      value: 8,
    })
  })

  it('rejects unknown keys inside strict public description args', () => {
    expect(() =>
      publicDescriptionArgsSchema.parse({
        DescArg1: {
          kind: 'linear',
          base: '5',
          gainPerLevel: '3',
          unknownKey: true,
        },
      }),
    ).toThrow()
  })

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
      evaluatePublicFormulaExpression(arg, {
        accountLevel: 33,
        ownedPosseCount: 0,
      }),
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

  it('resolves scaled ceil-then-multiply args in the source-backed operation order', () => {
    const arg = publicDescriptionArgsSchema.parse({
      Arg1: {
        kind: 'computed',
        formulaKey: 'scaledCeilThenMultiply',
        baseFormula: 'esotericResearchDepth',
        multiplier: 0.06,
        divisor: 3,
        postMultiplier: 3,
        inputs: ['accountLevel', 'ownedPosseCount'],
      },
    }).Arg1

    expect(
      evaluatePublicFormulaExpression(arg, {
        accountLevel: 33,
        ownedPosseCount: 0,
      }),
    ).toEqual({
      resolved: true,
      value: 15,
    })
    expect(
      resolveDescriptionArg(arg, {
        formulaContext: {accountLevel: 33, ownedPosseCount: 50},
      }).formattedTotalValue,
    ).toBe('15 (24)')
    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {accountLevel: 33, ownedPosseCount: 50},
      }),
    ).toBe(
      [
        'Forbidden Lore Scaling',
        'Base (Account Lv 33): ceil((243 × 6%) ÷ 3) × 3 = 15',
        'Astral Reign: 50 Posses add +50% to Research → 24',
      ].join('\n'),
    )
  })

  it('defaults the scaled ceil-then-multiply divisor to one', () => {
    const arg = publicDescriptionArgsSchema.parse({
      Arg1: {
        kind: 'computed',
        formulaKey: 'scaledCeilThenMultiply',
        baseFormula: 'esotericResearchDepth',
        multiplier: 0.008,
        postMultiplier: 3,
        inputs: ['accountLevel', 'ownedPosseCount'],
      },
    }).Arg1

    expect(
      evaluatePublicFormulaExpression(arg, {
        accountLevel: 33,
        ownedPosseCount: 0,
      }),
    ).toEqual({
      resolved: true,
      value: 6,
    })
  })

  it('rejects malformed scaled ceil-then-multiply args at the public boundary', () => {
    const validArg = {
      kind: 'computed',
      formulaKey: 'scaledCeilThenMultiply',
      baseFormula: 'esotericResearchDepth',
      multiplier: 0.06,
      postMultiplier: 3,
      inputs: ['accountLevel', 'ownedPosseCount'],
    } as const

    expect(() => publicDescriptionArgsSchema.parse({Arg1: {...validArg, divisor: 0}})).toThrow()

    expect(() =>
      publicDescriptionArgsSchema.parse({
        Arg1: {
          kind: 'computed',
          formulaKey: 'scaledCeilThenMultiply',
          baseFormula: 'esotericResearchDepth',
          multiplier: 0.06,
          inputs: ['accountLevel', 'ownedPosseCount'],
        },
      }),
    ).toThrow()
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
      evaluatePublicFormulaExpression(arg, {
        accountLevel: 1,
        ownedPosseCount: 100,
      }),
    ).toStrictEqual({
      resolved: true,
      value: 71,
    })
    expect(
      resolveDescriptionArg(arg, {
        formulaContext: {accountLevel: 1, ownedPosseCount: 100},
      }),
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

  it('resolves the exposed occult research multiplier baseline', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'scaled',
      baseFormula: 'occultResearchMultiplier',
      multiplier: 50,
      inputs: ['accountLevel', 'ownedPosseCount'],
    }

    const result = evaluatePublicFormulaExpression(arg, {
      accountLevel: 1,
      ownedPosseCount: 0,
    })
    expect(result.resolved).toBe(true)
    if (result.resolved) expect(result.value).toBeCloseTo(56.5)
    expect(
      resolveDescriptionArg(arg, {
        formulaContext: {accountLevel: 1, ownedPosseCount: 50},
      }).formattedTotalValue,
    ).toBe('57 (85)')
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
        formulaContext: {
          accountLevel: 100,
          ownedPosseCount: 0,
          wheelRefinementLevel: 3,
        },
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

  it('resolves realm mastery linear computed args from final realm mastery', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'realmMasteryLinear',
      baseValue: 40,
      perPoint: 0.02,
      rounding: 'ceil',
      inputs: ['realmMasteryFinal'],
    }

    expect(evaluatePublicFormulaExpression(arg, {realmMasteryFinal: 100})).toStrictEqual({
      resolved: true,
      value: 42,
    })
    expect(
      resolveDescriptionTemplate(
        'Gain [Arg3] stacks.',
        {Arg3: arg},
        {
          formulaContext: {realmMasteryFinal: 100},
        },
      ),
    ).toBe('Gain 42 stacks.')
    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {realmMasteryFinal: 100},
      }),
    ).toBe(
      [
        'Realm Mastery Scaling',
        'Final Realm Mastery: 100',
        'Base value: 40',
        'Per Realm Mastery: +0.02',
        '',
        '40 + (100 × 0.02) = 42',
      ].join('\n'),
    )
  })

  it('resolves Primordia Posse scaling and doubles it for all-Chaos teams', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'primordiaPosseScaled',
      baseFormula: 'fixed',
      baseValue: 50,
      scalingBucket: 'utility',
      rounding: 'ceil',
      inputs: ['realmMasteryFinal', 'primordiaAllChaosTeam'],
      suffix: '%',
    }

    expect(evaluatePublicFormulaExpression(arg, {realmMasteryFinal: 0})).toStrictEqual({
      resolved: true,
      value: 50,
    })
    expect(evaluatePublicFormulaExpression(arg, {realmMasteryFinal: 100})).toStrictEqual({
      resolved: true,
      value: 53,
    })
    expect(
      evaluatePublicFormulaExpression(arg, {
        realmMasteryFinal: 100,
        primordiaAllChaosTeam: true,
      }).value,
    ).toBe(55)
    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {realmMasteryFinal: 100},
      }),
    ).toBe(
      [
        'Primordia Scaling',
        'Utility: +0.05% per Realm Mastery (+0.1% with an all-Chaos lineup)',
        'Base effect: 50%',
        'Current bonus: +5% from 100 Realm Mastery',
        '',
        'ceil(50% x (1 + 5%)) = 53%',
      ].join('\n'),
    )
  })

  it('preserves Forbidden Lore and Astral Reign values under Primordia scaling', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'primordiaPosseScaled',
      baseFormula: 'esotericResearchDepth',
      multiplier: 0.04,
      scalingBucket: 'offensive',
      rounding: 'ceil',
      inputs: ['accountLevel', 'ownedPosseCount', 'realmMasteryFinal', 'primordiaAllChaosTeam'],
    }
    const context = {
      formulaContext: {
        accountLevel: 67,
        ownedPosseCount: 28,
        realmMasteryFinal: 10,
      },
    }

    expect(resolveDescriptionTemplate('{Steal} [Arg1] {STR}', {Arg1: arg}, context)).toBe(
      '{Steal} 37 (47) {STR}',
    )
    expect(buildDescriptionArgHover(arg, context)).toBe(
      [
        'Forbidden Lore + Primordia Scaling',
        'Base (Account Lv 67): Esoteric Research 897 × 4% = 36',
        'Astral Reign: 28 Posses add +28% to Research → 46',
        '',
        'Offensive Primordia: +0.1% per Realm Mastery (+0.2% with an all-Chaos lineup)',
        'Current Primordia bonus: +1%',
        'Final effect: 37 (Astral Reign 47)',
      ].join('\n'),
    )
  })

  it('applies Primordia after the normal Posse effect is rounded up', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      formulaKey: 'primordiaPosseScaled',
      baseFormula: 'esotericResearchDepth',
      multiplier: 0.03,
      scalingBucket: 'offensive',
      rounding: 'ceil',
      inputs: ['accountLevel', 'ownedPosseCount', 'realmMasteryFinal', 'primordiaAllChaosTeam'],
    }

    expect(
      evaluatePublicFormulaExpression(arg, {
        accountLevel: 1,
        ownedPosseCount: 0,
        realmMasteryFinal: 1,
      }),
    ).toStrictEqual({resolved: true, value: 3})
    expect(
      buildDescriptionArgHover(arg, {
        formulaContext: {accountLevel: 1, ownedPosseCount: 0, realmMasteryFinal: 1},
      }),
    ).toContain('Final effect: 3')
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
    expect(
      resolveDescriptionTemplate('Increase final DMG by [Arg1].', {
        Arg1: arg,
      }),
    ).toBe('Increase final DMG by [Arg1].')
  })

  it('treats unknown computed formula keys as unresolved', () => {
    expect(
      evaluatePublicFormulaExpression({
        kind: 'computed',
        formulaKey: 'unknown',
      }),
    ).toStrictEqual({
      resolved: false,
      value: null,
    })
  })
})
