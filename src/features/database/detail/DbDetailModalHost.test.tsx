import {useMemo, useState} from 'react'

import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, useLocation} from 'react-router'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {AwakenerDatabaseSelection} from '@/domain/awakener-database-state'
import type {CovenantFullRecord} from '@/domain/covenants-full'
import type {PosseFullRecord} from '@/domain/posses-full'
import type {PublicRelicRecord, Relic} from '@/domain/relics'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {useAwakenerDetailSession} from '@/features/database/internal/awakener-detail-session'
import {makeTestAwakenerFullRecord} from '@/features/database/internal/database-test-fixtures'
import {clearDatabaseDetailRecordCacheForTests} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {createDatabaseDetailOverlaySession} from '@/stores/dbDetailStore'

import {DbDetailModalHost} from './DbDetailModalHost'
import {
  dbDetailRegistry,
  type DatabaseDetailNavigationPort,
  type DatabaseDetailNavigationState,
} from './dbDetailRegistry'

interface MockDetailRenderOptions {
  navigationPort: DatabaseDetailNavigationPort
  item: {
    activeTab?: string
    item: {
      name: string
    }
    variantId?: string
  }
}

const DEFAULT_SESSION_SELECTION: AwakenerDatabaseSelection = {
  awakenerLevel: 60,
  gnosticPotentialLevel: 0,
  psycheSurgeOffset: 0,
  selectedEnlightenSlot: null,
  skillLevel: 1,
  soulforgeLevel: 0,
}

function SessionBackedAwakenerDetail({item, navigationPort}: MockDetailRenderOptions) {
  const session = useAwakenerDetailSession()
  const selection = session?.selection ?? DEFAULT_SESSION_SELECTION

  return (
    <dialog aria-label={`${item.item.name} details`} open>
      <div>{`Active tab ${String(item.activeTab)}`}</div>
      <div>{`Live level ${String(selection.awakenerLevel)}`}</div>
      <button
        aria-label='Set live level'
        onClick={() => {
          session?.onSelectionChange({...selection, awakenerLevel: 90})
        }}
        type='button'
      >
        Set live level
      </button>
      <button
        aria-label='Switch to lore tab'
        onClick={() => {
          navigationPort.updateState({tab: 'lore'})
        }}
        type='button'
      >
        Show lore
      </button>
    </dialog>
  )
}

