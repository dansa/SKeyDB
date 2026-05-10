import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {SkillPopover} from './SkillPopover'

describe('SkillPopover', () => {
  it('renders card headers with a cost icon label instead of CX text', () => {
    const {container} = render(
      <SkillPopover
        cardNames={new Set(['Strike'])}
        cost='2'
        description='Deal damage.'
        label='C1'
        name='Strike'
        onClose={vi.fn()}
        onNavigateToCards={undefined}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='command'
        stats={null}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Strike')).toBeInTheDocument()
    expect(screen.queryByText('Cost 2')).not.toBeInTheDocument()
    expect(container.querySelector('img[src*="UI_Battel_White_Buff_094"]')).not.toBeNull()
  })

  it('renders exalt labels with aliemus icon in the popover header', () => {
    const {container} = render(
      <SkillPopover
        cardNames={new Set()}
        description='Boosts damage.'
        label='EXALT'
        name='Overdrive'
        onClose={vi.fn()}
        onNavigateToCards={undefined}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='exalt'
        stats={null}
      />,
    )

    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('Overdrive')).toBeInTheDocument()
    expect(screen.queryByText('EXALT')).not.toBeInTheDocument()
    expect(container.querySelector('img[src*="Aliemus_Color"]')).not.toBeNull()
  })

  it('renders a shared header action button for card navigation', () => {
    const onClose = vi.fn()
    const onNavigateToCards = vi.fn()

    render(
      <SkillPopover
        cardNames={new Set(['Strike'])}
        description='Deal damage.'
        label='C1'
        name='Strike'
        onClose={onClose}
        onNavigateToCards={onNavigateToCards}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='command'
        stats={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Strike/}))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onNavigateToCards).toHaveBeenCalledTimes(1)
  })

  it('applies group hover classes for synchronized header highlight', () => {
    const onNavigateToCards = vi.fn()
    render(
      <SkillPopover
        cardNames={new Set()}
        description='Test description'
        label='C1'
        name='Strike'
        onClose={vi.fn()}
        onNavigateToCards={onNavigateToCards}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='command'
        stats={null}
      />,
    )

    const button = screen.getByRole('button', {name: /Strike/})
    expect(button).toHaveClass('group')

    // The name span is the second child of the inner span container
    // Structure: button > span > [span(eyebrow), span(name), span(arrow)]
    const nameContainer = screen.getByText('Strike')
    const arrow = screen.getByText('↗')
    // The SkillHeaderValue span has the hover class now
    const valueContainer = screen.getByText('C1')

    expect(valueContainer).toHaveClass('group-hover:text-amber-100')
    expect(nameContainer).toHaveClass('group-hover:!text-amber-100')
    expect(arrow.parentElement).toHaveClass('opacity-100')
  })

  it('shows nested depth controls and a close button for chained skill popovers', () => {
    const onClose = vi.fn()

    const {container} = render(
      <SkillPopover
        cardNames={new Set(['Strike'])}
        cost='2'
        depth={2}
        description='Deal damage.'
        label='C1'
        name='Strike'
        onBack={vi.fn()}
        onClose={onClose}
        onNavigateToCards={undefined}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='command'
        stats={null}
        totalDepth={3}
      />,
    )

    expect(container.querySelector('.absolute.top-0.left-0')?.textContent).toBe('2') // Corner depth
    fireEvent.click(screen.getByRole('button', {name: 'Close popover'}))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('truncates long descriptions and shows "Show More" button', () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    )
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      value: 300,
    })

    render(
      <SkillPopover
        cardNames={new Set()}
        description='Very long description...'
        label='TALENT'
        name='Overwhelming Power'
        onClose={vi.fn()}
        onNavigateToCards={undefined}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        stats={null}
      />,
    )

    const showMoreButton = screen.getByText('Show More')
    expect(showMoreButton).toBeInTheDocument()

    fireEvent.click(showMoreButton)

    expect(screen.queryByText('Show More')).not.toBeInTheDocument()

    if (originalScrollHeight) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight)
    } else {
      delete (HTMLElement.prototype as any).scrollHeight
    }
  })
})
