import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Wheel} from '@/domain/wheels'

import {WheelGridCard} from './WheelGridCard'

vi.mock('@/domain/wheel-assets', () => ({
  getWheelAssetById: () => '/wheel.webp',
}))

vi.mock('@/domain/realms', () => ({
  getRealmAccent: () => '#ffffff',
}))

vi.mock('@/domain/mainstats', () => ({
  getMainstatIcon: () => '/mainstat.png',
}))

function makeWheel(overrides: Partial<Wheel> = {}): Wheel {
  return {
    id: 'B01',
    assetId: 'Weapon_Full_B01',
    name: 'Merciful Nurturing',
    rarity: 'SSR',
    realm: 'CARO',
    awakener: 'alpha',
    ownerAwakenerId: 1,
    ownerAwakenerName: 'alpha',
    aliases: ['Merciful Nurturing'],
    tags: ['Embryo Fusion'],
    mainstatKey: 'KEYFLARE_REGEN',
    ...overrides,
  }
}

describe('WheelGridCard', () => {
  it('renders wheel art, an icon-only main-stat cue, and an accessible open action', () => {
    const {container} = render(<WheelGridCard index={0} onSelect={vi.fn()} wheel={makeWheel()} />)

    expect(screen.getByRole('img', {name: 'Merciful Nurturing'})).toBeInTheDocument()
    expect(screen.getByText('Merciful Nurturing')).toBeInTheDocument()
    expect(screen.queryByText('SSR')).not.toBeInTheDocument()
    expect(screen.queryByText('CARO')).not.toBeInTheDocument()
    expect(screen.queryByText('KEYFLARE_REGEN')).not.toBeInTheDocument()
    expect(container.querySelector('img[src="/mainstat.png"]')).not.toBeNull()
    expect(
      screen.getByRole('button', {name: 'View details for Merciful Nurturing'}),
    ).toBeInTheDocument()
  })
})
