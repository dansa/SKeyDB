import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../../builder-page.integration-mocks'

import {BuilderV2ActiveTeamHeader} from './BuilderV2ActiveTeamHeader'
import {useBuilderStore} from './store/builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function seedActiveTeam() {
  const state = useBuilderStore.getState()
  state.renameTeam(state.activeTeamId, 'Tablet Team')
  state.setPosseForActiveTeam('01')
  state.setActiveTeamSlots(
    state.teams[0].slots.map((slot, index) =>
      index === 0
        ? {
            ...slot,
            awakenerName: 'agrippa',
            realm: 'AEQUOR',
            level: 60,
            wheels: [null, null] as [null, null],
            covenantId: undefined,
          }
        : index === 1
          ? {
              ...slot,
              awakenerName: 'casiah',
              realm: 'CARO',
              level: 60,
              wheels: [null, null] as [null, null],
              covenantId: undefined,
            }
          : slot,
    ),
  )
}

describe('BuilderV2ActiveTeamHeader', () => {
  it('renders a compact tablet header and opens the posse picker', async () => {
    resetStore()
    seedActiveTeam()

    render(<BuilderV2ActiveTeamHeader compact />)

    expect(screen.getByTestId('builder-v2-compact-header')).toBeInTheDocument()
    expect(screen.getByText('Tablet Team')).toBeInTheDocument()
    expect(screen.getByText(/Aequor/i)).toBeInTheDocument()
    expect(screen.getByText(/Caro/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /Open posse picker/i}))

    await waitFor(() => {
      expect(useBuilderStore.getState().pickerTab).toBe('posses')
    })
  })

  it('keeps the compact tablet header display-only while still exposing posse access', async () => {
    resetStore()
    seedActiveTeam()

    render(<BuilderV2ActiveTeamHeader compact />)

    expect(screen.getByText('Tablet Team')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /Rename Tablet Team/i})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /Open posse picker/i})).toBeInTheDocument()
  })

  it('commits a header rename to the team that started editing even if the active team changes', async () => {
    resetStore()
    seedActiveTeam()
    const state = useBuilderStore.getState()
    const originalTeamId = state.activeTeamId
    state.addTeam()
    state.setActiveTeamId(originalTeamId)
    const secondTeamOriginalName = useBuilderStore.getState().teams[1].name

    render(<BuilderV2ActiveTeamHeader />)

    fireEvent.click(screen.getByRole('button', {name: /Rename Tablet Team/i}))

    const nameInput = screen.getByRole('textbox', {name: /Team name/i})
    fireEvent.change(nameInput, {target: {value: 'Pinned Header Name'}})

    act(() => {
      useBuilderStore.getState().setActiveTeamId(useBuilderStore.getState().teams[1].id)
    })
    fireEvent.keyDown(screen.getByRole('textbox', {name: /Team name/i}), {key: 'Enter'})

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0].name).toBe('Pinned Header Name')
    })

    expect(useBuilderStore.getState().teams[1].name).toBe(secondTeamOriginalName)
  })
})
