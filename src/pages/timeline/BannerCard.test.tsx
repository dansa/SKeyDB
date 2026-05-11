import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'

import {BannerCard} from './BannerCard'

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

    expect(screen.getByText('Ended 2d ago')).toBeInTheDocument()
    expect(screen.getByText('Ended').parentElement).toHaveAttribute(
      'title',
      'Mar 1, 2026 - Mar 8, 2026',
    )
    expect(screen.queryByTitle('Pinned')).not.toBeInTheDocument()
  })

  it('shows a date instead of long-range countdown text and exposes it on hover', () => {
    render(
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

    expect(screen.getByText('Starts Mar 30')).toBeInTheDocument()
    expect(screen.getByText('Soon').parentElement).toHaveAttribute(
      'title',
      'Mar 30, 2026 - Apr 10, 2026',
    )
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
})
