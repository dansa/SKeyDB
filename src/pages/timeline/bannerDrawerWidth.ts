export type BannerDrawerWidthMode = 'normal' | 'wide' | 'extra-wide'

const WIDTH_MODE_RANK: Record<BannerDrawerWidthMode, number> = {
  normal: 0,
  wide: 1,
  'extra-wide': 2,
}

export function getBannerDrawerWidthMode(
  scrollHeight: number,
  clientHeight: number,
): BannerDrawerWidthMode {
  if (clientHeight <= 0 || scrollHeight <= clientHeight) return 'normal'

  const overflowRatio = scrollHeight / clientHeight
  if (overflowRatio >= 1.85) return 'extra-wide'
  return 'wide'
}

export function promoteBannerDrawerWidthMode(
  currentMode: BannerDrawerWidthMode,
  scrollHeight: number,
  clientHeight: number,
): BannerDrawerWidthMode {
  if (currentMode === 'wide' && clientHeight > 0 && scrollHeight > clientHeight + 1) {
    return 'extra-wide'
  }
  return currentMode
}

export function keepWidestBannerDrawerWidthMode(
  currentMode: BannerDrawerWidthMode,
  measuredMode: BannerDrawerWidthMode,
): BannerDrawerWidthMode {
  return WIDTH_MODE_RANK[measuredMode] > WIDTH_MODE_RANK[currentMode] ? measuredMode : currentMode
}
