import {clamp} from './layout-math'

const MOBILE_PAGE_SNAP_THRESHOLD_MIN = 24
const MOBILE_PAGE_SNAP_THRESHOLD_MAX = 96
const MOBILE_PAGE_SNAP_THRESHOLD_RATIO = 0.12
export type MobilePageSnapTarget = 'builder' | 'exit' | null

interface ResolveMobilePageSnapTargetInput {
  builderTop: number
  currentScrollTop: number
  exitTop: number | null
  lastScrollTop: number
  viewportHeight: number
}

export function getMobilePageSnapThreshold(viewportHeight: number) {
  return clamp(
    Math.round(viewportHeight * MOBILE_PAGE_SNAP_THRESHOLD_RATIO),
    MOBILE_PAGE_SNAP_THRESHOLD_MIN,
    MOBILE_PAGE_SNAP_THRESHOLD_MAX,
  )
}

export function resolveMobilePageSnapTarget({
  builderTop,
  currentScrollTop,
  exitTop,
  lastScrollTop,
  viewportHeight,
}: ResolveMobilePageSnapTargetInput): MobilePageSnapTarget {
  const threshold = getMobilePageSnapThreshold(viewportHeight)
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
