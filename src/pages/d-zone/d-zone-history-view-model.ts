import type {DzoneSeasonSummary} from '@/domain/dzone'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'

import {formatDzoneSeasonDateRange} from './d-zone-date-format'

export interface DZoneHistoryYearGroup {
  seasons: DzoneSeasonSummary[]
  year: string
}

export interface DZoneHistorySelection {
  selectedSummary: DzoneSeasonSummary
  selectedYear: string
}

export interface DZoneHistoryExpandedYearsState {
  selectedSeasonId: string
  years: Set<string>
}

export function getDZoneHistorySeasonYear(season: DzoneSeasonSummary): string {
  return new Date(season.start).getUTCFullYear().toString()
}

function getLatestDZoneHistorySummary(summaries: DzoneSeasonSummary[]): DzoneSeasonSummary {
  const latest = summaries.reduce<DzoneSeasonSummary | undefined>((currentLatest, summary) => {
    if (!currentLatest || summary.period > currentLatest.period) {
      return summary
    }
    return currentLatest
  }, undefined)

  if (!latest) {
    throw new Error('D-zone history requires at least one season summary.')
  }

  return latest
}

export function getDZoneHistoryDefaultSummary(
  summaries: DzoneSeasonSummary[],
  now: Date,
): DzoneSeasonSummary {
  const timestamp = now.getTime()
  return (
    summaries.find(
      (summary) => Date.parse(summary.start) <= timestamp && timestamp <= Date.parse(summary.end),
    ) ?? getLatestDZoneHistorySummary(summaries)
  )
}

export function resolveDZoneHistorySelection({
  now,
  seasonParam,
  summaries,
}: {
  now: Date
  seasonParam: string | null
  summaries: DzoneSeasonSummary[]
}): DZoneHistorySelection {
  const defaultSummary = getDZoneHistoryDefaultSummary(summaries, now)
  const selectedSummary = summaries.find((season) => season.id === seasonParam) ?? defaultSummary

  return {
    selectedSummary,
    selectedYear: getDZoneHistorySeasonYear(selectedSummary),
  }
}

export function createDZoneHistoryExpandedYearsState(
  selectedSeasonId: string,
  selectedYear: string,
): DZoneHistoryExpandedYearsState {
  return {
    selectedSeasonId,
    years: new Set([selectedYear]),
  }
}

export function getDZoneHistoryExpandedYearsForSelection(
  state: DZoneHistoryExpandedYearsState,
  selectedSeasonId: string,
  selectedYear: string,
): Set<string> {
  if (state.selectedSeasonId === selectedSeasonId || state.years.has(selectedYear)) {
    return state.years
  }

  const nextYears = new Set(state.years)
  nextYears.add(selectedYear)
  return nextYears
}

export function toggleDZoneHistoryExpandedYear(
  state: DZoneHistoryExpandedYearsState,
  selectedSeasonId: string,
  selectedYear: string,
  toggledYear: string,
): DZoneHistoryExpandedYearsState {
  const currentYears = getDZoneHistoryExpandedYearsForSelection(
    state,
    selectedSeasonId,
    selectedYear,
  )
  const nextYears = new Set(currentYears)
  if (nextYears.has(toggledYear)) {
    nextYears.delete(toggledYear)
  } else {
    nextYears.add(toggledYear)
  }
  return {selectedSeasonId, years: nextYears}
}

export function getDZoneHistoryNextSearchParams(
  searchParams: URLSearchParams,
  seasonId: string,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams)
  nextParams.set('season', seasonId)
  return nextParams
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

export function getDZoneHistoryNormalizedSearchTerm(searchTerm: string): string {
  return searchTerm.trim().toLowerCase()
}

export function getDZoneHistoryVisibleSeasons(
  seasons: DzoneSeasonSummary[],
  searchTerm: string,
): DzoneSeasonSummary[] {
  const normalizedSearchTerm = getDZoneHistoryNormalizedSearchTerm(searchTerm)
  const exactSeasonSearch = /^season\s+(\d+)$/.exec(normalizedSearchTerm)?.[1]

  return seasons
    .filter((season) =>
      exactSeasonSearch
        ? season.period.toString() === exactSeasonSearch
        : normalizedSearchTerm
          ? getSeasonSearchText(season).includes(normalizedSearchTerm)
          : true,
    )
    .sort((left, right) => right.period - left.period)
}

export function buildDZoneHistoryYearGroups(
  seasons: DzoneSeasonSummary[],
): DZoneHistoryYearGroup[] {
  const groups = new Map<string, DzoneSeasonSummary[]>()

  for (const season of seasons) {
    const year = getDZoneHistorySeasonYear(season)
    groups.set(year, [...(groups.get(year) ?? []), season])
  }

  return Array.from(groups, ([year, groupedSeasons]) => ({year, seasons: groupedSeasons}))
}

export function getDZoneHistoryYearPanelId(year: string): string {
  return `d-zone-history-year-${year}-panel`
}

export function getDZoneHistoryYearButtonId(year: string): string {
  return `d-zone-history-year-${year}-button`
}