vi.mock('./dbDetailRegistry', async () => {
  const actual = await vi.importActual<typeof import('./dbDetailRegistry')>('./dbDetailRegistry')

  const dbDetailRegistry = {
    awakener: {
      ...actual.dbDetailRegistry.awakener,
      loadRecord: vi.fn(async (_id: string) => ({id: 'record-awakener'})),
      loadingLabel: 'Loading awakener details...',
      missingBrowsePath: '/database',
      render: vi.fn(({navigationPort, item}: MockDetailRenderOptions) => (
        <dialog aria-label={`${item.item.name} details`} open>
          <button onClick={navigationPort.close} type='button'>
            Close overlay
          </button>
          <button
            onClick={() => {
              navigationPort.select({kind: 'wheel', id: 'wheel-0050'})
            }}
            type='button'
          >
            Refer wheel
          </button>
          <button
            onClick={() => {
              navigationPort.select({kind: 'wheel', id: 'wheel-0050'})
            }}
            type='button'
          >
            Refer wheel by name
          </button>
          <span>Active tab: {item.activeTab}</span>
          <button
            onClick={() => {
              navigationPort.updateState({tab: 'skills'})
            }}
            type='button'
          >
            Show skills tab
          </button>
        </dialog>
      )),
    },
    wheel: {
      ...actual.dbDetailRegistry.wheel,
      loadRecord: vi.fn(async (_id: string) => ({id: 'record-wheel'})),
      loadingLabel: 'Loading wheel details...',
      missingBrowsePath: '/database/wheels',
      render: vi.fn(({navigationPort, item}: MockDetailRenderOptions) => (
        <dialog aria-label={`${item.item.name} details`} open>
          <button onClick={navigationPort.close} type='button'>
            Close overlay
          </button>
        </dialog>
      )),
    },
    posse: {
      ...actual.dbDetailRegistry.posse,
      loadRecord: vi.fn(async (_id: string) => ({id: 'record-posse'})),
      loadingLabel: 'Loading posse details...',
      missingBrowsePath: '/database/posses',
      render: vi.fn(({navigationPort, item}: MockDetailRenderOptions) => (
        <dialog aria-label={`${item.item.name} details`} open>
          <button onClick={navigationPort.close} type='button'>
            Close overlay
          </button>
        </dialog>
      )),
    },
    covenant: {
      ...actual.dbDetailRegistry.covenant,
      loadRecord: vi.fn(async (_id: string) => ({id: 'record-covenant'})),
      loadingLabel: 'Loading covenant details...',
      missingBrowsePath: '/database/covenants',
      render: vi.fn(({navigationPort, item}: MockDetailRenderOptions) => (
        <dialog aria-label={`${item.item.name} details`} open>
          <button onClick={navigationPort.close} type='button'>
            Close overlay
          </button>
        </dialog>
      )),
    },
    relic: {
      ...actual.dbDetailRegistry.relic,
      loadRecord: vi.fn(async (_id: string) => ({id: 'record-relic'})),
      loadingLabel: 'Loading relic details...',
      missingBrowsePath: '/database/relics',
      render: vi.fn(({navigationPort, item}: MockDetailRenderOptions) => (
        <dialog aria-label={`${item.item.name} details`} open>
          <button onClick={navigationPort.close} type='button'>
            Close overlay
          </button>
        </dialog>
      )),
    },
  }

  return {
    ...actual,
    dbDetailRegistry,
    preloadDatabaseDetailRecordByKind: vi.fn(
      (kind: keyof typeof dbDetailRegistry, id: string) =>
        void dbDetailRegistry[kind].loadRecord(id),
    ),
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
    defaultVariantCategory: 'DIMENSIONAL_IMAGE',
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

const overlaySession = createDatabaseDetailOverlaySession()

function openDetailInAct(detail: Parameters<typeof overlaySession.open>[0], _source?: unknown) {
  act(() => {
    overlaySession.open(detail)
  })
}

function closeAllDetailsInAct() {
  act(() => {
    while (overlaySession.isOpen()) overlaySession.close()
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

function createNavigationPort() {
  return {close: vi.fn(), select: vi.fn(), updateState: vi.fn()}
}

describe('DbDetailModalHost overlay entries', () => {
  it('renders an overlay without a route item and closes by popping the overlay stack', async () => {
    const navigationPort = createNavigationPort()

    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={navigationPort}
          overlaySession={overlaySession}
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
    expect(overlaySession.isOpen()).toBe(false)
    expect(navigationPort.close).not.toHaveBeenCalled()
  })

  it('pushes overlay references from overlay modal callbacks', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={createNavigationPort()}
          overlaySession={overlaySession}
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
    expect(overlaySession.top()).toEqual({kind: 'wheel', id: 'wheel-0050'})
  })

  it('pushes overlay wheel references by fallback normalized name when id is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={createNavigationPort()}
          overlaySession={overlaySession}
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
    expect(overlaySession.top()).toEqual({kind: 'wheel', id: 'wheel-0050'})
  })

  it('keeps awakener overlay tab state local to the modal host', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={createNavigationPort()}
          overlaySession={overlaySession}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    expect(await screen.findByText('Active tab: upgrades')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /show skills tab/i}))

    expect(await screen.findByText('Active tab: skills')).toBeInTheDocument()
  })

  it('pops missing overlay records without navigating away from the current page', async () => {
    vi.mocked(dbDetailRegistry.awakener.loadRecord).mockResolvedValue(undefined)

    render(
      <MemoryRouter initialEntries={['/builder']}>
        <LocationProbe />
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={createNavigationPort()}
          overlaySession={overlaySession}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'awakener', id: 'awakener-0021'}, 'builder-overlay')

    await waitFor(() => {
      expect(overlaySession.isOpen()).toBe(false)
    })
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/builder')
  })

  it('loads and renders registered relic overlay refs', async () => {
    render(
      <MemoryRouter initialEntries={['/builder']}>
        <LocationProbe />
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={createNavigationPort()}
          overlaySession={overlaySession}
          relics={relics}
          routeItem={null}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    openDetailInAct({kind: 'relic', id: 'relic-0001'}, 'builder-overlay')

    expect(overlaySession.top()).toEqual({kind: 'relic', id: 'relic-0001'})
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
  it('preserves an awakener session when route-backed detail content remounts', async () => {
    function RouteBackedAwakenerHost() {
      const [activeTab, setActiveTab] = useState<'skills' | 'lore'>('skills')
      const navigationPort = useMemo(
        () => ({
          close: vi.fn(),
          select: vi.fn(),
          updateState: (state: DatabaseDetailNavigationState) => {
            if (state.tab === 'skills' || state.tab === 'lore') {
              setActiveTab(state.tab)
            }
          },
        }),
        [],
      )

      return (
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={navigationPort}
          routeItem={{kind: 'awakener', item: awakeners[0], activeTab}}
          wheels={wheels}
        />
      )
    }

    await vi.mocked(dbDetailRegistry.awakener.render).withImplementation(
      (options) => <SessionBackedAwakenerDetail key={options.item.activeTab} {...options} />,
      async () => {
        render(
          <MemoryRouter initialEntries={['/database/awakeners/goliath/skills']}>
            <RouteBackedAwakenerHost />
          </MemoryRouter>,
        )

        await waitFor(() => {
          expect(dbDetailRegistry.awakener.render).toHaveBeenCalled()
        })
        expect(await screen.findByRole('dialog', {name: /goliath details/i})).toBeInTheDocument()
        expect(screen.getByText('Live level 60')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', {name: 'Set live level'}))
        expect(screen.getByText('Live level 90')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', {name: 'Switch to lore tab'}))

        await waitFor(() => {
          expect(screen.getByText('Active tab lore')).toBeInTheDocument()
          expect(screen.getByText('Live level 90')).toBeInTheDocument()
        })
      },
    )
  })

  it('renders the filter-preferred relic variant on its first committed frame', async () => {
    const goldVariantId = 'relic-variant-0002'
    vi.mocked(dbDetailRegistry.relic.render).mockClear()
    vi.mocked(dbDetailRegistry.relic.loadRecord).mockResolvedValue({
      ...mockRelicRecord,
      categories: ['ASTRAL_REIGN'],
      relicType: 'Relic',
      variantCount: 2,
      variantCategoryTiers: [
        {category: 'ASTRAL_REIGN', tier: 'Silver'},
        {category: 'ASTRAL_REIGN', tier: 'Gold'},
      ],
      variantTiers: ['Silver', 'Gold'],
      variants: [
        {
          ...mockRelicRecord.variants[0],
          category: 'ASTRAL_REIGN',
          label: 'Astral Reign - Silver',
          tier: 'Silver',
          variantType: 'STANDARD',
        },
        {
          ...mockRelicRecord.variants[0],
          category: 'ASTRAL_REIGN',
          id: goldVariantId,
          label: 'Astral Reign - Gold',
          tier: 'Gold',
          variantType: 'STANDARD',
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/database/relics/dimensional-image-24?tier=GOLD']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={createNavigationPort()}
          relics={relics}
          routeItem={{kind: 'relic', item: relics[0]}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(dbDetailRegistry.relic.render).toHaveBeenCalled()
    })
    expect(vi.mocked(dbDetailRegistry.relic.render).mock.calls[0]?.[0].item.variantId).toBe(
      goldVariantId,
    )
  })

  it('renders the family default on the first frame for a foreign relic variant', async () => {
    vi.mocked(dbDetailRegistry.relic.render).mockClear()
    vi.mocked(dbDetailRegistry.relic.loadRecord).mockResolvedValue(mockRelicRecord)

    render(
      <MemoryRouter
        initialEntries={['/database/relics/dimensional-image-24?variant=relic-variant-9999']}
      >
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={createNavigationPort()}
          relics={relics}
          routeItem={{kind: 'relic', item: relics[0], variantId: 'relic-variant-9999'}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(dbDetailRegistry.relic.render).toHaveBeenCalled()
    })
    expect(vi.mocked(dbDetailRegistry.relic.render).mock.calls[0]?.[0].item.variantId).toBe(
      mockRelicRecord.defaultVariantId,
    )
  })

  it('keeps the relic modal mounted while canonicalizing its default variant', async () => {
    vi.mocked(dbDetailRegistry.relic.loadRecord).mockResolvedValue(mockRelicRecord)
    const navigationPort = createNavigationPort()

    render(
      <MemoryRouter initialEntries={['/database/relics/dimensional-image-24']}>
        <LocationSearchProbe />
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={navigationPort}
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

  it('keeps database modal chrome visible while a route record is still loading', async () => {
    let resolveRecord!: (record: WheelFullRecord) => void
    const pendingRecord = new Promise<WheelFullRecord>((resolve) => {
      resolveRecord = resolve
    })
    vi.mocked(dbDetailRegistry.wheel.loadRecord).mockReturnValue(pendingRecord)
    const navigationPort = createNavigationPort()

    render(
      <MemoryRouter initialEntries={['/database/wheels/merciful-nurturing']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={navigationPort}
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

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.getByLabelText('Next result: Shared Dream')).toBeInTheDocument()
    expect(document.querySelector('[data-detail-modal-shell]')).toBeInTheDocument()

    resolveRecord(mockWheelRecord)

    await waitFor(() => {
      expect(dbDetailRegistry.wheel.render).toHaveBeenCalled()
    })
    expect(screen.getByRole('dialog', {name: /merciful nurturing details/i})).toBeInTheDocument()
  })

  it('shows a bounded route-record error and retries the failed load', async () => {
    const wheelLoadRecord = vi.mocked(dbDetailRegistry.wheel.loadRecord)
    const callsBeforeRender = wheelLoadRecord.mock.calls.length
    wheelLoadRecord
      .mockRejectedValueOnce(new Error('controlled route-record failure'))
      .mockResolvedValueOnce(mockWheelRecord)
    const navigationPort = createNavigationPort()

    render(
      <MemoryRouter initialEntries={['/database/wheels/merciful-nurturing']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={navigationPort}
          routeItem={{kind: 'wheel', item: wheels[0]}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Close details'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Retry loading details'}))

    await waitFor(() => {
      expect(dbDetailRegistry.wheel.render).toHaveBeenCalled()
    })
    expect(wheelLoadRecord.mock.calls).toHaveLength(callsBeforeRender + 2)
  })

  it('closes the route-loading modal with Escape', () => {
    vi.mocked(dbDetailRegistry.wheel.loadRecord).mockReturnValue(new Promise(() => undefined))
    const navigationPort = createNavigationPort()

    render(
      <MemoryRouter initialEntries={['/database/wheels/merciful-nurturing']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={navigationPort}
          routeItem={{kind: 'wheel', item: wheels[0]}}
          wheels={wheels}
        />
      </MemoryRouter>,
    )

    fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'})

    expect(navigationPort.close).toHaveBeenCalledTimes(1)
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
    const navigationPort = createNavigationPort()

    render(
      <MemoryRouter initialEntries={['/database/wheels/merciful-nurturing']}>
        <DbDetailModalHost
          awakeners={awakeners}
          navigationPort={navigationPort}
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
