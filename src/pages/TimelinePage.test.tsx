import {fireEvent, render, screen} from '@testing-library/react'
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
  ],
  timelineEvents: [],
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

afterEach(() => {
  vi.useRealTimers()
  detailStoreMocks.openDetail.mockReset()
  detailStoreMocks.popDetail.mockReset()
})

describe('TimelinePage', () => {
  it('keeps ended banners collapsed by default and expands them on demand', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    render(<TimelinePage />)

    expect(screen.getByText('Active Banner')).toBeInTheDocument()
    expect(screen.queryByText('Archived Banner')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /ended banners/i}))

    expect(screen.getByText('Archived Banner')).toBeInTheDocument()
  })

  it('opens database detail overlays from timeline cards', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    render(<TimelinePage />)

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

    render(<TimelinePage />)

    expect(screen.getByText('No events to display.')).toBeInTheDocument()
    expect(screen.getByText('Active Banner')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Events'}))

    expect(screen.getByText('No events to display.')).toBeInTheDocument()
    expect(screen.queryByText('Active Banner')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Banners'}))

    expect(screen.queryByText('No events to display.')).not.toBeInTheDocument()
    expect(screen.getByText('Active Banner')).toBeInTheDocument()
  })

  it('shows archived banners when the ended state filter is active', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    render(<TimelinePage />)

    expect(screen.queryByText('Archived Banner')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Ended'}))

    expect(screen.queryByText('Active Banner')).not.toBeInTheDocument()
    expect(screen.getByText('Archived Banner')).toBeInTheDocument()
  })
})
