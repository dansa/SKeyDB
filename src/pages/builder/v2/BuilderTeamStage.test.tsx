import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../../builder-page.integration-mocks'

import {BuilderTeamStage} from './BuilderTeamStage'
import {useBuilderStore} from './store/builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

describe('BuilderTeamStage', () => {
  it('renders the shared non-mobile team stage with tabs, a fixed four-card grid, and quick lineup controls', () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    expect(screen.getAllByRole('button', {name: /Team 1/i}).length).toBeGreaterThan(0)
    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
      'data-compact-layout',
      'single-row-flex',
    )
    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
      'data-builder-tabs-variant',
      'tablet',
    )
    expect(screen.getByTestId('builder-team-stage')).toBeInTheDocument()
    expect(screen.getByTestId('builder-v2-compact-header')).toBeInTheDocument()
    expect(screen.getByTestId('current-team-action-bar')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /^Rename$/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Reset Team/i})).toBeInTheDocument()
    expect(screen.getByTestId('builder-card-grid')).toHaveAttribute(
      'data-builder-grid-columns',
      '4',
    )
    expect(screen.getByRole('button', {name: /Quick Lineup/i})).toBeInTheDocument()
  })

  it('keeps the shared compact action bar above the card grid while idle', () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    const actionBar = screen.getByTestId('current-team-action-bar')
    const cardGrid = screen.getByTestId('builder-card-grid')

    expect(actionBar.compareDocumentPosition(cardGrid) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(
      0,
    )
  })

  it('keeps compact quick lineup controls in the top stage chrome above the card grid once active', async () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))

    const quickLineupControls = await screen.findByTestId('builder-quick-lineup-controls')
    const cardGrid = screen.getByTestId('builder-card-grid')

    expect(
      quickLineupControls.compareDocumentPosition(cardGrid) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
  })

  it('starts quick lineup from the shared stage and lets card clicks jump the active step', async () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    fireEvent.click(screen.getByRole('button', {name: /Quick Lineup/i}))

    await waitFor(() => {
      expect(useBuilderStore.getState().quickLineupSessionState).not.toBeNull()
    })

    expect(screen.getByText(/Step 1 \/ 17/i)).toBeInTheDocument()
    expect(screen.getByTestId('builder-quick-lineup-status')).toHaveTextContent(
      /Slot 1 -> Awakener/i,
    )

    const deployButtons = screen.getAllByRole('button', {name: /Deploy awakeners/i})
    const secondDeployButton = deployButtons[1]
    fireEvent.click(secondDeployButton)

    await waitFor(() => {
      expect(useBuilderStore.getState().activeSelection).toEqual({
        kind: 'awakener',
        slotId: 'slot-2',
      })
    })

    expect(screen.getByText(/Step 5 \/ 17/i)).toBeInTheDocument()
    expect(screen.getByTestId('builder-quick-lineup-status')).toHaveTextContent(
      /Slot 2 -> Awakener/i,
    )
  })

  it('keeps compact rename functionality in the shared action bar', async () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    fireEvent.click(screen.getByRole('button', {name: /^Rename$/i}))
    fireEvent.change(screen.getByDisplayValue('Team 1'), {target: {value: 'Compact Team'}})
    fireEvent.keyDown(screen.getByDisplayValue('Compact Team'), {key: 'Enter'})

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0]?.name).toBe('Compact Team')
    })
  })

  it('does not create a local horizontal scroller around the compact card grid', () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    expect(screen.getByTestId('builder-card-grid').parentElement).not.toHaveClass('overflow-x-auto')
  })

  it('does not reserve a hard compact-stage minimum width wider than the viewport', () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    expect(screen.getByTestId('builder-card-grid').parentElement).not.toHaveClass('min-w-[35rem]')
  })

  it('keeps the compact stage grid chain shrinkable while avoiding a forced full-height width wrapper', () => {
    resetStore()

    render(<BuilderTeamStage compact />)

    const grid = screen.getByTestId('builder-card-grid')
    const gridWidthShell = grid.parentElement
    const gridBody = gridWidthShell?.parentElement

    expect(gridWidthShell).not.toHaveClass('h-full')
    expect(gridBody).toHaveClass('min-h-0')
  })
})
