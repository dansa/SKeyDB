import {fireEvent, render, screen} from '@testing-library/react'
import {vi} from 'vitest'

import {type EventEntry} from '@/domain/timeline'

import {EventList} from './EventList'

describe('EventList', () => {
  it('keeps ended events collapsed by default, filters fluff archives, and shows rerun chips', () => {
    const now = new Date('2026-03-10T00:00:00.000Z')
    const events = [
      {
        id: 'active-rerun',
        title: 'Active Rerun Event',
        startDate: '2026-03-09T00:00:00.000Z',
        endDate: '2026-03-12T00:00:00.000Z',
        category: 'story',
        rerun: true,
        pinned: true,
      },
      {
        id: 'ended-story',
        title: 'Archived Story Event',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-08T00:00:00.000Z',
        category: 'story',
        pinned: true,
      },
      {
        id: 'ended-login',
        title: 'Archived Login Event',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-07T00:00:00.000Z',
        category: 'login',
      },
    ] as unknown as EventEntry[]

    render(<EventList events={events} now={now} />)

    expect(screen.getByText('Active Rerun Event')).toBeInTheDocument()
    expect(screen.getByText('Rerun')).toHaveClass(
      'timeline-event-chip',
      'timeline-event-chip--rerun',
    )
    expect(screen.getByText('Live').parentElement).toHaveAttribute(
      'title',
      'Mar 9, 2026 - Mar 12, 2026',
    )
    expect(screen.queryByTitle('Pinned')).not.toBeInTheDocument()
    expect(screen.queryByText('Archived Story Event')).not.toBeInTheDocument()
    expect(screen.queryByText('Archived Login Event')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /ended/i}))

    expect(screen.getByText('Archived Story Event')).toBeInTheDocument()
    expect(screen.queryByText('Archived Login Event')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Pinned')).not.toBeInTheDocument()
  })

  it('opens featured event details from a visible entity chip', () => {
    const onOpenDetail = vi.fn()
    const now = new Date('2026-03-10T00:00:00.000Z')
    const events = [
      {
        id: 'wheel-event',
        title: 'Wheel Event',
        startDate: '2026-03-09T00:00:00.000Z',
        endDate: '2026-03-12T00:00:00.000Z',
        category: 'wheel-event',
        featured: [{name: 'Stakes of Wisdom', kind: 'wheel'}],
      },
    ] as unknown as EventEntry[]

    render(<EventList events={events} now={now} onOpenDetail={onOpenDetail} />)

    const detailChip = screen.getByRole('button', {name: 'Open details for Stakes of Wisdom'})

    expect(detailChip).toHaveTextContent('Stakes of Wisdom')
    expect(detailChip).toHaveClass(
      'timeline-event-chip',
      'timeline-event-chip--interactive',
      'timeline-event-chip--wheel',
    )
    expect(detailChip.firstElementChild).toHaveClass('timeline-event-chip__label')

    fireEvent.click(detailChip)

    expect(onOpenDetail).toHaveBeenCalledWith({kind: 'wheel', id: 'wheel-0047'})
  })

  it('truncates long event titles instead of wrapping the status block down', () => {
    const now = new Date('2026-05-12T00:00:00.000Z')
    const events = [
      {
        id: 'long-title',
        title: "WoD Archives: L'Heure du Thé",
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-18T00:00:00.000Z',
        category: 'wheel-event',
        customArt: '/events/private-afternoon-wheelwebp.webp',
        description:
          'Limited-time WoD wheel acquisition event featuring "Private Afternoon". Complete various tasks to obtain 4 copies & 25 Pure Core.',
        pricing: '980 Silver Prime',
      },
    ] as unknown as EventEntry[]

    render(<EventList events={events} now={now} />)

    expect(screen.getByRole('heading', {name: "WoD Archives: L'Heure du Thé"})).toHaveClass(
      'truncate',
    )
    expect(screen.getByText('Live').parentElement).toHaveClass('shrink-0')
    expect(screen.getByText('980 Silver Prime')).toHaveClass(
      'timeline-event-chip',
      'timeline-event-chip--price',
    )
  })

  it('renders one detail target per featured entity for split events', () => {
    const onOpenDetail = vi.fn()
    const now = new Date('2026-05-10T00:00:00.000Z')
    const events = [
      {
        id: 'great-conquering',
        title: 'The Great Conquering',
        startDate: '2026-05-04T00:00:00.000Z',
        endDate: '2026-05-18T00:00:00.000Z',
        category: 'gameplay-event',
        customArt: '/events/uvhash-agrippa-event.webp',
        featured: [
          {name: 'Agrippa', kind: 'awakener'},
          {name: 'Uvhash', kind: 'awakener'},
        ],
      },
    ] as unknown as EventEntry[]

    render(<EventList events={events} now={now} onOpenDetail={onOpenDetail} />)

    const agrippaChip = screen.getByRole('button', {name: 'Open details for Agrippa'})
    const uvhashChip = screen.getByRole('button', {name: 'Open details for Uvhash'})

    expect(agrippaChip).toHaveTextContent('Agrippa')
    expect(uvhashChip).toHaveTextContent('Uvhash')
    expect(agrippaChip).toHaveClass('timeline-event-chip', 'timeline-event-chip--awakener')
    expect(uvhashChip).toHaveClass('timeline-event-chip', 'timeline-event-chip--awakener')

    fireEvent.click(agrippaChip)
    fireEvent.click(uvhashChip)

    expect(onOpenDetail).toHaveBeenNthCalledWith(1, {kind: 'awakener', id: 'awakener-0002'})
    expect(onOpenDetail).toHaveBeenNthCalledWith(2, {kind: 'awakener', id: 'awakener-0051'})
  })

  it('does not render event detail targets for opt-out featured entries', () => {
    const now = new Date('2026-04-10T00:00:00.000Z')
    const events = [
      {
        id: 'preorder',
        title: 'Pre-order "Conjugated Fates"',
        startDate: '2026-04-06T00:00:00.000Z',
        endDate: '2026-05-18T00:00:00.000Z',
        category: 'preorder',
        customArt: '/events/arachne-preorder.webp',
        featured: [{name: 'Arachne', kind: 'awakener', detailLink: false}],
      },
    ] as unknown as EventEntry[]

    render(<EventList events={events} now={now} onOpenDetail={vi.fn()} />)

    expect(screen.queryByRole('button', {name: 'Open details for Arachne'})).not.toBeInTheDocument()
  })
})
