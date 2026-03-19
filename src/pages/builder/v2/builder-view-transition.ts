const VIEW_LOCK_THRESHOLD = 12
const VIEW_SHIFT_FALLBACK_MIN = 24
const VIEW_SHIFT_FALLBACK_THRESHOLD = 96

interface ResolveBuilderViewTransitionScrollDeltaInput {
  nextTargetTop: number
  previousTargetTop: number | null
}

export function resolveBuilderViewTransitionScrollDelta({
  nextTargetTop,
  previousTargetTop,
}: ResolveBuilderViewTransitionScrollDeltaInput) {
  if (previousTargetTop !== null && Math.abs(previousTargetTop) <= VIEW_LOCK_THRESHOLD) {
    const delta = Math.round(nextTargetTop - previousTargetTop)

    return Math.abs(delta) <= 1 ? null : delta
  }

  const fallbackDelta = Math.round(nextTargetTop)

  if (
    Math.abs(fallbackDelta) < VIEW_SHIFT_FALLBACK_MIN ||
    Math.abs(fallbackDelta) > VIEW_SHIFT_FALLBACK_THRESHOLD
  ) {
    return null
  }

  return fallbackDelta
}
