import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerOverlayRecord, FullStats} from '@/domain/awakener-source-schema'
import {
  getAwakenerTextColor,
  getAwakenerTextHoverColor,
  getAwakenerTextUnderlineColor,
} from '@/domain/awakeners-text-colors'

import {RichSegmentRenderer} from './RichSegmentRenderer'

const BASE_STATS: FullStats = {
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

const TEST_OVERLAY: AwakenerOverlayRecord = {
  id: 'overlay.test.counter',
  displayName: 'Counter',
  overlayType: 'mechanic',
  aliases: ['Temporary Counter'],
  iconId: 'Battle_Card_Buff_019',
  descriptionTemplate: 'Gain {Counter} equal to 20% of DMG dealt.',
  descriptionArgs: {},
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

  it('activates interactive skill tokens from the keyboard', () => {
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
    fireEvent.keyDown(button, {key: 'Enter'})
    fireEvent.keyDown(button, {key: ' '})

    expect(onSkillClick).toHaveBeenCalledTimes(2)
    expect(onSkillClick).toHaveBeenNthCalledWith(1, 'Strike', expect.any(Object))
    expect(onSkillClick).toHaveBeenNthCalledWith(2, 'Strike', expect.any(Object))
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
    expect(screen.getByTitle(/Lv1: 10% ATK = 20/)).toBeInTheDocument()
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

  it('renders computed description args inline with the formula in parentheses', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'scaling',
            values: ['10', '20'],
            suffix: '%',
            stat: 'ATK',
          },
        }}
        descriptionMaxRank={2}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText(/\(10% ATK\)/)).toHaveClass('no-underline')
    expect(screen.getByTitle(/Lv1: 10% ATK = 20/)).toBeInTheDocument()
  })

  it('renders public V2 plural segments from resolved arg values', () => {
    const {rerender} = render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'fixed',
            value: '1',
          },
        }}
        segment={{
          type: 'argPlural',
          argKey: 'Arg1',
          channel: null,
          singular: 'stack',
          plural: 'stacks',
        }}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('stack')).toBeInTheDocument()

    rerender(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'fixed',
            value: '2',
          },
        }}
        segment={{
          type: 'argPlural',
          argKey: 'Arg1',
          channel: null,
          singular: 'stack',
          plural: 'stacks',
        }}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('stacks')).toBeInTheDocument()
  })

  it('renders public V2 plural segments from computed absolute arg values', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'fixed',
            value: '10',
            suffix: '%',
            stat: 'ATK',
          },
        }}
        segment={{
          type: 'argPlural',
          argKey: 'Arg1',
          channel: 'Poison',
          singular: 'stack',
          plural: 'stacks',
        }}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('stacks')).toBeInTheDocument()
  })

  it('resolves computed description args when formula context is supplied', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'computed',
            formulaKey: 'wheelRefinementLinear',
            baseValue: 0,
            perLevel: 3,
            inputs: ['wheelRefinementLevel'],
            suffix: '%',
          },
        }}
        formulaContext={{wheelRefinementLevel: 4}}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('12%')).toBeInTheDocument()
    expect(screen.getByText('12%')).toHaveAttribute(
      'title',
      [
        'Wheel Enlighten Bonus',
        'Current Enlighten tier: 4',
        'Base value: 0%',
        'Per tier: +3%',
        '',
        '0% + (4 × 3%) = 12%',
      ].join('\n'),
    )
  })

  it('does not present a numeric value for computed args when formula context is missing', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'computed',
            formulaKey: 'wheelRefinementLinear',
            baseValue: 0,
            perLevel: 3,
            inputs: ['wheelRefinementLevel'],
            suffix: '%',
          },
        }}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('—%')).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })

  it('can hide visible scaling while keeping the hover formula available', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'scaling',
            values: ['10', '20'],
            suffix: '%',
            stat: 'ATK',
          },
        }}
        descriptionMaxRank={2}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        showVisibleScaling={false}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.queryByText(/\(10% ATK\)/)).not.toBeInTheDocument()
    expect(screen.getByTitle(/Lv1: 10% ATK = 20/)).toBeInTheDocument()
  })

  it('renders description arg hover ranges for shared ladders like Madness Omen', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'linear',
            base: '5',
            gainPerLevel: '5',
          },
        }}
        descriptionMaxRank={12}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('5')).toBeInTheDocument()
    const token = screen.getByText('5')
    expect(token).toHaveAttribute('title', expect.stringMatching(/Lv1: 5[\s\S]*Lv2: 10/))
    expect(token).toHaveAttribute('title', expect.stringMatching(/Lv12: 60/))
  })

  it('keeps hover affordance styling for interactive description args in popovers', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'computed',
            formulaKey: 'scaled',
            baseFormula: 'accountStageGrowth',
            multiplier: 0.0065,
            inputs: ['accountLevel'],
          },
          Arg2: {
            kind: 'fixed',
            value: '6',
          },
        }}
        formulaContext={{accountLevel: 50}}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='popover'
      />,
    )

    const token = screen.getByTitle(/Account Lv 50:/)
    expect(token).toHaveClass('cursor-help')
    expect(token).toHaveClass('underline')
  })

  it('renders fixed description args without a fake hover tooltip', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'fixed',
            value: '5',
          },
        }}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('5')).not.toHaveAttribute('title')
  })

  it('renders fixed description args with display formula tooltips', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'fixed',
            value: 'X',
            displayFormula: 'Max HP * 0.2%',
          },
        }}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('X')).toHaveAttribute('title', 'Max HP * 0.2%')
  })

  it('renders fixed substat args with a single formula tooltip', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'fixed',
            substatBonus: {
              substat: 'SigilYield',
              multiplier: '1',
              suffix: '%',
            },
          },
        }}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={{
          ...BASE_STATS,
          SigilYield: '14.4%',
        }}
        variant='inline'
      />,
    )

    expect(screen.getByText('15%')).toHaveAttribute('title', 'Sigil Yield × 1%')
  })

  it('uses source arg channels to tint resolved values', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'scaling',
            values: ['10'],
            suffix: '%',
            stat: 'DEF',
          },
        }}
        descriptionMaxRank={1}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: 'Block'}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('8')).toHaveStyle({
      '--database-token-color': getAwakenerTextColor('shield'),
      '--database-token-underline-color': getAwakenerTextUnderlineColor('shield'),
      '--database-token-hover-color': getAwakenerTextHoverColor('shield'),
    })
    expect(screen.getByText(/\(10% DEF\)/)).toHaveClass('no-underline')
  })

  it('falls back to arg-level channels when the template token is plain', () => {
    render(
      <RichSegmentRenderer
        descriptionArgs={{
          Arg1: {
            kind: 'scaling',
            channel: 'Damage',
            values: ['10'],
            suffix: '%',
            stat: 'ATK',
          },
        }}
        descriptionMaxRank={1}
        descriptionRank={1}
        segment={{type: 'descriptionArg', argKey: 'Arg1', channel: null}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('20')).toHaveStyle({
      '--database-token-color': getAwakenerTextColor('damage'),
      '--database-token-underline-color': getAwakenerTextUnderlineColor('damage'),
      '--database-token-hover-color': getAwakenerTextHoverColor('damage'),
    })
  })

  it('renders overlay-backed mechanic tokens as interactive buttons', () => {
    const onMechanicClick = vi.fn()

    render(
      <RichSegmentRenderer
        onMechanicClick={onMechanicClick}
        overlays={[TEST_OVERLAY]}
        segment={{type: 'mechanic', name: 'Temporary Counter'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Temporary Counter'}))
    expect(onMechanicClick).toHaveBeenCalledWith(TEST_OVERLAY, expect.any(Object))
  })

  it('activates interactive mechanic tokens from the keyboard', () => {
    const onMechanicClick = vi.fn()

    render(
      <RichSegmentRenderer
        onMechanicClick={onMechanicClick}
        overlays={[TEST_OVERLAY]}
        segment={{type: 'mechanic', name: 'Temporary Counter'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    const button = screen.getByRole('button', {name: 'Temporary Counter'})
    fireEvent.keyDown(button, {key: 'Enter'})
    fireEvent.keyDown(button, {key: ' '})

    expect(onMechanicClick).toHaveBeenCalledTimes(2)
    expect(onMechanicClick).toHaveBeenNthCalledWith(1, TEST_OVERLAY, expect.any(Object))
    expect(onMechanicClick).toHaveBeenNthCalledWith(2, TEST_OVERLAY, expect.any(Object))
  })

  it('uses overlay text colors for mechanic tokens', () => {
    render(
      <RichSegmentRenderer
        overlays={[
          {
            ...TEST_OVERLAY,
            textColor: 'shield',
          },
        ]}
        segment={{type: 'mechanic', name: 'Counter'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(screen.getByText('Counter')).toHaveStyle({
      '--database-token-color': getAwakenerTextColor('shield'),
      '--database-token-underline-color': getAwakenerTextUnderlineColor('shield'),
      '--database-token-hover-color': getAwakenerTextHoverColor('shield'),
    })
  })

  it('renders mechanic icons when the tag icon preference is enabled', async () => {
    const {container} = render(
      <RichSegmentRenderer
        overlays={[TEST_OVERLAY]}
        segment={{type: 'mechanic', name: 'Counter'}}
        showTagIcons
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    await waitFor(() => {
      expect(container.querySelector('img')).not.toBeNull()
    })
    const icon = container.querySelector('img')
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute('src', expect.stringContaining('Battle_Card_Buff_019'))
    expect(icon).toHaveStyle({
      display: 'inline',
      objectFit: 'contain',
      verticalAlign: 'middle',
      position: 'relative',
      top: '-0.04em',
    })
    expect(screen.getByText('Counter')).toBeInTheDocument()
  })

  it('keeps icon and text inside the same interactive mechanic token', async () => {
    const {container} = render(
      <RichSegmentRenderer
        onMechanicClick={vi.fn()}
        overlays={[TEST_OVERLAY]}
        segment={{type: 'mechanic', name: 'Counter'}}
        showTagIcons
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    await waitFor(() => {
      expect(container.querySelector('img')).not.toBeNull()
    })
    const button = screen.getByRole('button', {name: 'Counter'})
    const icon = container.querySelector('img')
    expect(button).toContainElement(icon)
    expect(button).toContainElement(screen.getByText('Counter'))
  })

  it('hides mechanic icons when the tag icon preference is disabled', () => {
    const {container} = render(
      <RichSegmentRenderer
        overlays={[TEST_OVERLAY]}
        segment={{type: 'mechanic', name: 'Counter'}}
        showTagIcons={false}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('Counter')).toBeInTheDocument()
  })

  it('renders dropped self references without a bogus mechanic tooltip state', () => {
    render(
      <RichSegmentRenderer
        segment={{type: 'reference', name: 'Colorless Spiral'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(screen.queryByRole('button', {name: 'Colorless Spiral'})).not.toBeInTheDocument()
    expect(screen.getByText('Colorless Spiral')).not.toHaveAttribute('title', 'Details coming soon')
    expect(screen.getByText('Colorless Spiral')).toHaveClass('decoration-amber-200/35')
  })

  it('renders realm tokens as interactive buttons when realm overlays exist', () => {
    const onMechanicClick = vi.fn()
    const realmOverlay: AwakenerOverlayRecord = {
      id: 'overlay.global.chaos',
      displayName: 'Chaos',
      overlayType: 'realm',
      aliases: [],
      descriptionTemplate: 'Realm text',
      descriptionArgs: {},
    }

    render(
      <RichSegmentRenderer
        onMechanicClick={onMechanicClick}
        overlays={[realmOverlay]}
        segment={{type: 'realm', name: 'Chaos'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Chaos'}))
    expect(onMechanicClick).toHaveBeenCalledWith(realmOverlay, expect.any(Object))
  })

  it('activates interactive realm tokens from the keyboard', () => {
    const onMechanicClick = vi.fn()
    const realmOverlay: AwakenerOverlayRecord = {
      id: 'overlay.global.chaos',
      displayName: 'Chaos',
      overlayType: 'realm',
      aliases: [],
      descriptionTemplate: 'Realm text',
      descriptionArgs: {},
    }

    render(
      <RichSegmentRenderer
        onMechanicClick={onMechanicClick}
        overlays={[realmOverlay]}
        segment={{type: 'realm', name: 'Chaos'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    const button = screen.getByRole('button', {name: 'Chaos'})
    fireEvent.keyDown(button, {key: 'Enter'})
    fireEvent.keyDown(button, {key: ' '})

    expect(onMechanicClick).toHaveBeenCalledTimes(2)
    expect(onMechanicClick).toHaveBeenNthCalledWith(1, realmOverlay, expect.any(Object))
    expect(onMechanicClick).toHaveBeenNthCalledWith(2, realmOverlay, expect.any(Object))
  })

  it('renders mechanic tokens without overlay details as coming soon', () => {
    render(
      <RichSegmentRenderer
        overlays={[
          {
            ...TEST_OVERLAY,
            descriptionTemplate: '   ',
          },
        ]}
        segment={{type: 'mechanic', name: 'Counter'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(screen.queryByRole('button', {name: 'Counter'})).not.toBeInTheDocument()
    expect(screen.getByText('Counter').parentElement).toHaveAttribute(
      'title',
      'Details coming soon',
    )
  })

  it('renders mechanic tokens as plain text when details exist but no popover callback is provided', () => {
    render(
      <RichSegmentRenderer
        overlays={[TEST_OVERLAY]}
        segment={{type: 'mechanic', name: 'Counter'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(screen.queryByRole('button', {name: 'Counter'})).not.toBeInTheDocument()
    expect(screen.getByText('Counter')).not.toHaveAttribute('title', 'Details coming soon')
  })
})
