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
            faction: 'CHAOS',
            index: 2,
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

  it('supports level sorting with faction grouping and enlighten/index tie-breakers', () => {
    render(
      <OwnedAwakenerBoxExport
        entries={[
          {
            name: 'ramona',
            displayName: 'Ramona',
            faction: 'CHAOS',
            index: 2,
            level: 2,
            awakenerLevel: 60,
            cardAsset: null,
          },
          {
            name: 'aurita',
            displayName: 'Aurita',
            faction: 'AEQUOR',
            index: 1,
            level: 7,
            awakenerLevel: 60,
            cardAsset: null,
          },
          {
            name: 'ogier',
            displayName: 'Ogier',
            faction: 'CHAOS',
            index: 3,
            level: 5,
            awakenerLevel: 60,
            cardAsset: null,
          },
        ]}
        onStatusMessage={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export box as png/i }))

    fireEvent.change(screen.getByLabelText(/sort by/i), { target: { value: 'LEVEL' } })
    fireEvent.click(screen.getByLabelText(/group by faction/i))

    const sortSelect = screen.getByLabelText(/sort by/i)
    expect(sortSelect.textContent).not.toContain('Rarity')

    const labels = screen.getAllByTestId('export-preview-card-label')
    expect(labels[0]).toHaveTextContent('Ogier')
    expect(labels[1]).toHaveTextContent('Ramona')
    expect(labels[2]).toHaveTextContent('Aurita')
  })

  it('uses alphabetical as primary key when selected', () => {
    render(
      <OwnedAwakenerBoxExport
        entries={[
          {
            name: 'ramona',
            displayName: 'Ramona',
            faction: 'CHAOS',
            index: 2,
            level: 2,
            awakenerLevel: 60,
            cardAsset: null,
          },
          {
            name: 'aurita',
            displayName: 'Aurita',
            faction: 'AEQUOR',
            index: 1,
            level: 7,
            awakenerLevel: 60,
            cardAsset: null,
          },
        ]}
        onStatusMessage={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export box as png/i }))
    fireEvent.change(screen.getByLabelText(/sort by/i), { target: { value: 'ALPHABETICAL' } })
    fireEvent.click(screen.getByLabelText(/toggle sort direction/i))

    const labels = screen.getAllByTestId('export-preview-card-label')
    expect(labels[0]).toHaveTextContent('Aurita')
    expect(labels[1]).toHaveTextContent('Ramona')
  })
})
