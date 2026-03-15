import {getOverviewGridMetrics} from './mobile-layout-metrics'

export function shouldAllowMobileOverviewPageOverflow({
  chromeHeight,
  viewportHeight,
  viewportWidth,
}: {
  chromeHeight: number
  viewportHeight: number
  viewportWidth: number
}) {
  const availableGridHeight = Math.max(0, viewportHeight - chromeHeight)

  return getOverviewGridMetrics(viewportWidth, availableGridHeight).requiresPageScroll
}
