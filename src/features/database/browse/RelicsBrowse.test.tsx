import '@testing-library/jest-dom/vitest'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import {MemoryRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom'
import {afterEach, describe, expect, it} from 'vitest'

import {RELIC_DATABASE_BROWSE_DEFAULTS} from '@/domain/relic-database-browse-state'
import {buildRelicDatabaseViewResult} from '@/domain/relic-database-view'

import {databaseRelics} from '../data'
import {RelicsBrowse} from './EntityBrowseViews'
import {useEntityBrowseController} from './useEntityBrowseController'

function RelicsBrowseHarness() {
  const location = useLocation()
  const navigate = useNavigate()
  const controller = useEntityBrowseController({
    activeEntity: 'relics',
    isDetailOpen: false,
    locationPathname: location.pathname,
    locationSearch: location.search,
    navigate,
  })

  return <RelicsBrowse controller={controller} />
}

function renderRelicsBrowse(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<RelicsBrowseHarness />} path='/database/relics' />
      </Routes>
    </MemoryRouter>,
  )
}

function getResultsSummary(expectedText: string) {
  return screen.getByText((_, element) => element?.textContent === expectedText)
}

function getHiddenMatchesPanel() {
  return screen.getByRole('button', {name: 'Show hidden matches'}).parentElement
}

afterEach(() => {
  window.localStorage.clear()
})

describe('RelicsBrowse display-scope recovery', () => {
  it('reports every Pendulum family hidden by the default Display scopes and makes them reachable', async () => {
    renderRelicsBrowse('/database/relics?category=PENDULUM')

    expect(getHiddenMatchesPanel()).toHaveTextContent('50 matching relics are hidden by Display.')
    expect(screen.getByText('No relics match the current filters.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Show hidden matches'}))

    await waitFor(() => {
      expect(getResultsSummary('50 of 286')).toBeInTheDocument()
    })
    expect(screen.queryByText(/hidden by Display/)).not.toBeInTheDocument()
  })

  it('reports hidden Event matches while preserving already visible cross-category families', () => {
    renderRelicsBrowse('/database/relics?category=EVENT')

    const allEventMatches = buildRelicDatabaseViewResult(databaseRelics, {
      ...RELIC_DATABASE_BROWSE_DEFAULTS,
      categoryFilter: 'EVENT',
    })
    const defaultEventMatches = buildRelicDatabaseViewResult(
      databaseRelics,
      {...RELIC_DATABASE_BROWSE_DEFAULTS, categoryFilter: 'EVENT'},
      {displayScopes: ['STANDARD', 'DIMENSIONAL_IMAGE', 'OTHER']},
    )

    expect(defaultEventMatches.relics.length).toBeGreaterThan(0)
    expect(defaultEventMatches.hiddenByDisplayCount).toBeGreaterThan(0)
    expect(getHiddenMatchesPanel()).toHaveTextContent(
      `${String(defaultEventMatches.hiddenByDisplayCount)} matching relics are hidden by Display.`,
    )
    expect(
      getResultsSummary(`${String(defaultEventMatches.relics.length)} of 286`),
    ).toBeInTheDocument()
    expect(allEventMatches.relics).toHaveLength(41)
  })

  it('recovers category and tier intersection matches without changing URL filters', async () => {
    renderRelicsBrowse('/database/relics?category=EVENT&tier=GOLD')

    const allMatches = buildRelicDatabaseViewResult(databaseRelics, {
      ...RELIC_DATABASE_BROWSE_DEFAULTS,
      categoryFilter: 'EVENT',
      tierFilter: 'GOLD',
    })
    expect(allMatches.relics.length).toBeGreaterThan(0)
    expect(getHiddenMatchesPanel()).toHaveTextContent('1 matching relic is hidden by Display.')

    fireEvent.click(screen.getByRole('button', {name: 'Show hidden matches'}))

    await waitFor(() => {
      expect(getResultsSummary(`${String(allMatches.relics.length)} of 286`)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', {name: /^Events$/})).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', {name: 'Gold'})).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(window.localStorage.getItem('database-browse-preferences') ?? '{}')).toEqual(
      expect.objectContaining({
        relics: {
          displayScopes: ['STANDARD', 'DIMENSIONAL_IMAGE', 'OTHER', 'EVENT'],
        },
      }),
    )
  })
})
