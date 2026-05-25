import {describe, expect, it} from 'vitest'

import {getDzoneSeasonSummaries} from '@/domain/dzone'

import {
  buildDZoneHistoryYearGroups,
  createDZoneHistoryExpandedYearsState,
  getDZoneHistoryExpandedYearsForSelection,
  getDZoneHistoryNextSearchParams,
  getDZoneHistoryVisibleSeasons,
  resolveDZoneHistorySelection,
  toggleDZoneHistoryExpandedYear,
} from './d-zone-history-view-model'

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

  it('groups visible seasons by descending season order year', () => {
    const visibleSeasons = getDZoneHistoryVisibleSeasons(getDzoneSeasonSummaries(), '')
    const groups = buildDZoneHistoryYearGroups(visibleSeasons)

    expect(groups[0]?.year).toBe('2026')
    expect(groups[0]?.seasons[0]?.period).toBeGreaterThan(groups[0]?.seasons.at(-1)?.period ?? 0)
  })

  it('resolves URL selection with current and latest fallbacks', () => {
    const summaries = getDzoneSeasonSummaries()

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
    ).toBe(61)
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
