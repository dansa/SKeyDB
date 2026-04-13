import {useState} from 'react'

import {act, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {AwakenerEnlightenStepper} from './AwakenerEnlightenStepper'

function TestHarness({initialOffset}: {initialOffset: number}) {
  const [offset, setOffset] = useState(initialOffset)

  return (
    <AwakenerEnlightenStepper
      offset={offset}
      onDecrease={() => {
        setOffset((prev) => Math.max(prev - 1, 0))
      }}
      onIncrease={() => {
        setOffset((prev) => Math.min(prev + 1, 12))
      }}
    />
  )
}

describe('AwakenerEnlightenStepper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the E3 baseline state and disables the decrease action at zero', () => {
    render(<TestHarness initialOffset={0} />)

    expect(screen.getByText('E3+0')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /decrease psyche surge/i})).toBeDisabled()
  })

  it('supports hold-repeat stepping and clamps at E3+12', () => {
    render(<TestHarness initialOffset={10} />)

    const increaseButton = screen.getByRole('button', {name: /increase psyche surge/i})

    fireEvent.pointerDown(increaseButton)
    act(() => {
      vi.advanceTimersByTime(320)
      vi.advanceTimersByTime(190)
    })
    fireEvent.pointerUp(increaseButton)
    fireEvent.click(increaseButton)

    expect(screen.getByText('E3+12')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /increase psyche surge/i})).toBeDisabled()
  })
})
