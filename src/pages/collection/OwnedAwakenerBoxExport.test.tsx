import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OwnedAwakenerBoxExport } from './OwnedAwakenerBoxExport'

describe('OwnedAwakenerBoxExport', () => {
  it('shows card levels by default and allows disabling them', () => {
    render(
      <OwnedAwakenerBoxExport
        entries={[
          {
            name: 'ramona',
            displayName: 'Ramona',
            level: 4,
            awakenerLevel: 72,
            cardAsset: null,
          },
        ]}
        onStatusMessage={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export box as png/i }))

    expect(screen.getByText((_, element) => element?.textContent === 'Lv.72')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /hide levels on card/i }))
    expect(screen.queryByText((_, element) => element?.textContent === 'Lv.72')).not.toBeInTheDocument()
  })
})
