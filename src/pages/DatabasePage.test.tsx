import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {DatabasePage} from './DatabasePage'

let mockAwakenersFullV2 = [{id: 1}, {id: 2}, {id: 3}]
let mockLoadPromiseCache = new Map<number, Promise<{id: number} | undefined>>()
let mockWheelsFullV1 = [{id: 'B01'}, {id: 'D12'}]
let mockWheelLoadPromiseCache = new Map<string, Promise<{id: string} | undefined>>()
const wheelMockState = vi.hoisted(() => {
  const wheels = [
    {
      id: 'B01',
      assetId: 'Weapon_Full_B01',
      name: 'Merciful Nurturing',
      rarity: 'SSR',
      realm: 'CARO',
      awakener: 'alpha',
      ownerAwakenerId: 1,
      ownerAwakenerName: 'alpha',
      aliases: ['Merciful Nurturing'],
      tags: ['Caro', 'Embryo Fusion'],
      mainstatKey: 'KEYFLARE_REGEN',
    },
    {
      id: 'D12',
      assetId: 'Weapon_Full_D12',
      name: 'Shared Dream',
      rarity: 'SR',
      realm: 'CHAOS',
      awakener: '',
      aliases: ['Shared Dream'],
      tags: ['Chaos'],
      mainstatKey: 'CRIT_RATE',
    },
    {
      id: 'N07',
      assetId: 'Weapon_Full_N07',
      name: 'Quiet Orbit',
      rarity: 'R',
      realm: 'NEUTRAL',
      awakener: '',
      aliases: ['Quiet Orbit'],
      tags: ['Neutral'],
      mainstatKey: 'HP',
    },
  ] as const

  return {
    wheels,
  }
})
const mockLoadAwakenerFullV2ById = vi.fn((id: number) => {
  const cachedPromise = mockLoadPromiseCache.get(id)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = Promise.resolve(mockAwakenersFullV2.find((entry) => entry.id === id))
  mockLoadPromiseCache.set(id, recordPromise)

  return recordPromise
})
const mockLoadWheelFullV1ById = vi.fn((id: string) => {
  const cachedPromise = mockWheelLoadPromiseCache.get(id)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = Promise.resolve(mockWheelsFullV1.find((entry) => entry.id === id))
  mockWheelLoadPromiseCache.set(id, recordPromise)

  return recordPromise
})

vi.mock('../domain/awakeners', () => ({
  getAwakeners: () => [
    {
      id: 1,
      name: 'alpha',
      faction: 'The Fools',
      realm: 'CHAOS',
      rarity: 'SSR',
      type: 'ASSAULT',
      aliases: ['alpha'],
      stats: {CON: 100, ATK: 200, DEF: 80},
      tags: ['Bleed', 'Crit'],
    },
    {
      id: 2,
      name: 'beta',
      faction: 'Outlanders',
      realm: 'AEQUOR',
      rarity: 'SR',
      type: 'WARDEN',
      aliases: ['beta'],
      stats: {CON: 150, ATK: 90, DEF: 180},
      tags: ['Draw', 'STR Up'],
    },
    {
      id: 3,
      name: 'gamma',
      faction: 'Hybrid',
      realm: 'CHAOS',
      rarity: 'Genesis',
      type: 'CHORUS',
      aliases: ['gamma'],
      stats: {CON: 120, ATK: 150, DEF: 130},
      tags: ['Heal', 'Bleed'],
    },
  ],
}))

vi.mock('../domain/awakeners-full-v2-loader', () => ({
  loadAwakenerFullV2ById: (id: number) => mockLoadAwakenerFullV2ById(id),
}))

vi.mock('../domain/wheels', () => ({
  getWheels: () => wheelMockState.wheels,
}))

vi.mock('../domain/wheels-full-v1-loader', () => ({
  loadWheelFullV1ById: (id: string) => mockLoadWheelFullV1ById(id),
}))

vi.mock('../domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
  getAwakenerPortraitAsset: () => null,
}))

