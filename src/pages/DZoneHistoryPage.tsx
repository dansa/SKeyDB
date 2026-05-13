import {useMemo, useState, type MouseEvent} from 'react'

import {FaChevronRight, FaMagnifyingGlass} from 'react-icons/fa6'
import {Link} from 'react-router-dom'

import {
  getCurrentDzoneSeasonSummary,
  getDzoneSeasonById,
  getDzoneSeasonSummaries,
  getLatestDzoneSeason,
  getLatestDzoneSeasonSummary,
  type DzoneResolvedMonster,
  type DzoneSeasonSummary,
} from '@/domain/dzone'
import {getDzoneMonsterPreviewAsset} from '@/domain/dzone-assets'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'
import {buildGlobalDatabaseReferenceLayer} from '@/domain/global-database-reference-layer'
import {getTimelineCountdownDisplay, getTimelineStatus} from '@/domain/timeline'
import {DatabasePopoverContext} from '@/features/database/internal/database-popover-context'
import {DatabasePopoverRoot} from '@/features/database/internal/DatabasePopoverRoot'
import {
  buildDzoneMonsterPopoverEntry,
  loadDzoneRelicPopoverEntry,
} from '@/features/database/internal/dzone-popover-entries'
import {useDatabasePopoverController} from '@/features/database/internal/useDatabasePopoverController'

import {formatDzoneSeasonDateRange} from './d-zone/d-zone-date-format'
import {getDzoneRealmBadgeAsset, getDzoneRealmIconAsset} from './d-zone/d-zone-realm-assets'
import {type DZoneRelicPreview} from './d-zone/d-zone-view-model'
import {DZoneSeasonInspector} from './d-zone/DZoneSeasonInspector'
import {useTimelineNow} from './timeline/useTimelineNow'

import './d-zone/d-zone.css'

interface DZoneHistoryYearGroup {
  seasons: DzoneSeasonSummary[]
  year: string
}

function getSeasonYear(season: DzoneSeasonSummary): string {
  return new Date(season.start).getUTCFullYear().toString()
}

function getSeasonSearchText(season: DzoneSeasonSummary): string {
  return [
    `season ${season.period.toString()}`,
    season.period.toString(),
    season.name,
    getDzoneSeasonSummaryDisplayName(season),
    season.stageEffect,
    season.realm ?? '',
    formatDzoneSeasonDateRange(season),
  ]
    .join(' ')
    .toLowerCase()
}

function buildYearGroups(seasons: DzoneSeasonSummary[]): DZoneHistoryYearGroup[] {
  const groups = new Map<string, DzoneSeasonSummary[]>()

  for (const season of seasons) {
    const year = getSeasonYear(season)
    groups.set(year, [...(groups.get(year) ?? []), season])
  }

  return Array.from(groups, ([year, groupedSeasons]) => ({year, seasons: groupedSeasons}))
}

