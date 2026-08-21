import {describe, expect, it} from 'vitest'

import {
  getBannerDrawerWidthMode,
  keepWidestBannerDrawerWidthMode,
  promoteBannerDrawerWidthMode,
} from './bannerDrawerWidth'

describe('getBannerDrawerWidthMode', () => {
  it('keeps descriptions that fit at the default drawer width', () => {
    expect(getBannerDrawerWidthMode(100, 100)).toBe('normal')
    expect(getBannerDrawerWidthMode(80, 100)).toBe('normal')
  })

  it('widens descriptions with moderate overflow', () => {
    expect(getBannerDrawerWidthMode(150, 100)).toBe('wide')
  })

  it('uses the extra-wide drawer for substantial overflow', () => {
    expect(getBannerDrawerWidthMode(185, 100)).toBe('extra-wide')
    expect(getBannerDrawerWidthMode(260, 100)).toBe('extra-wide')
  })

  it('keeps the default width when layout dimensions are unavailable', () => {
    expect(getBannerDrawerWidthMode(200, 0)).toBe('normal')
  })
})

describe('promoteBannerDrawerWidthMode', () => {
  it('promotes a wide drawer when text still overflows after its width transition', () => {
    expect(promoteBannerDrawerWidthMode('wide', 126, 108)).toBe('extra-wide')
  })

  it('keeps fitting and already-extra-wide drawers stable', () => {
    expect(promoteBannerDrawerWidthMode('wide', 108, 108)).toBe('wide')
    expect(promoteBannerDrawerWidthMode('extra-wide', 180, 108)).toBe('extra-wide')
  })
})

describe('keepWidestBannerDrawerWidthMode', () => {
  it('does not demote a widened drawer when reopening measures the wider layout', () => {
    expect(keepWidestBannerDrawerWidthMode('wide', 'normal')).toBe('wide')
    expect(keepWidestBannerDrawerWidthMode('extra-wide', 'normal')).toBe('extra-wide')
    expect(keepWidestBannerDrawerWidthMode('extra-wide', 'wide')).toBe('extra-wide')
  })

  it('still allows measurements to widen the drawer', () => {
    expect(keepWidestBannerDrawerWidthMode('normal', 'wide')).toBe('wide')
    expect(keepWidestBannerDrawerWidthMode('wide', 'extra-wide')).toBe('extra-wide')
  })
})
