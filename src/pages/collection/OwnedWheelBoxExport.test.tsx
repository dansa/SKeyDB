import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OwnedWheelBoxExport } from './OwnedWheelBoxExport'

describe('OwnedWheelBoxExport', () => {
  it('defaults rarity filters to SSR only', () => {
    render(
      <OwnedWheelBoxExport
        entries={[
          {
            id: 'B01',
            name: 'SSR Wheel',
            rarity: 'SSR',
            level: 0,
            wheelAsset: null,
          },
          {
            id: 'SR01',
            name: 'SR Wheel',
            rarity: 'SR',
            level: 0,
            wheelAsset: null,
          },
        ]}
        onStatusMessage={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export wheels as png/i }))

    expect(screen.getByLabelText('Include SSR wheels')).toHaveAttribute('data-checked', 'true')
    expect(screen.getByLabelText('Include SR wheels')).toHaveAttribute('data-checked', 'false')
    expect(screen.getByLabelText('Include R wheels')).toHaveAttribute('data-checked', 'false')

    expect(screen.getByText('SSR Wheel')).toBeInTheDocument()
    expect(screen.queryByText('SR Wheel')).not.toBeInTheDocument()
    expect(screen.queryByText('Show Levels')).not.toBeInTheDocument()
    expect(screen.queryByText('Level Text Scale')).not.toBeInTheDocument()
  })
})
