import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {CompactArtTile} from './CompactArtTile'

describe('CompactArtTile', () => {
  it('keeps details in the caption while stacking signals on the artwork', () => {
    render(
      <CompactArtTile
        actionPlacement='caption'
        actions={<button type='button'>Info</button>}
        chipPlacement='overlay-stack'
        chips={<span>BiS</span>}
        name='Recommended Wheel'
        preview={<img alt='Recommended wheel art' src='/wheel.webp' />}
        previewClassName='aspect-square'
        statusBar={<span>Unowned</span>}
      />,
    )

    const preview = screen
      .getByAltText('Recommended wheel art')
      .closest('.compact-art-tile-preview')
    const caption = screen.getByText('Recommended Wheel').closest('.compact-art-tile-caption')
    const action = screen.getByRole('button', {name: 'Info'})
    const chip = screen.getByText('BiS')
    const status = screen.getByText('Unowned')

    expect(preview).not.toContainElement(action)
    expect(preview).toContainElement(chip)
    expect(preview).toContainElement(status)
    expect(caption).toContainElement(action)
    expect(caption).not.toContainElement(chip)
    expect(caption).not.toContainElement(status)
    expect(chip.parentElement).toHaveClass('compact-art-tile-chip-row-overlay-stack')
    expect(status.parentElement).toHaveClass('compact-art-tile-signal-stack')
  })
})
