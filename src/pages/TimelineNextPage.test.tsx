import {fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter, useLocation, useNavigate} from 'react-router'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {getPoolGroups} from './timeline/next/timelineNextModel'
import {TimelineNextPage} from './TimelineNextPage'

vi.mock('@/domain/timeline-data', () => ({
  timelineEvents: [
    {
      id: 'event-first',
      title: 'First Event',
      category: 'story',
      customArt: '/event-test.webp',
      description: 'A full sentence with enough words.\nAnother line.',
      pricing: '60 Silver Prime',
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
  ],
  timelineBanners: [
    {
      id: 'banner-pool',
      title: 'Pool Banner',
      type: 'combo',
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
  ],
}))
vi.mock('./timeline/timelineDZoneSummary', () => ({
  getTimelineDZoneSummary: () => ({
    name: 'Test season',
    realm: 'CARO',
    endDate: '2026-03-14T00:00:00Z',
  }),
}))
vi.mock('./timeline/BannerArtwork', () => ({
  BannerArtwork: ({reserveDrawerInset}: {reserveDrawerInset?: boolean}) => (
    <div data-reserve-inset={String(reserveDrawerInset)} data-testid='banner-artwork' />
  ),
}))
vi.mock('@/features/database/detail/DeferredDatabaseDetailOverlayOutlet', () => ({
  DeferredDatabaseDetailOverlayOutlet: () => null,
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
  it('shows missions even if the event has no reward summary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage('/timeline-next?item=event-missions-only')
    const stage = within(screen.getByLabelText('Selected details'))
    expect(stage.getByText('Missions (1)')).toBeInTheDocument()
    expect(stage.getByText('Complete a trial')).toBeInTheDocument()
  })

  it('treats a filter that clears the selection as a new list visit', () => {
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
    fireEvent.click(screen.getByRole('button', {name: 'Close'}))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?view=banners$/)
    fireEvent.click(screen.getByRole('button', {name: 'History back'}))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?item=event-first$/)
    fireEvent.click(screen.getByRole('button', {name: 'History forward'}))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?view=banners$/)
    fireEvent.click(screen.getByRole('button', {name: 'History forward'}))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\?view=banners&item=banner-pool$/)
  })

  it('exposes the masthead filters, price control and season link', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    renderPage()
    expect(screen.getByRole('heading', {name: 'Events & Banners', level: 1})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'D-Zone season'})).toHaveAttribute('href', '/d-zone')
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
    expect(within(screen.getByLabelText('Selected details')).getAllByText('~$1')).toHaveLength(2)
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
    const description = stage.getByText(/A full sentence/)
    expect(description).toHaveClass('timeline-next-description')
    expect(description.querySelectorAll('br')).toHaveLength(1)
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
    fireEvent.click(stage.getByRole('button', {name: 'Previous day'}))
    expect(day).toHaveValue('1')
    expect(stage.queryByRole('button', {name: 'Ever Sunward'})).not.toBeInTheDocument()
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
