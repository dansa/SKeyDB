import {describe, expect, it} from 'vitest'

import {getWheelMainstatSeries, resolveWheelMainstatValue} from './wheel-mainstat-scaling'

describe('resolveWheelMainstatValue', () => {
  it('keeps wheel mainstats flat through E3 and grows from E4 onward', () => {
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 0)).toBe('7.2%')
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 3)).toBe('7.2%')
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 4)).toBe('7.8%')
    expect(resolveWheelMainstatValue('SR:CRIT_RATE', 15)).toBe('14.4%')
  })

  it('supports the special N keyflare regen metadata', () => {
    expect(getWheelMainstatSeries('N:KEYFLARE_REGEN')).toBeDefined()
    expect(resolveWheelMainstatValue('N:KEYFLARE_REGEN', 3)).toBe('5.4')
    expect(resolveWheelMainstatValue('N:KEYFLARE_REGEN', 15)).toBe('5.4')
  })
})
