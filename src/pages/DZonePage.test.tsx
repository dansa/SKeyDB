import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {DZonePage} from './DZonePage'

function renderDZonePage() {
  return render(
    <MemoryRouter>
      <DZonePage />
    </MemoryRouter>,
  )
}

describe('DZonePage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the current D-zone season with all five waves', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-12T00:00:00Z'))

    renderDZonePage()

    expect(screen.getByRole('heading', {level: 1, name: 'D-Effect Zone'})).toBeInTheDocument()
    expect(screen.getByText(/Season 60 · May 11, 2026 - May 25, 2026/)).toBeInTheDocument()
    const seasonPanel = screen.getByRole('complementary', {name: 'Current D-zone season'})
    expect(seasonPanel).toHaveTextContent('Current Season')
    expect(seasonPanel).toHaveTextContent('Aequor Ring')
    expect(seasonPanel).toHaveTextContent(/Ends in/)
    expect(screen.getByRole('button', {name: 'Collapse Wave 1'})).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getAllByRole('button', {name: /Expand Wave/i})).toHaveLength(4)
    expect(screen.getAllByRole('heading', {level: 3, name: /Initial Relic/i})).toHaveLength(5)
    expect(screen.getAllByRole('heading', {level: 3, name: /Monsters/i})).toHaveLength(5)
  })

  it('shows the season relic first in each wave without duplicate relic labels', () => {
    renderDZonePage()

    const waveOneRelicButtons = screen.getAllByRole('button', {
      name: /View Wave 1 relic details/i,
    })

    expect(waveOneRelicButtons[0]).toHaveAccessibleName(/Aequor Ring/)
    expect(waveOneRelicButtons[1]).toHaveAccessibleName(/Preserved Butterfly/)
    expect(waveOneRelicButtons[0]).not.toHaveTextContent(/Initial Relic/i)
  })

  it('opens monster details with database rich characteristic text', async () => {
    renderDZonePage()

    fireEvent.click(
      screen.getByRole('button', {name: /View Wave 1 monster details for "Blesser"/i}),
    )

    const dialog = await screen.findByRole('dialog', {name: /database reference details/i})
    expect(within(dialog).getByLabelText('Redacted lore text')).toBeInTheDocument()
    expect(within(dialog).getByText('Dominion')).toBeInTheDocument()
    expect(within(dialog).getByText('Insectoid')).toBeInTheDocument()
    expect(
      within(dialog).getByText('Immensely powerful foes that spawn anomalies.'),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText('Badge')).not.toBeInTheDocument()
  })

  it('opens initial relic details through the database popover layer', async () => {
    renderDZonePage()

    fireEvent.click(
      screen.getByRole('button', {name: /View Wave 1 relic details for "Aequor Ring"/i}),
    )

    const dialog = await screen.findByRole('dialog', {name: /database reference details/i})
    await waitFor(() => {
      expect(within(dialog).getAllByText(/Relic Capacity/).length).toBeGreaterThan(0)
    })
    expect(within(dialog).queryByText(/D-Zone Initial Relic · SSR/)).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Rarity')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Type')).not.toBeInTheDocument()
  })
})
