import {act, fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {vi} from 'vitest'

import {BannerCard} from './BannerCard'
import {CYCLE_INTERVAL_MS} from './usePoolCycling'

describe('BannerCard', () => {
  it('shows ended relative text for ended banners', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'ended-banner',
            title: 'Ended Banner',
            type: 'rerun',
            startDate: '2026-03-01T00:00:00.000Z',
            endDate: '2026-03-08T00:00:00.000Z',
            pinned: true,
          }}
          now={new Date('2026-03-10T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Ended 2d ago')).toHaveLength(2)
    expect(screen.getAllByText('Ended 2d ago')[0]).toHaveAttribute(
      'title',
      'Mar 1, 2026 - Mar 8, 2026',
    )
    expect(screen.queryByTitle('Pinned')).not.toBeInTheDocument()
  })

  it('shows a date instead of long-range countdown text and exposes it on hover', () => {
    const {container} = render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'upcoming-banner',
            title: 'Upcoming Banner',
            type: 'limited',
            startDate: '2026-03-30T00:00:00.000Z',
            endDate: '2026-04-10T00:00:00.000Z',
          }}
          now={new Date('2026-03-10T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Starts Mar 30 - Apr 10')).toHaveLength(2)
    expect(screen.getAllByText('Starts Mar 30 - Apr 10')[0]).toHaveAttribute(
      'title',
      'Mar 30, 2026 - Apr 10, 2026',
    )
    expect(container.querySelector('[data-banner-hero="summary"]')).not.toHaveAttribute('title')
    expect(container.querySelector('[data-banner-drawer-body]')).not.toHaveAttribute('title')
    expect(container.querySelector('article')?.className).not.toContain('opacity-')
    expect(container.innerHTML).not.toContain('opacity-[0.86]')
    expect(container.innerHTML).not.toContain('saturate-[0.78]')
  })

  it('renders banner pricing in estimated dollars when requested', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'paid-banner',
            title: 'Paid Banner',
            type: 'premium',
            pricing: 'USD 29.99',
            startDate: '2026-03-09T00:00:00.000Z',
            endDate: '2026-03-12T00:00:00.000Z',
          }}
          now={new Date('2026-03-10T00:00:00.000Z')}
          priceMode='usd-estimate'
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('$30')).toHaveLength(2)
  })

  it('renders scaffolded combo pool slots for banners waiting on final unit lists', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'faded-legacy',
            title: 'Faded Legacy',
            type: 'combo',
            startDate: '2026-05-04T00:00:00.000Z',
            endDate: '2026-05-18T00:00:00.000Z',
            poolSlots: [
              {pool: [{name: 'Awakener Pool A', kind: 'placeholder'}]},
              {pool: [{name: 'Awakener Pool B', kind: 'placeholder'}]},
              {pool: [{name: 'Awakener Pool C', kind: 'placeholder'}]},
              {pool: [{name: 'Wheel Pool', kind: 'placeholder'}]},
            ],
          }}
          now={new Date('2026-05-06T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Awakener Pool A')).toHaveLength(1)
    expect(screen.getAllByText('Awakener Pool B')).toHaveLength(1)
    expect(screen.getAllByText('Awakener Pool C')).toHaveLength(1)
    expect(screen.getAllByText('Wheel Pool')).toHaveLength(1)
  })

  it('keeps combo slot links stable while pool artwork transitions', () => {
    vi.useFakeTimers()

    const {unmount} = render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'combo-cycle',
            title: 'Combo Cycle',
            type: 'combo',
            startDate: '2026-05-04T00:00:00.000Z',
            endDate: '2026-05-18T00:00:00.000Z',
            poolSlots: [
              {
                pool: [
                  {name: 'Arachne', kind: 'awakener'},
                  {name: 'Tulu', kind: 'awakener'},
                ],
              },
            ],
          }}
          now={new Date('2026-05-06T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    try {
      expect(screen.getByRole('link', {name: 'Arachne'})).toHaveAttribute(
        'href',
        '/database/awakeners/arachne',
      )
      expect(screen.getAllByRole('link')).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(2500)
      })

      expect(screen.getByRole('link', {name: 'Tulu'})).toHaveAttribute(
        'href',
        '/database/awakeners/tulu',
      )
      expect(screen.getAllByRole('link')).toHaveLength(1)
      expect(screen.queryByRole('link', {name: 'Arachne'})).not.toBeInTheDocument()
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })

  it('reconciles combo slot artwork when pool slots change after cycling', () => {
    vi.useFakeTimers()

    const initialBanner = {
      id: 'combo-cycle-rerender',
      title: 'Combo Cycle Rerender',
      type: 'combo' as const,
      startDate: '2026-05-04T00:00:00.000Z',
      endDate: '2026-05-18T00:00:00.000Z',
      poolSlots: [
        {
          pool: [
            {name: 'Arachne', kind: 'awakener' as const},
            {name: 'Tulu', kind: 'awakener' as const},
          ],
        },
      ],
    }

    const {rerender, unmount} = render(
      <MemoryRouter>
        <BannerCard banner={initialBanner} now={new Date('2026-05-06T00:00:00.000Z')} />
      </MemoryRouter>,
    )

    try {
      act(() => {
        vi.advanceTimersByTime(CYCLE_INTERVAL_MS)
      })

      rerender(
        <MemoryRouter>
          <BannerCard
            banner={{
              ...initialBanner,
              poolSlots: [{pool: [{name: 'Arachne', kind: 'awakener'}]}],
            }}
            now={new Date('2026-05-06T00:00:00.000Z')}
          />
        </MemoryRouter>,
      )

      expect(screen.getByRole('link', {name: 'Arachne'})).toHaveAttribute(
        'href',
        '/database/awakeners/arachne',
      )
      expect(screen.getAllByRole('link')).toHaveLength(1)
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })

  it('links database-backed wheel featured units to wheel details', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'arachne-banner',
            title: 'Fata Texunt / Sempiternal Web',
            type: 'awaken',
            startDate: '2026-04-20T00:00:00.000Z',
            endDate: '2026-05-18T00:00:00.000Z',
            featured: [
              {name: 'Arachne', kind: 'awakener'},
              {name: 'Eternal Weave', kind: 'wheel'},
            ],
          }}
          now={new Date('2026-04-25T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', {name: 'Arachne'})).toHaveAttribute(
      'href',
      '/database/awakeners/arachne',
    )
    expect(screen.getByRole('link', {name: 'Eternal Weave'})).toHaveAttribute(
      'href',
      '/database/wheels/eternal-weave',
    )
  })

  it('opens database-backed featured units in timeline detail overlays on plain clicks', () => {
    const onOpenDetail = vi.fn()

    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'arachne-banner',
            title: 'Fata Texunt / Sempiternal Web',
            type: 'awaken',
            startDate: '2026-04-20T00:00:00.000Z',
            endDate: '2026-05-18T00:00:00.000Z',
            featured: [
              {name: 'Arachne', kind: 'awakener'},
              {name: 'Eternal Weave', kind: 'wheel'},
            ],
          }}
          now={new Date('2026-04-25T00:00:00.000Z')}
          onOpenDetail={onOpenDetail}
        />
      </MemoryRouter>,
    )

    const wheelLink = screen.getByRole('link', {name: 'Eternal Weave'})

    expect(wheelLink).toHaveAttribute('href', '/database/wheels/eternal-weave')

    fireEvent.click(wheelLink)

    expect(onOpenDetail).toHaveBeenCalledWith({kind: 'wheel', id: 'wheel-0128'})
  })

  it('does not link featured units that opt out of detail links', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'pre-release-banner',
            title: 'Pre-release Banner',
            type: 'awaken',
            startDate: '2026-04-06T00:00:00.000Z',
            endDate: '2026-04-20T00:00:00.000Z',
            featured: [{name: 'Arachne', kind: 'awakener', detailLink: false}],
          }}
          now={new Date('2026-04-10T00:00:00.000Z')}
          onOpenDetail={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', {name: 'Arachne'})).not.toBeInTheDocument()
  })

  it('collapses three-featured banners behind the details handle', () => {
    const {container} = render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'triple-banner',
            title: 'Triple Banner',
            type: 'rerun',
            startDate: '2026-04-20T00:00:00.000Z',
            endDate: '2026-05-18T00:00:00.000Z',
            featured: [
              {name: 'Tulu', kind: 'awakener'},
              {name: 'Sorel', kind: 'awakener'},
              {name: 'Doll: Inferno', kind: 'awakener'},
            ],
          }}
          now={new Date('2026-04-25T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(container.querySelector('[data-banner-hero="summary"]')).toHaveTextContent(
      'Triple Banner',
    )

    const handle = screen.getByRole('button', {name: 'Show details for Triple Banner'})

    expect(handle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(handle)

    expect(screen.getByRole('button', {name: 'Hide details for Triple Banner'})).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(container.querySelector('[data-banner-hero="summary"]')).toHaveClass('opacity-0')
  })

  it('links auto-expanded signature wheel slices to wheel details', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'single-awakener-banner',
            title: 'Single Awakener Banner',
            type: 'awaken',
            startDate: '2026-04-20T00:00:00.000Z',
            endDate: '2026-05-18T00:00:00.000Z',
            featured: [{name: 'Arachne', kind: 'awakener'}],
          }}
          now={new Date('2026-04-25T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', {name: 'Eternal Weave'})).toHaveAttribute(
      'href',
      '/database/wheels/eternal-weave',
    )
  })

  it('renders custom-art featured units for banners without database entries', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'arachne-banner',
            title: 'Fata Texunt / Sempiternal Web',
            type: 'awaken',
            startDate: '2026-04-20T00:00:00.000Z',
            endDate: '2026-05-18T00:00:00.000Z',
            featured: [
              {
                name: 'Mystery Awakener',
                kind: 'awakener',
                customArt: '/banners/arachne-char.webp',
                realmId: 'ULTRA',
              },
              {
                name: 'Mystery Wheel',
                kind: 'wheel',
                customArt: '/banners/arachne-wheel.webp',
                realmId: 'ULTRA',
              },
            ],
          }}
          now={new Date('2026-04-25T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getByAltText('Mystery Awakener')).toBeInTheDocument()
    expect(screen.getByAltText('Mystery Wheel')).toBeInTheDocument()
  })

  it('uses banner custom art as full-card artwork', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'collab-banner',
            title: 'Morimens × Saya no Uta',
            type: 'limited',
            tags: ['limited', 'collab'],
            startDate: '2026-05-30T00:00:00.000Z',
            endDate: '2026-06-27T00:00:00.000Z',
            customArt: '/banners/saya-collab-prelim.webp',
          }}
          now={new Date('2026-05-31T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getByAltText('Morimens × Saya no Uta')).toHaveAttribute(
      'src',
      '/banners/saya-collab-prelim.webp',
    )
    expect(screen.getByText('Limited')).toBeInTheDocument()
    expect(screen.getByText('Collab')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: 'Show details for Morimens × Saya no Uta'}),
    ).toBeInTheDocument()
  })

  it('renders shared timeline rich text in banner descriptions', () => {
    const {container} = render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'rich-text-banner',
            title: 'Rich Text Banner',
            type: 'limited',
            description: 'Featured *Saya* **limited** banner.\n[Announcement](https://example.com)',
            startDate: '2026-05-30T00:00:00.000Z',
            endDate: '2026-06-27T00:00:00.000Z',
          }}
          now={new Date('2026-05-31T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(container.querySelector('em')).toHaveTextContent('Saya')
    expect(container.querySelector('strong')).toHaveTextContent('limited')
    expect(container.querySelector('br')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /Announcement.*opens in new tab/})).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })
})
