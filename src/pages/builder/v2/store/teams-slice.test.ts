import {describe, expect, it} from 'vitest'

import {useBuilderStore} from './builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

describe('teams slice', () => {
  it('initializes with one team', () => {
    resetStore()
    const {teams, activeTeamId} = useBuilderStore.getState()
    expect(teams).toHaveLength(1)
    expect(teams[0].name).toBe('Team 1')
    expect(activeTeamId).toBe(teams[0].id)
  })

  it('addTeam creates a new team and activates it', () => {
    resetStore()
    useBuilderStore.getState().addTeam()
    const {teams, activeTeamId} = useBuilderStore.getState()
    expect(teams).toHaveLength(2)
    expect(teams[1].name).toBe('Team 2')
    expect(activeTeamId).toBe(teams[1].id)
  })

  it('deleteTeam removes a team and adjusts active', () => {
    resetStore()
    useBuilderStore.getState().addTeam()
    const teamToDelete = useBuilderStore.getState().teams[0].id
    useBuilderStore.getState().deleteTeam(teamToDelete)
    const {teams, activeTeamId} = useBuilderStore.getState()
    expect(teams).toHaveLength(1)
    expect(teams[0].name).toBe('Team 2')
    expect(activeTeamId).toBe(teams[0].id)
  })

  it('deleteTeam does not remove the last team', () => {
    resetStore()
    const onlyTeamId = useBuilderStore.getState().teams[0].id
    useBuilderStore.getState().deleteTeam(onlyTeamId)
    expect(useBuilderStore.getState().teams).toHaveLength(1)
  })

  it('renameTeam updates the team name', () => {
    resetStore()
    const teamId = useBuilderStore.getState().teams[0].id
    useBuilderStore.getState().renameTeam(teamId, 'My Custom Name')
    expect(useBuilderStore.getState().teams[0].name).toBe('My Custom Name')
  })

  it('renameTeam ignores empty names', () => {
    resetStore()
    const teamId = useBuilderStore.getState().teams[0].id
    useBuilderStore.getState().renameTeam(teamId, '   ')
    expect(useBuilderStore.getState().teams[0].name).toBe('Team 1')
  })

  it('reorderTeams swaps team positions', () => {
    resetStore()
    useBuilderStore.getState().addTeam()
    useBuilderStore.getState().addTeam()
    const ids = useBuilderStore.getState().teams.map((t) => t.id)
    useBuilderStore.getState().reorderTeams(ids[2], ids[0])
    const reordered = useBuilderStore.getState().teams.map((t) => t.id)
    expect(reordered[0]).toBe(ids[2])
    expect(reordered[1]).toBe(ids[0])
    expect(reordered[2]).toBe(ids[1])
  })

  it('resetTeam clears all slots and posse', () => {
    resetStore()
    const teamId = useBuilderStore.getState().teams[0].id
    useBuilderStore.getState().setPosseForActiveTeam('posse-1')
    expect(useBuilderStore.getState().teams[0].posseId).toBe('posse-1')
    useBuilderStore.getState().resetTeam(teamId)
    const team = useBuilderStore.getState().teams[0]
    expect(team.posseId).toBeUndefined()
    expect(team.slots.every((s) => !s.awakenerName)).toBe(true)
  })

  it('setActiveTeamId switches active team', () => {
    resetStore()
    useBuilderStore.getState().addTeam()
    const firstTeamId = useBuilderStore.getState().teams[0].id
    useBuilderStore.getState().setActiveTeamId(firstTeamId)
    expect(useBuilderStore.getState().activeTeamId).toBe(firstTeamId)
  })

  it('setActiveTeamId ignores invalid team IDs', () => {
    resetStore()
    const originalId = useBuilderStore.getState().activeTeamId
    useBuilderStore.getState().setActiveTeamId('nonexistent-id')
    expect(useBuilderStore.getState().activeTeamId).toBe(originalId)
  })

  it('setPosseForActiveTeam sets posse on the active team', () => {
    resetStore()
    useBuilderStore.getState().setPosseForActiveTeam('posse-abc')
    expect(useBuilderStore.getState().teams[0].posseId).toBe('posse-abc')
  })

  it('setPosseForActiveTeam can clear posse', () => {
    resetStore()
    useBuilderStore.getState().setPosseForActiveTeam('posse-abc')
    useBuilderStore.getState().setPosseForActiveTeam(undefined)
    expect(useBuilderStore.getState().teams[0].posseId).toBeUndefined()
  })

  it('applyTemplate creates teams from DTIDE_5', () => {
    resetStore()
    useBuilderStore.getState().applyTemplate('DTIDE_5')
    const names = useBuilderStore.getState().teams.map((t) => t.name)
    expect(names).toEqual(['Wave 1', 'Wave 2', 'Wave 3', 'Wave 4', 'Wave 5'])
  })

  it('setTeams replaces all teams', () => {
    resetStore()
    const customTeams = [
      {id: 'custom-1', name: 'A', slots: [], posseId: undefined},
      {id: 'custom-2', name: 'B', slots: [], posseId: undefined},
    ]
    useBuilderStore.getState().setTeams(customTeams)
    expect(useBuilderStore.getState().teams).toEqual(customTeams)
  })
})
