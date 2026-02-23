import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CollectionLevelStepButton } from './CollectionLevelStepButton'

describe('CollectionLevelStepButton', () => {
  it('repeats on hold and suppresses trailing click', () => {
    vi.useFakeTimers()
    const onStep = vi.fn()

    render(
      <CollectionLevelStepButton
        ariaLabel="Increase enlighten level"
        direction="up"
        disabled={false}
        onStep={onStep}
      />,
    )

    const button = screen.getByRole('button', { name: /increase enlighten level/i })
    fireEvent.pointerDown(button)
    vi.advanceTimersByTime(320)
    vi.advanceTimersByTime(190)
    fireEvent.pointerUp(button)
    fireEvent.click(button)

    expect(onStep).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })
})
