import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, useLocation} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {Wheel} from '@/domain/wheels'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {DbDetailModalHost} from './DbDetailModalHost'
import {dbDetailRegistry} from './dbDetailRegistry'

interface MockDetailRenderOptions {
  callbacks: {
    onClose: () => void
    onTabChange: (tab: 'overview' | 'upgrades' | 'skills' | 'builds' | 'teams') => void
    onSelectWheel: (wheel: {id: string; name: string}) => void
  }
  item: {
    activeTab?: string
    item: {
      name: string
    }
  }
}

vi.mock('./dbDetailRegistry', async () => {
  const actual = await vi.importActual<typeof import('./dbDetailRegistry')>('./dbDetailRegistry')

  return {
    ...actual,
    dbDetailRegistry: {
      awakener: {
        loadRecord: vi.fn(async () => ({id: 'record-awakener'})),
        loadingLabel: 'Loading awakener details...',
        missingBrowsePath: '/database',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <div role='dialog' aria-label={`${item.item.name} details`}>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
            <button
              onClick={() => {
                callbacks.onSelectWheel({id: 'wheel-0050', name: 'Merciful Nurturing'})
              }}
              type='button'
            >
              Refer wheel
            </button>
            <span>Active tab: {item.activeTab}</span>
            <button
              onClick={() => {
                callbacks.onTabChange('skills')
              }}
              type='button'
            >
              Show skills tab
            </button>
          </div>
        )),
      },
      wheel: {
        loadRecord: vi.fn(async () => ({id: 'record-wheel'})),
        loadingLabel: 'Loading wheel details...',
        missingBrowsePath: '/database/wheels',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <div role='dialog' aria-label={`${item.item.name} details`}>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
          </div>
        )),
      },
      posse: {
        loadRecord: vi.fn(async () => ({id: 'record-posse'})),
        loadingLabel: 'Loading posse details...',
        missingBrowsePath: '/database/posses',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <div role='dialog' aria-label={`${item.item.name} details`}>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
          </div>
        )),
      },
      covenant: {
        loadRecord: vi.fn(async () => ({id: 'record-covenant'})),
        loadingLabel: 'Loading covenant details...',
        missingBrowsePath: '/database/covenants',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <div role='dialog' aria-label={`${item.item.name} details`}>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
          </div>
        )),
      },
    },
  }
})

const awakeners = [
  {
    id: 'awakener-0021',
    numericId: 21,
    name: 'goliath',
    faction: 'Among the Stars',
    realm: 'CHAOS',
    aliases: [],
    tags: [],
    lineupToken: 'f',
  },
]

const wheels: Wheel[] = [
  {
    id: 'wheel-0050',
    assetId: 'Weapon_Full_O01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'AEQUOR',
    awakener: 'goliath',
    mainstatKey: 'CRIT_RATE',
    aliases: [],
    tags: [],
    lineupToken: 'm',
  },
]

afterEach(() => {
  dbDetailStore.getState().closeAllDetails()
  vi.mocked(dbDetailRegistry.awakener.loadRecord).mockResolvedValue({id: 'record-awakener'})
  vi.mocked(dbDetailRegistry.wheel.loadRecord).mockResolvedValue({id: 'record-wheel'})
  vi.mocked(dbDetailRegistry.posse.loadRecord).mockResolvedValue({id: 'record-posse'})
  vi.mocked(dbDetailRegistry.covenant.loadRecord).mockResolvedValue({id: 'record-covenant'})
})

function LocationProbe() {
  const location = useLocation()
  return <span data-testid='location-pathname'>{location.pathname}</span>
}

describe('DbDetailModalHost overlay entries', () => {
  it('renders an overlay without a route item and closes by popping the overlay stack', async () => {
    const callbacks = {
      onClose: vi.fn(),
      onSelectAwakener: vi.fn(),
      onSelectCovenant: vi.fn(),
      onSelectWheel: vi.fn(),
      onTabChange: vi.fn(),
    }

    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={callbacks}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    dbDetailStore.getState().openDetail({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    expect(await screen.findByRole('dialog', {name: /goliath details/i})).toBeInTheDocument()
    expect(screen.getByText('Active tab: overview')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /close overlay/i}))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', {name: /goliath details/i})).not.toBeInTheDocument()
    })
    expect(dbDetailStore.getState().stack).toEqual([])
    expect(callbacks.onClose).not.toHaveBeenCalled()
  })

  it('pushes overlay references from overlay modal callbacks', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={{
            onClose: vi.fn(),
            onSelectAwakener: vi.fn(),
            onSelectCovenant: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange: vi.fn(),
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    dbDetailStore.getState().openDetail({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')
    fireEvent.click(await screen.findByRole('button', {name: /refer wheel/i}))

    expect(
      await screen.findByRole('dialog', {name: /merciful nurturing details/i}),
    ).toBeInTheDocument()
    expect(dbDetailStore.getState().stack).toEqual([
      {kind: 'awakener', id: 'awakener-0021', source: 'builder-overlay'},
      {kind: 'wheel', id: 'wheel-0050', source: 'reference'},
    ])
  })

  it('keeps awakener overlay tab state local to the modal host', async () => {
    const onTabChange = vi.fn()

    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={{
            onClose: vi.fn(),
            onSelectAwakener: vi.fn(),
            onSelectCovenant: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange,
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    dbDetailStore.getState().openDetail({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    expect(await screen.findByText('Active tab: overview')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /show skills tab/i}))

    expect(await screen.findByText('Active tab: skills')).toBeInTheDocument()
    expect(onTabChange).not.toHaveBeenCalled()
  })

  it('pops missing overlay records without navigating away from the current page', async () => {
    vi.mocked(dbDetailRegistry.awakener.loadRecord).mockResolvedValue(undefined)

    render(
      <MemoryRouter initialEntries={['/builder']}>
        <LocationProbe />
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={{
            onClose: vi.fn(),
            onSelectAwakener: vi.fn(),
            onSelectCovenant: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange: vi.fn(),
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    dbDetailStore.getState().openDetail({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    await waitFor(() => {
      expect(dbDetailStore.getState().stack).toEqual([])
    })
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/builder')
  })

  it('pops unsupported overlay refs without navigating away from the current page', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <LocationProbe />
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={{
            onClose: vi.fn(),
            onSelectAwakener: vi.fn(),
            onSelectCovenant: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange: vi.fn(),
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    dbDetailStore
      .getState()
      .openDetail({kind: 'relic', id: 'relic-0001'} as never, 'builder-overlay')

    await waitFor(() => {
      expect(dbDetailStore.getState().stack).toEqual([])
    })
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/builder')
  })
})
