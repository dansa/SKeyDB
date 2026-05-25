import {describe, expect, it, vi} from 'vitest'

import type {DzoneSeasonSummary} from '@/domain/dzone'
import type {EventEntry} from '@/domain/timeline'

import {getTimelineDZoneSummary, selectTimelineDZoneEvent} from './timelineDZoneSummary'

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
  end: '2026-03-20T00:00:00.000Z',
  realm: 'ULTRA',
  seasonPath: 'seasons/dzone0102.json',
}

vi.mock('@/domain/dzone', () => ({
  getCurrentDzoneSeasonSummary: (now: Date) =>
    now < new Date(CURRENT_DZONE.end) ? CURRENT_DZONE : undefined,
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

vi.mock('@/assets/events/dtide-aequor.webp', () => ({
  default: '/assets/dtide-aequor.webp',
}))

describe('timeline D-Zone summary', () => {
  it('uses the current D-Zone season for masthead name and countdown', () => {
    const summary = getTimelineDZoneSummary(
      [
        {
          id: 'event-dtide',
          title: 'Regional D-Effect Zone',
          category: 'd-tide',
          description: 'Current Realm relic: Aequor Ring.',
          startDate: '2026-03-09T00:00:00.000Z',
          endDate: '2026-03-12T00:00:00.000Z',
          customArt: '/events/dtide-aequor.webp',
        },
      ],
      new Date('2026-03-10T00:00:00.000Z'),
    )

    expect(summary).toMatchObject({
      artSrc: '/events/dtide-aequor.webp',
      emblemSrc: '/realm-badge-caro.webp',
      name: 'caro ring',
    })
    expect(summary.note).toBeUndefined()
    expect(summary.countdown?.text).toBe('Ends in 2d 0h')
  })

  it('ignores ended D-Zone event copy and falls back to the latest season with old art', () => {
    const summary = getTimelineDZoneSummary(
      [
        {
          id: 'event-dtide',
          title: 'Regional D-Effect Zone',
          category: 'd-tide',
          description: 'Current Realm relic: Aequor Ring.',
          startDate: '2026-03-01T00:00:00.000Z',
          endDate: '2026-03-02T00:00:00.000Z',
          customArt: '/events/dtide-aequor.webp',
        },
      ],
      new Date('2026-03-21T00:00:00.000Z'),
    )

    expect(summary.artSrc).toBe('/events/dtide-aequor.webp')
    expect(summary.emblemSrc).toBe('/realm-badge-ultra.webp')
    expect(summary.name).toBe('ultra ring')
    expect(summary.note).toBe('Current D-Zone data pending')
    expect(summary.countdown?.text).toBe('Ended 1 day ago')
  })

  it('falls back to bundled D-Zone art when no timeline event carries art', () => {
    const summary = getTimelineDZoneSummary([], new Date('2026-03-21T00:00:00.000Z'))

    expect(summary.artSrc).toBe('/assets/dtide-aequor.webp')
    expect(summary.name).toBe('ultra ring')
    expect(summary.note).toBe('Current D-Zone data pending')
    expect(summary.countdown?.text).toBe('Ended 1 day ago')
  })

  it('does not select ended D-Zone event entries', () => {
    const events: EventEntry[] = [
      {
        id: 'event-dtide',
        title: 'Regional D-Effect Zone',
        category: 'd-tide',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-02T00:00:00.000Z',
      },
    ]

    expect(selectTimelineDZoneEvent(events, new Date('2026-03-03T00:00:00.000Z'))).toBeUndefined()
  })
})
