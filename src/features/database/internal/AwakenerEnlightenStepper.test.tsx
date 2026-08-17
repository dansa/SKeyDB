import {useState} from 'react'

import {act, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {AwakenerPsycheSurgeStepper} from './AwakenerPsycheSurgeStepper'

function TestHarness({initialOffset}: {initialOffset: number}) {
  const [offset, setOffset] = useState(initialOffset)

  return <AwakenerPsycheSurgeStepper max={12} min={0} offset={offset} onChange={setOffset} />
}

describe('AwakenerPsycheSurgeStepper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the E3 baseline state and disables the decrease action at zero', () => {
    render(<TestHarness initialOffset={0} />)

    expect(screen.getByRole('group', {name: 'Psyche Surge'})).toBeInTheDocument()
    expect(screen.getByText('E3')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', {name: 'Psyche Surge bonus'})).toHaveValue(0)
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

    expect(screen.getByRole('spinbutton', {name: 'Psyche Surge bonus'})).toHaveValue(12)
    expect(screen.getByRole('button', {name: /increase psyche surge/i})).toBeDisabled()
  })

  it('edits only the bonus and supports focused wheel stepping', () => {
    render(<TestHarness initialOffset={4} />)

    const input = screen.getByRole('spinbutton', {name: 'Psyche Surge bonus'})
    fireEvent.change(input, {target: {value: ''}})
    expect(input).toHaveValue(null)

    fireEvent.change(input, {target: {value: '9'}})
    fireEvent.keyDown(input, {key: 'Enter'})
    expect(input).toHaveValue(9)
    expect(screen.getByText('E3')).toBeInTheDocument()

    input.focus()
    fireEvent.wheel(input, {deltaY: -100})
    expect(input).toHaveValue(10)
    expect(input).toHaveFocus()
  })
})
