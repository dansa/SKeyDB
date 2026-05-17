import {Link} from 'react-router-dom'

import {
  getCurrentDzoneSeason,
  getDzoneSeasonSummaryById,
  getLatestDzoneSeason,
  getLatestDzoneSeasonSummary,
} from '@/domain/dzone'
import {getDzoneMonsterPreviewAsset} from '@/domain/dzone-assets'
import {getDzoneSeasonRealmName} from '@/domain/dzone-season-realm'
import {SeasonMasthead} from '@/ui/masthead/SeasonMasthead'

import {getDZoneCountdownDisplay} from './d-zone/d-zone-countdown'
import {formatDzoneSeasonDateRange} from './d-zone/d-zone-date-format'
import {getDzoneRealmBadgeAsset} from './d-zone/d-zone-realm-assets'
import {DZonePopoverSurface} from './d-zone/DZonePopoverSurface'
import {DZoneSeasonInspector} from './d-zone/DZoneSeasonInspector'
import {useTimelineNow} from './timeline/useTimelineNow'

import './d-zone/d-zone.css'

const D_ZONE_DESCRIPTION =
  'Defeat waves of monsters and bosses across escalating alerts. Rewards include Silver, Black Offerings, Gnostic Advance Materials, and other upgrade materials.'

export function DZonePage() {
  const now = useTimelineNow()
  const season = getCurrentDzoneSeason(now) ?? getLatestDzoneSeason()
  const seasonSummary = getDzoneSeasonSummaryById(season.id) ?? getLatestDzoneSeasonSummary()
  const dateRange = formatDzoneSeasonDateRange(season)
  const countdownDisplay = getDZoneCountdownDisplay(season, now)
  const mastheadName = getDzoneSeasonRealmName(season)

  return (
    <DZonePopoverSurface>
      {(dzonePopovers) => (
        <section className='d-zone-page -mt-4 md:-mt-5'>
          <SeasonMasthead
            layout='page'
            summaryAlignment='center'
            summary={{
              ariaLabel: 'Current D-zone season',
              countdown: countdownDisplay ? {text: countdownDisplay, title: dateRange} : null,
              emblemSrc: getDzoneRealmBadgeAsset(seasonSummary.realm),
              kicker: 'Current Season',
              name: mastheadName,
            }}
          >
            <div className='d-zone-hero-copy'>
              <h1 className='d-zone-hero-title ui-title'>D-Effect Zone</h1>
              <p className='d-zone-hero-meta'>
                Current Season: {season.period.toString()} · {dateRange}
              </p>
              <p className='d-zone-hero-description'>{D_ZONE_DESCRIPTION}</p>
              <Link className='d-zone-history-cta' to='/d-zone/history'>
                History Archive
              </Link>
            </div>
          </SeasonMasthead>

          <DZoneSeasonInspector
            dateRange={dateRange}
            getMonsterAsset={(monster) => getDzoneMonsterPreviewAsset(monster.assetName)}
            onMonsterOpen={dzonePopovers.openMonsterPopover}
            onRelicOpen={(relic, event) => {
              void dzonePopovers.openRelicPopover(relic, event)
            }}
            realm={seasonSummary.realm}
            season={season}
            title={mastheadName}
          />
        </section>
      )}
    </DZonePopoverSurface>
  )
}
