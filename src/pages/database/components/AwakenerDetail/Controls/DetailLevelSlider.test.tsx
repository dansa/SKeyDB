import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DetailLevelSlider} from './DetailLevelSlider'

describe('DetailLevelSlider', () => {
  it('renders the standard slider without the compact modifier by default', () => {
    render(
      <DetailLevelSlider label='Awakener Level' level={60} max={90} min={1} onChange={vi.fn()} />,
    )

    expect(screen.getByRole('slider')).toHaveClass('export-box-slider')
    expect(screen.getByRole('slider')).not.toHaveClass('export-box-slider--compact')
  })

  it('applies the compact modifier and still forwards changes', () => {
    const onChange = vi.fn()

    render(
      <DetailLevelSlider
        compact
        label='Awakener Level'
        level={60}
        max={90}
        min={1}
        onChange={onChange}
      />,
    )

    const slider = screen.getByRole('slider')
    expect(slider).toHaveClass('export-box-slider--compact')

    fireEvent.change(slider, {target: {value: '77'}})
    expect(onChange).toHaveBeenCalledWith(77)
  })

  it('allows editing the numeric badge directly and clamps to the valid range', () => {
    const onChange = vi.fn()

    render(
      <DetailLevelSlider label='Psyche Surge' level={3} max={12} min={0} onChange={onChange} />,
    )

    const valueInput = screen.getByRole('textbox', {name: 'Psyche Surge value'})

    fireEvent.change(valueInput, {target: {value: '9'}})
    fireEvent.blur(valueInput)
    expect(onChange).toHaveBeenCalledWith(9)

    fireEvent.change(valueInput, {target: {value: '99'}})
    fireEvent.keyDown(valueInput, {key: 'Enter'})
    expect(onChange).toHaveBeenCalledWith(12)
  })
})
