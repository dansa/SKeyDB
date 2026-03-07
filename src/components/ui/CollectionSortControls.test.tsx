import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {CollectionSortControls} from './CollectionSortControls'

describe('CollectionSortControls', () => {
  it('renders high/low direction labels and fires callbacks', () => {
    const onSortKeyChange = vi.fn()
    const onSortDirectionToggle = vi.fn()
    const onGroupByRealmChange = vi.fn()

    render(
      <CollectionSortControls
        groupByRealm={false}
        onGroupByRealmChange={onGroupByRealmChange}
        onSortDirectionToggle={onSortDirectionToggle}
        onSortKeyChange={onSortKeyChange}
        sortDirection='DESC'
        sortKey='LEVEL'
      />,
    )

    expect(screen.getByRole('button', {name: /toggle sort direction/i})).toHaveTextContent('High')

    fireEvent.change(screen.getByRole('combobox', {name: /sort by/i}), {
      target: {value: 'ALPHABETICAL'},
    })
    expect(onSortKeyChange).toHaveBeenCalledWith('ALPHABETICAL')

    fireEvent.click(screen.getByRole('button', {name: /toggle sort direction/i}))
    expect(onSortDirectionToggle).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', {name: /toggle Grouping by realm/i}))
    expect(onGroupByRealmChange).toHaveBeenCalledWith(true)
  })

  it('renders low direction label when ascending', () => {
    render(
      <CollectionSortControls
        groupByRealm={false}
        onGroupByRealmChange={vi.fn()}
        onSortDirectionToggle={vi.fn()}
        onSortKeyChange={vi.fn()}
        sortDirection='ASC'
        sortKey='LEVEL'
      />,
    )

    expect(screen.getByRole('button', {name: /toggle sort direction/i})).toHaveTextContent('Low')
  })

  it('can hide Group By Realm toggle', () => {
    render(
      <CollectionSortControls
        groupByRealm={false}
        onGroupByRealmChange={vi.fn()}
        onSortDirectionToggle={vi.fn()}
        onSortKeyChange={vi.fn()}
        showGroupByRealm={false}
        sortDirection='DESC'
        sortKey='LEVEL'
      />,
    )

    expect(
      screen.queryByRole('button', {name: /toggle Grouping by realm/i}),
    ).not.toBeInTheDocument()
  })

  it('supports compact mode without heading text', () => {
    render(
      <CollectionSortControls
        groupByRealm={false}
        layout='compact'
        onGroupByRealmChange={vi.fn()}
        onSortDirectionToggle={vi.fn()}
        onSortKeyChange={vi.fn()}
        sortDirection='DESC'
        sortKey='LEVEL'
      />,
    )

    expect(screen.queryByText(/^sort$/i)).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', {name: /sort by/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /toggle sort direction/i})).toHaveTextContent('High')
  })
})
