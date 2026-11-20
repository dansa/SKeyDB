import {
  getCurrentDzoneSeasonSummary,
  getDzoneSeasonSummaries,
  getLatestDzoneSeasonSummary,
} from '@/domain/dzone'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'
import {getTimelineCountdownDisplay} from '@/domain/timeline'
import {getDzoneRealmBadgeAsset} from '@/pages/d-zone/d-zone-realm-assets'

export function getTimelineDZoneSummary(now: Date) {
  const currentSeason = getCurrentDzoneSeasonSummary(now)
  const season = currentSeason ?? getLatestDzoneSeasonSummary()
  const nextSeason = currentSeason
    ? getDzoneSeasonSummaries().find(({period}) => period === currentSeason.period + 1)
    : undefined
  // The outgoing season can close two seconds before the minute-aligned reset.
  const resetDate = currentSeason
    ? (nextSeason?.start ??
      new Date(Math.ceil(Date.parse(season.end) / 60_000) * 60_000).toISOString())
    : undefined

  return {
    countdown: getTimelineCountdownDisplay(season.start, resetDate ?? season.end, now),
    emblemSrc: getDzoneRealmBadgeAsset(season.realm),
    resetDate,
    startDate: season.start,
    name: getDzoneSeasonSummaryDisplayName(season),
    note: currentSeason ? undefined : 'Current D-Zone data pending',
    realm: season.realm,
  }
}
