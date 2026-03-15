import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {BuilderCovenantPlaceholder, BuilderSigilPlaceholder} from './BuilderPlaceholders'

describe('BuilderPlaceholders', () => {
  it('renders awakener and wheel sigils with their respective sizing variants', () => {
    const {container} = render(
      <>
        <BuilderSigilPlaceholder data-testid='awakener-sigil' variant='card' />
        <BuilderSigilPlaceholder data-testid='wheel-sigil' variant='wheel' />
        <BuilderSigilPlaceholder data-testid='thumb-sigil' variant='thumb' />
      </>,
    )

    expect(screen.getByTestId('awakener-sigil')).toHaveClass('sigil-placeholder-card')
    expect(screen.getByTestId('wheel-sigil')).toHaveClass('sigil-placeholder-wheel')
    expect(screen.getByTestId('thumb-sigil')).toHaveClass('sigil-placeholder-thumb')
    expect(container.querySelectorAll('.sigil-placeholder')).toHaveLength(3)
  })

  it('renders the covenant placeholder with the shared sigil treatment instead of text chrome', () => {
    const {container} = render(<BuilderCovenantPlaceholder />)

    expect(container.querySelector('.sigil-placeholder')).not.toBeNull()
    expect(container.querySelector('.sigil-placeholder-thumb')).not.toBeNull()
    expect(container).not.toHaveTextContent('+C')
  })
})
