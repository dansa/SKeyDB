import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {AwakenerGridCard} from './AwakenerGridCard'

vi.mock('../../../../domain/awakener-assets', () => ({
  getAwakenerCardAsset: (name: string) => (name === 'atlas' ? 'atlas-card' : null),
}))

vi.mock('../../../../domain/factions', () => ({
  getRealmTint: () => '#123456',
}))

vi.mock('../../../../domain/mainstats', () => ({
  getMainstatIcon: (key: string) => `icon-${key}`,
}))

vi.mock('../../../../domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => `UI ${name}`,
}))

const TEST_AWAKENER: Awakener = {
  id: 7,
  name: 'salvador',
  faction: 'Test',
  realm: 'CHAOS',
  aliases: ['salvador'],
  tags: [],
  stats: {
    CON: 111,
    ATK: 222,
    DEF: 333,
  },
}

describe('AwakenerGridCard', () => {
  it('renders the fallback, display name, and stats when the card art is missing', () => {
    render(<AwakenerGridCard awakener={TEST_AWAKENER} onSelect={vi.fn()} />)

    expect(screen.getByText('No Image')).toBeInTheDocument()
    expect(screen.getByText('UI salvador')).toBeInTheDocument()
    expect(screen.getByText('111')).toBeInTheDocument()
    expect(screen.getByText('222')).toBeInTheDocument()
    expect(screen.getByText('333')).toBeInTheDocument()
  })

  it('calls onSelect with the awakener id when the overlay button is clicked', () => {
    const onSelect = vi.fn()

    render(<AwakenerGridCard awakener={TEST_AWAKENER} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', {name: 'View details for UI salvador'}))
    expect(onSelect).toHaveBeenCalledWith(7)
  })

  it('renders card art and omits stats when the awakener has no stat block', () => {
    render(
      <AwakenerGridCard
        awakener={{...TEST_AWAKENER, id: 8, name: 'atlas', stats: undefined}}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('img', {name: 'UI atlas'})).toHaveAttribute('src', 'atlas-card')
    expect(screen.queryByText('No Image')).toBeNull()
    expect(screen.queryByText('111')).toBeNull()
  })
})
