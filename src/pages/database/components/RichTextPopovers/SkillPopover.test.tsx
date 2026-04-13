import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {SkillPopover} from './SkillPopover'

describe('SkillPopover', () => {
  it('renders card headers with a cost icon label instead of CX text', () => {
    const {container} = render(
      <SkillPopover
        cardNames={new Set(['Strike'])}
        description='Deal damage.'
        label='Cost 2'
        name='Strike'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onNavigateToCards={undefined}
        onScalingTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        skillLevel={1}
        stats={null}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Strike')).toBeInTheDocument()
    expect(screen.queryByText('Cost 2')).not.toBeInTheDocument()
    expect(container.querySelector('img[src*="UI_Battel_White_Buff_094"]')).not.toBeNull()
  })

  it('renders non-card labels as text in the popover header', () => {
    render(
      <SkillPopover
        cardNames={new Set()}
        description='Boosts damage.'
        label='EXALT'
        name='Overdrive'
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onNavigateToCards={undefined}
        onScalingTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        skillLevel={1}
        stats={null}
      />,
    )

    expect(screen.getByText('Exalt')).toBeInTheDocument()
    expect(screen.getByText('\u25c7?')).toBeInTheDocument()
    expect(screen.getByText('Overdrive')).toBeInTheDocument()
  })
})
