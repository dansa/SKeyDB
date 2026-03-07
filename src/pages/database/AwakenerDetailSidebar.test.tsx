import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullStats, AwakenerSubstatScaling} from '@/domain/awakeners-full'

import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

vi.mock('../../domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('../../domain/mainstats', () => ({
  getMainstatIcon: () => null,
}))

vi.mock('./AwakenerLevelSlider', () => ({
  AwakenerLevelSlider: ({level}: {level: number}) => <div>Level slider {level}</div>,
}))

const TEST_AWAKENER: Awakener = {
  id: 1,
  name: 'thais',
  realm: 'AEQUOR',
  faction: 'Test',
  type: 'ASSAULT',
  rarity: 'SSR',
  aliases: ['thais'],
  tags: [],
}

const TEST_STATS: AwakenerFullStats = {
  CON: '140',
  ATK: '135',
  DEF: '126',
  CritRate: '14.6%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '15',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
}

const TEST_SUBSTAT_SCALING: AwakenerSubstatScaling = {
  CritRate: '1.6%',
}

describe('AwakenerDetailSidebar', () => {
  it('keeps the level label in the slider, shows the Psyche Surge stepper, and exposes substat scaling on hover', () => {
    render(
      <AwakenerDetailSidebar
        awakener={TEST_AWAKENER}
        enlightenOffset={0}
        level={60}
        onDecreaseEnlighten={vi.fn()}
        onIncreaseEnlighten={vi.fn()}
        onLevelChange={vi.fn()}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.getByRole('heading', {name: 'Attributes'})).toBeInTheDocument()
    expect(screen.queryByText('(Lv. 60)')).not.toBeInTheDocument()
    expect(screen.getByText('E3+0')).toBeInTheDocument()

    expect(screen.getByText('140')).toHaveClass('text-slate-200')
    expect(screen.getByText('14.6%')).toHaveClass('text-slate-200')
    expect(screen.getByTitle('Level scaling: +1.6% per 10 levels to Lv. 60')).toHaveTextContent(
      '14.6%',
    )
    expect(screen.getByText(/psyche surge bonuses shown from e3\+0 to e3\+12/i)).toBeInTheDocument()
  })
})
