import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerFullStats} from '@/domain/awakeners-full'

import {
  RichMechanicSegmentView,
  RichScalingSegmentView,
  RichSkillSegmentView,
} from './RichSegmentViews'

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

vi.mock('@/domain/tags', async () => {
  const actual = await vi.importActual<typeof import('@/domain/tags')>('@/domain/tags')
  return {
    ...actual,
    getTagIcon: (iconId: string) => `icon-${iconId}`,
    resolveTag: (name: string) =>
      name === 'Weakness'
        ? {
            key: 'weakness',
            label: 'Weakness',
            description: 'desc',
            tint: '#cc8844',
            iconId: 'weakness',
            aliases: [],
          }
        : null,
  }
})

describe('RichSegmentViews', () => {
  it('renders a non-interactive skill segment as text when no handler is provided', () => {
    render(<RichSkillSegmentView segment={{type: 'skill', name: 'Strike'}} />)

    expect(screen.getByText('Strike').tagName).toBe('SPAN')
  })

  it('renders interactive mechanics with icon and tint', () => {
    const onMechanicClick = vi.fn()

    render(
      <RichMechanicSegmentView
        onMechanicClick={onMechanicClick}
        segment={{type: 'mechanic', name: 'Weakness'}}
      />,
    )

    const button = screen.getByRole('button', {name: 'Weakness'})
    fireEvent.click(button)

    expect(button).toHaveStyle({color: '#cc8844'})
    expect(screen.getByRole('presentation')).toHaveAttribute('src', 'icon-weakness')
    expect(onMechanicClick).toHaveBeenCalled()
  })

  it('clamps scaling level lookups and omits hover text for single-value scaling', () => {
    const {rerender} = render(
      <RichScalingSegmentView
        segment={{type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}}
        skillLevel={10}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('40')).toBeInTheDocument()

    rerender(
      <RichScalingSegmentView
        segment={{type: 'scaling', values: [25], suffix: '%', stat: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('25%')).toHaveAttribute('title', '')
  })
})
