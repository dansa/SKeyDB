import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {TeamSlot} from '../../../types'
import type {QuickLineupStep} from '../../store/types'
import {QuickLineupSlotCard} from './QuickLineupSlotCard'

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerCardAsset: (awakenerName: string) =>
    awakenerName === 'goliath' ? undefined : `/mock/awakeners/${awakenerName}-card.png`,
  getAwakenerPortraitAsset: (awakenerName: string) =>
    `/mock/awakeners/${awakenerName}-portrait.png`,
}))

function createSlot(overrides: Partial<TeamSlot> = {}): TeamSlot {
  return {
    slotId: 'slot-1',
    wheels: [null, null],
    ...overrides,
  }
}

describe('QuickLineupSlotCard', () => {
  it('marks the active slot and active target distinctly', () => {
    render(
      <QuickLineupSlotCard
        activeTarget='wheel-1'
        cardHeight={212.8}
        cardWidth={91.5}
        isActiveSlot
        layout='portrait'
        onJumpToStep={() => undefined}
        slot={createSlot({awakenerName: 'goliath'})}
        slotIndex={0}
      />,
    )

    expect(screen.getByTestId('quick-lineup-slot-card-slot-1')).toHaveAttribute(
      'data-active-slot',
      'true',
    )
    expect(screen.getByTestId('quick-lineup-target-slot-1-wheel-1')).toHaveAttribute(
      'data-active-target',
      'true',
    )
    expect(screen.getByTestId('quick-lineup-target-slot-1-wheel-0')).toHaveAttribute(
      'data-active-target',
      'false',
    )
  })

  it('renders portrait and landscape card shells with filled and empty targets', () => {
    const {rerender} = render(
      <QuickLineupSlotCard
        activeTarget={null}
        cardHeight={212.8}
        cardWidth={91.5}
        isActiveSlot={false}
        layout='portrait'
        onJumpToStep={() => undefined}
        slot={createSlot({awakenerName: 'goliath', covenantId: '001', wheels: ['O01', null]})}
        slotIndex={0}
      />,
    )

    expect(screen.getByTestId('quick-lineup-slot-card-slot-1')).toHaveAttribute(
      'data-layout',
      'portrait',
    )
    expect(screen.getByTestId('quick-lineup-target-slot-1-awakener')).toHaveAttribute(
      'data-filled',
      'true',
    )
    expect(screen.getByTestId('quick-lineup-target-slot-1-wheel-0')).toHaveAttribute(
      'data-filled',
      'true',
    )
    expect(screen.getByTestId('quick-lineup-target-slot-1-wheel-1')).toHaveAttribute(
      'data-filled',
      'false',
    )
    expect(screen.getByTestId('quick-lineup-target-slot-1-covenant')).toHaveAttribute(
      'data-filled',
      'true',
    )

    rerender(
      <QuickLineupSlotCard
        activeTarget={null}
        cardHeight={82.5}
        cardWidth={236.3}
        isActiveSlot={false}
        layout='landscape'
        onJumpToStep={() => undefined}
        slot={createSlot()}
        slotIndex={0}
      />,
    )

    expect(screen.getByTestId('quick-lineup-slot-card-slot-1')).toHaveAttribute(
      'data-layout',
      'landscape',
    )
    expect(screen.getByTestId('quick-lineup-target-slot-1-awakener')).toHaveAttribute(
      'data-filled',
      'false',
    )
  })

  it('falls back to the portrait art when card art is unavailable', () => {
    render(
      <QuickLineupSlotCard
        activeTarget={null}
        cardHeight={212.8}
        cardWidth={91.5}
        isActiveSlot={false}
        layout='portrait'
        onJumpToStep={() => undefined}
        slot={createSlot({awakenerName: 'goliath'})}
        slotIndex={0}
      />,
    )

    expect(screen.getByRole('img', {name: /goliath card/i})).toHaveAttribute(
      'src',
      '/mock/awakeners/goliath-portrait.png',
    )
  })

  it('keeps the covenant target over the visual zone instead of spending a dedicated gear lane on it', () => {
    const {rerender} = render(
      <QuickLineupSlotCard
        activeTarget={null}
        cardHeight={212.8}
        cardWidth={91.5}
        isActiveSlot={false}
        layout='portrait'
        onJumpToStep={() => undefined}
        slot={createSlot({covenantId: '001'})}
        slotIndex={0}
      />,
    )

    const portraitVisualZone = screen.getByTestId('quick-lineup-visual-zone-slot-1')
    const portraitWheelsZone = screen.getByTestId('quick-lineup-wheels-zone-slot-1')
    const portraitCovenant = screen.getByTestId('quick-lineup-target-slot-1-covenant')

    expect(portraitVisualZone).toContainElement(portraitCovenant)
    expect(portraitWheelsZone).not.toContainElement(portraitCovenant)

    rerender(
      <QuickLineupSlotCard
        activeTarget={null}
        cardHeight={150}
        cardWidth={220}
        isActiveSlot={false}
        layout='landscape'
        onJumpToStep={() => undefined}
        slot={createSlot({covenantId: '001'})}
        slotIndex={0}
      />,
    )

    const landscapeVisualZone = screen.getByTestId('quick-lineup-visual-zone-slot-1')
    const landscapeWheelsZone = screen.getByTestId('quick-lineup-wheels-zone-slot-1')
    const landscapeCovenant = screen.getByTestId('quick-lineup-target-slot-1-covenant')

    expect(landscapeVisualZone).toContainElement(landscapeCovenant)
    expect(landscapeWheelsZone).not.toContainElement(landscapeCovenant)
  })

  it('renders covenant overlays without the cov label and with a tighter art crop', () => {
    render(
      <QuickLineupSlotCard
        activeTarget={null}
        cardHeight={150}
        cardWidth={220}
        isActiveSlot={false}
        layout='landscape'
        onJumpToStep={() => undefined}
        slot={createSlot({covenantId: '001', wheels: ['O01', null]})}
        slotIndex={0}
      />,
    )

    const covenantButton = screen.getByTestId('quick-lineup-target-slot-1-covenant')
    const covenantImage = covenantButton.querySelector('img')
    const wheelButton = screen.getByTestId('quick-lineup-target-slot-1-wheel-0')

    expect(covenantButton).not.toHaveTextContent('Cov')
    expect(covenantImage).toHaveStyle({transform: 'scale(1.75)'})
    expect(wheelButton).toHaveTextContent('W1')
  })

  it('routes portrait, wheel, and covenant clicks back as quick-lineup steps', () => {
    const onJumpToStep = vi.fn<(step: QuickLineupStep) => void>()

    render(
      <QuickLineupSlotCard
        activeTarget={null}
        cardHeight={212.8}
        cardWidth={91.5}
        isActiveSlot={false}
        layout='portrait'
        onJumpToStep={onJumpToStep}
        slot={createSlot()}
        slotIndex={2}
      />,
    )

    fireEvent.click(screen.getByTestId('quick-lineup-target-slot-1-awakener'))
    fireEvent.click(screen.getByTestId('quick-lineup-target-slot-1-wheel-0'))
    fireEvent.click(screen.getByTestId('quick-lineup-target-slot-1-covenant'))

    expect(onJumpToStep.mock.calls).toEqual([
      [{kind: 'awakener', slotId: 'slot-1'}],
      [{kind: 'wheel', slotId: 'slot-1', wheelIndex: 0}],
      [{kind: 'covenant', slotId: 'slot-1'}],
    ])
  })
})
