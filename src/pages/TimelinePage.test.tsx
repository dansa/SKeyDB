import {act, fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter, useLocation} from 'react-router-dom'
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

vi.mock('@/domain/dzone', () => ({
  getCurrentDzoneSeasonSummary: () => ({
    id: 'dzone-0101',
    period: 101,
    name: 'Current Test Zone',
    start: '2026-03-09T00:00:00.000Z',
    end: '2026-03-12T00:00:00.000Z',
    stageEffect: 'Astral Reign',
    realm: 'CARO',
    seasonPath: 'seasons/dzone0101.json',
  }),
  getLatestDzoneSeasonSummary: () => ({
    id: 'dzone-0101',
    period: 101,
    name: 'Current Test Zone',
    start: '2026-03-09T00:00:00.000Z',
    end: '2026-03-12T00:00:00.000Z',
    stageEffect: 'Astral Reign',
    realm: 'CARO',
    seasonPath: 'seasons/dzone0101.json',
  }),
}))

vi.mock('@/domain/dzone-season-realm', () => ({
  getDzoneSeasonSummaryDisplayName: () => 'Caro Ring',
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

function LocationProbe() {
  const location = useLocation()
  return <output data-testid='location'>{`${location.pathname}${location.search}`}</output>
}

function renderTimelinePage(initialEntries = ['/timeline']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TimelinePage />
      <LocationProbe />
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
    const upcomingToggle = screen.getByRole('button', {name: /upcoming banners/i})
    expect(upcomingToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', {name: 'Upcoming Banner'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Archived Banner'})).not.toBeInTheDocument()

    fireEvent.click(upcomingToggle)

    expect(upcomingToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', {name: 'Upcoming Banner'})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /ended banners/i}))

    expect(screen.getByRole('button', {name: 'Archived Banner'})).toBeInTheDocument()
  })

  it('renders the timeline price display toggle in the masthead', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage()

    expect(screen.getByText('Display Prices')).toBeInTheDocument()

    const silverPrime = screen.getByRole('button', {name: 'Silver Prime'})
    const estimatedUsd = screen.getByRole('button', {name: 'Estimated USD'})

    expect(silverPrime).toHaveAttribute('aria-pressed', 'true')
    expect(estimatedUsd).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(estimatedUsd)

    expect(silverPrime).toHaveAttribute('aria-pressed', 'false')
    expect(estimatedUsd).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses the view search param for timeline content tabs', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage(['/timeline?view=banners'])

    expect(screen.getByTestId('location')).toHaveTextContent('/timeline?view=banners')
    expect(screen.getByRole('button', {name: 'Banners'})).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Active Banner')).toBeInTheDocument()
    expect(screen.queryByText('No events to display.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Events'}))

    expect(screen.getByTestId('location')).toHaveTextContent('/timeline?view=events')
    expect(screen.getByRole('button', {name: 'Events'})).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', {name: 'Both'}))

    expect(screen.getByTestId('location')).toHaveTextContent('/timeline')
    expect(screen.getByRole('button', {name: 'Both'})).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses the section search param as a timeline scroll target and view hint', () => {
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'scrollIntoView',
    )
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    try {
      renderTimelinePage(['/timeline?section=upcoming-banners'])

      expect(screen.getByRole('button', {name: 'Banners'})).toHaveAttribute('aria-pressed', 'true')
      const upcomingBannersToggle = screen.getByRole('button', {name: /upcoming banners/i})
      expect(upcomingBannersToggle).toHaveAttribute('aria-expanded', 'true')

      act(() => {
        vi.runOnlyPendingTimers()
      })

      expect(scrollIntoView).toHaveBeenCalledWith({block: 'start', behavior: 'smooth'})

      fireEvent.click(upcomingBannersToggle)

      expect(upcomingBannersToggle).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(screen.getByRole('button', {name: 'Events'}))

      expect(screen.getByTestId('location')).toHaveTextContent('/timeline?view=events')
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(Element.prototype, 'scrollIntoView', originalScrollIntoView)
      }
    }
  })

  it('uses instant section scrolling when reduced motion is preferred', () => {
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'scrollIntoView',
    )
    const originalMatchMedia = window.matchMedia
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    try {
      renderTimelinePage(['/timeline?section=upcoming-banners'])

      act(() => {
        vi.runOnlyPendingTimers()
      })

      expect(scrollIntoView).toHaveBeenCalledWith({block: 'start', behavior: 'auto'})
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(Element.prototype, 'scrollIntoView', originalScrollIntoView)
      }
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      })
    }
  })

  it('cancels a pending section scroll frame when the section param changes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame')
    const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame')

    try {
      renderTimelinePage(['/timeline?section=upcoming-banners'])

      fireEvent.click(screen.getByRole('button', {name: 'Events'}))

      expect(requestAnimationFrame).toHaveBeenCalled()
      expect(cancelAnimationFrame).toHaveBeenCalledWith(requestAnimationFrame.mock.results[0].value)
    } finally {
      requestAnimationFrame.mockRestore()
      cancelAnimationFrame.mockRestore()
    }
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

  it('uses the D-Zone season data in the masthead', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    renderTimelinePage()

    const seasonLink = screen.getByRole('link', {name: 'D-Zone season'})
    expect(seasonLink).toHaveAttribute('href', '/d-zone')
    expect(seasonLink).toHaveTextContent('Current Season')
    expect(seasonLink).toHaveTextContent('Caro Ring')
    expect(screen.getByText('Ends in 2d 0h')).toBeInTheDocument()
    expect(screen.queryByText('Current D-Zone data pending')).not.toBeInTheDocument()
  })
})
