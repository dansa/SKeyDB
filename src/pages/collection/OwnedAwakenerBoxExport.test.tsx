import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OwnedAwakenerBoxExport } from './OwnedAwakenerBoxExport'

describe('OwnedAwakenerBoxExport', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

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
    expect(sortSelect.textContent).toContain('Rarity')

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

  it('supports rarity sort with Genesis above SSR and SR', () => {
    render(
      <OwnedAwakenerBoxExport
        entries={[
          {
            name: 'gen',
            displayName: 'Genesis Unit',
            faction: 'AEQUOR',
            index: 1,
            level: 0,
            awakenerLevel: 60,
            cardAsset: null,
            rarity: 'Genesis',
          },
          {
            name: 'ssr',
            displayName: 'SSR Unit',
            faction: 'CHAOS',
            index: 2,
            level: 0,
            awakenerLevel: 60,
            cardAsset: null,
            rarity: 'SSR',
          },
          {
            name: 'sr',
            displayName: 'SR Unit',
            faction: 'CARO',
            index: 3,
            level: 0,
            awakenerLevel: 60,
            cardAsset: null,
            rarity: 'SR',
          },
        ]}
        onStatusMessage={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export box as png/i }))
    fireEvent.change(screen.getByLabelText(/sort by/i), { target: { value: 'RARITY' } })
    const directionButton = screen.getByRole('button', { name: /toggle sort direction/i })
    if (directionButton.textContent?.includes('Low')) {
      fireEvent.click(directionButton)
    }

    const labels = screen.getAllByTestId('export-preview-card-label')
    expect(labels[0]).toHaveTextContent('Genesis Unit')
    expect(labels[1]).toHaveTextContent('SSR Unit')
    expect(labels[2]).toHaveTextContent('SR Unit')
  })

  it('rehydrates persisted rarity sort config from local storage', () => {
    window.localStorage.setItem(
      'skeydb.ownedBoxExport.sort.v1',
      JSON.stringify({
        key: 'RARITY',
        direction: 'ASC',
        groupByFaction: true,
      }),
    )

    render(
      <OwnedAwakenerBoxExport
        entries={[
          {
            name: 'aurita',
            displayName: 'Aurita',
            faction: 'AEQUOR',
            rarity: 'SSR',
            index: 1,
            level: 1,
            awakenerLevel: 60,
            cardAsset: null,
          },
        ]}
        onStatusMessage={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export box as png/i }))

    expect(screen.getByRole('combobox', { name: /sort by/i })).toHaveValue('RARITY')
    expect(screen.getByRole('button', { name: /toggle sort direction/i })).toHaveTextContent('Low')
    expect(screen.getByRole('button', { name: /group by faction/i })).toHaveTextContent('On')
  })
})
