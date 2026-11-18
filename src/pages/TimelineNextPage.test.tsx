import {fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter, useLocation, useNavigate} from 'react-router'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {DatabaseDetailOverlaySession} from '@/stores/dbDetailStore'

import {getPoolGroups} from './timeline/next/timelineNextModel'
import {TimelineNextPage} from './TimelineNextPage'

vi.mock('@/domain/timeline-data', () => ({
  timelinePatches: [],
  timelineEvents: [
    {
      id: 'event-first',
      title: 'First Event',
      category: 'story',
      customArt: '/event-test.webp',
      description: 'A full sentence with enough words.\nAnother line.',
      pricing: '60 Silver Prime',
      keyDates: [
        {label: 'Claims until', date: '2026-11-30T11:00:00Z'},
        {label: 'Shop closes', date: '2027-01-11T11:00:00Z'},
      ],
      startDate: '2026-03-09T00:00:00Z',
      endDate: '2026-03-12T00:00:00Z',
      rewards: [{title: 'Daily login', items: [{name: 'Core', amount: '×3'}]}],
      related: ['banner-pool', 'banner-wheel'],
    },
    {
      id: 'event-missions-only',
      title: 'Missions Only',
      startDate: '2026-03-11T00:00:00Z',
      endDate: '2026-03-12T00:00:00Z',
      missions: [{label: 'Complete a trial', standard: [{name: 'Core', amount: '×1'}]}],
    },
    {
      id: 'event-february',
      title: 'February Event',
      startDate: '2026-02-01T12:00:00Z',
      endDate: '2026-02-25T12:00:00Z',
    },
    {
      id: 'event-january',
      title: 'January Event',
      startDate: '2026-01-01T12:00:00Z',
      endDate: '2026-01-25T12:00:00Z',
    },
  ],
  timelineBanners: [
    {
      id: 'banner-pool',
      title: 'Pool Banner',
      type: 'combo',
      pricing: '1980 Silver Prime',
      startDate: '2026-03-09T00:00:00Z',
      endDate: '2026-03-12T00:00:00Z',
      poolSlots: [
        {
          pool: [
            {name: 'Tulu', kind: 'awakener'},
            {name: 'Lily', kind: 'awakener'},
          ],
        },
      ],
    },
    {
      id: 'banner-daily',
      title: 'Daily Banner',
      type: 'daily',
      startDate: '2026-03-09T00:00:00Z',
      endDate: '2026-03-12T00:00:00Z',
      dailySchedule: [
        {day: 1, featured: [{name: 'Tulu', kind: 'awakener'}]},
        {
          day: 2,
          featured: [
            {name: 'Lily', kind: 'awakener'},
            {name: 'Ever Sunward', kind: 'wheel'},
          ],
        },
        {day: 3, featured: [{name: 'Miryam', kind: 'awakener'}]},
      ],
    },
    {
      id: 'banner-wheel',
      title: 'Wheel Banner',
      type: 'wheel',
      startDate: '2026-03-09T00:00:00Z',
      endDate: '2026-03-12T00:00:00Z',
      featured: [{name: 'Ever Sunward', kind: 'wheel'}],
    },
    {
      id: 'banner-february',
      title: 'February Banner',
      type: 'limited',
      startDate: '2026-02-01T12:00:00Z',
      endDate: '2026-02-25T12:00:00Z',
    },
    {
      id: 'banner-january',
      title: 'January Banner',
      type: 'limited',
      startDate: '2026-01-01T12:00:00Z',
      endDate: '2026-01-25T12:00:00Z',
    },
  ],
}))
vi.mock('./timeline/timelineDZoneSummary', () => ({
  getTimelineDZoneSummary: () => ({
    name: 'Test season',
    realm: 'CARO',
    startDate: '2026-02-28T00:00:00Z',
    endDate: '2026-03-14T00:00:00Z',
  }),
}))
vi.mock('./timeline/BannerArtwork', () => ({
  BannerArtwork: ({
    featured,
    reserveDrawerInset,
  }: {
    featured?: {name: string}[]
    reserveDrawerInset?: boolean
  }) => (
    <div
      data-featured={featured?.map(({name}) => name).join(',')}
      data-reserve-inset={String(reserveDrawerInset)}
      data-testid='banner-artwork'
    />
  ),
}))
vi.mock('@/features/database/detail/DeferredDatabaseDetailOverlayOutlet', () => ({
  DeferredDatabaseDetailOverlayOutlet: ({session}: {session: DatabaseDetailOverlaySession}) => (
    <div aria-label='Roster details' role='dialog'>
      <span>{session.top()?.kind}</span>
      <button onClick={session.close} type='button'>
        Close roster
      </button>
    </div>
  ),
}))

