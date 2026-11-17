import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router'
import {describe, expect, it, vi} from 'vitest'

import type {BannerEntry, EventEntry} from '@/domain/timeline'
import {timelineBanners} from '@/domain/timeline-data'

import {resolveTimelineFeaturedAsset} from '../timelineDetailResolution'
import {TimelineAgenda} from './TimelineAgenda'
import {getTimelineAgendaGroups} from './timelineNextModel'
import {resolveTimelineThumbnail} from './timelineNextThumbnails'

it.each(['feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov'])(
  'resolves the three separate Triune and Sylvan pools for %s',
  (month) => {
    for (const [family, kind] of [
      ['triune-verdant', 'awakener'],
      ['sylvan-omen', 'wheel'],
    ] as const) {
      const entry = timelineBanners.find(({id}) => id === `banner-${family}-${month}`)
      const group = entry?.rateUpGroups?.[0]
      expect(group?.kind).toBe(kind)
      expect(group?.options).toHaveLength(3)
      if (kind === 'wheel') expect(group?.sharedOffBanner).toHaveLength(20)
      else expect(group?.sharedOffBanner).toBeUndefined()
      expect(entry?.featured?.map(({name}) => name)).toEqual(
        group?.options.map(({rateUp}) => rateUp),
      )
      for (const option of group?.options ?? []) {
        const pool = option.offBanner ?? group?.sharedOffBanner ?? []
        expect(pool).toHaveLength(kind === 'wheel' ? 20 : 5)
        expect(pool).not.toContain(option.rateUp)
        for (const name of [option.rateUp, ...pool]) {
          expect(resolveTimelineFeaturedAsset({kind, name}).detailRef?.kind, name).toBe(kind)
        }
      }
    }
  },
)

it.each([
  'vortice',
  'arachne',
  'saya-no-uta-collab',
  'pontos',
  'lotan-cetarchon',
  'caraboo',
  'ogier-oathbound',
])('resolves both SSR pools for the historical %s pair', (id) => {
  const groups = timelineBanners.find((entry) => entry.id === `banner-${id}`)?.rateUpGroups ?? []
  expect(groups.map(({kind}) => kind)).toEqual(['awakener', 'wheel'])
  for (const {kind, options, sharedOffBanner} of groups) {
    expect(options).toHaveLength(1)
    for (const {rateUp, offBanner} of options) {
      const others = offBanner ?? sharedOffBanner ?? []
      expect(others).toHaveLength(kind === 'awakener' ? 5 : 20)
      expect(others).not.toContain(rateUp)
      for (const name of [rateUp, ...others]) {
        expect(resolveTimelineFeaturedAsset({kind, name}).detailRef?.kind, name).toBe(kind)
      }
    }
  }
})

const date = (day: number, hour = 12) => new Date(2026, 2, day, hour).toISOString()
const now = new Date(2026, 2, 10, 9)
const event = (id: string, start: number, end: number): EventEntry => ({
  id,
  title: id,
  startDate: date(start),
  endDate: date(end),
})
const banner = (id: string, start: number, end: number): BannerEntry => ({
  id,
  title: id,
  type: 'limited',
  startDate: date(start),
  endDate: date(end),
})

describe('timeline agenda grouping', () => {
  it('groups starts, multi-entry ends and the season by local calendar day', () => {
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'all',
      events: [
        event('upcoming', 11, 15),
        event('active-1', 9, 12),
        event('active-2', 9, 12),
        event('other-start', 12, 16),
      ],
      banners: [banner('active-banner', 9, 12)],
      season: {name: 'Ultra Ring', endDate: date(12, 15)},
    })
    expect(groups).toHaveLength(2)
    expect(groups[0].moments).toMatchObject([{title: 'upcoming', action: 'start', kind: 'event'}])
    expect(groups[1].moments.map((moment) => moment.kind)).toEqual([
      'event',
      'event',
      'event',
      'banner',
      'season',
    ])
    expect(groups[1].moments.filter((moment) => moment.action === 'end')).toHaveLength(4)
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={onSelect} />
      </MemoryRouter>,
    )
    expect(
      screen.getByText('2 events · 1 banner end · 1 event starts · Ultra Ring season ends'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /upcoming starts/}))
    expect(onSelect).toHaveBeenCalledWith('upcoming')
  })

  it('respects the filter, excludes past moments, and limits future groups to four', () => {
    const events = [
      event('ended', 1, 9),
      ...[11, 12, 13, 14, 15].map((day) => event(`event-${String(day)}`, day, day + 1)),
    ]
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'events',
      events,
      banners: [banner('hidden', 11, 12)],
    })
    expect(groups).toHaveLength(4)
    expect(groups.flatMap((group) => group.moments).map((moment) => moment.title)).toEqual([
      'event-11',
      'event-12',
      'event-13',
      'event-14',
    ])
    const banners = getTimelineAgendaGroups({
      now,
      filter: 'banners',
      events,
      banners: [banner('shown', 11, 12)],
    })
    expect(banners.flatMap((group) => group.moments).map((moment) => moment.title)).toEqual([
      'shown',
    ])
  })

  it('keeps a future season independent of the content filter and renders its link', () => {
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'banners',
      events: [],
      banners: [],
      season: {name: 'Ultra Ring', endDate: date(11)},
    })
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', {name: /Ultra Ring season ends/})).toHaveAttribute(
      'href',
      '/d-zone',
    )
    expect(
      getTimelineAgendaGroups({
        now,
        filter: 'all',
        events: [],
        banners: [],
        season: {name: 'Old', endDate: date(9)},
      }),
    ).toEqual([])
  })
})

describe('timeline thumbnails', () => {
  it('uses portrait and wheel minis, including signature wheels, and preserves custom art', () => {
    expect(resolveTimelineThumbnail({kind: 'awakener', name: 'Tulu'})).toMatchObject({
      isSmall: true,
      url: expect.stringContaining('/awk-portraits/'),
    })
    expect(resolveTimelineThumbnail({kind: 'wheel', name: 'Hymn of the Sovereign'})).toMatchObject({
      isSmall: true,
      url: expect.stringContaining('/wheels/Mini/'),
    })
    expect(resolveTimelineThumbnail({kind: 'wheel-auto', name: 'Tulu'})).toMatchObject({
      isSmall: true,
      url: expect.stringContaining('/wheels/Mini/'),
    })
    expect(
      resolveTimelineThumbnail({kind: 'wheel-auto', name: 'Tulu', customArt: '/custom.webp'}),
    ).toMatchObject({
      isSmall: false,
      url: '/custom.webp',
    })
    expect(resolveTimelineThumbnail({kind: 'wheel', name: 'Missing wheel'})).toMatchObject({
      isSmall: false,
      url: undefined,
    })
  })
})
