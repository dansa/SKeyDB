import {describe, expect, it} from 'vitest'

import {getWideFocusedStageMetrics} from './focused-layout'

describe('focused-layout', () => {
  it('derives the two-stage wide focused layout from the available height', () => {
    expect(getWideFocusedStageMetrics(520)).toEqual({
      stage: 'stacked',
      cardHeight: 350,
      cardWidth: 240,
      railSize: 44,
      redColumnWidth: 66.8,
      redRowHeight: 162,
      stageHeight: 520,
      willScroll: false,
    })

    expect(getWideFocusedStageMetrics(430)).toEqual({
      stage: 'stacked',
      cardHeight: 260,
      cardWidth: 240,
      railSize: 44,
      redColumnWidth: 48.8,
      redRowHeight: 162,
      stageHeight: 430,
      willScroll: false,
    })

    expect(getWideFocusedStageMetrics(350)).toEqual({
      stage: 'split',
      cardHeight: 350,
      cardWidth: 240,
      railSize: 44,
      redColumnWidth: 66.8,
      redRowHeight: 162,
      stageHeight: 350,
      willScroll: false,
    })

    expect(getWideFocusedStageMetrics(220)).toEqual({
      stage: 'split',
      cardHeight: 240,
      cardWidth: 240,
      railSize: 44,
      redColumnWidth: 44.8,
      redRowHeight: 162,
      stageHeight: 220,
      willScroll: true,
    })
  })
})