vi.mock('../domain/realms', () => ({
  getRealmIcon: () => null,
  getRealmLabel: (realm: string) => realm,
  getRealmAccent: () => '#ffffff',
}))

vi.mock('../domain/mainstats', () => ({
  getMainstatIcon: () => null,
  getMainstatByKey: (key: string) => ({label: key}),
  getWheelFilterMainstats: () => [
    {key: 'CRIT_RATE', label: 'CRIT_RATE', iconId: '001'},
    {key: 'KEYFLARE_REGEN', label: 'KEYFLARE_REGEN', iconId: '002'},
  ],
  MAINSTAT_ICON_BY_ID: {},
}))

vi.mock('./database/AwakenerDetailModal', () => ({
  AwakenerDetailModal: ({
    activeTab = 'overview',
    awakener,
    onClose,
    onSelectAwakener,
    onTabChange,
  }: {
    activeTab?: 'overview' | 'skills' | 'builds' | 'teams'
    awakener: {id: number; name: string}
    onClose: () => void
    onSelectAwakener: (
      awakener: {id: number; name: string},
      tab: 'overview' | 'skills' | 'builds' | 'teams',
    ) => void
    onTabChange: (tab: 'overview' | 'skills' | 'builds' | 'teams') => void
  }) => (
    <div aria-label={`${awakener.name} details`} role='dialog'>
      <div>{`Active tab ${activeTab}`}</div>
      <button
        aria-label='Switch to builds tab'
        onClick={() => {
          onTabChange('builds')
        }}
        type='button'
      >
        Builds
      </button>
      <button
        aria-label='Switch to beta detail'
        onClick={() => {
          onSelectAwakener({id: 2, name: 'beta'}, activeTab)
        }}
        type='button'
      >
        Beta
      </button>
      <button aria-label='Close detail' onClick={onClose} type='button'>
        Close
      </button>
    </div>
  ),
}))

vi.mock('./database/WheelDetailModal', () => ({
  WheelDetailModal: ({
    onClose,
    onSelectAwakener,
    onSelectWheel,
    wheel,
  }: {
    wheel: {id: string; name: string}
    onClose: () => void
    onSelectAwakener?: (
      awakener: {id: number; name: string},
      tab?: 'overview' | 'skills' | 'builds' | 'teams',
    ) => void
    onSelectWheel?: (wheel: {name: string}) => void
  }) => (
    <div aria-label={`${wheel.name} details`} role='dialog'>
      <button
        aria-label='Switch to alpha awakener detail'
        onClick={() => {
          onSelectAwakener?.({id: 1, name: 'alpha'}, 'overview')
        }}
        type='button'
      >
        Alpha
      </button>
      <button
        aria-label='Switch to Shared Dream detail'
        onClick={() => {
          onSelectWheel?.({name: 'Shared Dream'})
        }}
        type='button'
      >
        Shared Dream
      </button>
      <button aria-label='Close wheel detail' onClick={onClose} type='button'>
        Close wheel
      </button>
    </div>
  ),
}))

afterEach(() => {
  vi.restoreAllMocks()
  mockAwakenersFullV2 = [{id: 1}, {id: 2}, {id: 3}]
  mockLoadPromiseCache = new Map()
  mockWheelsFullV1 = [{id: 'B01'}, {id: 'D12'}]
  mockWheelLoadPromiseCache = new Map()
  mockLoadAwakenerFullV2ById.mockClear()
  mockLoadWheelFullV1ById.mockClear()
})

function getResultsSummary(expectedText: string) {
  return screen.getByText((_, element) => element?.textContent === expectedText)
}

