import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerFullStats} from '@/domain/awakeners-full'

import {RichSegmentRenderer} from './RichSegmentRenderer'

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
}

describe('RichSegmentRenderer', () => {
  it('renders interactive skill tokens and forwards click callbacks', () => {
    const onSkillClick = vi.fn()

    render(
      <RichSegmentRenderer
        onSkillClick={onSkillClick}
        segment={{type: 'skill', name: 'Strike'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Strike'}))
    expect(onSkillClick).toHaveBeenCalledWith('Strike', expect.any(Object))
  })

  it('renders inline scaling using selected skill level with hover breakdown', () => {
    render(
      <RichSegmentRenderer
        segment={{type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}}
        skillLevel={2}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText(/\(20% ATK\)/)).toBeInTheDocument()
    expect(screen.getByTitle(/Lv1: 10% = 20/)).toBeInTheDocument()
  })

  it('renders popover scaling as full-range text', () => {
    render(
      <RichSegmentRenderer
        segment={{type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='popover'
      />,
    )

    expect(screen.getByText('20~40')).toBeInTheDocument()
    expect(screen.getByText(/\(10% \(\+10%\/Lv\) ATK\)/)).toBeInTheDocument()
  })
})
