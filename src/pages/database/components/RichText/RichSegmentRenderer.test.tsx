import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import * as tagsModule from '@/domain/tags'

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
  BaseAliemus: '100',
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

    const button = screen.getByRole('button', {name: 'Strike'})
    expect(button).toHaveStyle({
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit',
    })
    expect(button).toHaveClass('font-bold')
    fireEvent.click(button)
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
  })

  it('allows popover scaling tokens to open nested scaling details', () => {
    const onScalingClick = vi.fn()

    render(
      <RichSegmentRenderer
        onScalingClick={onScalingClick}
        segment={{type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='popover'
      />,
    )

    const button = screen.getByRole('button', {name: '20~40'})
    expect(button).toHaveStyle({
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit',
    })
    expect(button).toHaveClass('font-bold')
    fireEvent.click(button)
    expect(onScalingClick).toHaveBeenCalledWith([10, 20], '%', 'ATK', expect.any(Object))
  })

  it('keeps mechanics without description non-interactive', () => {
    vi.spyOn(tagsModule, 'resolveTag').mockReturnValueOnce({
      key: 'empty-desc',
      label: 'Empty Desc',
      description: '   ',
      iconId: '',
      aliases: [],
    })

    render(
      <RichSegmentRenderer
        onMechanicClick={vi.fn()}
        segment={{type: 'mechanic', name: 'Empty Desc'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(screen.queryByRole('button', {name: 'Empty Desc'})).toBeNull()
    expect(screen.getByText('Empty Desc').closest('[title]')).toHaveAttribute(
      'title',
      'Details coming soon',
    )
  })

  it('renders indentation marker with the expected bullet sign', () => {
    const {container} = render(
      <RichSegmentRenderer
        segment={{type: 'line', indented: true, segments: [{type: 'text', value: 'Indented text'}]}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(container).toHaveTextContent('\u2022Indented text')
    expect(container).not.toHaveTextContent('В·')
  })
})
