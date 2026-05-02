import {describe, expect, it} from 'vitest'

import {
  clampWheelEnhanceLevel,
  getWheelEnhanceDiamondCount,
  getWheelEnhancePlusLevel,
  resolveWheelDescriptionFormulaLevel,
  resolveWheelDescriptionRank,
} from './wheel-enhance'

describe('wheel enhance helpers', () => {
  it('clamps wheel enhance levels into the supported range', () => {
    expect(clampWheelEnhanceLevel(-4)).toBe(0)
    expect(clampWheelEnhanceLevel(2.9)).toBe(2)
    expect(clampWheelEnhanceLevel(99)).toBe(15)
  })

  it('maps description scaling to E0, E1, E2, and E3+ tiers', () => {
    expect(resolveWheelDescriptionRank(0)).toBe(1)
    expect(resolveWheelDescriptionRank(1)).toBe(2)
    expect(resolveWheelDescriptionRank(2)).toBe(3)
    expect(resolveWheelDescriptionRank(3)).toBe(4)
    expect(resolveWheelDescriptionRank(4)).toBe(4)
    expect(resolveWheelDescriptionRank(15)).toBe(4)
  })

  it('clamps formula inputs to the four description tiers', () => {
    expect(resolveWheelDescriptionFormulaLevel(0)).toBe(0)
    expect(resolveWheelDescriptionFormulaLevel(1)).toBe(1)
    expect(resolveWheelDescriptionFormulaLevel(2)).toBe(2)
    expect(resolveWheelDescriptionFormulaLevel(3)).toBe(3)
    expect(resolveWheelDescriptionFormulaLevel(4)).toBe(3)
    expect(resolveWheelDescriptionFormulaLevel(15)).toBe(3)
  })

  it('splits visible enlighten state into diamonds and plus levels', () => {
    expect(getWheelEnhanceDiamondCount(0)).toBe(0)
    expect(getWheelEnhanceDiamondCount(2)).toBe(2)
    expect(getWheelEnhanceDiamondCount(6)).toBe(3)

    expect(getWheelEnhancePlusLevel(0)).toBe(0)
    expect(getWheelEnhancePlusLevel(3)).toBe(0)
    expect(getWheelEnhancePlusLevel(7)).toBe(4)
  })
})
