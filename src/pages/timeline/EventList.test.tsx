import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {vi} from 'vitest'

import {EVENT_CATEGORIES, type EventEntry} from '@/domain/timeline'

import {EventList} from './EventList'

function mockDescriptionOverflow() {
  const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollHeight',
  )
  const clientHeightDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientHeight',
  )

  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => 80,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 40,
  })

  return () => {
    if (scrollHeightDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeightDescriptor)
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight')
    }

    if (clientHeightDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeightDescriptor)
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight')
    }
  }
}

describe('EventList', () => {
  it('keeps ended events collapsed by default, filters fluff archives, and shows rerun metadata', () => {
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
        id: 'upcoming-story',
        title: 'Upcoming Story Event',
        startDate: '2026-03-13T00:00:00.000Z',
        endDate: '2026-03-20T00:00:00.000Z',
        category: 'story',
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
    const upcomingToggle = screen.getByRole('button', {name: /upcoming events/i})
    expect(upcomingToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Upcoming Story Event')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {name: 'Upcoming Story Event'}).closest('li'),
    ).not.toHaveClass('opacity-80', 'saturate-40')
    expect(screen.getByText('Rerun')).toHaveClass('timeline-event-meta-segment')
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
    expect(screen.getByText('Ends in 2d 0h')).toHaveAttribute('title', 'Mar 9, 2026 - Mar 12, 2026')
    expect(screen.queryByTitle('Pinned')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', {name: 'Archived Story Event'})).not.toBeInTheDocument()
    expect(screen.queryByText('Archived Login Event')).not.toBeInTheDocument()

    fireEvent.click(upcomingToggle)

    expect(upcomingToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('heading', {name: 'Upcoming Story Event'})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /ended/i}))

    expect(screen.getByRole('heading', {name: 'Archived Story Event'})).toBeInTheDocument()
    expect(screen.queryByText('Archived Login Event')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Pinned')).not.toBeInTheDocument()
  })

  it('opens featured event details from a visible entity metadata link', () => {
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
    expect(detailChip).toHaveClass('timeline-event-meta-segment', 'timeline-event-meta-link')

    fireEvent.click(detailChip)

    expect(onOpenDetail).toHaveBeenCalledWith({kind: 'wheel', id: 'wheel-0047'})
  })

  it('allows long event titles to use a second line without rendering status chips', () => {
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
      'line-clamp-2',
    )
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
    expect(screen.getByText('Ends in 6d 0h')).toBeInTheDocument()
    expect(screen.getByText('980 Silver Prime')).toHaveClass('timeline-event-meta-segment')
  })

  it('renders event pricing and description prices in estimated dollars when requested', () => {
    const now = new Date('2026-05-12T00:00:00.000Z')
    const events = [
      {
        id: 'price-event',
        title: 'Price Event',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-18T00:00:00.000Z',
        category: 'bundle',
        description: 'Each gift box costs 1980 Silver Prime.',
        pricing: '1980 Silver Prime',
      },
    ] as unknown as EventEntry[]

    render(<EventList events={events} now={now} priceMode='usd-estimate' />)

    expect(screen.getByText('~$29')).toHaveClass('timeline-event-meta-segment')
    expect(screen.getByText('Each gift box costs ~$29.')).toBeInTheDocument()
  })

  it('renders shared timeline rich text in event descriptions', () => {
    const now = new Date('2026-05-12T00:00:00.000Z')
    const events = [
      {
        id: 'rich-text-event',
        title: 'Rich Text Event',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-18T00:00:00.000Z',
        category: 'collab',
        description:
          'Event copy with *italic* and **bold**.\n[Announcement](https://example.com) <em>raw</em>',
      },
    ] as unknown as EventEntry[]

    const {container} = render(<EventList events={events} now={now} />)

    expect(container.querySelector('em')).toHaveTextContent('italic')
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('br')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /Announcement.*opens in new tab/})).toHaveAttribute(
      'href',
      'https://example.com',
    )
    expect(screen.getByText(/<em>raw<\/em>/)).toBeInTheDocument()
  })

  it('opens overflowing event descriptions in an in-card detail shelf', async () => {
    const restoreOverflowMock = mockDescriptionOverflow()
    const now = new Date('2026-05-12T00:00:00.000Z')
    const description =
      'Limited-time WoD wheel acquisition event featuring "Private Afternoon". Complete various tasks to obtain 4 copies & 25 Pure Core. Premium track grants additional materials and a longer reward path.'
    const events = [
      {
        id: 'long-description',
        title: 'Long Description Event',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-18T00:00:00.000Z',
        category: 'wheel-event',
        description,
      },
    ] as unknown as EventEntry[]

    try {
      render(<EventList events={events} now={now} />)

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'More'})).toHaveAttribute('aria-expanded', 'false')
      })

      const moreButton = screen.getByRole('button', {name: 'More'})

      fireEvent.click(moreButton)

      const shelf = screen.getByRole('region', {name: 'Details'})
      const lessButton = screen.getByRole('button', {name: 'Less'})

      expect(shelf).toBeInTheDocument()
      expect(lessButton).toHaveFocus()
      expect(
        screen.getByText(description, {selector: '#event-description-long-description p'}),
      ).toBeInTheDocument()
      expect(
        document.getElementById('event-description-long-description')?.parentElement,
      ).toHaveClass('group/event-row')
      expect(document.getElementById('event-description-long-description')).toHaveClass('inset-0')

      fireEvent.keyDown(shelf, {key: 'Escape'})

      expect(screen.queryByText('Details')).not.toBeInTheDocument()

      await waitFor(() => {
        expect(moreButton).toHaveFocus()
      })
    } finally {
      restoreOverflowMock()
    }
  })

  it('renders every event category with a protected main taxonomy tag', () => {
    const now = new Date('2026-05-12T00:00:00.000Z')
    const events = EVENT_CATEGORIES.map(
      (category, index) =>
        ({
          id: `category-${category}`,
          title: `Category ${category}`,
          startDate: '2026-05-01T00:00:00.000Z',
          endDate: `2026-06-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
          category,
          pricing: index === 0 ? '980 Silver Prime' : undefined,
          rerun: index === 1,
        }) satisfies EventEntry,
    )

    render(<EventList events={events} now={now} />)

    const taxonomyLines = screen.getAllByLabelText('Event classification')

    expect(taxonomyLines).toHaveLength(EVENT_CATEGORIES.length)

    taxonomyLines.forEach((line) => {
      const mainTag = line.querySelector('.timeline-event-meta-segment--primary')

      expect(mainTag).toHaveClass('timeline-event-meta-segment')
      expect(mainTag?.className).toMatch(
        /timeline-event-meta--(?:amber|blue|champagne|gold|orange|red|slate|teal|violet)/,
      )
      expect(mainTag).not.toHaveClass('timeline-event-meta--ended')
    })

    expect(screen.getByText('980 Silver Prime')).toHaveClass('timeline-event-meta--price')
    expect(screen.getByText('Rerun')).toHaveClass('timeline-event-meta--violet')
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
    expect(agrippaChip).toHaveClass('timeline-event-meta-segment', 'timeline-event-meta-link')
    expect(uvhashChip).toHaveClass('timeline-event-meta-segment', 'timeline-event-meta-link')

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
