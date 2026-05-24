import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {AwakenerGridCard} from './AwakenerGridCard'

vi.mock('@/domain/realms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/realms')>()
  return {
    ...actual,
    getRealmAccent: () => '#ffffff',
    getRealmBadge: () => '/realm-badge.png',
    getRealmIcon: () => '/realm-icon.png',
    getRealmLabel: () => 'Caro',
  }
})

function makeAwakener(overrides: Partial<Awakener> = {}): Awakener {
  const awakener: Awakener = {
    id: 'awakener-0024',
    numericId: 24,
    name: '24',
    faction: 'Test',
    realm: 'CARO',
    aliases: ['24'],
    stats: {
      CON: 52,
      ATK: 66,
      DEF: 30,
    },
    primaryScalingBase: 30,
    statScaling: {
      CON: 1.65,
      ATK: 2.1,
      DEF: 0.95,
    },
    tags: [],
    lineupToken: 'T',
    ...overrides,
  }
  return awakener
}

describe('AwakenerGridCard', () => {
  it('renders database card stats at the basic max level instead of level 1', () => {
    const awakener = makeAwakener()

    render(<AwakenerGridCard awakener={awakener} index={0} onSelect={vi.fn()} />)

    expect(screen.getByText('149')).toBeInTheDocument()
    expect(screen.getByText('189')).toBeInTheDocument()
    expect(screen.getByText('86')).toBeInTheDocument()
    expect(screen.queryByText('52')).not.toBeInTheDocument()
  })

  it('renders default-maxed Gnostic bonuses in resolved card stats', () => {
    const awakener = makeAwakener({
      defaultPrimaryStatBonusLevel: 10,
    })

    render(<AwakenerGridCard awakener={awakener} index={0} onSelect={vi.fn()} />)

    expect(screen.getByText('165')).toBeInTheDocument()
    expect(screen.getByText('210')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
  })

  it('does not render dossier-only realm icons in portrait mode', () => {
    const {container} = render(
      <AwakenerGridCard awakener={makeAwakener()} index={0} onSelect={vi.fn()} />,
    )

    expect(container.querySelector('img[src="/realm-badge.png"]')).not.toBeNull()
    expect(container.querySelector('img[src="/realm-icon.png"]')).toBeNull()
  })

  it('renders both scaling roles when scaling meta is active', () => {
    render(
      <AwakenerGridCard
        awakener={makeAwakener({
          substatScaling: {CritRate: 1.6, CritDamage: 1.2},
        })}
        cardMetaContext={{
          availabilityFilter: 'ALL',
          rarityFilter: 'ALL',
          scalingSubstatFilters: [{key: 'CritRate', role: 'ANY'}],
          sortKey: 'BEST_MATCH',
        }}
        index={0}
        onSelect={vi.fn()}
      />,
    )

    expect(
      screen.getByLabelText('Primary scaling: Crit Rate; Secondary scaling: Crit DMG'),
    ).toBeInTheDocument()
  })

  it('renders date-only release metadata when release date meta is active', () => {
    render(
      <AwakenerGridCard
        awakener={makeAwakener({releaseDate: '2024-08-13'})}
        cardMetaContext={{
          availabilityFilter: 'ALL',
          rarityFilter: 'ALL',
          scalingSubstatFilters: [],
          sortKey: 'RELEASE_DATE',
        }}
        index={0}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByText('Aug 2024')).toBeInTheDocument()
  })

  it('renders normalized rarity and source metadata when rarity source meta is active', () => {
    render(
      <AwakenerGridCard
        awakener={makeAwakener({
          availabilityType: 'LIMITED_FADED_LEGACY',
          rarity: 'SSR',
        })}
        cardMetaContext={{
          availabilityFilter: 'ALL',
          rarityFilter: 'ALL',
          scalingSubstatFilters: [],
          sortKey: 'RARITY',
        }}
        index={0}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByText('SSR · Limited · Faded Legacy')).toBeInTheDocument()
  })

  it('renders Genesis rarity as UR Genesis metadata', () => {
    render(
      <AwakenerGridCard
        awakener={makeAwakener({rarity: 'Genesis'})}
        cardMetaContext={{
          availabilityFilter: 'ALL',
          rarityFilter: 'ALL',
          scalingSubstatFilters: [],
          sortKey: 'RARITY',
        }}
        index={0}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByText('UR · Genesis')).toBeInTheDocument()
  })
})
