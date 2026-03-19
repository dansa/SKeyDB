import {describe, expect, it} from 'vitest'

import {getBuilderPageSnapThreshold, resolveBuilderPageSnapTarget} from './builder-page-snap'

describe('builder page snap', () => {
  it('uses a forgiving threshold for phone-height viewports', () => {
    expect(getBuilderPageSnapThreshold(844)).toBe(96)
    expect(getBuilderPageSnapThreshold(390)).toBe(47)
  })

  it('snaps back into the builder when page scroll stops a few pixels above the shell', () => {
    expect(
      resolveBuilderPageSnapTarget({
        builderTop: 3,
        currentScrollTop: 285,
        exitTop: 901,
        lastScrollTop: 250,
        viewportHeight: 900,
      }),
    ).toBe('builder')
  })

  it('snaps back into the builder when page scroll stops a little past the shell top', () => {
    expect(
      resolveBuilderPageSnapTarget({
        builderTop: -17,
        currentScrollTop: 305,
        exitTop: 883,
        lastScrollTop: 285,
        viewportHeight: 900,
      }),
    ).toBe('builder')
  })

  it('does not snap when the page is still meaningfully away from either zone', () => {
    expect(
      resolveBuilderPageSnapTarget({
        builderTop: 142,
        currentScrollTop: 146,
        exitTop: 1040,
        lastScrollTop: 90,
        viewportHeight: 900,
      }),
    ).toBeNull()
  })

  it('snaps to the teams section when scrolling down near the exit zone', () => {
    expect(
      resolveBuilderPageSnapTarget({
        builderTop: -902,
        currentScrollTop: 1080,
        exitTop: 22,
        lastScrollTop: 1030,
        viewportHeight: 900,
      }),
    ).toBe('exit')
  })

  it('does not pin the exit zone when the user scrolls back upward from below', () => {
    expect(
      resolveBuilderPageSnapTarget({
        builderTop: -910,
        currentScrollTop: 1060,
        exitTop: 18,
        lastScrollTop: 1110,
        viewportHeight: 900,
      }),
    ).toBeNull()
  })
})
