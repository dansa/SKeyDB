import {describe, expect, it} from 'vitest'

import {
  getTabletMainZoneHeight,
  getTabletPickerHeight,
  getTabletStageHeight,
  getTabletStageHeightBounds,
  resolveTabletBuilderCardHeightScale,
} from './tablet-layout-metrics'

describe('resolveTabletBuilderCardHeightScale', () => {
  it('keeps the tablet main zone at the viewport height until the shared 600px tablet floor takes over', () => {
    expect(getTabletMainZoneHeight(1100)).toBe(1100)
    expect(getTabletMainZoneHeight(1024)).toBe(1024)
    expect(getTabletMainZoneHeight(420)).toBe(600)
  })

  it('caps builder height at the natural four-card stage so extra room goes back to the picker', () => {
    expect(getTabletStageHeightBounds(900)).toEqual({
      idealHeight: 498,
      minHeight: 365,
    })
    expect(getTabletPickerHeight({mainZoneHeight: 520, mainZoneWidth: 900})).toBe(222)
    expect(getTabletPickerHeight({mainZoneHeight: 887, mainZoneWidth: 900})).toBe(377)
  })

  it('keeps the stage compact through the short-tablet band so picker height grows first', () => {
    expect(getTabletStageHeight({mainZoneHeight: 600, mainZoneWidth: 900})).toBe(365)
    expect(getTabletPickerHeight({mainZoneHeight: 600, mainZoneWidth: 900})).toBe(223)
    expect(getTabletStageHeight({mainZoneHeight: 750, mainZoneWidth: 900})).toBe(385)
    expect(getTabletPickerHeight({mainZoneHeight: 750, mainZoneWidth: 900})).toBe(353)
  })

  it('gives the builder stage the extra height first once the picker-priority band is cleared', () => {
    expect(getTabletStageHeight({mainZoneHeight: 887, mainZoneWidth: 900})).toBe(498)
    expect(getTabletStageHeight({mainZoneHeight: 800, mainZoneWidth: 900})).toBe(435)
    expect(getTabletPickerHeight({mainZoneHeight: 800, mainZoneWidth: 900})).toBe(353)
  })

  it('keeps full card height when the viewport has enough vertical room', () => {
    expect(
      resolveTabletBuilderCardHeightScale({
        availableHeight: 406,
        gridWidth: 704,
      }),
    ).toBe(1)
  })

  it('shrinks card height when the stage would otherwise outrun the viewport', () => {
    expect(
      resolveTabletBuilderCardHeightScale({
        availableHeight: 322,
        gridWidth: 678,
      }),
    ).toBe(0.88)
  })

  it('never shrinks below the readable tablet floor', () => {
    expect(
      resolveTabletBuilderCardHeightScale({
        availableHeight: 200,
        gridWidth: 704,
      }),
    ).toBe(0.65)
  })
})
