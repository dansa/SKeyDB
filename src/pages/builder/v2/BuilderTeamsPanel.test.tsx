import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../../builder-page.integration-mocks'

import {BuilderTeamsPanel} from './BuilderTeamsPanel'
import {useBuilderStore} from './store/builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function seedActiveTeam() {
  const state = useBuilderStore.getState()
  const nextSlots = state.teams[0].slots.map((slot, index) =>
    index === 0
      ? {
          ...slot,
          awakenerName: 'agrippa',
          realm: 'AEQUOR',
          level: 60,
          wheels: [null, null] as [null, null],
          covenantId: undefined,
        }
      : slot,
  )

  state.setActiveTeamSlots(nextSlots)
  state.setPosseForActiveTeam('01')
}

describe('BuilderTeamsPanel', () => {
  it('renders a preview strip and posse badge for teams', () => {
    resetStore()
    seedActiveTeam()

    render(<BuilderTeamsPanel />)

    expect(screen.getByAltText(/Agrippa team preview portrait/i)).toBeInTheDocument()
    expect(screen.getByAltText(/Team 1 posse/i)).toBeInTheDocument()
    expect(screen.getByText(/^Active$/i)).toBeInTheDocument()
  })

  it('resets the active team from the manage shelf', async () => {
    resetStore()
    seedActiveTeam()

    render(<BuilderTeamsPanel />)

    fireEvent.click(screen.getByRole('button', {name: /Manage/i}))
    fireEvent.click(screen.getAllByRole('button', {name: /Reset Active/i})[0])

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0].slots[0].awakenerName).toBeUndefined()
    })
  })

  it('switches the active team when another row is tapped', async () => {
    resetStore()
    useBuilderStore.getState().addTeam()

    render(<BuilderTeamsPanel />)

    fireEvent.click(screen.getByText(/^Team 2$/i))

    await waitFor(() => {
      expect(useBuilderStore.getState().activeTeamId).toBe(useBuilderStore.getState().teams[1].id)
    })
  })

  it('keeps the rename target pinned to the team that started editing', async () => {
    resetStore()
    const state = useBuilderStore.getState()
    const originalTeamId = state.activeTeamId
    state.addTeam()
    state.setActiveTeamId(originalTeamId)

    render(<BuilderTeamsPanel />)

    fireEvent.click(screen.getAllByTitle(/Rename team/i)[0])

    const nameInput = screen.getByRole('textbox')
    fireEvent.change(nameInput, {target: {value: 'Renamed Team 1'}})

    fireEvent.click(screen.getByText(/^Team 2$/i))
    fireEvent.keyDown(screen.getByRole('textbox'), {key: 'Enter'})

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0].name).toBe('Renamed Team 1')
    })

    expect(useBuilderStore.getState().teams[1].name).toBe('Team 2')
  })
})
