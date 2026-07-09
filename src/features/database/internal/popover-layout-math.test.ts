import {describe, expect, it} from 'vitest'

import {calculateBasePosition, clampOffset} from './popover-layout-math'

describe('popover-layout-math', () => {
  describe('calculateBasePosition', () => {
    const viewport = {width: 1024, height: 768}

    it('calculates the standard down-placement position correctly', () => {
      const anchorRect = {left: 100, top: 200, right: 150, bottom: 250}
      const result = calculateBasePosition({
        anchorRect,
        popoverWidth: 200,
        popoverHeight: 300,
        direction: 'down',
        zIndex: 0,
        viewport,
        gap: 6,
        margin: 12,
      })

      // top = anchorRect.bottom + verticalGap = 250 + 6 = 256
      // left = anchorRect.left = 100
      expect(result).toEqual({top: 256, left: 100})
    })

    it('calculates the standard up-placement position correctly', () => {
      const anchorRect = {left: 100, top: 400, right: 150, bottom: 450}
      const result = calculateBasePosition({
        anchorRect,
        popoverWidth: 200,
        popoverHeight: 150,
        direction: 'up',
        zIndex: 0,
        viewport,
        gap: 6,
        margin: 12,
      })

      // top = anchorRect.top - verticalGap - popoverHeight = 400 - 6 - 150 = 244
      // left = anchorRect.left = 100
      expect(result).toEqual({top: 244, left: 100})
    })

    it('clamps left position to fit within the viewport margins', () => {
      const anchorRect = {left: 950, top: 200, right: 1000, bottom: 250}
      const result = calculateBasePosition({
        anchorRect,
        popoverWidth: 200,
        popoverHeight: 100,
        direction: 'down',
        zIndex: 0,
        viewport,
        gap: 6,
        margin: 12,
      })

      // left + width (950 + 200 = 1150) > viewport.width - margin (1024 - 12 = 1012)
      // left should be clamped to viewport.width - width - margin = 1024 - 200 - 12 = 812
      expect(result.left).toBe(812)
    })

    it('clamps top position if it would overflow the bottom margin', () => {
      const anchorRect = {left: 100, top: 700, right: 150, bottom: 750}
      const result = calculateBasePosition({
        anchorRect,
        popoverWidth: 200,
        popoverHeight: 100,
        direction: 'down',
        zIndex: 0,
        viewport,
        gap: 6,
        margin: 12,
      })

      // top = 750 + 6 = 756. top + height = 856 > 768 - 12 = 756.
      // clamped top = 768 - 100 - 12 = 656.
      expect(result.top).toBe(656)
    })
  })

  describe('clampOffset', () => {
    const viewport = {width: 1024, height: 768}

    it('returns offset unchanged when within bounds', () => {
      const result = clampOffset({
        targetLeft: 100,
        targetTop: 200,
        popoverWidth: 200,
        popoverHeight: 150,
        viewport,
        margin: 12,
        layoutLeft: 100,
        layoutTop: 200,
      })

      expect(result).toEqual({x: 0, y: 0})
    })

    it('clamps offset on dragging beyond right edge', () => {
      // popoverWidth = 200, margin = 12. maxLeft = 1024 - 200 - 12 = 812.
      // targetLeft = 900. Clamped left = 812.
      // layoutLeft = 500. Expected x = 812 - 500 = 312.
      const result = clampOffset({
        targetLeft: 900,
        targetTop: 200,
        popoverWidth: 200,
        popoverHeight: 150,
        viewport,
        margin: 12,
        layoutLeft: 500,
        layoutTop: 200,
      })

      expect(result.x).toBe(312)
    })
  })
})
