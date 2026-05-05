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
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Lv. 60')
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

  it('clamps forwarded values to the configured slider bounds', () => {
    const onChange = vi.fn()

    render(
      <DetailLevelSlider label='Awakener Level' level={60} max={90} min={1} onChange={onChange} />,
    )

    const slider = screen.getByRole('slider')

    fireEvent.change(slider, {target: {value: '120'}})
    fireEvent.change(slider, {target: {value: '-8'}})

    expect(onChange).toHaveBeenNthCalledWith(1, 90)
    expect(onChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('uses the formatted value label for aria-valuetext when provided', () => {
    render(
      <DetailLevelSlider
        formatValueLabel={(level) => (level === 0 ? 'Off' : `Lv. ${String(level)}`)}
        label='Soulforge'
        level={0}
        max={5}
        min={0}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Off')
  })
})
