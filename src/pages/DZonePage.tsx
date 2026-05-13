import {useMemo, type MouseEvent} from 'react'

import {Link} from 'react-router-dom'

import {
  getCurrentDzoneSeason,
  getDzoneSeasonSummaryById,
  getLatestDzoneSeason,
  getLatestDzoneSeasonSummary,
  type DzoneResolvedMonster,
  type DzoneSeason,
} from '@/domain/dzone'
import {getDzoneMonsterPreviewAsset} from '@/domain/dzone-assets'
import {getDzoneSeasonRealmName} from '@/domain/dzone-season-realm'
import {buildGlobalDatabaseReferenceLayer} from '@/domain/global-database-reference-layer'
import {getTimelineCountdownDisplay, getTimelineStatus} from '@/domain/timeline'
import {DatabasePopoverContext} from '@/features/database/internal/database-popover-context'
import {DatabasePopoverRoot} from '@/features/database/internal/DatabasePopoverRoot'
import {
  buildDzoneMonsterPopoverEntry,
  loadDzoneRelicPopoverEntry,
} from '@/features/database/internal/dzone-popover-entries'
import {useDatabasePopoverController} from '@/features/database/internal/useDatabasePopoverController'
import {SeasonMasthead} from '@/ui/masthead/SeasonMasthead'

import {formatDzoneSeasonDateRange} from './d-zone/d-zone-date-format'
import {getDzoneRealmBadgeAsset} from './d-zone/d-zone-realm-assets'
import {type DZoneRelicPreview} from './d-zone/d-zone-view-model'
import {D_ZONE_DESCRIPTION, DZoneSeasonInspector} from './d-zone/DZoneSeasonInspector'
import {useTimelineNow} from './timeline/useTimelineNow'

import './d-zone/d-zone.css'

function getDzoneCountdownDisplay(season: DzoneSeason, now: Date): string {
  const status = getTimelineStatus(season.start, season.end, now)
  if (status !== 'active') return ''
  return getTimelineCountdownDisplay(season.start, season.end, now)?.text ?? ''
}

export function DZonePage() {
  const now = useTimelineNow()
  const referenceLayer = useMemo(() => buildGlobalDatabaseReferenceLayer(), [])
  const popoverController = useDatabasePopoverController({
    referenceLayer,
    stats: null,
  })
  const season = getCurrentDzoneSeason(now) ?? getLatestDzoneSeason()
  const seasonSummary = getDzoneSeasonSummaryById(season.id) ?? getLatestDzoneSeasonSummary()
  const dateRange = formatDzoneSeasonDateRange(season)
  const countdownDisplay = getDzoneCountdownDisplay(season, now)
  const mastheadName = getDzoneSeasonRealmName(season)

  function openMonsterPopover(monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) {
    const thumbnailSrc = getDzoneMonsterPreviewAsset(monster.assetName)
    popoverController.contextValue.openRootInfo?.(
      buildDzoneMonsterPopoverEntry({monster, thumbnailSrc}),
      event,
    )
  }

  async function openRelicPopover(relic: DZoneRelicPreview, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const anchorElement = event.currentTarget
    const entry = await loadDzoneRelicPopoverEntry({
      relicId: relic.id,
      thumbnailSrc: relic.iconSrc,
    })

    if (!entry || !anchorElement.isConnected) {
      return
    }

    popoverController.contextValue.openRootInfo?.(entry, {
      currentTarget: anchorElement,
      stopPropagation: () => undefined,
    })
  }

  return (
    <DatabasePopoverContext.Provider value={popoverController.contextValue}>
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
              Season {season.period.toString()} · {dateRange}
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
          onMonsterOpen={openMonsterPopover}
          onRelicOpen={(relic, event) => {
            void openRelicPopover(relic, event)
          }}
          realm={seasonSummary.realm}
          season={season}
          title={mastheadName}
        />
      </section>

      <DatabasePopoverRoot {...popoverController.popoverRootProps} />
    </DatabasePopoverContext.Provider>
  )
}