async function renderDatabasePage(
  initialEntryOrEntries: string | string[] = '/database',
  initialIndex?: number,
) {
  function LocationProbe() {
    const location = useLocation()
    return (
      <>
        <div data-testid='location-path'>{location.pathname}</div>
        <div data-testid='location-search'>{location.search}</div>
      </>
    )
  }

  function HistoryBackButton() {
    const navigate = useNavigate()

    return (
      <button
        aria-label='Go back in history'
        onClick={() => {
          void navigate(-1)
        }}
        type='button'
      >
        Back
      </button>
    )
  }

  const initialEntries = Array.isArray(initialEntryOrEntries)
    ? initialEntryOrEntries
    : [initialEntryOrEntries]

  let renderResult: ReturnType<typeof render> | null = null

  await act(async () => {
    renderResult = render(
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <Routes>
          <Route element={<DatabasePage />} path='/database' />
          <Route element={<DatabasePage />} path='/database/awk/:awakenerSlug' />
          <Route element={<DatabasePage />} path='/database/awk/:awakenerSlug/:tabSlug' />
          <Route element={<DatabasePage />} path='/database/wheels' />
          <Route element={<DatabasePage />} path='/database/wheels/:wheelSlug' />
        </Routes>
        <HistoryBackButton />
        <LocationProbe />
      </MemoryRouter>,
    )
  })

  return renderResult
}

