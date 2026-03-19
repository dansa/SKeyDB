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

  it('uses the same outer border and hover treatment for wheel and covenant tiles', () => {
    render(
      <LandscapeLoadout
        onCovenantClick={() => undefined}
        onWheelClick={() => undefined}
        slot={{
          covenantId: '001',
          level: 60,
          slotId: 'slot-1',
          awakenerName: 'agrippa',
          wheels: ['O01', null],
        }}
        wheelOwnedLevels={[null, null]}
      />,
    )

    const [wheelButton] = screen.getAllByRole('button')
    const covenantButton = screen.getAllByRole('button')[2]

    expect(wheelButton).toHaveClass('border-slate-500/45')
    expect(wheelButton).toHaveClass('hover:border-amber-400/50')
    expect(covenantButton).toHaveClass('border-slate-500/45')
    expect(covenantButton).toHaveClass('hover:border-amber-400/50')
  })
})
