import {describe, expect, it} from 'vitest'

import {resolveMobileViewTransitionScrollDelta} from './mobile-view-transition'

describe('mobile view transition scroll delta', () => {
  it('preserves the locked builder position when the next target shifts upward', () => {
    expect(
      resolveMobileViewTransitionScrollDelta({
        nextTargetTop: -78,
        previousTargetTop: 0,
      }),
    ).toBe(-78)
  })

  it('preserves the locked builder position when the next target shifts downward', () => {
    expect(
      resolveMobileViewTransitionScrollDelta({
        nextTargetTop: 78,
        previousTargetTop: 0,
      }),
    ).toBe(78)
  })

  it('keeps a near-top offset stable instead of forcing a new alignment', () => {
    expect(
      resolveMobileViewTransitionScrollDelta({
        nextTargetTop: -75,
        previousTargetTop: 3,
      }),
    ).toBe(-78)
  })

  it('does not preserve when the builder was not actually locked into place', () => {
    expect(
      resolveMobileViewTransitionScrollDelta({
        nextTargetTop: -12,
        previousTargetTop: 72,
      }),
    ).toBeNull()
  })

  it('still preserves small dom shifts when the stored top is stale', () => {
    expect(
      resolveMobileViewTransitionScrollDelta({
        nextTargetTop: -77,
        previousTargetTop: 72,
      }),
    ).toBe(-77)
  })

  it('does not adjust for insignificant target movement', () => {
    expect(
      resolveMobileViewTransitionScrollDelta({
        nextTargetTop: 1,
        previousTargetTop: 0,
      }),
    ).toBeNull()
  })
})
