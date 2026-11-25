import {describe, expect, it} from 'vitest'

import {formatTimelinePrice} from './timeline-pricing'

describe('timeline pricing display helpers', () => {
  it('formats prices in Silver Prime mode', () => {
    expect(formatTimelinePrice('1980 Silver Prime', 'silver-prime')).toBe('1,980 Silver Prime')
    expect(formatTimelinePrice('480-1980 Silver Prime', 'silver-prime')).toBe(
      '480–1,980 Silver Prime',
    )
    expect(formatTimelinePrice('Free during event', 'silver-prime')).toBe('Free during event')
    expect(formatTimelinePrice('USD 29.99', 'silver-prime')).toBe('$29.99')
  })

  it('formats Silver Prime prices as rounded estimated dollars', () => {
    expect(formatTimelinePrice('980 Silver Prime', 'usd-estimate')).toBe('~$15')
    expect(formatTimelinePrice('1980 Silver Prime', 'usd-estimate')).toBe('~$29')
    expect(formatTimelinePrice('3980 Silver Prime', 'usd-estimate')).toBe('~$52')
    expect(formatTimelinePrice('680-1280 Silver Prime', 'usd-estimate')).toBe('~$11-19')
  })

  it('includes repeat extras without treating first-purchase doubling as repeatable', () => {
    expect(formatTimelinePrice('8080 Silver Prime', 'usd-estimate')).toBe('~$100')
    expect(formatTimelinePrice('17500 Silver Prime', 'usd-estimate')).toBe('~$200')
    expect(formatTimelinePrice('12960 Silver Prime', 'usd-estimate')).not.toBe('~$100')
  })

  it('estimates cumulative extraction milestones without regular gifts or first-purchase matching', () => {
    const paidOnly = {includeGifted: false}
    const estimate = (amount: number) =>
      formatTimelinePrice(`${String(amount)} Silver Prime`, 'usd-estimate', paidOnly)
    expect([5000, 10000, 20000, 30000].map(estimate)).toEqual(['~$76', '~$152', '~$304', '~$455'])
    expect(estimate(8080)).not.toBe('~$100')
    expect(estimate(12960)).not.toBe('~$100')
    expect(formatTimelinePrice('8080 Silver Prime', 'usd-estimate')).toBe('~$100')
    expect(formatTimelinePrice('5000-30000 Silver Prime', 'usd-estimate', paidOnly)).toBe(
      '~$76-455',
    )
  })

  it('formats embedded Silver Prime prose and exact USD prices', () => {
    expect(
      formatTimelinePrice(
        'Spend up to 30k Silver Prime to claim rewards. Each gift box costs 1980 Silver Prime.',
        'usd-estimate',
      ),
    ).toBe('Spend up to ~$350 to claim rewards. Each gift box costs ~$29.')
    expect(formatTimelinePrice('USD 29.99', 'usd-estimate')).toBe('$29.99')
  })
})
