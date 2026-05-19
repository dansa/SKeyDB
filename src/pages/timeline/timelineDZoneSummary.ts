import {getCurrentDzoneSeasonSummary, getLatestDzoneSeasonSummary} from '@/domain/dzone'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'
import {getTimelineCountdownDisplay, getTimelineStatus, type EventEntry} from '@/domain/timeline'

export function selectTimelineDZoneEvent(events: EventEntry[], now: Date): EventEntry | undefined {
  return (
    events.find(
      (event) =>
        event.category === 'd-tide' &&
        getTimelineStatus(event.startDate, event.endDate, now) !== 'ended',
    ) ?? events.find((event) => event.category === 'd-tide')
  )
}

export function getTimelineDZoneRealmName(event: EventEntry | undefined, now: Date): string {
  const match = event?.description?.match(/Current Realm relic:\s*([^.\n]+)/i)
  const eventRealmName = match?.[1]?.trim()
  if (eventRealmName) return eventRealmName

  return getDzoneSeasonSummaryDisplayName(
    getCurrentDzoneSeasonSummary(now) ?? getLatestDzoneSeasonSummary(),
  )
}

export function getTimelineDZoneSummary(events: EventEntry[], now: Date) {
  const event = selectTimelineDZoneEvent(events, now)

  return {
    artSrc: event?.customArt,
    countdown: event ? getTimelineCountdownDisplay(event.startDate, event.endDate, now) : null,
    name: getTimelineDZoneRealmName(event, now),
  }
}
