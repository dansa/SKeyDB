import {getCurrentDzoneSeasonSummary, getLatestDzoneSeasonSummary} from '@/domain/dzone'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'
import {getTimelineCountdownDisplay} from '@/domain/timeline'
import {getDzoneRealmBadgeAsset} from '@/pages/d-zone/d-zone-realm-assets'

export function getTimelineDZoneSummary(now: Date) {
  const currentSeason = getCurrentDzoneSeasonSummary(now)
  const season = currentSeason ?? getLatestDzoneSeasonSummary()

  return {
    countdown: getTimelineCountdownDisplay(season.start, season.end, now),
    emblemSrc: getDzoneRealmBadgeAsset(season.realm),
    endDate: season.end,
    name: getDzoneSeasonSummaryDisplayName(season),
    startDate: season.start,
    note: currentSeason ? undefined : 'Current D-Zone data pending',
    realm: season.realm,
  }
}
