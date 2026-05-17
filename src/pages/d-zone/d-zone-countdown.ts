import type {DzoneSeason} from '@/domain/dzone'
import {getTimelineCountdownDisplay, getTimelineStatus} from '@/domain/timeline'

export function getDZoneCountdownDisplay(season: DzoneSeason, now: Date): string {
  const status = getTimelineStatus(season.start, season.end, now)
  if (status !== 'active') {
    return ''
  }

  return getTimelineCountdownDisplay(season.start, season.end, now)?.text ?? ''
}
