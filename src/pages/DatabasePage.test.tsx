import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter, Route, Routes, useLocation} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {DatabasePage} from './DatabasePage'

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

vi.mock('../domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
  getAwakenerPortraitAsset: () => null,
}))

vi.mock('../domain/factions', () => ({
  getRealmIcon: () => null,
  getRealmLabel: (realm: string) => realm,
  getRealmTint: () => '#ffffff',
}))

vi.mock('../domain/mainstats', () => ({
  getMainstatIcon: () => null,
}))

vi.mock('./database/AwakenerDetailModal', () => ({
  AwakenerDetailModal: ({
    awakener,
    onClose,
    initialTab = 'overview',
    onTabChange,
  }: {
    awakener: {name: string}
    onClose: () => void
    initialTab?: 'overview' | 'cards' | 'builds' | 'teams'
    onTabChange?: (tab: 'overview' | 'cards' | 'builds' | 'teams') => void
  }) => (
    <div aria-label={`${awakener.name} details`} role='dialog'>
      <div>{`Active tab ${initialTab}`}</div>
      <button
        aria-label='Switch to builds tab'
        onClick={() => {
          onTabChange?.('builds')
        }}
        type='button'
      >
        Builds
      </button>
      <button aria-label='Close detail' onClick={onClose} type='button'>
        Close
      </button>
    </div>
  ),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

function renderDatabasePage(initialEntry = '/database') {
  function LocationProbe() {
    const location = useLocation()
    return <div data-testid='location-path'>{location.pathname}</div>
  }

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<DatabasePage />} path='/database' />
        <Route element={<DatabasePage />} path='/database/awk/:awakenerSlug' />
        <Route element={<DatabasePage />} path='/database/awk/:awakenerSlug/:tabSlug' />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('DatabasePage', () => {
  it('renders work-in-progress banner', () => {
    renderDatabasePage()

    expect(screen.getByText('Work in Progress:')).toBeInTheDocument()
    expect(screen.getByText(/still being built/)).toBeInTheDocument()
  })

  it('renders all awakeners in the grid by default', () => {
    renderDatabasePage()

    expect(screen.getByLabelText('View details for Alpha')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Beta')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Gamma')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
  })

  it('filters awakeners by realm', () => {
    renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /CHAOS/}))

    expect(screen.getByLabelText('View details for Alpha')).toBeInTheDocument()
    expect(screen.getByLabelText('View details for Gamma')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Beta')).not.toBeInTheDocument()
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('filters awakeners by type', () => {
    renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /Warden/}))

    expect(screen.getByLabelText('View details for Beta')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Alpha')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Gamma')).not.toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('filters awakeners by rarity', () => {
    renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /Genesis/}))

    expect(screen.getByLabelText('View details for Gamma')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Alpha')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Beta')).not.toBeInTheDocument()
  })

  it('filters awakeners via search input', () => {
    renderDatabasePage()

    const searchbox = screen.getByRole('searchbox')
    fireEvent.change(searchbox, {target: {value: 'alpha'}})

    expect(screen.getByLabelText('View details for Alpha')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Beta')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Gamma')).not.toBeInTheDocument()
  })

  it('filters awakeners by tag search', () => {
    renderDatabasePage()

    const searchbox = screen.getByRole('searchbox')
    fireEvent.change(searchbox, {target: {value: 'STR Up'}})

    expect(screen.getByLabelText('View details for Beta')).toBeInTheDocument()
    expect(screen.queryByLabelText('View details for Alpha')).not.toBeInTheDocument()
  })

  it('shows empty state when all awakeners are filtered out', () => {
    renderDatabasePage()

    fireEvent.click(screen.getByRole('button', {name: /AEQUOR/}))
    fireEvent.click(screen.getByRole('button', {name: /Genesis/}))

    expect(screen.getByText('No awakeners match the current filters.')).toBeInTheDocument()
  })

  it('opens detail modal when clicking an awakener card', () => {
    renderDatabasePage()

    fireEvent.click(screen.getByLabelText('View details for Alpha'))

    expect(screen.getByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha')
  })

  it('closes detail modal via close button', () => {
    renderDatabasePage()

    fireEvent.click(screen.getByLabelText('View details for Alpha'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close detail'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database')
  })

  it('opens detail modal from deep-linked awakener route', () => {
    renderDatabasePage('/database/awk/beta')

    expect(screen.getByRole('dialog', {name: /beta details/})).toBeInTheDocument()
  })

  it('opens detail modal from deep-linked awakener tab route', () => {
    renderDatabasePage('/database/awk/beta/builds')

    expect(screen.getByRole('dialog', {name: /beta details/})).toBeInTheDocument()
    expect(screen.getByText('Active tab builds')).toBeInTheDocument()
  })

  it('updates url when switching detail tabs', () => {
    renderDatabasePage('/database/awk/alpha')

    fireEvent.click(screen.getByLabelText('Switch to builds tab'))

    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha/builds')
  })

  it('falls back to the database root when deep link slug is unknown', () => {
    renderDatabasePage('/database/awk/missing')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database')
  })

  it('falls back to the awakener overview route when deep link tab is unknown', () => {
    renderDatabasePage('/database/awk/alpha/missing')

    expect(screen.getByRole('dialog', {name: /alpha details/})).toBeInTheDocument()
    expect(screen.getByText('Active tab overview')).toBeInTheDocument()
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/awk/alpha')
  })

  it('sorts awakeners by ATK stat descending', () => {
    renderDatabasePage()

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
