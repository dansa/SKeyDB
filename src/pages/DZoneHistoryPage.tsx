import {useState} from 'react'

import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'
import {Link, useSearchParams} from 'react-router-dom'

import {getDzoneSeasonSummaries} from '@/domain/dzone'
import {getDzoneMonsterPreviewAsset} from '@/domain/dzone-assets'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'

import {getDZoneCountdownDisplay} from './d-zone/d-zone-countdown'
import {formatDzoneSeasonDateRange} from './d-zone/d-zone-date-format'
import {
  buildDZoneHistoryYearGroups,
  createDZoneHistoryExpandedYearsState,
  getDZoneHistoryExpandedYearsForSelection,
  getDZoneHistoryNextSearchParams,
  getDZoneHistoryNormalizedSearchTerm,
  getDZoneHistoryVisibleSeasons,
  resolveDZoneHistorySelection,
  toggleDZoneHistoryExpandedYear,
  type DZoneHistoryExpandedYearsState,
} from './d-zone/d-zone-history-view-model'
import {getDzoneRealmBadgeAsset} from './d-zone/d-zone-realm-assets'
import {DZoneHistoryBrowser} from './d-zone/DZoneHistoryBrowser'
import {DZonePopoverSurface} from './d-zone/DZonePopoverSurface'
import {DZoneSeasonInspector} from './d-zone/DZoneSeasonInspector'
import {useDZoneSeason} from './d-zone/useDZoneSeason'
import {useTimelineNow} from './timeline/useTimelineNow'

import './d-zone/d-zone.css'

export function DZoneHistoryPage() {
  const now = useTimelineNow()
  const [searchParams, setSearchParams] = useSearchParams()
  const summaries = getDzoneSeasonSummaries()
  const {selectedSummary, selectedYear} = resolveDZoneHistorySelection({
    now,
    seasonParam: searchParams.get('season'),
    summaries,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [browserOpen, setBrowserOpen] = useState(false)
  const [browserOpener, setBrowserOpener] = useState<HTMLElement | null>(null)
  const [expandedYearState, setExpandedYearState] = useState<DZoneHistoryExpandedYearsState>(() =>
    createDZoneHistoryExpandedYearsState(selectedSummary.id, selectedYear),
  )
  const selectedSeasonLoadState = useDZoneSeason(selectedSummary.id)

  const selectedRealmName = selectedSummary.realm
    ? getDzoneSeasonSummaryDisplayName(selectedSummary)
    : null
  const selectedRealmBadgeSrc = selectedSummary.realm
    ? getDzoneRealmBadgeAsset(selectedSummary.realm)
    : undefined
  const selectedDateRange =
    selectedSeasonLoadState.status === 'loaded'
      ? formatDzoneSeasonDateRange(selectedSeasonLoadState.season)
      : ''
  const countdownDisplay =
    selectedSeasonLoadState.status === 'loaded'
      ? getDZoneCountdownDisplay(selectedSeasonLoadState.season, now)
      : ''
  const normalizedSearchTerm = getDZoneHistoryNormalizedSearchTerm(searchTerm)
  const visibleSeasons = getDZoneHistoryVisibleSeasons(summaries, searchTerm)
  const yearGroups = buildDZoneHistoryYearGroups(visibleSeasons)
  const expandedYears = getDZoneHistoryExpandedYearsForSelection(
    expandedYearState,
    selectedSummary.id,
    selectedYear,
  )

  function toggleYear(year: string) {
    setExpandedYearState((currentState) => {
      return toggleDZoneHistoryExpandedYear(currentState, selectedSummary.id, selectedYear, year)
    })
  }

  return (
    <DZonePopoverSurface>
      {(dzonePopovers) => (
        <section
          className={`d-zone-page d-zone-history-page -mt-4 md:-mt-5 ${
            browserOpen ? 'd-zone-history-page--browser-open' : ''
          }`}
        >
          <div className='d-zone-history-page-heading' aria-labelledby='d-zone-history-page-title'>
            <div className='d-zone-history-page-heading-copy'>
              <h1 className='d-zone-history-title ui-title' id='d-zone-history-page-title'>
                D-Zone Archive
              </h1>
              <p>Browse past seasons, their stage lineups and relics.</p>
            </div>
            <Link className='d-zone-history-cta d-zone-history-back-link' to='/d-zone'>
              <FaChevronLeft aria-hidden />
              Back to D-Zone
            </Link>
          </div>

          <button
            aria-controls='d-zone-history-browser'
            aria-expanded={browserOpen}
            aria-label='Open season browser drawer'
            className='d-zone-history-browser-trigger'
            onClick={(event) => {
              setBrowserOpener(event.currentTarget)
              setBrowserOpen(true)
            }}
            type='button'
          >
            <span className='d-zone-history-browser-trigger-copy'>
              <span className='d-zone-history-browser-trigger-title'>Season Browser</span>
            </span>
            <span className='d-zone-history-browser-trigger-action'>
              Open Drawer
              <FaChevronRight aria-hidden />
            </span>
          </button>

          <div className='d-zone-history-shell'>
            <DZoneHistoryBrowser
              browserOpen={browserOpen}
              expandedYears={expandedYears}
              forceExpandedYears={normalizedSearchTerm.length > 0}
              groups={yearGroups}
              openerElement={browserOpener}
              search={searchTerm}
              selectedSeasonId={selectedSummary.id}
              onBackdropClose={() => {
                setBrowserOpen(false)
              }}
              onClose={() => {
                setBrowserOpen(false)
              }}
              onSearchChange={setSearchTerm}
              onSelectSeason={(seasonId) => {
                setSearchParams(getDZoneHistoryNextSearchParams(searchParams, seasonId), {
                  replace: true,
                })
                setBrowserOpen(false)
              }}
              onToggleYear={toggleYear}
            />

            {selectedSeasonLoadState.status === 'loaded' ? (
              <DZoneSeasonInspector
                countdownDisplay={countdownDisplay}
                dateRange={selectedDateRange}
                getMonsterAsset={(monster) => getDzoneMonsterPreviewAsset(monster.assetName)}
                onMonsterOpen={dzonePopovers.openMonsterPopover}
                onRelicOpen={(relic, event) => {
                  void dzonePopovers.openRelicPopover(relic, event)
                }}
                realm={selectedSummary.realm}
                season={selectedSeasonLoadState.season}
                showHeader
                realmBadgeSrc={selectedRealmBadgeSrc}
                realmName={selectedRealmName}
                title={`Season ${selectedSeasonLoadState.season.period.toString()}`}
                waveHeadingLevel={3}
              />
            ) : (
              <div className='d-zone-history-loading' role='status'>
                {selectedSeasonLoadState.status === 'error'
                  ? selectedSeasonLoadState.message
                  : 'Loading season archive...'}
              </div>
            )}
          </div>
        </section>
      )}
    </DZonePopoverSurface>
  )
}
