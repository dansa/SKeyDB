import {createRef} from 'react'

import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DatabaseFilters} from './DatabaseFilters'

const defaultProps = {
  availabilityFilter: 'ALL' as const,
  gameplayFactionFilters: [],
  onAvailabilityFilterChange: vi.fn(),
  onGameplayFactionFilterToggle: vi.fn(),
  onQueryChange: vi.fn(),
  onRarityFilterChange: vi.fn(),
  onRealmFilterChange: vi.fn(),
  onScalingSubstatFilterRemove: vi.fn(),
  onScalingSubstatFilterRoleChange: vi.fn(),
  onScalingSubstatFilterToggle: vi.fn(),
  onTypeFilterChange: vi.fn(),
  query: '',
  rarityFilter: 'ALL' as const,
  realmFilter: 'ALL' as const,
  scalingSubstatFilters: [],
  searchInputRef: createRef<HTMLInputElement>(),
  typeFilter: 'ALL' as const,
}

describe('DatabaseFilters', () => {
  it('keeps scaling as one row with role qualifiers on selected chips', () => {
    const onScalingSubstatFilterRoleChange = vi.fn()
    const onScalingSubstatFilterToggle = vi.fn()
    const {rerender} = render(
      <DatabaseFilters
        {...defaultProps}
        onScalingSubstatFilterRoleChange={onScalingSubstatFilterRoleChange}
        onScalingSubstatFilterToggle={onScalingSubstatFilterToggle}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Advanced filters/}))
    fireEvent.click(screen.getByRole('button', {name: 'Filter by DMG Amp scaling'}))

    expect(onScalingSubstatFilterToggle).toHaveBeenCalledWith('DamageAmplification')

    rerender(
      <DatabaseFilters
        {...defaultProps}
        onScalingSubstatFilterRoleChange={onScalingSubstatFilterRoleChange}
        onScalingSubstatFilterToggle={onScalingSubstatFilterToggle}
        scalingSubstatFilters={[{key: 'DamageAmplification', role: 'ANY'}]}
      />,
    )

    fireEvent.click(screen.getByRole('menuitemradio', {name: 'Primary scaling'}))

    expect(onScalingSubstatFilterRoleChange).toHaveBeenCalledWith('DamageAmplification', 'PRIMARY')
  })

  it('right-click quick toggles a scaling filter without opening its role menu', () => {
    const onScalingSubstatFilterToggle = vi.fn()
    render(
      <DatabaseFilters
        {...defaultProps}
        onScalingSubstatFilterToggle={onScalingSubstatFilterToggle}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Advanced filters/}))
    fireEvent.contextMenu(screen.getByRole('button', {name: 'Filter by DMG Amp scaling'}))

    expect(onScalingSubstatFilterToggle).toHaveBeenCalledWith('DamageAmplification')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps the scaling role menu keyboard reachable and dismissible', () => {
    render(
      <DatabaseFilters
        {...defaultProps}
        scalingSubstatFilters={[{key: 'DamageAmplification', role: 'ANY'}]}
      />,
    )

    const trigger = screen.getByRole('button', {name: 'Change scaling role for DMG Amp'})
    fireEvent.click(trigger)

    const menu = screen.getByRole('menu')
    expect(trigger).toHaveAttribute('aria-controls', menu.id)
    expect(menu).toHaveAttribute('tabindex', '-1')
    expect(menu).toHaveFocus()

    fireEvent.keyDown(menu, {key: 'ArrowDown'})
    expect(screen.getByRole('menuitemradio', {name: 'Any role'})).toHaveFocus()

    fireEvent.keyDown(menu, {key: 'Escape'})
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('left-clicking an active exclusive filter resets it to all', () => {
    const onRarityFilterChange = vi.fn()
    render(
      <DatabaseFilters
        {...defaultProps}
        onRarityFilterChange={onRarityFilterChange}
        rarityFilter='SSR'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'SSR'}))

    expect(onRarityFilterChange).toHaveBeenCalledWith('ALL')
  })

  it('right-click quick toggles exclusive and multi-select database filters', async () => {
    const onAvailabilityFilterChange = vi.fn()
    const onGameplayFactionFilterToggle = vi.fn()
    render(
      <DatabaseFilters
        {...defaultProps}
        availabilityFilter='LIMITED'
        onAvailabilityFilterChange={onAvailabilityFilterChange}
        onGameplayFactionFilterToggle={onGameplayFactionFilterToggle}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('button', {name: 'Limited'}))
    fireEvent.click(screen.getByRole('button', {name: /Advanced filters/}))
    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Lemurian'})).toBeInTheDocument()
    })
    fireEvent.contextMenu(screen.getByRole('button', {name: 'Lemurian'}))

    expect(onAvailabilityFilterChange).toHaveBeenCalledWith('ALL')
    expect(onGameplayFactionFilterToggle).toHaveBeenCalledWith('Lemurian')
  })
})
