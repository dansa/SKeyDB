const MOBILE_VIEW_LOCK_THRESHOLD = 12
const MOBILE_VIEW_SHIFT_FALLBACK_MIN = 24
const MOBILE_VIEW_SHIFT_FALLBACK_THRESHOLD = 96

interface ResolveMobileViewTransitionScrollDeltaInput {
  nextTargetTop: number
  previousTargetTop: number | null
}

export function resolveMobileViewTransitionScrollDelta({
  nextTargetTop,
  previousTargetTop,
}: ResolveMobileViewTransitionScrollDeltaInput) {
  if (previousTargetTop !== null && Math.abs(previousTargetTop) <= MOBILE_VIEW_LOCK_THRESHOLD) {
    const delta = Math.round(nextTargetTop - previousTargetTop)

    return Math.abs(delta) <= 1 ? null : delta
  }

  const fallbackDelta = Math.round(nextTargetTop)

  if (
    Math.abs(fallbackDelta) < MOBILE_VIEW_SHIFT_FALLBACK_MIN ||
    Math.abs(fallbackDelta) > MOBILE_VIEW_SHIFT_FALLBACK_THRESHOLD
  ) {
    return null
  }

  return fallbackDelta
}
