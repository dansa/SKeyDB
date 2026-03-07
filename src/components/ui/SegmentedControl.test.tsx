import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {SegmentedControl} from './SegmentedControl'

describe('SegmentedControl', () => {
  it('renders options and changes the selected value', () => {
    const onChange = vi.fn()

    render(
      <SegmentedControl
        ariaLabel='Preview mode'
        onChange={onChange}
        options={[
          {value: 'compact', label: 'Compact'},
          {value: 'expanded', label: 'Expanded'},
        ]}
        value='compact'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Expanded'}))

    expect(onChange).toHaveBeenCalledWith('expanded')
    expect(screen.getByRole('button', {name: 'Compact'})).toHaveAttribute('aria-pressed', 'true')
  })
})
