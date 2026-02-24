import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CollectionSortControls } from './CollectionSortControls'

describe('CollectionSortControls', () => {
  it('renders high/low direction labels and fires callbacks', () => {
    const onSortKeyChange = vi.fn()
    const onSortDirectionToggle = vi.fn()
    const onGroupByFactionChange = vi.fn()

    render(
      <CollectionSortControls
        groupByFaction={false}
        onGroupByFactionChange={onGroupByFactionChange}
        onSortDirectionToggle={onSortDirectionToggle}
        onSortKeyChange={onSortKeyChange}
        sortDirection="DESC"
        sortKey="LEVEL"
      />,
    )

    expect(screen.getByRole('button', { name: /toggle sort direction/i })).toHaveTextContent('High')

    fireEvent.change(screen.getByRole('combobox', { name: /sort by/i }), {
      target: { value: 'ALPHABETICAL' },
    })
    expect(onSortKeyChange).toHaveBeenCalledWith('ALPHABETICAL')

    fireEvent.click(screen.getByRole('button', { name: /toggle sort direction/i }))
    expect(onSortDirectionToggle).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /toggle grouping by faction/i }))
    expect(onGroupByFactionChange).toHaveBeenCalledWith(true)
  })

  it('renders low direction label when ascending', () => {
    render(
      <CollectionSortControls
        groupByFaction={false}
        onGroupByFactionChange={vi.fn()}
        onSortDirectionToggle={vi.fn()}
        onSortKeyChange={vi.fn()}
        sortDirection="ASC"
        sortKey="LEVEL"
      />,
    )

    expect(screen.getByRole('button', { name: /toggle sort direction/i })).toHaveTextContent('Low')
  })

  it('can hide group by faction toggle', () => {
    render(
      <CollectionSortControls
        groupByFaction={false}
        onGroupByFactionChange={vi.fn()}
        onSortDirectionToggle={vi.fn()}
        onSortKeyChange={vi.fn()}
        showGroupByFaction={false}
        sortDirection="DESC"
        sortKey="LEVEL"
      />,
    )

    expect(screen.queryByRole('button', { name: /toggle grouping by faction/i })).not.toBeInTheDocument()
  })
})
