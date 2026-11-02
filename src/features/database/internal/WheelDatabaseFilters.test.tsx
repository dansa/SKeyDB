import {createRef} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {WheelDatabaseFilters} from './WheelDatabaseFilters'

describe('WheelDatabaseFilters', () => {
  const defaultProps = {
    availabilityFilter: 'ALL' as const,
    onAvailabilityFilterChange: vi.fn(),
    mainstatFilter: 'ALL' as const,
    onMainstatFilterChange: vi.fn(),
    onQueryChange: vi.fn(),
    onRarityFilterChange: vi.fn(),
    onRealmFilterChange: vi.fn(),
    query: '',
    rarityFilter: 'ALL' as const,
    realmFilter: 'ALL' as const,
    searchInputRef: createRef<HTMLInputElement>(),
  }

  it('does not advertise mainstat text as searchable', () => {
    render(<WheelDatabaseFilters {...defaultProps} />)

    expect(screen.getByRole('searchbox', {name: 'Search wheels'})).toHaveAttribute(
      'placeholder',
      'Name, owner, realm, rarity, or effect',
    )
  })

  it('toggles an active source filter back to all', () => {
    const onAvailabilityFilterChange = vi.fn()
    render(
      <WheelDatabaseFilters
        {...defaultProps}
        availabilityFilter='BATTLE_PASS'
        onAvailabilityFilterChange={onAvailabilityFilterChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', {name: 'Battle Pass'}))
    expect(onAvailabilityFilterChange).toHaveBeenCalledWith('ALL')
  })

  it('toggles active exclusive wheel filters back to all', () => {
    const onMainstatFilterChange = vi.fn()
    render(
      <WheelDatabaseFilters
        {...defaultProps}
        mainstatFilter='CRIT_RATE'
        onMainstatFilterChange={onMainstatFilterChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Crit Rate'}))

    expect(onMainstatFilterChange).toHaveBeenCalledWith('ALL')
  })

  it('right-click quick toggles wheel filters', () => {
    const onMainstatFilterChange = vi.fn()
    const onRarityFilterChange = vi.fn()
    render(
      <WheelDatabaseFilters
        {...defaultProps}
        mainstatFilter='CRIT_RATE'
        onMainstatFilterChange={onMainstatFilterChange}
        onRarityFilterChange={onRarityFilterChange}
        rarityFilter='SSR'
      />,
    )

    fireEvent.contextMenu(screen.getByRole('button', {name: 'Crit Rate'}))
    fireEvent.contextMenu(screen.getByRole('button', {name: 'SSR'}))

    expect(onMainstatFilterChange).toHaveBeenCalledWith('ALL')
    expect(onRarityFilterChange).toHaveBeenCalledWith('ALL')
  })
})