describe('DatabasePage', () => {
  it('renders database beta banner', async () => {
    await renderDatabasePage()

    expect(screen.getByText('Database beta:')).toBeInTheDocument()
    expect(screen.getByText(/Search, filters, and detail views are live\./)).toBeInTheDocument()
  })

  it('renders all awakeners in the grid by default', async () => {
    await renderDatabasePage()

    expect(screen.getByLabelText('Search awakeners')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Alpha')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Beta')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Gamma')).toBeInTheDocument()
    expect(getResultsSummary('3 awakeners')).toBeInTheDocument()
  })

  it('filters awakeners by realm', async () => {
    await renderDatabasePage()

    const chaosFilter = screen.getByRole('button', {name: /^CHAOS$/})
    fireEvent.click(chaosFilter)

    expect(screen.getByLabelText('View details for Alpha')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Gamma')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Beta')).not.toBeInTheDocument()
    expect(getResultsSummary('2 of 3')).toBeInTheDocument()
    expect(chaosFilter).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen
        .getAllByRole('button', {name: 'All'})
        .some((button) => button.getAttribute('aria-pressed') === 'false'),
    ).toBe(true)
  })

  it('filters awakeners by type', async () => {
    await renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /Warden/}))

    expect(screen.getByLabelText('View details for Beta')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Alpha')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Gamma')).not.toBeInTheDocument()
    expect(getResultsSummary('1 of 3')).toBeInTheDocument()
  })

  it('filters awakeners by rarity', async () => {
    await renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /Genesis/}))

    expect(screen.getByLabelText('View details for Gamma')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Alpha')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Beta')).not.toBeInTheDocument()
  })

  it('filters awakeners via search input', async () => {
    await renderDatabasePage()

    const searchbox = screen.getByRole('searchbox')
    fireEvent.change(searchbox, {target: {value: 'alpha'}})

    expect(screen.getByLabelText('View details for Alpha')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Beta')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Gamma')).not.toBeInTheDocument()
  })

  it('initializes browse filters and search from query params', async () => {
    await renderDatabasePage('/database?q=alpha&realm=CHAOS&sort=ATK&dir=DESC')

    expect(screen.getByRole('searchbox')).toHaveValue('alpha')
    expect(screen.getByRole('button', {name: /^CHAOS$/})).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Database sort key')).toHaveValue('ATK')
    expect(screen.getByLabelText('View details for Alpha')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Beta')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Gamma')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?q=alpha&realm=CHAOS&sort=ATK&dir=DESC',
    )
  })

  it('writes browse control changes back into query params', async () => {
    await renderDatabasePage()

    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'beta'}})
    fireEvent.click(screen.getByRole('button', {name: /AEQUOR/}))
    fireEvent.change(screen.getByLabelText('Database sort key'), {target: {value: 'ATK'}})
    fireEvent.click(screen.getByLabelText('Toggle database sort direction'))

    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?q=beta&realm=AEQUOR&sort=ATK&dir=DESC',
    )
  })

  it('pushes discrete browse refinements into browser history', async () => {
    await renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /AEQUOR/}))
    fireEvent.change(screen.getByLabelText('Database sort key'), {target: {value: 'ATK'}})
    fireEvent.click(screen.getByLabelText('Toggle database sort direction'))

    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?realm=AEQUOR&sort=ATK&dir=DESC',
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    await waitFor(() =>
      expect(screen.getByTestId('location-search')).toHaveTextContent('?realm=AEQUOR&sort=ATK'),
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    await waitFor(() =>
      expect(screen.getByTestId('location-search')).toHaveTextContent('?realm=AEQUOR'),
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent(''))
  })

  it('keeps live search typing as replace-style history updates', async () => {
    await renderDatabasePage(['/database', '/database'], 1)

    const searchbox = screen.getByRole('searchbox')
    fireEvent.change(searchbox, {target: {value: 'a'}})
    fireEvent.change(searchbox, {target: {value: 'al'}})
    fireEvent.change(searchbox, {target: {value: 'alp'}})

    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alp')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent(''))
  })

  it('filters awakeners by tag search', async () => {
    await renderDatabasePage()

    const searchbox = screen.getByRole('searchbox')
    fireEvent.change(searchbox, {target: {value: 'STR Up'}})

    expect(screen.getByLabelText('View details for Beta')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Alpha')).not.toBeInTheDocument()
  })

  it('shows empty state when all awakeners are filtered out', async () => {
    await renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /AEQUOR/}))
    fireEvent.click(screen.getByRole('button', {name: /Genesis/}))

    expect(screen.getByText('No awakeners match the current filters.')).toBeInTheDocument()
  })

  it('opens detail modal when clicking an awakener card', async () => {
    await renderDatabasePage()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('View details for Alpha'))
    })

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha')
  })

  it('pushes detail open into browser history instead of replacing the browse page', async () => {
    await renderDatabasePage()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('View details for Alpha'))
    })

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database')
  })

  it('preserves browse query params when opening and closing detail routes', async () => {
    await renderDatabasePage('/database?q=alpha&realm=CHAOS')

    await act(async () => {
      fireEvent.click(screen.getByLabelText('View details for Alpha'))
    })

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alpha&realm=CHAOS')

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Close detail'))
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alpha&realm=CHAOS')
  })

  it('closes detail modal via close button', async () => {
    await renderDatabasePage()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('View details for Alpha'))
    })
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Close detail'))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database')
  })

  it('opens detail modal from deep-linked awakener route', async () => {
    await renderDatabasePage('/database/awk/beta')

    expect(await screen.findByRole('dialog', {name: /beta details/})).toBeInTheDocument()
  })

  it('opens detail modal from deep-linked awakener tab route', async () => {
    await renderDatabasePage('/database/awk/beta/builds')

    expect(await screen.findByRole('dialog', {name: /beta details/})).toBeInTheDocument()
    expect(screen.getByText('Active tab builds')).toBeInTheDocument()
  })

  it('opens the skills tab from the renamed awakener detail route slug', async () => {
    await renderDatabasePage('/database/awk/beta/skills')

    expect(await screen.findByRole('dialog', {name: /beta details/})).toBeInTheDocument()
    expect(screen.getByText('Active tab skills')).toBeInTheDocument()
  })

  it('updates url when switching detail tabs', async () => {
    await renderDatabasePage('/database/awk/alpha')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Switch to builds tab'))
    })

    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha/builds')
  })

  it('pushes detail tab changes into browser history', async () => {
    await renderDatabasePage('/database/awk/alpha')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Switch to builds tab'))
    })

    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha/builds')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha'),
    )
    expect(screen.getByText('Active tab overview')).toBeInTheDocument()
  })

  it('pushes modal awakener switches into browser history', async () => {
    await renderDatabasePage('/database/awk/alpha')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Switch to beta detail'))
    })

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/beta'),
    )
    expect(screen.getByRole('dialog', {name: /beta details/})).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha'),
    )
    expect(screen.getByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
  })

  it('falls back to the database root when deep link slug is unknown', async () => {
    await renderDatabasePage('/database/awk/missing')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/database'))
  })

  it('falls back to the database root when a deep-linked awakener is missing V2 data', async () => {
    mockAwakenersFullV2 = [{id: 1}, {id: 3}]
    mockLoadPromiseCache = new Map()

    await renderDatabasePage('/database/awk/beta')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/database'))
  })

  it('falls back to the awakener overview route when deep link tab is unknown', async () => {
    await renderDatabasePage('/database/awk/alpha/missing')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByText('Active tab overview')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha'),
    )
  })

  it('canonicalizes legacy cards tab routes onto the skills slug', async () => {
    await renderDatabasePage('/database/awk/alpha/cards')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByText('Active tab skills')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha/skills'),
    )
  })

  it('canonicalizes mixed-case legacy tab routes onto the skills slug', async () => {
    await renderDatabasePage('/database/awk/alpha/Cards')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByText('Active tab skills')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha/skills'),
    )
  })

  it('opens wheel browse routes inside the database shell', async () => {
    await renderDatabasePage('/database/wheels')

    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/wheels')
    expect(screen.getByLabelText('Search wheels')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Merciful Nurturing')).toBeInTheDocument()
  })

  it('opens a wheel detail modal from the wheel browse grid and closes back to wheel browse', async () => {
    await renderDatabasePage('/database/wheels')

    await act(async () => {
      fireEvent.click(screen.getByLabelText('View details for Merciful Nurturing'))
    })

    expect(
      await screen.findByRole('dialog', {name: /merciful nurturing details/i}),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/database/wheels/merciful-nurturing',
    )

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Close wheel detail'))
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/wheels')
  })

  it('opens wheel detail modal from a deep-linked wheel route', async () => {
    await renderDatabasePage('/database/wheels/merciful-nurturing')

    expect(
      await screen.findByRole('dialog', {name: /merciful nurturing details/i}),
    ).toBeInTheDocument()
  })

  it('falls back to the wheel browse route when deep link wheel slug is unknown', async () => {
    await renderDatabasePage('/database/wheels/missing')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/wheels'),
    )
  })

  it('preserves search params when switching from a wheel modal to an awakener modal', async () => {
    await renderDatabasePage('/database/wheels/merciful-nurturing?q=merciful&realm=CARO')

    expect(
      await screen.findByRole('dialog', {name: /merciful nurturing details/i}),
    ).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Switch to alpha awakener detail'))
    })

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha'),
    )
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=merciful&realm=CARO')
  })

  it('preserves search params when switching from a wheel modal to another wheel modal', async () => {
    await renderDatabasePage('/database/wheels/merciful-nurturing?q=merciful&realm=CARO')

    expect(
      await screen.findByRole('dialog', {name: /merciful nurturing details/i}),
    ).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Switch to Shared Dream detail'))
    })

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent(
        '/database/wheels/shared-dream',
      ),
    )
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=merciful&realm=CARO')
  })

  it('filters wheels by the neutral realm without affecting other wheel routes', async () => {
    await renderDatabasePage('/database/wheels')

    fireEvent.click(screen.getByRole('button', {name: 'NEUTRAL'}))

    expect(screen.getByLabelText('View details for Quiet Orbit')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Merciful Nurturing')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Shared Dream')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-search')).toHaveTextContent('?realm=NEUTRAL')
  })

  it('sorts awakeners by ATK stat descending', async () => {
    await renderDatabasePage()

    const sortSelect = screen.getByLabelText('Database sort key')
    fireEvent.change(sortSelect, {target: {value: 'ATK'}})

    fireEvent.click(screen.getByLabelText('Toggle database sort direction'))

    const cards = screen.getAllByLabelText(/View details for/)
    const names = cards.map((card) => card.getAttribute('aria-label'))

    expect(names).toEqual([
      'View details for Alpha',
      'View details for Gamma',
      'View details for Beta',
    ])
  })
})
