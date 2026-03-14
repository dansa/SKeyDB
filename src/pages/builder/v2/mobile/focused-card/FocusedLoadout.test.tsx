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
  it('keeps the wide empty covenant placeholder visually larger than the row placeholder', () => {
    const {rerender} = render(<LandscapeLoadout layout={wideLayout} />)

    expect(screen.getByText('+C')).toHaveClass('text-[8px]')

    rerender(<LandscapeLoadout />)

    expect(screen.getByText('+C')).toHaveClass('text-[7px]')
  })

  it('renders empty covenant placeholders as static tiles instead of inert buttons', () => {
    const {rerender} = render(<LandscapeLoadout layout={wideLayout} />)

    expect(screen.queryByRole('button')).toBeNull()

    rerender(<LandscapeLoadout />)

    expect(screen.queryByRole('button')).toBeNull()
  })
})
