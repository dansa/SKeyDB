import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, useLocation} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {CovenantFullRecord} from '@/domain/covenants-full'
import type {PosseFullRecord} from '@/domain/posses-full'
import type {PublicRelicRecord, Relic} from '@/domain/relics'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {makeTestAwakenerFullRecord} from '@/features/database/internal/database-test-fixtures'
import {clearDatabaseDetailRecordCacheForTests} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {DbDetailModalHost} from './DbDetailModalHost'
import {dbDetailRegistry} from './dbDetailRegistry'

interface MockDetailRenderOptions {
  callbacks: {
    onClose: () => void
    onTabChange: (tab: 'overview' | 'upgrades' | 'skills' | 'builds' | 'teams' | 'lore') => void
    onSelectWheel: (wheel: {id?: string; name: string}) => void
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
          <dialog aria-label={`${item.item.name} details`} open>
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
            <button
              onClick={() => {
                callbacks.onSelectWheel({name: ' Merciful Nurturing '})
              }}
              type='button'
            >
              Refer wheel by name
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
          </dialog>
        )),
      },
      wheel: {
        loadRecord: vi.fn(async () => ({id: 'record-wheel'})),
        loadingLabel: 'Loading wheel details...',
        missingBrowsePath: '/database/wheels',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <dialog aria-label={`${item.item.name} details`} open>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
          </dialog>
        )),
      },
      posse: {
        loadRecord: vi.fn(async () => ({id: 'record-posse'})),
        loadingLabel: 'Loading posse details...',
        missingBrowsePath: '/database/posses',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <dialog aria-label={`${item.item.name} details`} open>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
          </dialog>
        )),
      },
      covenant: {
        loadRecord: vi.fn(async () => ({id: 'record-covenant'})),
        loadingLabel: 'Loading covenant details...',
        missingBrowsePath: '/database/covenants',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <dialog aria-label={`${item.item.name} details`} open>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
          </dialog>
        )),
      },
      relic: {
        loadRecord: vi.fn(async () => ({id: 'record-relic'})),
        loadingLabel: 'Loading relic details...',
        missingBrowsePath: '/database/relics',
        render: vi.fn(({callbacks, item}: MockDetailRenderOptions) => (
          <dialog aria-label={`${item.item.name} details`} open>
            <button onClick={callbacks.onClose} type='button'>
              Close overlay
            </button>
          </dialog>
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

const relics: Relic[] = [
  {
    aliases: [],
    assetId: 'Relic_24',
    categories: ['DIMENSIONAL_IMAGE'],
    defaultVariantId: 'relic-variant-0001',
    description: 'Test relic',
    id: 'relic-0001',
    kind: 'PORTRAIT',
    name: 'Dimensional Image: "24"',
    ownerAwakenerId: 'awakener-0001',
    ownerAwakenerName: '24',
    rarity: 'SSR',
    relicType: 'Dimensional Image',
    route: {
      canonicalPath: '/database/relics/dimensional-image-24',
      slug: 'dimensional-image-24',
    },
    variantCount: 1,
    variantCategoryTiers: [{category: 'DIMENSIONAL_IMAGE', tier: 'Unique'}],
    variantTiers: ['Unique'],
  },
]

const mockAwakenerRecord = makeTestAwakenerFullRecord({id: 21, displayName: 'goliath'})
const mockWheelRecord: WheelFullRecord = {
  id: 'wheel-0050',
  assetId: 'Weapon_Full_O01',
  name: 'Merciful Nurturing',
  rarity: 'SSR',
  realm: 'AEQUOR',
  awakener: 'goliath',
  aliases: [],
  searchTags: [],
  mainstatKey: 'CRIT_RATE',
  mainstatSeriesKey: 'SSR:CRIT_RATE',
  descriptionTemplate: '',
  descriptionArgs: {},
}
const mockPosseRecord: PosseFullRecord = {
  id: 'posse-0001',
  name: 'Test Posse',
  realm: 'OTHER',
  assetId: 'KeyToken_Skill_01',
  descriptionTemplate: '',
  descriptionArgs: {},
}
const mockCovenantRecord: CovenantFullRecord = {
  id: 'covenant-0001',
  name: 'Test Covenant',
  assetId: 'covenant-icon-001',
  setEffects: [],
}
const mockRelicRecord: PublicRelicRecord = {
  schemaVersion: 3,
  kind: 'relic',
  id: 'relic-0001',
  name: 'Dimensional Image: "24"',
  route: {
    canonicalPath: '/database/relics/dimensional-image-24',
    slug: 'dimensional-image-24',
  },
  assets: {icon: 'asset-relic-0001-icon'},
  aliases: [],
  categories: ['DIMENSIONAL_IMAGE'],
  defaultVariantId: 'relic-variant-0001',
  relicType: 'Dimensional Image',
  variantCount: 1,
  variantCategoryTiers: [{category: 'DIMENSIONAL_IMAGE', tier: 'Unique'}],
  variantTiers: ['Unique'],
  descriptionTemplate: 'Test relic',
  descriptionArgs: {},
  variants: [
    {
      id: 'relic-variant-0001',
      name: 'Dimensional Image: "24"',
      label: 'Dimensional Image',
      variantType: 'DIMENSIONAL_IMAGE',
      tier: 'Unique',
      category: 'DIMENSIONAL_IMAGE',
      descriptionTemplate: 'Test relic',
      descriptionArgs: {},
    },
  ],
}

afterEach(() => {
  cleanup()
  closeAllDetailsInAct()
  clearDatabaseDetailRecordCacheForTests()
  vi.mocked(dbDetailRegistry.awakener.loadRecord).mockResolvedValue(mockAwakenerRecord)
  vi.mocked(dbDetailRegistry.wheel.loadRecord).mockResolvedValue(mockWheelRecord)
  vi.mocked(dbDetailRegistry.posse.loadRecord).mockResolvedValue(mockPosseRecord)
  vi.mocked(dbDetailRegistry.covenant.loadRecord).mockResolvedValue(mockCovenantRecord)
  vi.mocked(dbDetailRegistry.relic.loadRecord).mockResolvedValue(mockRelicRecord)
})

function openDetailInAct(
  detail: Parameters<ReturnType<typeof dbDetailStore.getState>['openDetail']>[0],
  source: Parameters<ReturnType<typeof dbDetailStore.getState>['openDetail']>[1],
) {
  act(() => {
    dbDetailStore.getState().openDetail(detail, source)
  })
}

function closeAllDetailsInAct() {
  act(() => {
    dbDetailStore.getState().closeAllDetails()
  })
}

function LocationProbe() {
  const location = useLocation()
  return <span data-testid='location-pathname'>{location.pathname}</span>
}

function LocationSearchProbe() {
  const location = useLocation()
  return <span data-testid='location-search'>{location.search}</span>
}

describe('DbDetailModalHost overlay entries', () => {
  it('renders an overlay without a route item and closes by popping the overlay stack', async () => {
    const callbacks = {
      onClose: vi.fn(),
      onSelectAwakener: vi.fn(),
      onSelectCovenant: vi.fn(),
      onSelectPosse: vi.fn(),
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

    openDetailInAct({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    await waitFor(() => {
      expect(screen.getByRole('dialog', {name: /goliath details/i})).toBeInTheDocument()
    })
    expect(screen.getByText('Active tab: upgrades')).toBeInTheDocument()

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
            onSelectPosse: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange: vi.fn(),
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')
    fireEvent.click(await screen.findByRole('button', {name: /^refer wheel$/i}))

    expect(
      await screen.findByRole('dialog', {name: /merciful nurturing details/i}),
    ).toBeInTheDocument()
    expect(dbDetailStore.getState().stack).toEqual([
      {kind: 'awakener', id: 'awakener-0021', source: 'builder-overlay'},
      {kind: 'wheel', id: 'wheel-0050', source: 'reference'},
    ])
  })

  it('pushes overlay wheel references by fallback normalized name when id is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={{
            onClose: vi.fn(),
            onSelectAwakener: vi.fn(),
            onSelectCovenant: vi.fn(),
            onSelectPosse: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange: vi.fn(),
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')
    fireEvent.click(await screen.findByRole('button', {name: /refer wheel by name/i}))

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
            onSelectPosse: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange,
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    expect(await screen.findByText('Active tab: upgrades')).toBeInTheDocument()
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
            onSelectPosse: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange: vi.fn(),
          }}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    await waitFor(() => {
      expect(dbDetailStore.getState().stack).toEqual([])
    })
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/builder')
  })

  it('loads and renders registered relic overlay refs', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <LocationProbe />
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={{
            onClose: vi.fn(),
            onSelectAwakener: vi.fn(),
            onSelectCovenant: vi.fn(),
            onSelectPosse: vi.fn(),
            onSelectWheel: vi.fn(),
            onTabChange: vi.fn(),
          }}
          relics={relics}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'relic', id: 'relic-0001'}, 'builder-overlay')

    expect(dbDetailStore.getState().stack).toEqual([
      {kind: 'relic', id: 'relic-0001', source: 'builder-overlay'},
    ])
    await waitFor(() => {
      expect(dbDetailRegistry.relic.loadRecord).toHaveBeenCalledWith('relic-0001')
      expect(dbDetailRegistry.relic.render).toHaveBeenCalled()
    })
    expect(
      screen.getByRole('dialog', {name: /dimensional image: "24" details/i}),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/builder')
  })
})

describe('DbDetailModalHost route entries', () => {
  it('keeps the relic modal mounted while canonicalizing its default variant', async () => {
    vi.mocked(dbDetailRegistry.relic.loadRecord).mockResolvedValue(mockRelicRecord)
    const callbacks = {
      onClose: vi.fn(),
      onSelectAwakener: vi.fn(),
      onSelectCovenant: vi.fn(),
      onSelectPosse: vi.fn(),
      onSelectWheel: vi.fn(),
      onTabChange: vi.fn(),
    }

    render(
      <MemoryRouter initialEntries={['/database/relics/dimensional-image-24']}>
        <LocationSearchProbe />
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={callbacks}
          relics={relics}
          routeItem={{kind: 'relic', item: relics[0]}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(dbDetailRegistry.relic.render).toHaveBeenCalled()
    })
    expect(
      screen.getByRole('dialog', {name: /dimensional image: "24" details/i}),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('?variant=relic-variant-0001')
    })
  })

  it('does not render a stale route-sourced stack entry as an overlay after the route closes', async () => {
    vi.mocked(dbDetailRegistry.awakener.loadRecord).mockResolvedValue(mockAwakenerRecord)
    const callbacks = {
      onClose: vi.fn(),
      onSelectAwakener: vi.fn(),
      onSelectCovenant: vi.fn(),
      onSelectPosse: vi.fn(),
      onSelectWheel: vi.fn(),
      onTabChange: vi.fn(),
    }
    const {rerender} = render(
      <MemoryRouter initialEntries={['/database/awakeners/goliath']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={callbacks}
          routeItem={{kind: 'awakener', item: awakeners[0], activeTab: 'upgrades'}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('dialog', {name: /goliath details/i})).toBeInTheDocument()
    })
    expect(dbDetailStore.getState().stack).toEqual([
      {kind: 'awakener', id: 'awakener-0021', source: 'database-route'},
    ])

    rerender(
      <MemoryRouter initialEntries={['/database']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={callbacks}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('dialog', {name: /goliath details/i})).not.toBeInTheDocument()
    await waitFor(() => {
      expect(dbDetailStore.getState().stack).toEqual([])
    })
  })

  it('keeps database modal chrome visible while a route record is still loading', async () => {
    let resolveRecord!: (record: WheelFullRecord) => void
    const pendingRecord = new Promise<WheelFullRecord>((resolve) => {
      resolveRecord = resolve
    })
    vi.mocked(dbDetailRegistry.wheel.loadRecord).mockReturnValue(pendingRecord)
    const callbacks = {
      onClose: vi.fn(),
      onSelectAwakener: vi.fn(),
      onSelectCovenant: vi.fn(),
      onSelectPosse: vi.fn(),
      onSelectWheel: vi.fn(),
      onTabChange: vi.fn(),
    }

    render(
      <MemoryRouter initialEntries={['/database/wheels/merciful-nurturing']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={callbacks}
          resultSet={{
            kind: 'wheel',
            items: [
              {id: 'wheel-0050', name: 'Merciful Nurturing'},
              {id: 'wheel-0099', name: 'Shared Dream'},
            ],
          }}
          routeItem={{kind: 'wheel', item: wheels[0]}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading wheel details...')
    expect(screen.getByLabelText('Next result: Shared Dream')).toBeInTheDocument()
    expect(document.querySelector('[data-detail-modal-shell]')).toBeInTheDocument()

    resolveRecord(mockWheelRecord)

    await waitFor(() => {
      expect(dbDetailRegistry.wheel.render).toHaveBeenCalled()
    })
    expect(screen.getByRole('dialog', {name: /merciful nurturing details/i})).toBeInTheDocument()
  })

  it('waits for the selected route record before preloading neighboring result records', async () => {
    let resolveRecord!: (record: WheelFullRecord) => void
    const pendingRecord = new Promise<WheelFullRecord>((resolve) => {
      resolveRecord = resolve
    })
    const wheelLoadRecord = vi.mocked(dbDetailRegistry.wheel.loadRecord)
    wheelLoadRecord.mockImplementation((id) => {
      if (id === 'wheel-0050') {
        return pendingRecord
      }
      return Promise.resolve({
        ...mockWheelRecord,
        id,
        name: 'Shared Dream',
      })
    })
    const callbacks = {
      onClose: vi.fn(),
      onSelectAwakener: vi.fn(),
      onSelectCovenant: vi.fn(),
      onSelectPosse: vi.fn(),
      onSelectWheel: vi.fn(),
      onTabChange: vi.fn(),
    }

    render(
      <MemoryRouter initialEntries={['/database/wheels/merciful-nurturing']}>
        <DbDetailModalHost
          awakeners={awakeners}
          callbacks={callbacks}
          resultSet={{
            kind: 'wheel',
            items: [
              {id: 'wheel-0050', name: 'Merciful Nurturing'},
              {id: 'wheel-0099', name: 'Shared Dream'},
            ],
          }}
          routeItem={{kind: 'wheel', item: wheels[0]}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(wheelLoadRecord).toHaveBeenCalledWith('wheel-0050')
    })
    expect(wheelLoadRecord).not.toHaveBeenCalledWith('wheel-0099')

    resolveRecord(mockWheelRecord)

    await waitFor(() => {
      expect(screen.getByRole('dialog', {name: /merciful nurturing details/i})).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(wheelLoadRecord).toHaveBeenCalledWith('wheel-0099')
    })
  })
})
