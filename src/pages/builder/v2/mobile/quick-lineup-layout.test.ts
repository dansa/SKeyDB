import {describe, expect, it} from 'vitest'

import {getQuickLineupLayoutMetrics, getQuickLineupSlotCardMetrics} from './quick-lineup-layout'

describe('quick-lineup-layout', () => {
  it('derives a portrait rail and card size from measured portrait space', () => {
    expect(getQuickLineupLayoutMetrics(390, 760)).toEqual({
      cardHeight: 193.8,
      cardWidth: 93,
      footerSize: 32,
      gap: 6,
      mode: 'portrait',
      pickerSize: 528.2,
      railSize: 193.8,
      willScroll: false,
    })
  })

  it('derives a landscape split layout that leaves most width to the picker', () => {
    expect(getQuickLineupLayoutMetrics(844, 390)).toEqual({
      cardHeight: 85.5,
      cardWidth: 211.4,
      footerSize: 28,
      gap: 4,
      mode: 'landscape',
      pickerSize: 620.6,
      railSize: 219.4,
      willScroll: false,
    })
  })

  it('keeps portrait cards fluid on short shells until they hit the safety floor', () => {
    expect(getQuickLineupLayoutMetrics(390, 420)).toEqual({
      cardHeight: 112,
      cardWidth: 93,
      footerSize: 32,
      gap: 6,
      mode: 'portrait',
      pickerSize: 270,
      railSize: 112,
      willScroll: false,
    })
  })

  it('marks short landscape shells for scroll once the stacked card column hits its floor', () => {
    expect(getQuickLineupLayoutMetrics(720, 220)).toEqual({
      cardHeight: 64,
      cardWidth: 206,
      footerSize: 28,
      gap: 4,
      mode: 'landscape',
      pickerSize: 502,
      railSize: 214,
      willScroll: true,
    })
  })

  it('keeps landscape cards inset inside the rail instead of treating the rail width as card width', () => {
    const metrics = getQuickLineupLayoutMetrics(844, 390)

    expect(metrics.mode).toBe('landscape')
    expect(metrics.railSize).toBeGreaterThan(metrics.cardWidth)
  })

  it('honors an explicit landscape mode even when the measured box is taller than it is wide', () => {
    const metrics = getQuickLineupLayoutMetrics(320, 700, 'landscape')

    expect(metrics.mode).toBe('landscape')
    expect(metrics.railSize).toBeGreaterThan(metrics.cardWidth)
  })

  it('caps portrait card width on roomier portrait shells so tablet-sized cards do not keep stretching', () => {
    expect(getQuickLineupLayoutMetrics(800, 1000)).toEqual({
      cardHeight: 208,
      cardWidth: 172,
      footerSize: 32,
      gap: 6,
      mode: 'portrait',
      pickerSize: 754,
      railSize: 208,
      willScroll: false,
    })
  })

  it('allows taller landscape cards on roomier shells before clamping them', () => {
    expect(getQuickLineupLayoutMetrics(1024, 700)).toEqual({
      cardHeight: 150,
      cardWidth: 220,
      footerSize: 28,
      gap: 4,
      mode: 'landscape',
      pickerSize: 792,
      railSize: 228,
      willScroll: false,
    })
  })

  it('caps wheel growth to a tall-card ratio once a landscape slot gets extra height', () => {
    expect(getQuickLineupSlotCardMetrics(220, 150, 'landscape')).toEqual({
      covenantSize: 38.7,
      visualSize: 123.2,
      wheelHeight: 88.8,
    })
  })
})
