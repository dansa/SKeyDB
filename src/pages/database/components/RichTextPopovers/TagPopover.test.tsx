import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {resolveTag} from '@/domain/tags'

import {TagPopover} from './TagPopover'

describe('TagPopover', () => {
  it('renders the tag header with its label and icon when available', () => {
    const tag = resolveTag('Weakness')
    if (!tag) {
      throw new Error('Expected Weakness tag fixture to exist')
    }

    const {container} = render(
      <TagPopover
        cardNames={new Set()}
        onClose={vi.fn()}
        onMechanicTokenClick={vi.fn()}
        onScalingTokenClick={vi.fn()}
        onSkillTokenClick={vi.fn()}
        skillLevel={1}
        stats={null}
        tag={tag}
      />,
    )

    expect(screen.getByText(tag.label)).toBeInTheDocument()
    expect(screen.getByText(tag.description)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeNull()
  })
})
