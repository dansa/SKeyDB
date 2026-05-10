import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerFullStats} from '@/domain/awakeners-full'

import {ScalingPopover} from './ScalingPopover'

const BASE_STATS: AwakenerFullStats = {
  CON: '100',
  ATK: '200',
  DEF: '80',
  CritRate: '0%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '0',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
  BaseAliemus: '100',
}

describe('ScalingPopover', () => {
  it('renders stat scaling header and highlights the current level row', () => {
    render(
      <ScalingPopover
        currentLevel={2}
        onClose={vi.fn()}
        stat='ATK'
        stats={BASE_STATS}
        suffix='%'
        values={[10, 20, 30]}
      />,
    )

    expect(screen.getByText('ATK')).toBeInTheDocument()
    expect(screen.getByText('Scaling')).toBeInTheDocument()
    expect(screen.getByText('Lv.2').closest('div')).toHaveClass('bg-amber-400/10')
    expect(screen.getByText('40')).toBeInTheDocument()
  })

  it('renders the generic title when there is no stat name', () => {
    render(
      <ScalingPopover onClose={vi.fn()} stat={null} stats={null} suffix='%' values={[10, 20]} />,
    )

    expect(screen.getByText('Lvl Scaling')).toBeInTheDocument()
  })

  it('renders a back-enabled depth indicator for nested scaling chains', () => {
    render(
      <ScalingPopover
        depth={3}
        onBack={vi.fn()}
        onClose={vi.fn()}
        stat='DEF'
        stats={BASE_STATS}
        suffix='%'
        totalDepth={4}
        values={[10, 20]}
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders split columns for larger scaling tables and custom level labels', () => {
    const {container} = render(
      <ScalingPopover
        levelLabelPrefix='Rank '
        levelStart={0}
        onClose={vi.fn()}
        stat={null}
        stats={null}
        suffix='%'
        values={[10, 20, 30, 40, 50]}
      />,
    )

    expect(screen.getByText('Rank 0')).toBeInTheDocument()
    expect(screen.getByText('Rank 4')).toBeInTheDocument()
    expect(container.querySelectorAll('[class*="grid-cols-[3.1em_minmax(0,1fr)]"]')).toHaveLength(5)
  })
})
