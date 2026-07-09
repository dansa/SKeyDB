import {describe, expect, it, vi} from 'vitest'

import {
  calculateBaseModifier,
  compileAbstractFormula,
  getSafeProgressionStep,
} from './popover-calculations'

describe('popover-calculations', () => {
  describe('getSafeProgressionStep', () => {
    const steps = ['one', 'two', 'three']

    it('returns the correct step when index is within bounds', () => {
      expect(getSafeProgressionStep(steps, 1, 1)).toBe('one')
      expect(getSafeProgressionStep(steps, 2, 1)).toBe('two')
      expect(getSafeProgressionStep(steps, 3, 1)).toBe('three')
    })

    it('returns null when index is out of bounds or steps is empty', () => {
      expect(getSafeProgressionStep(steps, 0, 1)).toBeNull()
      expect(getSafeProgressionStep(steps, 4, 1)).toBeNull()
      expect(getSafeProgressionStep(null, 1, 1)).toBeNull()
    })
  })

  describe('calculateBaseModifier', () => {
    it('returns null if progression data is missing or empty', () => {
      const result = calculateBaseModifier({
        liveProgression: null,
        originalProgression: null,
        activeLevel: 1,
        levelStart: 1,
        getMultipliers: vi.fn(),
      })

      expect(result).toBeNull()
    })

    it('returns null if there is no multiplier change', () => {
      const result = calculateBaseModifier({
        liveProgression: [{baseValue: 10}],
        originalProgression: [{baseValue: 10}],
        activeLevel: 1,
        levelStart: 1,
        getMultipliers: vi.fn(),
      })

      expect(result).toBeNull()
    })

    it('calculates the multiplier and flat increases correctly when base values differ', () => {
      const getMultipliers = vi.fn().mockReturnValue([1.5])
      const result = calculateBaseModifier({
        liveProgression: [{baseValue: 15}],
        originalProgression: [{baseValue: 10}],
        activeLevel: 1,
        levelStart: 1,
        getMultipliers,
      })

      expect(result).toEqual({
        multiplier: 1.5,
        flatIncrease: 5,
        multipliers: [1.5],
      })
      expect(getMultipliers).toHaveBeenCalledWith(0)
    })
  })

  describe('compileAbstractFormula', () => {
    it('returns fallback formula if liveArg is missing', () => {
      const result = compileAbstractFormula({
        liveArg: undefined,
        suffix: '%',
        baseModifier: null,
        fallbackFormula: 'base',
      })

      expect(result).toBe('base')
    })

    it('compiles standard formula without substat bonus', () => {
      const baseModifier = {multiplier: 1.5, flatIncrease: 5, multipliers: [1.5]}
      const result = compileAbstractFormula({
        liveArg: {kind: 'fixed', value: 'arg'},
        suffix: '%',
        baseModifier,
        fallbackFormula: 'base',
      })

      expect(result).toBe('base × 1.5')
    })

    it('compiles formula with substat bonus in scale_base mode', () => {
      const baseModifier = {multiplier: 1.5, flatIncrease: 5, multipliers: [1.5]}
      const result = compileAbstractFormula({
        liveArg: {
          kind: 'fixed',
          substatBonus: {
            substat: 'attackPower',
            multiplier: '0.1',
            mode: 'scale_base',
          },
        },
        suffix: '%',
        baseModifier,
        fallbackFormula: 'base',
      })

      expect(result).toBe('base × 1.5 × (1 + attack Power × 0.1)')
    })
  })
})
