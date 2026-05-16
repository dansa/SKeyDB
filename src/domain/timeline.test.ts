import {describe, expect, it} from 'vitest'

import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_METADATA,
  EVENT_CATEGORY_PRIORITY,
  formatCountdown,
  getTimelineCountdown,
  getTimelineCountdownDisplay,
  getTimelineStatus,
  normalizeEventCategory,
  parseGameDate,
  shouldDisplayEndedEventInArchive,
  sortBannersByRelevance,
  sortEventsByRelevance,
  type BannerEntry,
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

  it('keeps event category priority and archive visibility derived from metadata', () => {
    expect(Object.keys(EVENT_CATEGORY_METADATA)).toEqual([...EVENT_CATEGORIES])
    expect(EVENT_CATEGORY_PRIORITY).toEqual(
      Object.fromEntries(
        EVENT_CATEGORIES.map((category) => [category, EVENT_CATEGORY_METADATA[category].priority]),
      ),
    )
    expect(
      shouldDisplayEndedEventInArchive({
        id: 'ended-login',
        title: 'Ended Login',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-02T00:00:00.000Z',
        category: 'login',
      }),
    ).toBe(false)
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

  it('returns relative countdown text with a date hover label for nearby timeline targets', () => {
    expect(
      getTimelineCountdownDisplay(
        '2026-03-09T01:00:00.000Z',
        '2026-03-10T01:00:00.000Z',
        new Date('2026-03-12T01:00:00.000Z'),
      ),
    ).toEqual({text: 'Ended 2d ago', title: 'Mar 9, 2026 - Mar 10, 2026'})
  })

  it('switches long-range timeline text to a date instead of a day-hour countdown', () => {
    expect(
      getTimelineCountdownDisplay(
        '2026-03-30T01:00:00.000Z',
        '2026-04-10T01:00:00.000Z',
        new Date('2026-03-10T01:00:00.000Z'),
      ),
    ).toEqual({text: 'Starts Mar 30', title: 'Mar 30, 2026 - Apr 10, 2026'})
  })

  it('keeps the year in long-range visible dates outside the current year', () => {
    expect(
      getTimelineCountdownDisplay(
        '2027-01-15T01:00:00.000Z',
        '2027-01-30T01:00:00.000Z',
        new Date('2026-12-20T01:00:00.000Z'),
      ),
    ).toEqual({text: 'Starts Jan 15, 2027', title: 'Jan 15, 2027 - Jan 30, 2027'})
  })
})

describe('sortBannersByRelevance', () => {
  it('uses pinned only for active banners and keeps ended banners date-sorted', () => {
    const now = new Date('2026-03-10T00:00:00.000Z')
    const banners: BannerEntry[] = [
      {
        id: 'older-pinned-ended',
        title: 'Older Pinned Ended',
        type: 'rerun',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-04T00:00:00.000Z',
        pinned: true,
      },
      {
        id: 'active',
        title: 'Active',
        type: 'limited',
        startDate: '2026-03-09T00:00:00.000Z',
        endDate: '2026-03-12T00:00:00.000Z',
      },
      {
        id: 'pinned-active',
        title: 'Pinned Active',
        type: 'limited',
        startDate: '2026-03-09T00:00:00.000Z',
        endDate: '2026-03-13T00:00:00.000Z',
        pinned: true,
      },
      {
        id: 'recent-ended',
        title: 'Recent Ended',
        type: 'rerun',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-08T00:00:00.000Z',
      },
    ]

    const sortedIds = sortBannersByRelevance(banners, now).map((banner) => banner.id)

    expect(sortedIds).toEqual(['pinned-active', 'active', 'recent-ended', 'older-pinned-ended'])
  })
})

describe('sortEventsByRelevance', () => {
  it('sorts by active pinned first, then active/upcoming/ended relevance', () => {
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
        startDate: '2026-03-16T00:00:00.000Z',
        endDate: '2026-03-17T00:00:00.000Z',
        pinned: true,
      },
      {
        id: 'pinned-active',
        title: 'Pinned Active',
        startDate: '2026-03-09T00:00:00.000Z',
        endDate: '2026-03-13T00:00:00.000Z',
        pinned: true,
      },
    ]

    const sortedIds = sortEventsByRelevance(events, now).map((event) => event.id)
    expect(sortedIds).toEqual(['pinned-active', 'active', 'upcoming', 'pinned-upcoming', 'ended'])
  })

  it('sorts ended events by most recent end date before category priority or pinned state', () => {
    const now = new Date('2026-03-10T00:00:00.000Z')
    const events: EventEntry[] = [
      {
        id: 'older-story',
        title: 'Older Story',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-04T00:00:00.000Z',
        category: 'story',
        pinned: true,
      },
      {
        id: 'recent-maintenance',
        title: 'Recent Maintenance',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-08T00:00:00.000Z',
        category: 'maintenance',
      },
    ]

    const sortedIds = sortEventsByRelevance(events, now).map((event) => event.id)
    expect(sortedIds).toEqual(['recent-maintenance', 'older-story'])
  })

  it('sorts upcoming events by start date before category priority', () => {
    const now = new Date('2026-05-16T00:00:00.000Z')
    const events: EventEntry[] = [
      {
        id: 'later-story',
        title: 'Later Story',
        startDate: '2026-06-15T01:00:00.000Z',
        endDate: '2026-07-13T01:00:00.000Z',
        category: 'gameplay-event',
      },
      {
        id: 'earlier-anniversary',
        title: 'Earlier Anniversary',
        startDate: '2026-05-30T01:00:00.000Z',
        endDate: '2026-06-29T01:00:00.000Z',
        category: 'anniversary',
      },
      {
        id: 'same-day-wheel',
        title: 'Same Day Wheel',
        startDate: '2026-05-30T01:00:00.000Z',
        endDate: '2026-06-29T01:00:00.000Z',
        category: 'wheel-event',
      },
    ]

    const sortedIds = sortEventsByRelevance(events, now).map((event) => event.id)
    expect(sortedIds).toEqual(['same-day-wheel', 'earlier-anniversary', 'later-story'])
  })
})
