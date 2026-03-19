import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../../builder-page.integration-mocks'

import {useBuilderStore} from './store/builder-store'
import {TeamTabs} from './TeamTabs'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

describe('TeamTabs', () => {
  it('keeps low-count compact tabs on a single row so the add button does not claim its own line', () => {
    resetStore()

    const state = useBuilderStore.getState()
    state.addTeam()

    render(<TeamTabs variant='compact' />)

    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
      'data-compact-layout',
      'single-row-flex',
    )
    expect(screen.getByRole('button', {name: /^\+$/})).toBeInTheDocument()
  })

  it('keeps compact tabs in a fixed two-row grid instead of wrapping into extra rows', () => {
    resetStore()

    const state = useBuilderStore.getState()
    for (let index = state.teams.length; index < 10; index += 1) {
      state.addTeam()
    }

    const renamedTeams = useBuilderStore.getState().teams.map((team, index) => ({
      ...team,
      name: `Extraordinarily Long Team Name ${String(index + 1)}`,
    }))
    useBuilderStore.getState().setTeams(renamedTeams)

    render(<TeamTabs variant='compact' />)

    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
      'data-compact-layout',
      'two-row-grid',
    )
    expect(screen.getByTestId('team-tabs-compact')).toHaveStyle({
      gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    })
    expect(screen.getByRole('button', {name: /^\+$/})).toBeInTheDocument()
  })

  it('renders tablet tabs as a single attached rail that fits teams into one row without overflow metadata', () => {
    resetStore()

    const state = useBuilderStore.getState()
    for (let index = state.teams.length; index < 10; index += 1) {
      state.addTeam()
    }

    const renamedTeams = useBuilderStore.getState().teams.map((team, index) => ({
      ...team,
      name: `Long Team ${String(index + 1)}`,
    }))
    useBuilderStore.getState().setTeams(renamedTeams)

    render(<TeamTabs variant='tablet' />)

    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute(
      'data-builder-tabs-variant',
      'tablet',
    )
    expect(screen.getByTestId('team-tabs-compact')).toHaveAttribute('data-builder-tabs-fit', 'true')
    expect(screen.getByTestId('team-tabs-compact')).not.toHaveClass('overflow-x-auto')
    expect(screen.getByRole('button', {name: /^Long Team 1$/i}).parentElement).not.toHaveClass(
      'max-w-[8rem]',
    )
    expect(screen.getByRole('button', {name: /^Long Team 1$/i})).not.toHaveAttribute(
      'data-realm-tint',
    )
    expect(screen.getByRole('button', {name: /^\+$/})).toBeInTheDocument()
  })
})
