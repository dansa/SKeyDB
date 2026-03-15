import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {LandscapeLoadout} from './FocusedLoadout'

const wideLayout = {
  cardHeight: 240,
  cardWidth: 240,
  railSize: 44,
  redColumnWidth: 44.8,
  redRowHeight: 88,
  stage: 'split' as const,
  stageHeight: 240,
  willScroll: false,
}

describe('FocusedLoadout', () => {
  it('renders the empty covenant placeholder with the shared sigil treatment in both layouts', () => {
    const {container, rerender} = render(<LandscapeLoadout layout={wideLayout} />)

    expect(container.querySelector('.sigil-placeholder-thumb')).not.toBeNull()
    expect(container).not.toHaveTextContent('+C')

    rerender(<LandscapeLoadout />)

    expect(container.querySelector('.sigil-placeholder-thumb')).not.toBeNull()
    expect(container).not.toHaveTextContent('+C')
  })

  it('renders empty covenant placeholders as static tiles instead of inert buttons', () => {
    const {rerender} = render(<LandscapeLoadout layout={wideLayout} />)

    expect(screen.queryByRole('button')).toBeNull()

    rerender(<LandscapeLoadout />)

    expect(screen.queryByRole('button')).toBeNull()
  })
})
