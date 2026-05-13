import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {TimelinePage} from './TimelinePage'

const detailStoreMocks = vi.hoisted(() => ({
  openDetail: vi.fn(),
  popDetail: vi.fn(),
}))

vi.mock('@/domain/timeline-data', () => ({
  timelineBanners: [
    {
      id: 'active-banner',
      title: 'Active Banner',
      type: 'limited',
      startDate: '2026-03-09T00:00:00.000Z',
      endDate: '2026-03-12T00:00:00.000Z',
    },
    {
      id: 'ended-banner',
      title: 'Archived Banner',
      type: 'rerun',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-08T00:00:00.000Z',
    },
    {
      id: 'upcoming-banner',
      title: 'Upcoming Banner',
      type: 'limited',
      startDate: '2026-03-13T00:00:00.000Z',
      endDate: '2026-03-20T00:00:00.000Z',
    },
  ],
  timelineEvents: [
    {
      id: 'event-dtide',
      title: 'Regional D-Effect Zone',
      category: 'd-tide',
      description: 'Bi-weekly D-Tide raids.\nCurrent Realm relic: Caro Ring.',
      startDate: '2026-03-09T00:00:00.000Z',
      endDate: '2026-03-12T00:00:00.000Z',
    },
  ],
}))

vi.mock('@/stores/dbDetailStore', () => ({
  dbDetailStore: {
    getState: () => detailStoreMocks,
  },
}))

vi.mock('@/features/database/detail/DbDetailModalHost', () => ({
  DbDetailModalHost: () => <div data-testid='timeline-detail-host' />,
}))

vi.mock('./timeline/BannerCard', () => ({
  BannerCard: ({
    banner,
    onOpenDetail,
  }: {
    banner: {title: string}
    onOpenDetail?: (ref: {kind: 'wheel'; id: string}) => void
  }) => (
    <button
      onClick={() => {
        onOpenDetail?.({kind: 'wheel', id: 'wheel-0128'})
      }}
      type='button'
    >
      {banner.title}
    </button>
  ),
}))

vi.mock('./timeline/EventList', () => ({
  EventList: () => <div>No events to display.</div>,
}))

function renderTimelinePage() {
  return render(
    <MemoryRouter>
      <TimelinePage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.useRealTimers()
  detailStoreMocks.openDetail.mockReset()
  detailStoreMocks.popDetail.mockReset()
})

describe('TimelinePage', () => {
  it('keeps ended banners collapsed by default and expands them on demand', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage()

    expect(screen.getByText('Active Banner')).toBeInTheDocument()
    expect(screen.getByText('Upcoming banners')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Upcoming Banner'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Archived Banner'})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /ended banners/i}))

    expect(screen.getByRole('button', {name: 'Archived Banner'})).toBeInTheDocument()
  })

  it('opens database detail overlays from timeline cards', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage()

    fireEvent.click(screen.getByRole('button', {name: 'Active Banner'}))

    expect(detailStoreMocks.openDetail).toHaveBeenCalledWith(
      {kind: 'wheel', id: 'wheel-0128'},
      'timeline-overlay',
    )
    expect(screen.getByTestId('timeline-detail-host')).toBeInTheDocument()
  })

  it('filters the timeline surface between events and banners', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage()

    expect(screen.getByRole('group', {name: 'Timeline content'})).toBeInTheDocument()
    expect(screen.getByText('No events to display.')).toBeInTheDocument()
    expect(screen.getByText('Active Banner')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Banner')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Events'}))

    expect(screen.getByText('No events to display.')).toBeInTheDocument()
    expect(screen.queryByText('Active Banner')).not.toBeInTheDocument()
    expect(screen.queryByText('Upcoming Banner')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Banners'}))

    expect(screen.queryByText('No events to display.')).not.toBeInTheDocument()
    expect(screen.getByText('Active Banner')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Banner')).toBeInTheDocument()
  })

  it('does not render redundant status filter controls', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage()

    expect(screen.queryByRole('button', {name: 'Live'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Upcoming'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Ended'})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /ended banners/i})).toBeInTheDocument()
  })

  it('uses the D-Zone event data in the masthead', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage()

    const seasonLink = screen.getByRole('link', {name: 'D-Zone season'})
    expect(seasonLink).toHaveAttribute('href', '/d-zone')
    expect(seasonLink).toHaveTextContent('Current Season')
    expect(seasonLink).toHaveTextContent('Caro Ring')
    expect(screen.getByText('Ends in 2d 0h')).toBeInTheDocument()
  })
})
