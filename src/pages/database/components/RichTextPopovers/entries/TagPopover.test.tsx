import {fireEvent, render, screen} from '@testing-library/react'
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
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        stats={null}
        tag={tag}
      />,
    )

    expect(screen.getByText(tag.label)).toBeInTheDocument()
    expect(screen.getByText(tag.description)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('shows depth navigation and routes close/back actions', () => {
    const tag = resolveTag('Weakness')
    if (!tag) {
      throw new Error('Expected Weakness tag fixture to exist')
    }

    const onClose = vi.fn()

    render(
      <TagPopover
        cardNames={new Set()}
        depth={2}
        onBack={vi.fn()}
        onClose={onClose}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        stats={null}
        tag={tag}
        totalDepth={3}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument() // Corner depth
    fireEvent.click(screen.getByRole('button', {name: 'Close popover'}))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not render an icon when the tag icon asset is unavailable', () => {
    render(
      <TagPopover
        cardNames={new Set()}
        onClose={vi.fn()}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        stats={null}
        tag={{
          key: 'custom-tag',
          label: 'Custom Tag',
          description: 'Custom description',
          iconId: 'missing-icon-id',
          aliases: [],
        }}
      />,
    )

    expect(screen.getByText('Custom Tag')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
