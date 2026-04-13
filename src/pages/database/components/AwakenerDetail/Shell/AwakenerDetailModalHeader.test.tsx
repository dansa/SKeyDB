import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {AwakenerDetailModalHeader} from './AwakenerDetailModalHeader'

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerPortraitAsset: (name: string) => (name === 'beta' ? 'portrait-beta' : null),
}))

vi.mock('@/domain/factions', () => ({
  getRealmIcon: (realm: string) => `icon-${realm}`,
  getRealmLabel: (realm: string) => `Realm ${realm}`,
}))

vi.mock('@/domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => `UI ${name}`,
}))

function makeAwakener(overrides: Partial<Awakener> = {}): Awakener {
  return {
    id: 1,
    name: 'alpha',
    realm: 'AEQUOR',
    faction: 'Faction',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: ['alpha'],
    tags: [],
    ...overrides,
  }
}

describe('AwakenerDetailModalHeader', () => {
  it('renders the pre-release banner and forwards tab changes', () => {
    const onTabChange = vi.fn()

    render(
      <AwakenerDetailModalHeader
        activeTab='cards'
        awakener={makeAwakener({unreleased: true})}
        onTabChange={onTabChange}
        realmTint='#ffaa33'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Builds'}))

    expect(screen.getByText(/Pre-release data:/)).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'UI alpha'})).toBeInTheDocument()
    expect(screen.getByText('Realm AEQUOR')).toHaveStyle({color: '#ffaa33'})
    expect(onTabChange).toHaveBeenCalledWith('builds')
  })

  it('renders portrait and uses the current active tab styling', () => {
    render(
      <AwakenerDetailModalHeader
        activeTab='teams'
        awakener={makeAwakener({id: 2, name: 'beta', type: undefined})}
        onTabChange={vi.fn()}
        realmTint='#44ccff'
      />,
    )

    const images = screen.getAllByRole('presentation')
    expect(images[0]).toHaveAttribute('src', 'portrait-beta')
    expect(screen.getByRole('button', {name: 'Teams'}).className).toContain('text-amber-100')
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
