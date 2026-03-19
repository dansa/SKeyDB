import {clamp} from './layout-math'

const PAGE_SNAP_THRESHOLD_MIN = 24
const PAGE_SNAP_THRESHOLD_MAX = 96
const PAGE_SNAP_THRESHOLD_RATIO = 0.12

export type BuilderPageSnapTarget = 'builder' | 'exit' | null

interface ResolveBuilderPageSnapTargetInput {
  builderTop: number
  currentScrollTop: number
  exitTop: number | null
  lastScrollTop: number
  viewportHeight: number
}

export function getBuilderPageSnapThreshold(viewportHeight: number) {
  return clamp(
    Math.round(viewportHeight * PAGE_SNAP_THRESHOLD_RATIO),
    PAGE_SNAP_THRESHOLD_MIN,
    PAGE_SNAP_THRESHOLD_MAX,
  )
}

export function resolveBuilderPageSnapTarget({
  builderTop,
  currentScrollTop,
  exitTop,
  lastScrollTop,
  viewportHeight,
}: ResolveBuilderPageSnapTargetInput): BuilderPageSnapTarget {
  const threshold = getBuilderPageSnapThreshold(viewportHeight)
  const direction =
    currentScrollTop > lastScrollTop ? 'down' : currentScrollTop < lastScrollTop ? 'up' : 'none'

  if (Math.abs(builderTop) <= threshold) {
    return 'builder'
  }

  if (direction !== 'up' && exitTop !== null && Math.abs(exitTop) <= threshold) {
    return 'exit'
  }

  return null
}
