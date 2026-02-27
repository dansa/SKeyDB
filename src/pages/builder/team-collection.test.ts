import { describe, expect, it } from 'vitest'
import {
  addTeam,
  applyTeamTemplate,
  createInitialTeams,
  deleteTeam,
  MAX_TEAMS,
  reorderTeams,
  renameTeam,
  resetTeam,
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

  it('applies D-Tide (10) by creating missing teams and assigning expected names', () => {
    const initial = createInitialTeams()

    const result = applyTeamTemplate(initial, 'DTIDE_10')

    expect(result.nextTeams).toHaveLength(10)
    expect(result.createdCount).toBe(9)
    expect(result.removedCount).toBe(0)
    expect(result.targetCount).toBe(10)
    expect(result.nextTeams.map((team) => team.name)).toEqual([
      'Wave 1',
      'Wave 1 Extra',
      'Wave 2',
      'Wave 2 Extra',
      'Wave 3',
      'Wave 3 Extra',
      'Wave 4',
      'Wave 4 Extra',
      'Wave 5',
      'Wave 5 Extra',
    ])
  })

  it('applies D-Tide (5) by renaming first five teams and keeping teams beyond target unchanged', () => {
    const one = createInitialTeams()
    const two = addTeam(one).nextTeams
    const three = addTeam(two).nextTeams
    const four = addTeam(three).nextTeams
    const five = addTeam(four).nextTeams
    const six = addTeam(five).nextTeams
    const renamedSix = renameTeam(six, six[5].id, 'Keep Team 6').map((team, index) =>
      index === 5
        ? {
            ...team,
            posseId: 'keep-team-6',
          }
        : team,
    )

    const result = applyTeamTemplate(renamedSix, 'DTIDE_5')

    expect(result.nextTeams).toHaveLength(6)
    expect(result.createdCount).toBe(0)
    expect(result.removedCount).toBe(0)
    expect(result.nextTeams.slice(0, 5).map((team) => team.name)).toEqual([
      'Wave 1',
      'Wave 2',
      'Wave 3',
      'Wave 4',
      'Wave 5',
    ])
    expect(result.nextTeams[5].name).toBe('Keep Team 6')
  })

  it('renames teams in place without replacing their payload state', () => {
    const initial = createInitialTeams()
    const beforeSlots = initial[0].slots

    const result = applyTeamTemplate(initial, 'DTIDE_5')

    expect(result.nextTeams[0].id).toBe(initial[0].id)
    expect(result.nextTeams[0].slots).toBe(beforeSlots)
  })

  it('removes only empty teams beyond slot 5 for D-Tide (5)', () => {
    const one = createInitialTeams()
    const two = addTeam(one).nextTeams
    const three = addTeam(two).nextTeams
    const four = addTeam(three).nextTeams
    const five = addTeam(four).nextTeams
    const six = addTeam(five).nextTeams
    const seven = addTeam(six).nextTeams

    const filledSeven = {
      ...seven[6],
      posseId: 'filled-posse',
    }
    const seeded = [...seven.slice(0, 6), filledSeven]

    const result = applyTeamTemplate(seeded, 'DTIDE_5')

    expect(result.removedCount).toBe(1)
    expect(result.nextTeams).toHaveLength(6)
    expect(result.nextTeams[5]?.id).toBe(filledSeven.id)
  })

  it('resets a single team without changing id or name', () => {
    const one = createInitialTeams()
    const withData = renameTeam(one, one[0].id, 'Wave 1')
    withData[0] = {
      ...withData[0],
      posseId: 'some-posse',
      slots: [
        { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', level: 60, wheels: ['SR19', null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    }

    const reset = resetTeam(withData, withData[0].id)
    expect(reset[0].id).toBe(withData[0].id)
    expect(reset[0].name).toBe('Wave 1')
    expect(reset[0].posseId).toBeUndefined()
    expect(reset[0].slots.every((slot) => !slot.awakenerName && slot.wheels[0] === null && slot.wheels[1] === null)).toBe(true)
  })
})
