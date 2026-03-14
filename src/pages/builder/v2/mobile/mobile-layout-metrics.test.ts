import {describe, expect, it} from 'vitest'

import {getOverviewGridMetrics} from './mobile-layout-metrics'

describe('mobile-layout-metrics', () => {
  it('derives a two-by-two overview grid that fits cards within portrait height limits', () => {
    expect(getOverviewGridMetrics(390, 760)).toEqual({
      cardHeight: 368,
      cardWidth: 183,
      columns: 2,
      contentHeight: 744,
      contentWidth: 374,
      gap: 8,
      requiresPageScroll: false,
      rows: 2,
      totalGridHeight: 760,
    })
  })

  it('derives a single-row overview grid that keeps cards inside landscape height constraints', () => {
    expect(getOverviewGridMetrics(900, 390)).toEqual({
      cardHeight: 374,
      cardWidth: 215,
      columns: 4,
      contentHeight: 374,
      contentWidth: 884,
      gap: 8,
      requiresPageScroll: false,
      rows: 1,
      totalGridHeight: 390,
    })
  })

  it('prefers the denser four-card row when a square viewport can support larger cards that way', () => {
    expect(getOverviewGridMetrics(760, 760)).toEqual({
      cardHeight: 450,
      cardWidth: 180,
      columns: 4,
      contentHeight: 744,
      contentWidth: 744,
      gap: 8,
      requiresPageScroll: false,
      rows: 1,
      totalGridHeight: 466,
    })
  })

  it('caps overview cards at the shared mobile art size on oversized viewports', () => {
    expect(getOverviewGridMetrics(1600, 900)).toEqual({
      cardHeight: 600,
      cardWidth: 240,
      columns: 4,
      contentHeight: 884,
      contentWidth: 1584,
      gap: 8,
      requiresPageScroll: false,
      rows: 1,
      totalGridHeight: 616,
    })
  })

  it('keeps mid-height portrait overview cards fluid instead of forcing an early floor', () => {
    expect(getOverviewGridMetrics(425, 650)).toEqual({
      cardHeight: 313,
      cardWidth: 200.5,
      columns: 2,
      contentHeight: 634,
      contentWidth: 409,
      gap: 8,
      requiresPageScroll: false,
      rows: 2,
      totalGridHeight: 650,
    })
  })

  it('only floors overview cards once they reach the lower overview-specific shrink limit', () => {
    expect(getOverviewGridMetrics(390, 420)).toEqual({
      cardHeight: 198,
      cardWidth: 183,
      columns: 2,
      contentHeight: 404,
      contentWidth: 374,
      gap: 8,
      requiresPageScroll: false,
      rows: 2,
      totalGridHeight: 420,
    })
  })

  it('marks overview grids for page scroll once the measured grid area falls below the shrink floor', () => {
    expect(getOverviewGridMetrics(335, 66)).toEqual({
      cardHeight: 73.8,
      cardWidth: 73.8,
      columns: 4,
      contentHeight: 50,
      contentWidth: 319,
      gap: 8,
      requiresPageScroll: true,
      rows: 1,
      totalGridHeight: 89.8,
    })
  })
})
