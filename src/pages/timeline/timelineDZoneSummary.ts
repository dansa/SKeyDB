import fallbackDzoneArt from '@/assets/events/dtide-aequor.webp'
import {getCurrentDzoneSeasonSummary, getLatestDzoneSeasonSummary} from '@/domain/dzone'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'
import {getTimelineCountdownDisplay, getTimelineStatus, type EventEntry} from '@/domain/timeline'
import {getDzoneRealmBadgeAsset} from '@/pages/d-zone/d-zone-realm-assets'

export function selectTimelineDZoneEvent(events: EventEntry[], now: Date): EventEntry | undefined {
  return events.find(
    (event) =>
      event.category === 'd-tide' &&
      getTimelineStatus(event.startDate, event.endDate, now) !== 'ended',
  )
}

export function getTimelineDZoneSummary(events: EventEntry[], now: Date) {
  const event = selectTimelineDZoneEvent(events, now)
  const currentSeason = getCurrentDzoneSeasonSummary(now)
  const season = currentSeason ?? getLatestDzoneSeasonSummary()
  const latestDzoneEventArt =
    events.find((candidate) => candidate.category === 'd-tide' && candidate.customArt)?.customArt ??
    fallbackDzoneArt

  return {
    artSrc: event?.customArt ?? latestDzoneEventArt,
    countdown: getTimelineCountdownDisplay(season.start, season.end, now),
    emblemSrc: getDzoneRealmBadgeAsset(season.realm),
    name: getDzoneSeasonSummaryDisplayName(season),
    note: currentSeason ? undefined : 'Current D-Zone data pending',
  }
}
