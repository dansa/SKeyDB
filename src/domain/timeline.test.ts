import {describe, expect, it} from 'vitest'

import {
  formatCountdown,
  getTimelineCountdown,
  getTimelineStatus,
  normalizeEventCategory,
  parseGameDate,
  sortEventsByRelevance,
  type EventEntry,
} from './timeline'

describe('timeline date and status helpers', () => {
  it('parses game dates as UTC+8 timestamps', () => {
    expect(parseGameDate('2026/03/09 09:00')).toBe('2026-03-09T01:00:00.000Z')
  })

  it('returns original value when date format is not game-format', () => {
    expect(parseGameDate('2026-03-09 09:00')).toBe('2026-03-09 09:00')
  })

  it('normalizes unknown categories to other', () => {
    expect(normalizeEventCategory('gameplay-event')).toBe('gameplay-event')
    expect(normalizeEventCategory('unknown-category')).toBe('other')
    expect(normalizeEventCategory(undefined)).toBeUndefined()
  })

  it('resolves upcoming, active and ended statuses', () => {
    const start = '2026-03-09T01:00:00.000Z'
    const end = '2026-03-23T01:00:00.000Z'

    expect(getTimelineStatus(start, end, new Date('2026-03-08T12:00:00.000Z'))).toBe('upcoming')
    expect(getTimelineStatus(start, end, new Date('2026-03-10T12:00:00.000Z'))).toBe('active')
    expect(getTimelineStatus(start, end, new Date('2026-03-24T00:00:00.000Z'))).toBe('ended')
  })

  it('formats ended countdown text', () => {
    const countdown = getTimelineCountdown(
      '2026-03-09T01:00:00.000Z',
      '2026-03-10T01:00:00.000Z',
      new Date('2026-03-12T01:00:00.000Z'),
    )
    expect(countdown).not.toBeNull()
    expect(countdown ? formatCountdown(countdown) : '').toBe('Ended 2d ago')
  })
})

describe('sortEventsByRelevance', () => {
  it('sorts by pinned first, then active/upcoming/ended relevance', () => {
    const now = new Date('2026-03-10T00:00:00.000Z')
    const events: EventEntry[] = [
      {
        id: 'ended',
        title: 'Ended',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-05T00:00:00.000Z',
      },
      {
        id: 'active',
        title: 'Active',
        startDate: '2026-03-09T00:00:00.000Z',
        endDate: '2026-03-12T00:00:00.000Z',
      },
      {
        id: 'upcoming',
        title: 'Upcoming',
        startDate: '2026-03-15T00:00:00.000Z',
        endDate: '2026-03-16T00:00:00.000Z',
      },
      {
        id: 'pinned-upcoming',
        title: 'Pinned Upcoming',
        startDate: '2026-03-14T00:00:00.000Z',
        endDate: '2026-03-15T00:00:00.000Z',
        pinned: true,
      },
    ]

    const sortedIds = sortEventsByRelevance(events, now).map((event) => event.id)
    expect(sortedIds).toEqual(['pinned-upcoming', 'active', 'upcoming', 'ended'])
  })
})
