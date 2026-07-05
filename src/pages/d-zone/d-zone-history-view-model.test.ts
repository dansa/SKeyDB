import {describe, expect, it} from 'vitest'

import {getDzoneSeasonSummaries, type DzoneSeasonSummary} from '@/domain/dzone'

import {
  buildDZoneHistoryYearGroups,
  createDZoneHistoryExpandedYearsState,
  getDZoneHistoryExpandedYearsForSelection,
  getDZoneHistoryNextSearchParams,
  getDZoneHistoryReleasedSeasons,
  getDZoneHistoryVisibleSeasons,
  resolveDZoneHistorySelection,
  toggleDZoneHistoryExpandedYear,
} from './d-zone-history-view-model'

function createSummary(period: number, start: string, end: string): DzoneSeasonSummary {
  return {
    end,
    id: `dzone-${period.toString().padStart(4, '0')}`,
    name: `Season ${period.toString()}`,
    period,
    realm: 'AEQUOR',
    seasonPath: `seasons/dzone${period.toString().padStart(4, '0')}.json`,
    stageEffect: 'Astral Reign',
    start,
  }
}

describe('d-zone history view model', () => {
  it('keeps exact season searches exact', () => {
    const visibleSeasons = getDZoneHistoryVisibleSeasons(getDzoneSeasonSummaries(), 'season 1')

    expect(visibleSeasons.map((season) => season.period)).toEqual([1])
  })

  it('supports regular text search across season metadata', () => {
    const visibleSeasons = getDZoneHistoryVisibleSeasons(getDzoneSeasonSummaries(), 'aequor')

    expect(visibleSeasons.length).toBeGreaterThan(0)
    expect(visibleSeasons.every((season) => season.realm === 'AEQUOR')).toBe(true)
  })

  it('keeps unreleased seasons out of the visible history list', () => {
    const releasedSeason = createSummary(1, '2026-05-01T00:00:00.000Z', '2026-05-08T00:00:00.000Z')
    const futureSeason = createSummary(2, '2026-05-15T00:00:00.000Z', '2026-05-22T00:00:00.000Z')

    expect(
      getDZoneHistoryReleasedSeasons(
        [releasedSeason, futureSeason],
        new Date('2026-05-12T00:00:00.000Z'),
      ).map((season) => season.period),
    ).toEqual([1])
  })

  it('groups visible seasons by descending season order year', () => {
    const visibleSeasons = getDZoneHistoryVisibleSeasons(getDzoneSeasonSummaries(), '')
    const groups = buildDZoneHistoryYearGroups(visibleSeasons)

    expect(groups[0]?.year).toBe('2026')
    expect(groups[0]?.seasons[0]?.period).toBeGreaterThan(groups[0]?.seasons.at(-1)?.period ?? 0)
  })

  it('resolves URL selection with current and latest fallbacks', () => {
    const summaries = getDzoneSeasonSummaries()
    const latestPeriod = summaries.at(-1)?.period

    expect(
      resolveDZoneHistorySelection({
        now: new Date('2026-05-12T00:00:00.000Z'),
        seasonParam: 'dzone-0001',
        summaries,
      }).selectedSummary.period,
    ).toBe(1)
    expect(
      resolveDZoneHistorySelection({
        now: new Date('2026-05-12T00:00:00.000Z'),
        seasonParam: 'dzone-not-real',
        summaries,
      }).selectedSummary.period,
    ).toBe(60)
    expect(
      resolveDZoneHistorySelection({
        now: new Date('2099-01-01T00:00:00.000Z'),
        seasonParam: null,
        summaries,
      }).selectedSummary.period,
    ).toBe(latestPeriod)
  })

  it('defaults to released seasons while allowing direct links to unreleased seasons', () => {
    const currentSeason = createSummary(1, '2026-05-01T00:00:00.000Z', '2026-05-14T00:00:00.000Z')
    const futureSeason = createSummary(2, '2026-05-15T00:00:00.000Z', '2026-05-22T00:00:00.000Z')
    const summaries = [currentSeason, futureSeason]
    const now = new Date('2026-05-12T00:00:00.000Z')

    expect(
      resolveDZoneHistorySelection({
        now,
        seasonParam: null,
        summaries,
      }).selectedSummary.period,
    ).toBe(1)
    expect(
      resolveDZoneHistorySelection({
        now,
        seasonParam: 'dzone-not-real',
        summaries,
      }).selectedSummary.period,
    ).toBe(1)
    expect(
      resolveDZoneHistorySelection({
        now,
        seasonParam: futureSeason.id,
        summaries,
      }).selectedSummary.period,
    ).toBe(2)
  })

  it('repairs expanded years for changed selections without mutating search-forced expansion', () => {
    const state = createDZoneHistoryExpandedYearsState('dzone-0001', '2024')
    const expandedYears = getDZoneHistoryExpandedYearsForSelection(state, 'dzone-0060', '2026')

    expect([...expandedYears]).toEqual(['2024', '2026'])
    expect([...state.years]).toEqual(['2024'])

    const nextState = toggleDZoneHistoryExpandedYear(state, 'dzone-0060', '2026', '2024')

    expect(nextState.selectedSeasonId).toBe('dzone-0060')
    expect([...nextState.years]).toEqual(['2026'])
  })

  it('builds season query params without dropping unrelated params', () => {
    const currentParams = new URLSearchParams('foo=bar&season=dzone-0001')
    const nextParams = getDZoneHistoryNextSearchParams(currentParams, 'dzone-0002')

    expect(nextParams.toString()).toBe('foo=bar&season=dzone-0002')
    expect(currentParams.toString()).toBe('foo=bar&season=dzone-0001')
  })
})
