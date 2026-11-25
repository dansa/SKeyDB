import {fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router'
import {describe, expect, it, vi} from 'vitest'

import type {BannerEntry, EventEntry} from '@/domain/timeline'
import {timelineBanners} from '@/domain/timeline-data'

import {resolveTimelineFeaturedAsset} from '../timelineDetailResolution'
import {TimelineAgenda} from './TimelineAgenda'
import {
  getBannerArtworkSlots,
  getDesktopAgendaGroups,
  getDisplayBanner,
  getTimelineAgendaGroups,
} from './timelinePageModel'
import {resolveTimelineThumbnail} from './timelineThumbnails'

it.each(['260223', '260323', '260406', '260615', '260713', '260810', '260907', '261005', '261102'])(
  'resolves the three separate Triune and Sylvan pools for %s',
  (runDate) => {
    for (const [family, kind] of [
      ['triune-verdant', 'awakener'],
      ['sylvan-omen', 'wheel'],
    ] as const) {
      const entry = timelineBanners.find(({id}) => id === `${family}-${runDate}`)
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
  'vortice-duo-260309',
  'arachne-duo-260420',
  'saya-collab-260530',
  'pontos-duo-260629',
  'lotan-duo-260727',
  'caraboo-duo-260824',
  'ogier-duo-260921',
  'godking-duo-261130',
])('resolves both SSR pools for the featured %s pair', (id) => {
  const groups = timelineBanners.find((entry) => entry.id === id)?.rateUpGroups ?? []
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

it('uses the current rotation while active and the first day after it ends', () => {
  const daily: BannerEntry = {
    ...banner('daily-test', 9, 12),
    dailySchedule: [
      {day: 1, featured: [{kind: 'awakener', name: 'Tulu'}]},
      {day: 2, featured: [{kind: 'awakener', name: 'Lily'}]},
    ],
  }
  expect(getDisplayBanner(daily, new Date(date(10))).customTags).toEqual(['Day 2', 'Lily'])
  const ended = getDisplayBanner(daily, new Date(date(13)))
  expect(ended.customTags).toBeUndefined()
  expect(ended.featured?.[0].name).toBe('Tulu')
})

it('resolves every announced anniversary pair without publishing unannounced rules or pools', () => {
  const galaxy = timelineBanners.find(({id}) => id === 'galaxy-shines-261130')
  expect(galaxy?.rulesProfile).toBeUndefined()
  expect(galaxy?.poolSlots).toBeUndefined()
  expect(galaxy?.dailySchedule).toHaveLength(35)
  for (const {featured, offBanner} of galaxy?.dailySchedule ?? []) {
    expect(offBanner).toBeUndefined()
    expect(featured.map(({kind}) => kind)).toEqual(['awakener', 'wheel'])
    for (const unit of featured) {
      const asset = resolveTimelineFeaturedAsset(unit)
      expect(asset.detailRef?.kind, unit.name).toBe(unit.kind)
      expect(asset.url, unit.name).toBeTruthy()
    }
  }
  expect(galaxy).toBeDefined()
  if (!galaxy) return
  const finalDay = getDisplayBanner(galaxy, new Date('2027-01-03T01:00:00.000Z'))
  expect(finalDay.customTags).toEqual(['Day 35', 'Tulu'])
  expect(finalDay.featured?.map(({name}) => name)).toEqual(['Tulu', 'Hymn of the Sovereign'])
})

it.each(['faded', 'astral'])(
  'uses four realm portraits and resolves all paid pool links (%s)',
  (arc) => {
    const entry = timelineBanners.find(({id}) => id === `stars-bloom-${arc}-261130`)
    expect(entry).toBeDefined()
    if (!entry) return
    expect(getBannerArtworkSlots(entry)).toEqual(
      entry.realmPools?.map(({awakeners}) => ({pool: awakeners})),
    )
    for (const {awakeners, wheels} of entry.realmPools ?? []) {
      for (const unit of [...awakeners, ...wheels]) {
        const asset = resolveTimelineFeaturedAsset(unit)
        expect(asset.detailRef?.kind, unit.name).toBe(unit.kind)
        expect(asset.url, unit.name).toBeTruthy()
      }
    }
  },
)

describe('timeline agenda grouping', () => {
  it('shows launch notes in both agendas, even when the date has no event or banner', () => {
    const launchNote = 'First top-up bonus resets.'
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'all',
      events: [event('Campaign event', 9, 14)],
      banners: [],
      patches: [
        {
          id: 'anniv',
          title: 'Anniversary',
          kind: 'anniversary',
          date: date(12),
          endDate: date(14),
          launchNote,
        },
      ],
    })
    expect(groups[0].moments).toEqual([])
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={vi.fn()} />
      </MemoryRouter>,
    )
    const mobile = within(screen.getByRole('list', {name: 'Upcoming dates'}))
    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    expect(mobile.getByText(launchNote)).toBeInTheDocument()
    expect(desktop.queryByText(launchNote)).not.toBeInTheDocument()
    const launch = desktop.getByRole('button', {name: /Anniversary$/})
    fireEvent.click(launch)
    expect(desktop.getByText(launchNote)).toBeInTheDocument()
    fireEvent.click(desktop.getByRole('button', {name: /Anniversary ends/}))
    expect(desktop.queryByText(launchNote)).not.toBeInTheDocument()
    expect(desktop.getByRole('button', {name: 'Campaign event ends'})).toBeInTheDocument()
  })

  it('keeps the next named patch visible within the four desktop dates', () => {
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'all',
      events: [11, 12, 13, 14].map((day) => event(`Event ${String(day)}`, day, 20)),
      banners: [],
      patches: [{id: 'anniversary', title: 'Anniversary', kind: 'anniversary', date: date(15)}],
    })
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={vi.fn()} />
      </MemoryRouter>,
    )

    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    expect(desktop.getByText('Anniversary')).toBeInTheDocument()
    expect(desktop.getByRole('button', {name: /Event 13 starts/})).toBeInTheDocument()
    expect(desktop.queryByRole('button', {name: /Event 14 starts/})).not.toBeInTheDocument()
  })

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
      resetDate: date(12, 15),
    })
    expect(groups).toHaveLength(4)
    expect(groups[0].moments).toMatchObject([{title: 'upcoming', action: 'start', kind: 'event'}])
    expect(groups[1].moments.map((moment) => moment.kind)).toEqual([
      'event',
      'event',
      'event',
      'banner',
      'season',
    ])
    expect(groups[1].moments.filter((moment) => moment.action === 'end')).toHaveLength(3)
    expect(groups[2].moments).toMatchObject([{id: 'upcoming', action: 'end', at: date(15)}])
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={onSelect} />
      </MemoryRouter>,
    )
    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    expect(
      desktop.getByText('2 events · 1 banner end · 1 event starts · D-Zone reset'),
    ).toBeInTheDocument()
    fireEvent.click(desktop.getByRole('button', {name: /upcoming starts/}))
    expect(onSelect).toHaveBeenCalledWith('upcoming')
    const grouped = desktop.getByRole('button', {name: /2 events.*D-Zone reset/})
    expect(grouped).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(grouped)
    expect(grouped).toHaveAttribute('aria-expanded', 'true')
    const starting = desktop.getByRole('list', {name: 'Starting events'})
    const endingEvents = desktop.getByRole('list', {name: 'Ending events'})
    const endingBanners = desktop.getByRole('list', {name: 'Ending banners'})
    expect(within(starting).getByRole('button', {name: 'other-start starts'})).toHaveTextContent(
      /^other-start$/,
    )
    expect(within(endingEvents).getByRole('button', {name: 'active-2 ends'})).toHaveTextContent(
      /^active-2$/,
    )
    expect(
      within(endingBanners).getByRole('button', {name: 'active-banner ends'}),
    ).toHaveTextContent(/^active-banner$/)
    const reset = desktop.getByRole('link', {name: /D-Zone reset/})
    expect(reset.querySelector('time')).toHaveAttribute('datetime', date(12, 15))
    fireEvent.click(desktop.getByRole('button', {name: /active-2 ends/}))
    expect(onSelect).toHaveBeenCalledWith('active-2')
    fireEvent.click(grouped)
    expect(desktop.queryByRole('link', {name: /D-Zone reset/})).not.toBeInTheDocument()
  })

  it('keeps both campaign boundaries without displacing nearer dates for its end', () => {
    const launch = date(10)
    const end = date(18)
    const input = {
      filter: 'all' as const,
      events: [11, 12, 13].map((day) => event(`Event ${String(day)}`, day, 17)),
      banners: [],
      resetDate: date(14),
      patches: [
        {
          id: 'anniv',
          title: 'Anniversary',
          kind: 'anniversary' as const,
          date: launch,
          endDate: end,
        },
      ],
    }
    const upcoming = getTimelineAgendaGroups({...input, now})
    expect(upcoming[0].patch).toMatchObject({action: 'start', date: launch})
    expect(upcoming.at(-1)?.patch).toMatchObject({action: 'end', date: end})
    const active = getTimelineAgendaGroups({...input, now: new Date(launch)})
    expect(active.at(-1)?.patch).toMatchObject({action: 'end', date: end})
    expect(getDesktopAgendaGroups(active).at(-1)?.moments[0].kind).toBe('season')

    expect(getTimelineAgendaGroups({...input, now: new Date(end)})).toEqual([])
  })

  it('dismisses a grouped desktop date when selecting an adjacent standalone end', () => {
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'all',
      events: [event('Campaign event', 9, 12), event('Standalone event', 9, 13)],
      banners: [],
      patches: [
        {id: 'campaign', title: 'Campaign', kind: 'anniversary', date: date(9), endDate: date(12)},
      ],
    })
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={onSelect} />
      </MemoryRouter>,
    )
    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    const grouped = desktop.getByRole('button', {name: /Campaign ends/})
    fireEvent.click(grouped)
    expect(desktop.getByRole('button', {name: 'Campaign event ends'})).toBeInTheDocument()
    fireEvent.click(desktop.getByRole('button', {name: /Standalone event ends/}))
    expect(onSelect).toHaveBeenCalledWith('Standalone event')
    expect(grouped).toHaveAttribute('aria-expanded', 'false')
    expect(desktop.queryByRole('button', {name: 'Campaign event ends'})).not.toBeInTheDocument()
  })

  it('caps both agendas at 60 calendar days without losing the active campaign highlight', () => {
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'all',
      events: [event('Within range', 9, 70), event('Out of range', 9, 71)],
      banners: [],
      patches: [
        {id: 'long', title: 'Long campaign', kind: 'anniversary', date: date(9), endDate: date(80)},
      ],
    })
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={vi.fn()} />
      </MemoryRouter>,
    )
    const mobile = within(screen.getByRole('list', {name: 'Upcoming dates', hidden: true}))
    expect(mobile.getByText('Within range', {exact: true})).toBeInTheDocument()
    expect(mobile.queryByText('Out of range', {exact: true})).not.toBeInTheDocument()
    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    expect(desktop.getByText('Within range ends', {exact: true})).toBeInTheDocument()
    expect(screen.queryByText('Out of range ends', {exact: true})).not.toBeInTheDocument()
    expect(screen.queryByText('Long campaign ends', {exact: true})).not.toBeInTheDocument()
    expect(screen.getByText('Now').closest('.timeline-agenda-node')).toHaveAttribute(
      'data-campaign',
      'true',
    )
  })

  it.each([
    [
      9,
      [
        ['Now', 'false'],
        ['Anniversary', 'true'],
        ['D-Zone reset', 'true'],
        ['Anniversary ends', 'false'],
        ['After ends', 'false'],
      ],
    ],
    [
      12,
      [
        ['Now', 'true'],
        ['D-Zone reset', 'true'],
        ['Anniversary ends', 'false'],
        ['After ends', 'false'],
      ],
    ],
    [
      19,
      [
        ['Now', 'false'],
        ['After ends', 'false'],
      ],
    ],
  ])('colors just the visible campaign span on day %i', (day, expected) => {
    const now = new Date(date(day))
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'all',
      events: [event('After', 8, 21)],
      banners: [],
      resetDate: date(14),
      patches: [
        {
          id: 'anniv',
          title: 'Anniversary',
          kind: 'anniversary',
          date: date(10),
          endDate: date(18),
        },
      ],
    })
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={vi.fn()} />
      </MemoryRouter>,
    )
    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    for (const [label, highlighted] of expected) {
      expect(
        desktop.getByText(label, {exact: true}).closest('.timeline-agenda-node'),
      ).toHaveAttribute('data-campaign', highlighted)
    }
  })

  it('respects the filter and keeps every future day available to the mobile agenda', () => {
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
    expect(groups).toHaveLength(6)
    const moments = groups.flatMap((group) => group.moments)
    const titles = ['event-11', 'event-12', 'event-13', 'event-14', 'event-15']
    expect(moments.filter(({action}) => action === 'start').map(({title}) => title)).toEqual(titles)
    expect(moments.filter(({action}) => action === 'end').map(({title}) => title)).toEqual(titles)
    const banners = getTimelineAgendaGroups({
      now,
      filter: 'banners',
      events,
      banners: [banner('shown', 11, 12)],
    })
    expect(banners.flatMap((group) => group.moments)).toMatchObject([
      {id: 'shown', action: 'start', at: date(11)},
      {id: 'shown', action: 'end', at: date(12)},
    ])
  })

  it('keeps claim deadlines in event details only', () => {
    const ended = {
      ...event('ended', 1, 8),
      keyDates: [{label: 'Claims until', date: date(15)}],
    }
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'events',
      events: [ended, event('active', 9, 12)],
      banners: [],
    })
    expect(groups.flatMap((group) => group.moments)).toMatchObject([
      {id: 'active', action: 'end', at: date(12)},
    ])
  })

  it('headlines a major update on its day, even with nothing else scheduled', () => {
    const patch = {
      id: 'anniv',
      title: 'Anniversary',
      kind: 'anniversary' as const,
      date: date(12, 9),
    }
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'all',
      events: [event('active-1', 9, 12), event('upcoming', 11, 15)],
      banners: [],
      patches: [
        patch,
        {...patch, id: 'past', date: date(9)},
        {...patch, id: 'quiet', title: 'Later update', date: date(14)},
      ],
    })
    expect(groups.map((group) => group.patch?.id)).toEqual([undefined, 'anniv', 'quiet', undefined])
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={vi.fn()} />
      </MemoryRouter>,
    )
    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    const major = desktop.getByRole('button', {name: /Anniversary.*active-1 ends/})
    expect(major.closest('[data-major]')).toHaveTextContent('active-1 ends')
    expect(desktop.getByText('Later update').closest('button')).toBeNull()
  })

  it('keeps a future season independent of the content filter and renders its link', () => {
    const groups = getTimelineAgendaGroups({
      now,
      filter: 'banners',
      events: [],
      banners: [],
      resetDate: date(11),
    })
    render(
      <MemoryRouter>
        <TimelineAgenda groups={groups} now={now} onSelect={vi.fn()} />
      </MemoryRouter>,
    )
    const desktop = within(screen.getByRole('region', {name: 'Upcoming timeline moments'}))
    const reset = desktop.getByRole('link', {name: /D-Zone reset/})
    expect(reset).toHaveAttribute('href', '/d-zone')
    expect(reset.querySelector('time')).toHaveAttribute('datetime', date(11))
    expect(
      getTimelineAgendaGroups({
        now,
        filter: 'all',
        events: [],
        banners: [],
        resetDate: date(9),
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
