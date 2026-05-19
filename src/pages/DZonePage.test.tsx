import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {DZonePage} from './DZonePage'

vi.mock('./timeline/useTimelineNow', () => ({
  useTimelineNow: () => new Date('2026-05-12T00:00:00Z'),
}))

function renderDZonePage() {
  return render(
    <MemoryRouter>
      <DZonePage />
    </MemoryRouter>,
  )
}

describe('DZonePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the current D-zone season with all five waves', async () => {
    renderDZonePage()

    expect(
      await screen.findByRole('heading', {level: 1, name: 'D-Effect Zone'}),
    ).toBeInTheDocument()
    expect(screen.getByText(/Current Season: 60 · May 11, 2026 - May 25, 2026/)).toBeInTheDocument()
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
    expect(screen.getByRole('button', {name: 'Select Alert V'})).toBeInTheDocument()
  })

  it('switches all waves to the selected alert level', async () => {
    renderDZonePage()

    fireEvent.click(await screen.findByRole('button', {name: 'Select Alert IV'}))

    const waveOne = screen.getByRole('article', {name: 'Wave 1'})
    expect(within(waveOne).getByText('Lv 73')).toBeInTheDocument()
    expect(within(waveOne).queryByText('Lv 38')).not.toBeInTheDocument()
  })

  it('shows the season relic first in each wave without duplicate relic labels', async () => {
    renderDZonePage()

    await screen.findByRole('heading', {level: 1, name: 'D-Effect Zone'})
    const waveOneRelicButtons = screen.getAllByRole('button', {
      name: /View Wave 1 relic details/i,
    })

    expect(waveOneRelicButtons[0]).toHaveAccessibleName(/Aequor Ring/)
    expect(waveOneRelicButtons[1]).toHaveAccessibleName(/Preserved Butterfly/)
    expect(waveOneRelicButtons[0]).not.toHaveTextContent(/Initial Relic/i)
  })

  it('opens monster details with database rich characteristic text', async () => {
    renderDZonePage()

    await screen.findByRole('heading', {level: 1, name: 'D-Effect Zone'})
    fireEvent.click(
      screen.getByRole('button', {name: /View Wave 1 monster details for "Blesser"/i}),
    )

    const dialog = await screen.findByRole('dialog', {name: /database reference details/i})
    expect(within(dialog).getByLabelText('Redacted lore text')).toBeInTheDocument()
    expect(within(dialog).getByText('Dominion')).toBeInTheDocument()
    expect(within(dialog).getByText('Insectoid')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        (_, element) =>
          element !== null &&
          element.tagName === 'P' &&
          element.textContent === 'Level 38 · HP 24474 · 3 HP bars',
      ),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText('Alert')).not.toBeInTheDocument()
    expect(
      within(dialog).getByText('Immensely powerful foes that spawn anomalies.'),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText('Badge')).not.toBeInTheDocument()
  })

  it('uses the database outside-click preference for D-zone popovers', async () => {
    window.localStorage.setItem(
      'database-detail-preferences',
      JSON.stringify({
        shared: {
          showTagIcons: true,
          clickOutsideClosesPopovers: true,
          fontScale: 'small',
          accountLevel: 50,
        },
      }),
    )

    renderDZonePage()

    await screen.findByRole('heading', {level: 1, name: 'D-Effect Zone'})
    fireEvent.click(
      screen.getByRole('button', {name: /View Wave 1 monster details for "Blesser"/i}),
    )

    expect(
      await screen.findByRole('dialog', {name: /database reference details/i}),
    ).toBeInTheDocument()

    fireEvent.pointerDown(document.body)

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', {name: /database reference details/i}),
      ).not.toBeInTheDocument()
    })
  })

  it('opens initial relic details through the database popover layer', async () => {
    renderDZonePage()

    await screen.findByRole('heading', {level: 1, name: 'D-Effect Zone'})
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
