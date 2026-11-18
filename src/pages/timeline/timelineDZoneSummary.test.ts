import {describe, expect, it, vi} from 'vitest'

import type {DzoneSeasonSummary} from '@/domain/dzone'

import {getTimelineDZoneSummary} from './timelineDZoneSummary'

const CURRENT_DZONE: DzoneSeasonSummary = {
  id: 'dzone-0101',
  period: 101,
  name: 'Current Test Zone',
  start: '2026-03-09T00:00:00.000Z',
  end: '2026-03-12T00:00:00.000Z',
  stageEffect: 'Astral Reign',
  realm: 'CARO',
  seasonPath: 'seasons/dzone0101.json',
}

const LATEST_DZONE: DzoneSeasonSummary = {
  ...CURRENT_DZONE,
  id: 'dzone-0102',
  period: 102,
  name: 'Latest Test Zone',
  start: '2026-03-13T00:00:00.000Z',
  end: '2026-03-20T00:59:58.000Z',
  realm: 'ULTRA',
  seasonPath: 'seasons/dzone0102.json',
}

vi.mock('@/domain/dzone', () => ({
  getCurrentDzoneSeasonSummary: (now: Date) =>
    [CURRENT_DZONE, LATEST_DZONE].find(
      (season) => new Date(season.start) <= now && now <= new Date(season.end),
    ),
  getDzoneSeasonSummaries: () => [CURRENT_DZONE, LATEST_DZONE],
  getLatestDzoneSeasonSummary: () => LATEST_DZONE,
}))

vi.mock('@/domain/dzone-season-realm', () => ({
  getDzoneSeasonSummaryDisplayName: (summary: DzoneSeasonSummary) =>
    summary.realm ? `${summary.realm.toLowerCase()} ring` : summary.name,
}))

vi.mock('@/pages/d-zone/d-zone-realm-assets', () => ({
  getDzoneRealmBadgeAsset: (realm: string | null | undefined) =>
    realm ? `/realm-badge-${realm.toLowerCase()}.webp` : undefined,
}))

describe('timeline D-Zone summary', () => {
  it('uses the current D-Zone season for the masthead and agenda', () => {
    const summary = getTimelineDZoneSummary(new Date('2026-03-10T00:00:00.000Z'))

    expect(summary).toMatchObject({
      emblemSrc: '/realm-badge-caro.webp',
      name: 'caro ring',
      resetDate: LATEST_DZONE.start,
    })
    expect(summary.note).toBeUndefined()
    expect(summary.countdown?.text).toBe('Ends in 3d 0h')
  })

  it('uses the next minute boundary when the next season is not available', () => {
    const summary = getTimelineDZoneSummary(new Date('2026-03-19T01:00:00.000Z'))
    expect(summary.resetDate).toBe('2026-03-20T01:00:00.000Z')
    expect(summary.countdown?.text).toBe('Ends in 1d 0h')
  })

  it('falls back to the latest season and explains when current data is pending', () => {
    const summary = getTimelineDZoneSummary(new Date('2026-03-21T01:00:00.000Z'))

    expect(summary).toMatchObject({
      emblemSrc: '/realm-badge-ultra.webp',
      name: 'ultra ring',
      note: 'Current D-Zone data pending',
    })
    expect(summary.countdown?.text).toBe('Ended 1 day ago')
    expect(summary.resetDate).toBeUndefined()
  })
})
