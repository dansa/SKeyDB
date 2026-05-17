/// <reference types="node" />

import '@testing-library/jest-dom/vitest'

import {Suspense} from 'react'

import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, Routes, useLocation, useNavigate} from 'react-router-dom'
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest'

import {createMockPublicCatalog, createMockPublicDetailLoaders} from '@/test/publicCatalogFixtures'

import {DatabaseRouteElements} from './routes'

const mockPublicCatalog = createMockPublicCatalog()
const mockPublicDetailLoaders = createMockPublicDetailLoaders()

vi.mock('@/domain/awakeners', () => ({
  getAwakeners: () => mockPublicCatalog.awakeners,
  resolveAwakenerLiteStatsForLevel: (awakener: {stats?: {CON: number; ATK: number; DEF: number}}) =>
    awakener.stats,
}))

vi.mock('@/domain/wheels', () => ({
  getWheels: () => mockPublicCatalog.wheels,
  getWheelMainstatLabel: (wheel: {mainstatKey: string}) => wheel.mainstatKey,
}))

vi.mock('@/domain/posses', () => ({
  getPosses: () => mockPublicCatalog.posses,
}))

vi.mock('@/domain/covenants', () => ({
  getCovenants: () => mockPublicCatalog.covenants,
}))

vi.mock('@/domain/public-detail-record-adapters', () => ({
  loadPublicAwakenerDetailById: (id: string) =>
    mockPublicDetailLoaders.loadPublicAwakenerDetailById(id),
  loadPublicWheelDetailById: (id: string) => mockPublicDetailLoaders.loadPublicWheelDetailById(id),
  loadPublicPosseDetailById: (id: string) => mockPublicDetailLoaders.loadPublicPosseDetailById(id),
  loadPublicCovenantDetailById: (id: string) =>
    mockPublicDetailLoaders.loadPublicCovenantDetailById(id),
}))

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
  getAwakenerPortraitAsset: () => null,
}))

vi.mock('@/domain/posse-assets', () => ({
  getPosseBadgeAssetById: () => null,
}))

vi.mock('@/domain/covenant-assets', () => ({
  getCovenantAssetById: () => null,
}))

vi.mock('@/domain/realms', () => ({
  DEFAULT_REALM_ACCENT: '#ffffff',
  getRealmBadge: () => null,
  getRealmIcon: () => null,
  getRealmLabel: (realm: string) => realm,
  getRealmAccent: () => '#ffffff',
}))

vi.mock('@/domain/mainstats', () => ({
  getMainstatIcon: () => null,
  getMainstatByKey: (key: string) => ({label: key}),
  getWheelFilterMainstats: () => [
    {key: 'CRIT_RATE', label: 'CRIT_RATE', iconId: '001'},
    {key: 'KEYFLARE_REGEN', label: 'KEYFLARE_REGEN', iconId: '002'},
  ],
  MAINSTAT_ICON_BY_ID: {},
}))

