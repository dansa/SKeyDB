import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {TeamSlot} from '../../../types'
import {SlotThumbnails} from './FocusedShared'

function makeSlot(slotId: string, awakenerName?: string, isSupport = false): TeamSlot {
  return {
    covenantId: undefined,
    isSupport,
    level: 60,
    realm: awakenerName ? 'AEQUOR' : undefined,
    slotId,
    awakenerName,
    wheels: [null, null],
  }
}

describe('SlotThumbnails', () => {
  it('does not reselect the current slot thumbnail', () => {
    const onSelect = vi.fn()

    render(
      <SlotThumbnails
        currentIndex={0}
        onSelect={onSelect}
        slots={[makeSlot('slot-1', 'agrippa'), makeSlot('slot-2', 'casiah')]}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /agrippa/i}))
    fireEvent.click(screen.getByRole('button', {name: /casiah/i}))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('marks support thumbnails with a support badge', () => {
    render(
      <SlotThumbnails
        currentIndex={0}
        onSelect={() => undefined}
        slots={[makeSlot('slot-1', 'agrippa', true), makeSlot('slot-2', 'casiah')]}
      />,
    )

    expect(screen.getByText('S')).toBeInTheDocument()
  })
})
