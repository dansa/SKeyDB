import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {DatabaseGrid} from './DatabaseGrid'

vi.mock('./AwakenerGridCard', () => ({
  AwakenerGridCard: ({
    awakener,
    onSelect,
  }: {
    awakener: Awakener
    onSelect: (id: number) => void
  }) => (
    <button
      onClick={() => {
        onSelect(awakener.id)
      }}
      type='button'
    >
      {awakener.name}
    </button>
  ),
}))

describe('DatabaseGrid', () => {
  it('shows an empty state when the list is empty', () => {
    render(<DatabaseGrid awakeners={[]} onSelectAwakener={vi.fn()} />)

    expect(screen.getByText('No awakeners match the current filters.')).toBeInTheDocument()
  })

  it('renders all awakeners and forwards selection', () => {
    const onSelectAwakener = vi.fn()

    render(
      <DatabaseGrid
        awakeners={[{id: 1, name: 'alpha'} as Awakener, {id: 2, name: 'beta'} as Awakener]}
        onSelectAwakener={onSelectAwakener}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'beta'}))

    expect(screen.getByRole('button', {name: 'alpha'})).toBeInTheDocument()
    expect(onSelectAwakener).toHaveBeenCalledWith(2)
  })
})
