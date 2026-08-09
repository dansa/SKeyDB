import {useState} from 'react'

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

  it('buffers numeric drafts until Enter and clamps committed values', () => {
    const onChange = vi.fn()

    render(
      <DetailLevelSlider label='Awakener Level' level={60} max={90} min={1} onChange={onChange} />,
    )

    const input = screen.getByRole('spinbutton', {name: 'Awakener Level'})
    fireEvent.change(input, {target: {value: ''}})
    expect(input).toHaveValue(null)
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.change(input, {target: {value: '120'}})
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(input, {key: 'Enter'})

    expect(onChange).toHaveBeenCalledWith(90)
  })

  it('restores the committed numeric value on Escape', () => {
    const onChange = vi.fn()

    render(
      <DetailLevelSlider label='Awakener Level' level={60} max={90} min={1} onChange={onChange} />,
    )

    const input = screen.getByRole('spinbutton', {name: 'Awakener Level'})
    fireEvent.change(input, {target: {value: '7'}})
    fireEvent.keyDown(input, {key: 'Escape'})

    expect(input).toHaveValue(60)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps the slider and buffered input synchronized', () => {
    function Harness() {
      const [level, setLevel] = useState(60)
      return (
        <DetailLevelSlider
          label='Awakener Level'
          level={level}
          max={90}
          min={1}
          onChange={setLevel}
        />
      )
    }

    render(<Harness />)

    fireEvent.change(screen.getByRole('slider', {name: 'Awakener Level'}), {
      target: {value: '77'},
    })

    expect(screen.getByRole('spinbutton', {name: 'Awakener Level'})).toHaveValue(77)
  })
})
