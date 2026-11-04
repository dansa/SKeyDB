import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {TogglePill} from './TogglePill'

describe('TogglePill', () => {
  it('exposes its name and state and reports keyboard/button activation changes', () => {
    const onChange = vi.fn()
    const {rerender} = render(
      <TogglePill ariaLabel='Unused first' checked={false} onChange={onChange} />,
    )
    const toggle = screen.getByRole('button', {name: 'Unused first', pressed: false})
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
    rerender(<TogglePill ariaLabel='Unused first' checked onChange={onChange} />)
    expect(screen.getByRole('button', {name: 'Unused first', pressed: true})).toBe(toggle)
  })
})