function Location() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <>
      <span data-testid='location'>{location.search}</span>
      <button
        type='button'
        onClick={() => {
          void navigate(-1)
        }}
      >
        History back
      </button>
      <button
        type='button'
        onClick={() => {
          void navigate(1)
        }}
      >
        History forward
      </button>
    </>
  )
}

function renderPage(path = '/timeline-next') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TimelineNextPage />
      <Location />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('TimelineNextPage', () => {
  it('formats key dates like the date range, including a different year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?item=event-first')
    const stage = within(screen.getByLabelText('Selected details'))
    expect(stage.getByText('Nov 30')).toHaveAttribute('datetime', '2026-11-30T11:00:00Z')
    expect(stage.getByText('Jan 11, 2027')).toHaveAttribute('datetime', '2027-01-11T11:00:00Z')
  })
  it('inserts end-month headings in both archives while preserving list semantics', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage()
    fireEvent.click(screen.getByRole('button', {name: /Ended events/}))
    fireEvent.click(screen.getByRole('button', {name: /Ended banners/}))
    const february = new Date('2026-02-25T12:00:00Z').toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    })
    const january = new Date('2026-01-25T12:00:00Z').toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    })
    const eventArchive = within(screen.getByRole('region', {name: 'Ended events'}))
    const bannerArchive = within(screen.getByRole('region', {name: 'Ended banners'}))
    expect(eventArchive.getByRole('heading', {name: february}).closest('li')).toBeInTheDocument()
    expect(eventArchive.getByRole('heading', {name: january})).toBeInTheDocument()
    expect(bannerArchive.getByRole('heading', {name: february})).toBeInTheDocument()
    expect(bannerArchive.getByRole('heading', {name: january})).toBeInTheDocument()
  })

  it('shows missions even if the event has no reward summary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?item=event-missions-only')
    const stage = within(screen.getByLabelText('Selected details'))
    expect(stage.getByRole('heading', {name: 'By mission (1)'})).toBeInTheDocument()
    expect(stage.getByText('Complete a trial')).toBeVisible()
    expect(stage.getByText('Complete a trial').closest('details')).toBeNull()
    expect(stage.queryByRole('columnheader')).not.toBeInTheDocument()
  })

  it('does not add a history step when a filter clears the selection', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage()
    const row = screen
      .getAllByRole('button', {name: /First Event/})
      .find((button) => button.classList.contains('timeline-next-row'))
    if (!row) throw new Error('Event row not found')
    fireEvent.click(row)
    fireEvent.click(
      within(screen.getByRole('group', {name: 'Show'})).getByRole('button', {name: 'Banners'}),
    )
    fireEvent.click(screen.getByRole('button', {name: 'Show details for Pool Banner'}))
    expect(screen.queryByRole('button', {name: 'Close'})).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'History back'}))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?view=banners$/)
    fireEvent.click(screen.getByRole('button', {name: 'History back'}))
    expect(screen.getByTestId('location')).toBeEmptyDOMElement()
    fireEvent.click(screen.getByRole('button', {name: 'History forward'}))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?view=banners$/)
    fireEvent.click(screen.getByRole('button', {name: 'History forward'}))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?view=banners&item=banner-pool$/)
  })

  it('closes the roster before the timeline and restores it on Forward', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    renderPage('/timeline-next?view=banners')
    fireEvent.click(screen.getByRole('button', {name: 'Show details for Pool Banner'}))
    const sheet = screen.getByRole('dialog', {name: 'Pool Banner'})
    fireEvent.click(within(sheet).getByRole('button', {name: 'Tulu'}))
    expect(screen.getByRole('dialog', {name: 'Roster details'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'History back'}))
    expect(screen.queryByRole('dialog', {name: 'Roster details'})).not.toBeInTheDocument()
    expect(sheet).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'History forward'}))
    fireEvent.click(screen.getByRole('button', {name: 'Close roster'}))
    expect(screen.queryByRole('dialog', {name: 'Roster details'})).not.toBeInTheDocument()
    expect(sheet).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'History back'}))
    expect(sheet).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?view=banners$/)
  })

  it('exposes the masthead filters, price control and season link', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage()
    expect(screen.getByRole('heading', {name: 'Events & Banners', level: 1})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /^D-Zone, Test season/})).toHaveAttribute(
      'href',
      '/d-zone',
    )
    const show = within(screen.getByRole('group', {name: 'Show'}))
    expect(show.getByRole('button', {name: 'All'})).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(show.getByRole('button', {name: 'Banners'}))
    expect(screen.getByTestId('location')).toHaveTextContent('?view=banners')
    expect(show.getByRole('button', {name: 'Banners'})).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(screen.getByLabelText('Selected details')).queryByRole('heading', {
        name: 'First Event',
      }),
    ).not.toBeInTheDocument()
    fireEvent.click(show.getByRole('button', {name: 'Events'}))
    fireEvent.click(screen.getByRole('button', {name: 'Estimated USD'}))
    expect(screen.getByRole('button', {name: 'Estimated USD'})).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(screen.getByLabelText('Selected details')).getAllByText('~$1')).toHaveLength(1)
  })

  it('deduplicates labeled pool members across slots and includes linked wheels', () => {
    const groups = getPoolGroups([
      {label: 'First', linked: true, pool: [{kind: 'awakener', name: 'Tulu'}]},
      {
        label: 'Second',
        pool: [
          {kind: 'awakener', name: 'Tulu'},
          {kind: 'awakener', name: 'Lily'},
        ],
      },
    ])
    expect(groups.map((group) => [group.label, group.units.map((unit) => unit.kind)])).toEqual([
      ['First', ['awakener', 'wheel-auto']],
      ['Second', ['awakener']],
    ])
  })

  it('defaults to the first active event and displays its rewards', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage()
    const stage = within(screen.getByLabelText('Selected details'))
    expect(stage.getByRole('heading', {name: 'First Event'})).toBeInTheDocument()
    expect(stage.getByText('Daily login')).toBeInTheDocument()
    expect(stage.getByText('×3')).toBeInTheDocument()
    expect(stage.getByText('Claims until')).toBeInTheDocument()
    expect(stage.getAllByText('60 Silver Prime')).toHaveLength(1)
    const description = stage.getByText(/A full sentence/)
    expect(description.parentElement).toHaveClass('timeline-next-description')
    expect(stage.getByText('Another line.').tagName).toBe('P')
    const art = screen.getByLabelText('Selected details').querySelector('img')
    expect(art).toHaveStyle({objectPosition: '50% 25%'})
    expect(art?.parentElement).toHaveClass('aspect-[5/2]')
    const poolRelated = stage.getByRole('button', {name: /Pool Banner/})
    expect(within(poolRelated).queryByTestId('banner-artwork')).not.toBeInTheDocument()
    expect(poolRelated.querySelector('img')).toBeNull()
    const wheelRelated = stage.getByRole('button', {name: /Wheel Banner/})
    expect(wheelRelated.querySelector('img')).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('')
  })

  it('selects a banner and lists its pool in the stage', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?view=banners')
    const tile = screen
      .getByRole('button', {name: 'Show details for Pool Banner'})
      .closest('article')
    if (!tile) throw new Error('Banner tile not found')
    const art = within(tile).getByTestId('banner-artwork')
    expect(art).toHaveAttribute('data-reserve-inset', 'false')
    expect(art.parentElement).toHaveAttribute('inert')
    expect(art.parentElement).toHaveClass('pointer-events-none', 'isolate')
    expect(art.parentElement).not.toContainElement(
      within(tile).getByRole('heading', {name: 'Pool Banner'}),
    )
    fireEvent.click(screen.getByRole('button', {name: 'Show details for Pool Banner'}))
    expect(
      within(screen.getByLabelText('Selected details')).getAllByText('1,980 Silver Prime'),
    ).toHaveLength(1)
    expect(screen.getByTestId('location')).toHaveTextContent('view=banners&item=banner-pool')
    const stage = within(screen.getByLabelText('Selected details'))
    expect(stage.getByTestId('banner-artwork')).toHaveAttribute('data-reserve-inset', 'false')
    expect(stage.getByRole('heading', {name: 'Pool'})).toBeInTheDocument()
    expect(
      screen.getByLabelText('Selected details').querySelector('.aspect-video'),
    ).toBeInTheDocument()
    expect(stage.getByText('Tulu')).toBeInTheDocument()
    expect(stage.getByText('Lily')).toBeInTheDocument()
  })

  it('opens on the current rotation and lets readers browse another day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?item=banner-daily')
    const stage = within(screen.getByLabelText('Selected details'))
    expect(stage.getByRole('heading', {name: 'Schedule'})).toBeInTheDocument()
    const day = stage.getByRole('combobox', {name: 'Rotation day'})
    expect(day).toHaveValue('2')
    expect(stage.getByRole('option', {name: /Day 2.*Today/})).toHaveProperty('selected', true)
    const wheel = stage.getByRole('button', {name: 'Ever Sunward'}).querySelector('img')
    expect(wheel).toHaveAttribute('src', expect.stringContaining('/wheels/Mini/'))
    expect(stage.getByRole('button', {name: 'Lily'}).querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/awk-portraits/'),
    )
    const hero = stage.getByTestId('banner-artwork')
    expect(hero).toHaveAttribute('data-featured', 'Lily,Ever Sunward')
    fireEvent.click(stage.getByRole('button', {name: 'Previous day'}))
    expect(day).toHaveValue('1')
    expect(stage.queryByRole('button', {name: 'Ever Sunward'})).not.toBeInTheDocument()
    expect(stage.getByTestId('banner-artwork')).toHaveAttribute('data-featured', 'Tulu')
  })

  it('explains an unknown entry link instead of opening a different entry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?item=does-not-exist')
    const stage = within(screen.getByLabelText('Selected details'))
    expect(stage.getByRole('heading', {name: 'Entry not found'})).toBeInTheDocument()
    expect(stage.getByText(/does-not-exist/)).toBeInTheDocument()
    expect(stage.queryByRole('heading', {name: 'First Event'})).not.toBeInTheDocument()
    expect(document.querySelector('[aria-current="true"]')).toBeNull()
    fireEvent.click(stage.getByRole('button', {name: 'Clear link'}))
    expect(screen.getByTestId('location')).toBeEmptyDOMElement()
    expect(
      within(screen.getByLabelText('Selected details')).getByRole('heading', {name: 'First Event'}),
    ).toBeInTheDocument()
  })

  it('keeps the list in step with a related banner and focuses its details', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?view=events&item=event-first')
    fireEvent.click(
      within(screen.getByLabelText('Selected details')).getByRole('button', {name: /Pool Banner/}),
    )
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?item=banner-pool$/)
    expect(screen.getByRole('button', {name: 'Show details for Pool Banner'})).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(
      within(screen.getByLabelText('Selected details')).getByRole('heading', {
        name: 'Pool Banner',
        level: 2,
      }),
    ).toHaveFocus()
  })

  it('shows every entry when a deep link points outside the current view', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?view=events&item=banner-pool')
    const show = within(screen.getByRole('group', {name: 'Show'}))
    expect(show.getByRole('button', {name: 'All'})).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', {name: 'Show details for Pool Banner'})).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('offers a keyboard jump from the selected row to its details', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?item=event-first')
    const jump = screen.getAllByRole('button', {name: 'Jump to details'})
    expect(jump).toHaveLength(1)
    fireEvent.click(jump[0])
    expect(
      within(screen.getByLabelText('Selected details')).getByRole('heading', {
        name: 'First Event',
        level: 2,
      }),
    ).toHaveFocus()
  })

  it('opens the archive that holds a linked ended entry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?item=event-february')
    const archive = within(screen.getByRole('region', {name: 'Ended events'}))
    expect(archive.getByRole('button', {name: /February Event/})).toHaveAttribute(
      'aria-current',
      'true',
    )
    fireEvent.click(screen.getByRole('button', {name: /Ended events/}))
    expect(screen.queryByRole('region', {name: 'Ended events'})).not.toBeInTheDocument()
  })

  it('opens and closes the mobile sheet, restoring focus and preserving filters', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    renderPage('/timeline-next?view=events')
    const row = screen
      .getAllByRole('button', {name: /First Event/})
      .find((button) => button.classList.contains('timeline-next-row'))
    if (!row) throw new Error('Event row not found')
    row.focus()
    fireEvent.click(row)
    expect(screen.getByRole('dialog', {name: 'First Event'})).toHaveFocus()
    expect(document.documentElement.style.overflow).toBe('hidden')
    fireEvent(screen.getByRole('dialog'), new Event('cancel', {bubbles: true, cancelable: true}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(row).toHaveFocus()
    expect(screen.getByTestId('location')).toHaveTextContent('?view=events')
    expect(document.documentElement.style.overflow).not.toBe('hidden')
  })

  it('updates the mobile sheet name when selecting a related entry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    renderPage('/timeline-next?item=event-first')
    fireEvent.click(
      within(screen.getByRole('dialog', {name: 'First Event'})).getByRole('button', {
        name: /Pool Banner/,
      }),
    )
    expect(screen.getByRole('dialog', {name: 'Pool Banner'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'History back'}))
    expect(screen.getByRole('dialog', {name: 'First Event'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'History forward'}))
    fireEvent.click(
      within(screen.getByRole('dialog', {name: 'Pool Banner'})).getByRole('button', {
        name: 'Close',
      }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toBeEmptyDOMElement()
    fireEvent.click(screen.getByRole('button', {name: 'History forward'}))
    expect(screen.getByRole('dialog', {name: 'Pool Banner'})).toBeInTheDocument()
  })
})