vi.mock('@/features/database/internal/AwakenerDetailModal', () => ({
  AwakenerDetailModal: ({
    activeTab = 'overview',
    awakener,
    onClose,
    onSelectAwakener,
    onTabChange,
  }: {
    activeTab?: 'overview' | 'upgrades' | 'skills' | 'builds' | 'teams'
    awakener: {id: string; name: string}
    onClose: () => void
    onSelectAwakener: (
      awakener: {id: string; name: string},
      tab: 'overview' | 'upgrades' | 'skills' | 'builds' | 'teams',
    ) => void
    onTabChange: (tab: 'overview' | 'upgrades' | 'skills' | 'builds' | 'teams') => void
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
          onSelectAwakener({id: 'awakener-0002', name: 'beta'}, activeTab)
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

vi.mock('@/features/database/internal/WheelDetailModal', () => ({
  WheelDetailModal: ({
    onClose,
    onSelectAwakener,
    onSelectWheel,
    wheel,
  }: {
    wheel: {id: string; name: string}
    onClose: () => void
    onSelectAwakener?: (
      awakener: {id: string; name: string},
      tab?: 'overview' | 'upgrades' | 'skills' | 'builds' | 'teams',
    ) => void
    onSelectWheel?: (wheel: {name: string}) => void
  }) => (
    <div aria-label={`${wheel.name} details`} role='dialog'>
      <button
        aria-label='Switch to alpha awakener detail'
        onClick={() => {
          onSelectAwakener?.({id: 'awakener-0001', name: 'alpha'}, 'overview')
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

vi.mock('@/features/database/internal/SimpleArtifactDetailModal', () => ({
  SimpleArtifactDetailModal: ({
    item,
    kind,
    onClose,
  }: {
    item: {name: string}
    kind: 'posse' | 'covenant'
    onClose: () => void
  }) => (
    <div aria-label={`${item.name} ${kind} details`} role='dialog'>
      <button aria-label={`Close ${kind} detail`} onClick={onClose} type='button'>
        Close {kind}
      </button>
    </div>
  ),
}))

beforeAll(async () => {
  await import('./DatabasePage')
})

afterEach(() => {
  vi.restoreAllMocks()
  mockPublicDetailLoaders.reset()
})

function getResultsSummary(expectedText: string) {
  return screen.getByText((_, element) => element?.textContent === expectedText)
}

async function expectAwakenerDetailRouteEndState({
  dialogName,
  path,
  tab,
}: {
  dialogName: RegExp
  path: string
  tab: 'overview' | 'upgrades' | 'skills' | 'builds' | 'teams'
}) {
  await waitFor(() => {
    expect(screen.getByRole('dialog', {name: dialogName})).toBeInTheDocument()
    expect(screen.getByText(`Active tab ${tab}`)).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent(path)
  })
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
        <Suspense fallback={null}>
          <Routes>{DatabaseRouteElements}</Routes>
        </Suspense>
        <HistoryBackButton />
        <LocationProbe />
      </MemoryRouter>,
    )
  })

  await screen.findByText('Database beta:')

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

  it('pushes detail open into browser history instead of replacing the browse page', async () => {
    await renderDatabasePage()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('View details for Alpha'))
    })

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/alpha')

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
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/alpha')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alpha&realm=CHAOS')

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Close detail'))
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alpha&realm=CHAOS')
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

    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/database/awakeners/alpha/builds',
    )
  })

  it('pushes detail tab changes into browser history', async () => {
    await renderDatabasePage('/database/awk/alpha')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Switch to builds tab'))
    })

    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/database/awakeners/alpha/builds',
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/alpha'),
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
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/beta'),
    )
    expect(screen.getByRole('dialog', {name: /beta details/})).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/alpha'),
    )
    expect(screen.getByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
  })

  it('falls back to the database root when deep link slug is unknown', async () => {
    await renderDatabasePage('/database/awk/missing')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/database'))
  })

  it('falls back to the database root when a deep-linked awakener is missing current public data', async () => {
    mockPublicDetailLoaders.setAwakenerDetails([{id: 'awakener-0001'}, {id: 'awakener-0003'}])

    await renderDatabasePage('/database/awk/beta')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/database'))
  })

  it('preserves query params when falling back from an unknown deep link tab', async () => {
    await renderDatabasePage('/database/awk/alpha/missing?q=alpha&realm=CHAOS')

    await expectAwakenerDetailRouteEndState({
      dialogName: /alpha details/,
      path: '/database/awakeners/alpha',
      tab: 'overview',
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alpha&realm=CHAOS')
  })

  it('replaces legacy tab aliases while preserving query params', async () => {
    await renderDatabasePage(['/database', '/database/awk/alpha/Cards?q=alpha&realm=CHAOS'], 1)

    await expectAwakenerDetailRouteEndState({
      dialogName: /alpha details/,
      path: '/database/awakeners/alpha/skills',
      tab: 'skills',
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=alpha&realm=CHAOS')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    await waitFor(() => expect(screen.getByTestId('location-path')).toHaveTextContent('/database'))
  })

  it('preserves generated canonical awakener slugs and only entity-valid query params', async () => {
    await renderDatabasePage('/database/awk/24?q=24&mainstat=KEYFLARE_REGEN&realm=CHAOS&sort=ATK')

    expect(await screen.findByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/24'),
    )
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=24&realm=CHAOS&sort=ATK')
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
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awakeners/alpha'),
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

  it('initializes posse filters and search from query params', async () => {
    await renderDatabasePage('/database/posses?q=sigil&realm=CHAOS')

    expect(screen.getByRole('searchbox')).toHaveValue('sigil')
    expect(screen.getByRole('button', {name: /^chaos$/i})).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('View details for Silent Sigil')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Aequor Banner')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=sigil&realm=CHAOS')
  })

  it('captures global search keystrokes for the active simple artifact entity only', async () => {
    await renderDatabasePage('/database/posses')

    fireEvent.keyDown(window, {key: 's'})

    expect(screen.getByRole('searchbox')).toHaveValue('s')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=s')

    fireEvent.click(screen.getByRole('link', {name: 'Covenants'}))
    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/covenants'),
    )
    await waitFor(() => expect(screen.getByTestId('location-search')).toBeEmptyDOMElement())

    fireEvent.keyDown(window, {key: 'o'})

    expect(screen.getByRole('searchbox')).toHaveValue('o')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=o')
  })

  it('does not capture global search keystrokes while a detail route is open', async () => {
    await renderDatabasePage('/database/posses')

    fireEvent.click(screen.getByLabelText('View details for Silent Sigil'))
    expect(
      await screen.findByRole('dialog', {name: /silent sigil posse details/i}),
    ).toBeInTheDocument()

    fireEvent.keyDown(window, {key: 'x'})

    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/posses/silent-sigil')
    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement()
  })

  it('preserves sanitized posse search params when opening and closing detail routes', async () => {
    await renderDatabasePage('/database/posses?q=sigil&realm=CHAOS&mainstat=KEYFLARE_REGEN')

    await waitFor(() =>
      expect(screen.getByTestId('location-search')).toHaveTextContent('?q=sigil&realm=CHAOS'),
    )

    fireEvent.click(screen.getByLabelText('View details for Silent Sigil'))

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent(
        '/database/posses/silent-sigil',
      ),
    )
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=sigil&realm=CHAOS')
    expect(
      await screen.findByRole('dialog', {name: /silent sigil posse details/i}),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close posse detail'))

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/posses'),
    )
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=sigil&realm=CHAOS')
  })

  it('preserves sanitized covenant search params when opening and closing detail routes', async () => {
    await renderDatabasePage('/database/covenants?q=oath&realm=CHAOS')

    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('?q=oath'))

    fireEvent.click(screen.getByLabelText('View details for Oath of Glass'))

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent(
        '/database/covenants/oath-of-glass',
      ),
    )
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=oath')
    expect(
      await screen.findByRole('dialog', {name: /oath of glass covenant details/i}),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close covenant detail'))

    await waitFor(() =>
      expect(screen.getByTestId('location-path')).toHaveTextContent('/database/covenants'),
    )
    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=oath')
  })

  it('clears unrelated entity params when switching database tabs', async () => {
    await renderDatabasePage('/database/wheels?mainstat=KEYFLARE_REGEN')

    fireEvent.click(screen.getByRole('link', {name: 'Posses'}))

    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/posses')
    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement()
  })

  it('strips invalid entity params from deep-linked posse routes', async () => {
    await renderDatabasePage('/database/posses?mainstat=KEYFLARE_REGEN')

    await waitFor(() => expect(screen.getByTestId('location-search')).toBeEmptyDOMElement())
  })

  it('sorts awakeners by ATK stat descending', async () => {
    await renderDatabasePage()

    const sortSelect = screen.getByLabelText('Database sort key')
    fireEvent.change(sortSelect, {target: {value: 'ATK'}})

    fireEvent.click(screen.getByLabelText('Toggle database sort direction'))

    const cards = screen.getAllByRole('button', {name: /View details for/})

    expect(cards).toHaveLength(3)
    expect(cards[0]).toHaveAccessibleName('View details for Alpha')
    expect(cards[1]).toHaveAccessibleName('View details for Gamma')
    expect(cards[2]).toHaveAccessibleName('View details for Beta')
    cards.forEach((card) => {
      expect(card).not.toHaveAttribute('aria-label')
    })
  })
})
