import {describe, expect, it} from 'vitest'

import {
  buildWheelMainstatHover,
  getWheelMainstatSeries,
  resolveWheelMainstatValue,
} from './wheel-mainstat-scaling'

describe('resolveWheelMainstatValue', () => {
  it('keeps wheel mainstats flat through E3 and grows from E4 onward', () => {
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 0)).toBe('7.2%')
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 3)).toBe('7.2%')
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 4)).toBe('7.8%')
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 15)).toBe('14.4%')
  })

  it('explains wheel mainstat growth using in-game enhance labels', () => {
    expect(buildWheelMainstatHover('SR:CRIT_RATE', 4)).toBe(
      [
        'Wheel Main Stat',
        'Base value: 7.2%',
        'Enhance growth: +0.6% per level after E3',
        'Current Enhance: E3 + 1',
        '',
        '7.2% + (1 × 0.6%) = 7.8%',
      ].join('\n'),
    )
  })

  it('supports the special N keyflare regen metadata', () => {
    expect(getWheelMainstatSeries('N:KEYFLARE_REGEN')).toBeDefined()
    expect(resolveWheelMainstatValue('N:KEYFLARE_REGEN', 3)).toBe('5.4')
    expect(resolveWheelMainstatValue('N:KEYFLARE_REGEN', 15)).toBe('5.4')
  })
})
