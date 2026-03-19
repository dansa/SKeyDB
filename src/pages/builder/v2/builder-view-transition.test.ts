import {describe, expect, it} from 'vitest'

import {resolveBuilderViewTransitionScrollDelta} from './builder-view-transition'

describe('builder view transition scroll delta', () => {
  it('preserves the locked builder position when the next target shifts upward', () => {
    expect(
      resolveBuilderViewTransitionScrollDelta({
        nextTargetTop: -78,
        previousTargetTop: 0,
      }),
    ).toBe(-78)
  })

  it('preserves the locked builder position when the next target shifts downward', () => {
    expect(
      resolveBuilderViewTransitionScrollDelta({
        nextTargetTop: 78,
        previousTargetTop: 0,
      }),
    ).toBe(78)
  })

  it('keeps a near-top offset stable instead of forcing a new alignment', () => {
    expect(
      resolveBuilderViewTransitionScrollDelta({
        nextTargetTop: -75,
        previousTargetTop: 3,
      }),
    ).toBe(-78)
  })

  it('does not preserve when the builder was not actually locked into place', () => {
    expect(
      resolveBuilderViewTransitionScrollDelta({
        nextTargetTop: -12,
        previousTargetTop: 72,
      }),
    ).toBeNull()
  })

  it('still preserves small dom shifts when the stored top is stale', () => {
    expect(
      resolveBuilderViewTransitionScrollDelta({
        nextTargetTop: -77,
        previousTargetTop: 72,
      }),
    ).toBe(-77)
  })

  it('does not adjust for insignificant target movement', () => {
    expect(
      resolveBuilderViewTransitionScrollDelta({
        nextTargetTop: 1,
        previousTargetTop: 0,
      }),
    ).toBeNull()
  })
})
