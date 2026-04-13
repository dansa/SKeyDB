import {createRef} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DatabaseFilters} from './DatabaseFilters'

vi.mock('@/domain/factions', () => ({
  getRealmIcon: (realm: string) => `icon-${realm}`,
  getRealmLabel: (realm: string) => realm,
  getRealmTint: (realm: string) => `tint-${realm}`,
}))

describe('DatabaseFilters', () => {
  it('forwards query, filter, sort, and grouping interactions', () => {
    const onQueryChange = vi.fn()
    const onRealmFilterChange = vi.fn()
    const onRarityFilterChange = vi.fn()
    const onTypeFilterChange = vi.fn()
    const onSortKeyChange = vi.fn()
    const onSortDirectionToggle = vi.fn()
    const onGroupByRealmChange = vi.fn()

    render(
      <DatabaseFilters
        filteredCount={2}
        groupByRealm={false}
        onGroupByRealmChange={onGroupByRealmChange}
        onQueryChange={onQueryChange}
        onRarityFilterChange={onRarityFilterChange}
        onRealmFilterChange={onRealmFilterChange}
        onSortDirectionToggle={onSortDirectionToggle}
        onSortKeyChange={onSortKeyChange}
        onTypeFilterChange={onTypeFilterChange}
        query=''
        rarityFilter='ALL'
        realmFilter='ALL'
        searchInputRef={createRef<HTMLInputElement>()}
        sortDirection='ASC'
        sortKey='ALPHABETICAL'
        totalCount={5}
        typeFilter='ALL'
      />,
    )

    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'alp'}})
    fireEvent.click(screen.getByRole('button', {name: 'CHAOS'}))
    fireEvent.click(screen.getByRole('button', {name: 'Genesis'}))
    fireEvent.click(screen.getByRole('button', {name: 'Warden'}))
    fireEvent.change(screen.getByLabelText('Database sort key'), {target: {value: 'ATK'}})
    fireEvent.click(screen.getByLabelText('Toggle database sort direction'))
    fireEvent.click(screen.getByLabelText('Toggle grouping awakeners by realm'))

    expect(onQueryChange).toHaveBeenCalledWith('alp')
    expect(onRealmFilterChange).toHaveBeenCalledWith('CHAOS')
    expect(onRarityFilterChange).toHaveBeenCalledWith('Genesis')
    expect(onTypeFilterChange).toHaveBeenCalledWith('WARDEN')
    expect(onSortKeyChange).toHaveBeenCalledWith('ATK')
    expect(onSortDirectionToggle).toHaveBeenCalledTimes(1)
    expect(onGroupByRealmChange).toHaveBeenCalledWith(true)
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

  it('shows active state styling for the selected realm chip', () => {
    render(
      <DatabaseFilters
        filteredCount={1}
        groupByRealm
        onGroupByRealmChange={vi.fn()}
        onQueryChange={vi.fn()}
        onRarityFilterChange={vi.fn()}
        onRealmFilterChange={vi.fn()}
        onSortDirectionToggle={vi.fn()}
        onSortKeyChange={vi.fn()}
        onTypeFilterChange={vi.fn()}
        query='beta'
        rarityFilter='SSR'
        realmFilter='AEQUOR'
        searchInputRef={createRef<HTMLInputElement>()}
        sortDirection='DESC'
        sortKey='RARITY'
        totalCount={9}
        typeFilter='ASSAULT'
      />,
    )

    expect(screen.getByRole('button', {name: 'AEQUOR'}).className).toContain(
      'bg-slate-800/80 text-amber-100',
    )
  })
})
