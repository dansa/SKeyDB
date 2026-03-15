import {describe, expect, it} from 'vitest'

import {shouldAllowMobileOverviewPageOverflow} from './mobile-overview-shell'

describe('mobile-overview-shell', () => {
  it('keeps the fixed-height overview shell when the remaining viewport space still supports fluid card sizing', () => {
    expect(
      shouldAllowMobileOverviewPageOverflow({
        chromeHeight: 118,
        viewportHeight: 760,
        viewportWidth: 390,
      }),
    ).toBe(false)
  })

  it('switches the overview shell to page overflow once short landscape chrome leaves less than the card floor', () => {
    expect(
      shouldAllowMobileOverviewPageOverflow({
        chromeHeight: 118,
        viewportHeight: 220,
        viewportWidth: 700,
      }),
    ).toBe(true)
  })
})
