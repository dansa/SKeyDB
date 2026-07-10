import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {RelicDatabaseFilters} from './RelicDatabaseFilters'

describe('RelicDatabaseFilters', () => {
  it('renders a single-select tier row and persistent multi-select display scopes', () => {
    const onTierFilterChange = vi.fn()
    const onDisplayScopeToggle = vi.fn()

    render(
      <RelicDatabaseFilters
        categoryFilter='ALL'
        displayScopes={['STANDARD', 'DIMENSIONAL_IMAGE', 'OTHER']}
        onCategoryFilterChange={vi.fn()}
        onDisplayScopeToggle={onDisplayScopeToggle}
        onQueryChange={vi.fn()}
        onTierFilterChange={onTierFilterChange}
        query=''
        searchInputRef={{current: null}}
        tierFilter='SILVER'
      />,
    )

    expect(screen.getByRole('button', {name: 'Silver'})).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', {name: 'Display Standard'})).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', {name: 'Display Events'})).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    fireEvent.click(screen.getByRole('button', {name: 'Gold'}))
    fireEvent.click(screen.getByRole('button', {name: 'Display Events'}))

    expect(onTierFilterChange).toHaveBeenCalledWith('GOLD')
    expect(onDisplayScopeToggle).toHaveBeenCalledWith('EVENT')
  })
})