export function DZoneHistoryPage() {
  const now = useTimelineNow()
  const summaries = getDzoneSeasonSummaries()
  const defaultSummary = getCurrentDzoneSeasonSummary(now) ?? getLatestDzoneSeasonSummary()
  const [selectedSeasonId, setSelectedSeasonId] = useState(defaultSummary.id)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedYears, setExpandedYears] = useState<Set<string>>(
    () => new Set([getSeasonYear(defaultSummary)]),
  )
  const referenceLayer = useMemo(() => buildGlobalDatabaseReferenceLayer(), [])
  const popoverController = useDatabasePopoverController({
    referenceLayer,
    stats: null,
  })

  const selectedSummary =
    summaries.find((season) => season.id === selectedSeasonId) ?? getLatestDzoneSeasonSummary()
  const selectedSeason = getDzoneSeasonById(selectedSummary.id) ?? getLatestDzoneSeason()
  const selectedRealmName = selectedSummary.realm
    ? getDzoneSeasonSummaryDisplayName(selectedSummary)
    : null
  const selectedRealmBadgeSrc = selectedSummary.realm
    ? getDzoneRealmBadgeAsset(selectedSummary.realm)
    : undefined
  const selectedDateRange = formatDzoneSeasonDateRange(selectedSeason)
  const status = getTimelineStatus(selectedSeason.start, selectedSeason.end, now)
  const countdownDisplay =
    status === 'active'
      ? (getTimelineCountdownDisplay(selectedSeason.start, selectedSeason.end, now)?.text ?? '')
      : ''
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const exactSeasonSearch = /^season\s+(\d+)$/.exec(normalizedSearchTerm)?.[1]
  const visibleSeasons = summaries
    .filter((season) =>
      exactSeasonSearch
        ? season.period.toString() === exactSeasonSearch
        : normalizedSearchTerm
          ? getSeasonSearchText(season).includes(normalizedSearchTerm)
          : true,
    )
    .sort((left, right) => right.period - left.period)
  const yearGroups = buildYearGroups(visibleSeasons)

  function toggleYear(year: string) {
    setExpandedYears((currentYears) => {
      const nextYears = new Set(currentYears)
      if (nextYears.has(year)) {
        nextYears.delete(year)
      } else {
        nextYears.add(year)
      }
      return nextYears
    })
  }

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
      <section className='d-zone-page d-zone-history-page -mt-4 md:-mt-5'>
        <nav aria-label='Breadcrumb' className='d-zone-history-breadcrumbs'>
          <Link to='/'>Home</Link>
          <FaChevronRight aria-hidden />
          <Link to='/d-zone'>D-Zone</Link>
          <FaChevronRight aria-hidden />
          <span>Archive</span>
        </nav>

        <div className='d-zone-history-shell'>
          <aside aria-label='D-zone season archive' className='d-zone-history-sidebar'>
            <div className='d-zone-history-heading-row'>
              <div className='d-zone-history-title-copy'>
                <h1 className='d-zone-history-title ui-title'>D-Zone Archive</h1>
                <p>Inspect past seasons, their stage lineups and relics.</p>
              </div>
            </div>

            <div className='d-zone-history-controls'>
              <label className='d-zone-history-search'>
                <span className='sr-only'>Search D-zone seasons</span>
                <FaMagnifyingGlass aria-hidden className='d-zone-history-search-icon' />
                <input
                  aria-label='Search D-zone seasons'
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                  }}
                  placeholder='Search seasons...'
                  type='search'
                  value={searchTerm}
                />
              </label>
            </div>

            <div
              className='d-zone-history-year-list'
              role='region'
              aria-label='D-zone season archive'
            >
              {yearGroups.map((group) => {
                const forceExpanded = normalizedSearchTerm.length > 0
                const expanded = forceExpanded || expandedYears.has(group.year)

                return (
                  <section className='d-zone-history-year-group' key={group.year}>
                    <button
                      aria-expanded={expanded}
                      className='d-zone-history-year-button'
                      onClick={() => {
                        toggleYear(group.year)
                      }}
                      type='button'
                    >
                      <FaChevronRight aria-hidden className='d-zone-history-year-chevron' />
                      <span>{group.year}</span>
                      <span className='d-zone-history-year-count'>
                        {group.seasons.length.toString()}
                      </span>
                    </button>

                    {expanded ? (
                      <div className='d-zone-history-season-list'>
                        {group.seasons.map((season) => {
                          const displayName = getDzoneSeasonSummaryDisplayName(season)
                          const realmIconSrc = getDzoneRealmIconAsset(season.realm)
                          const selected = season.id === selectedSummary.id

                          return (
                            <button
                              aria-current={selected ? 'true' : undefined}
                              aria-label={`Select Season ${season.period.toString()}`}
                              className={`d-zone-history-season-button ${
                                selected ? 'd-zone-history-season-button--selected' : ''
                              }`}
                              key={season.id}
                              onClick={() => {
                                setSelectedSeasonId(season.id)
                              }}
                              title={`${displayName} · ${season.stageEffect}`}
                              type='button'
                            >
                              <span className='d-zone-history-season-name'>
                                Season {season.period.toString()}
                                {realmIconSrc ? (
                                  <img
                                    alt={`${displayName} realm`}
                                    className='d-zone-history-season-realm-badge'
                                    decoding='async'
                                    draggable={false}
                                    loading='lazy'
                                    src={realmIconSrc}
                                  />
                                ) : (
                                  <span aria-hidden className='d-zone-history-season-realm-empty' />
                                )}
                              </span>

                              <span className='d-zone-history-season-date'>
                                {formatDzoneSeasonDateRange(season)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </section>
                )
              })}
            </div>
          </aside>

          <DZoneSeasonInspector
            countdownDisplay={countdownDisplay}
            dateRange={selectedDateRange}
            getMonsterAsset={(monster) => getDzoneMonsterPreviewAsset(monster.assetName)}
            onMonsterOpen={openMonsterPopover}
            onRelicOpen={(relic, event) => {
              void openRelicPopover(relic, event)
            }}
            realm={selectedSummary.realm}
            season={selectedSeason}
            showHeader
            realmBadgeSrc={selectedRealmBadgeSrc}
            realmName={selectedRealmName}
            title={`Season ${selectedSeason.period.toString()}`}
            waveHeadingLevel={3}
          />
        </div>
      </section>

      <DatabasePopoverRoot {...popoverController.popoverRootProps} />
    </DatabasePopoverContext.Provider>
  )
}
