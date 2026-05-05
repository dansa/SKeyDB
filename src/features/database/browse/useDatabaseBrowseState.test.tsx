import {act, fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom'
import {describe, expect, it} from 'vitest'

import {useDatabaseBrowseState} from './useDatabaseBrowseState'
import {useWheelsDatabaseBrowseState} from './useWheelsDatabaseBrowseState'

function HistoryBackButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => {
        void navigate(-1)
      }}
      type='button'
    >
      Go back in history
    </button>
  )
}

function DatabaseBrowseStateHarness() {
  const state = useDatabaseBrowseState()
  const location = useLocation()

  return (
    <div>
      <div data-testid='location-search'>{location.search}</div>
      <button
        onClick={() => {
          state.appendSearchCharacter('a')
        }}
        type='button'
      >
        Append a
      </button>
      <button
        onClick={() => {
          state.appendSearchCharacter('l')
        }}
        type='button'
      >
        Append l
      </button>
      <button
        onClick={() => {
          state.setRealmFilter('AEQUOR')
        }}
        type='button'
      >
        Set realm AEQUOR
      </button>
      <button
        onClick={() => {
          state.setSortKey('ATK')
        }}
        type='button'
      >
        Set sort ATK
      </button>
      <button
        onClick={() => {
          state.toggleSortDirection()
        }}
        type='button'
      >
        Toggle sort direction
      </button>
      <HistoryBackButton />
    </div>
  )
}

function WheelsDatabaseBrowseStateHarness() {
  const state = useWheelsDatabaseBrowseState()
  const location = useLocation()

  return (
    <div>
      <div data-testid='location-search'>{location.search}</div>
      <button
        onClick={() => {
          state.appendSearchCharacter('m')
        }}
        type='button'
      >
        Append m
      </button>
      <button
        onClick={() => {
          state.appendSearchCharacter('e')
        }}
        type='button'
      >
        Append e
      </button>
      <button
        onClick={() => {
          state.setRealmFilter('CARO')
        }}
        type='button'
      >
        Set realm CARO
      </button>
      <button
        onClick={() => {
          state.setRarityFilter('SSR')
        }}
        type='button'
      >
        Set rarity SSR
      </button>
      <button
        onClick={() => {
          state.setMainstatFilter('KEYFLARE_REGEN')
        }}
        type='button'
      >
        Set mainstat KEYFLARE_REGEN
      </button>
      <button
        onClick={() => {
          state.setSortKey('RARITY')
        }}
        type='button'
      >
        Set sort RARITY
      </button>
      <button
        onClick={() => {
          state.setSortKey('ALPHABETICAL')
        }}
        type='button'
      >
        Set sort ALPHABETICAL
      </button>
      <button
        onClick={() => {
          state.toggleSortDirection()
        }}
        type='button'
      >
        Toggle wheel sort direction
      </button>
      <HistoryBackButton />
    </div>
  )
}

function renderBrowseStateHarness(initialEntries: string[] = ['/database']) {
  render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route element={<DatabaseBrowseStateHarness />} path='/database' />
      </Routes>
    </MemoryRouter>,
  )
}

function renderWheelsBrowseStateHarness(initialEntries: string[] = ['/database/wheels']) {
  render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route element={<WheelsDatabaseBrowseStateHarness />} path='/database/wheels' />
      </Routes>
    </MemoryRouter>,
  )
}

describe('useDatabaseBrowseState', () => {
  it('keeps query typing as replace-style history updates', async () => {
    renderBrowseStateHarness(['/database', '/database'])

    fireEvent.click(screen.getByRole('button', {name: 'Append a'}))
    fireEvent.click(screen.getByRole('button', {name: 'Append l'}))

    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=al')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    expect(screen.getByTestId('location-search')).toHaveTextContent('')
  })

  it('pushes discrete browse refinements into history', async () => {
    renderBrowseStateHarness()

    fireEvent.click(screen.getByRole('button', {name: 'Set realm AEQUOR'}))
    fireEvent.click(screen.getByRole('button', {name: 'Set sort ATK'}))
    fireEvent.click(screen.getByRole('button', {name: 'Toggle sort direction'}))

    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?realm=AEQUOR&sort=ATK&dir=DESC',
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('?realm=AEQUOR&sort=ATK')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('?realm=AEQUOR')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('')
  })
})

describe('useWheelsDatabaseBrowseState', () => {
  it('parses wheel browse params from the wheel route', () => {
    renderWheelsBrowseStateHarness([
      '/database/wheels?q=merciful&realm=CARO&rarity=SSR&mainstat=KEYFLARE_REGEN&sort=RARITY&dir=DESC',
    ])

    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?q=merciful&realm=CARO&rarity=SSR&mainstat=KEYFLARE_REGEN&sort=RARITY&dir=DESC',
    )
  })

  it('keeps wheel query typing as replace-style history updates', async () => {
    renderWheelsBrowseStateHarness(['/database/wheels', '/database/wheels'])

    fireEvent.click(screen.getByRole('button', {name: 'Append m'}))
    fireEvent.click(screen.getByRole('button', {name: 'Append e'}))

    expect(screen.getByTestId('location-search')).toHaveTextContent('?q=me')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })

    expect(screen.getByTestId('location-search')).toHaveTextContent('')
  })

  it('resets the wheel sort direction to the new key default', () => {
    renderWheelsBrowseStateHarness(['/database/wheels?sort=RARITY&dir=DESC'])

    fireEvent.click(screen.getByRole('button', {name: 'Set sort ALPHABETICAL'}))

    expect(screen.getByTestId('location-search')).toHaveTextContent('?sort=ALPHABETICAL')
  })

  it('pushes wheel filter and sort changes into history', async () => {
    renderWheelsBrowseStateHarness()

    fireEvent.click(screen.getByRole('button', {name: 'Set realm CARO'}))
    fireEvent.click(screen.getByRole('button', {name: 'Set rarity SSR'}))
    fireEvent.click(screen.getByRole('button', {name: 'Set mainstat KEYFLARE_REGEN'}))
    fireEvent.click(screen.getByRole('button', {name: 'Set sort RARITY'}))
    fireEvent.click(screen.getByRole('button', {name: 'Toggle wheel sort direction'}))

    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?realm=CARO&rarity=SSR&mainstat=KEYFLARE_REGEN&dir=ASC',
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?realm=CARO&rarity=SSR&mainstat=KEYFLARE_REGEN',
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('?realm=CARO&rarity=SSR')
  })
})
