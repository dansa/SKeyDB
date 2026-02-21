import { describe, expect, it } from 'vitest'
import {
  addTeam,
  createInitialTeams,
  deleteTeam,
  MAX_TEAMS,
  reorderTeams,
  renameTeam,
} from './team-collection'

describe('team collection state', () => {
  it('starts with one default team', () => {
    const teams = createInitialTeams()
    expect(teams).toHaveLength(1)
    expect(teams[0].name).toBe('Team 1')
    expect(teams[0].slots).toHaveLength(4)
  })

  it('adds teams up to max and stops after max', () => {
    let teams = createInitialTeams()
    let addedId = teams[0].id

    for (let index = 0; index < MAX_TEAMS - 1; index += 1) {
      const result = addTeam(teams)
      teams = result.nextTeams
      addedId = result.addedTeamId ?? addedId
    }

    expect(teams).toHaveLength(MAX_TEAMS)
    expect(teams.some((team) => team.id === addedId)).toBe(true)

    const beyondMax = addTeam(teams)
    expect(beyondMax.nextTeams).toBe(teams)
    expect(beyondMax.addedTeamId).toBeUndefined()
  })

  it('renames a team', () => {
    const teams = createInitialTeams()
    const renamed = renameTeam(teams, teams[0].id, 'Farming Team')

    expect(renamed[0].name).toBe('Farming Team')
  })

  it('deletes active team and reassigns active team id', () => {
    const one = createInitialTeams()
    const two = addTeam(one).nextTeams
    const three = addTeam(two).nextTeams
    const activeTeamId = three[1].id

    const result = deleteTeam(three, activeTeamId, activeTeamId)
    expect(result.nextTeams).toHaveLength(2)
    expect(result.nextActiveTeamId).toBe(result.nextTeams[0].id)
  })

  it('does not delete when only one team exists', () => {
    const teams = createInitialTeams()
    const result = deleteTeam(teams, teams[0].id, teams[0].id)

    expect(result.nextTeams).toBe(teams)
    expect(result.nextActiveTeamId).toBe(teams[0].id)
  })

  it('reorders teams by source and target ids', () => {
    const one = createInitialTeams()
    const two = addTeam(one).nextTeams
    const three = addTeam(two).nextTeams

    const reordered = reorderTeams(three, three[0].id, three[2].id)
    expect(reordered.map((team) => team.id)).toEqual([three[1].id, three[2].id, three[0].id])
  })
})
