import { describe, expect, it } from 'vitest'
import type { Team } from './types'
import { applyPendingTransfer } from './transfer-resolution'

function buildTeam(id: string, name: string, awakenerName?: string): Team {
  return {
    id,
    name,
    slots: [
      { slotId: `${id}-slot-1`, awakenerName, faction: awakenerName ? 'AEQUOR' : undefined, level: 60, wheels: [null, null] },
      { slotId: `${id}-slot-2`, wheels: [null, null] },
      { slotId: `${id}-slot-3`, wheels: [null, null] },
      { slotId: `${id}-slot-4`, wheels: [null, null] },
    ],
  }
}

describe('applyPendingTransfer', () => {
  it('moves an awakener between teams and clears source slot', () => {
    const teams: Team[] = [buildTeam('team-1', 'Team 1', 'goliath'), buildTeam('team-2', 'Team 2')]

    const result = applyPendingTransfer(teams, {
      kind: 'awakener',
      itemName: 'goliath',
      awakenerName: 'goliath',
      fromTeamId: 'team-1',
      toTeamId: 'team-2',
    })

    expect(result[0]?.slots[0]?.awakenerName).toBeUndefined()
    expect(result[1]?.slots[0]?.awakenerName).toBe('goliath')
  })

  it('replaces target slot when targetSlotId is provided', () => {
    const source = buildTeam('team-1', 'Team 1', 'goliath')
    const target = buildTeam('team-2', 'Team 2', 'ramona')
    const targetSlotId = target.slots[0]?.slotId
    expect(targetSlotId).toBeDefined()
    const teams: Team[] = [source, target]

    const result = applyPendingTransfer(teams, {
      kind: 'awakener',
      itemName: 'goliath',
      awakenerName: 'goliath',
      fromTeamId: 'team-1',
      toTeamId: 'team-2',
      targetSlotId,
    })

    expect(result[0]?.slots[0]?.awakenerName).toBeUndefined()
    expect(result[1]?.slots[0]?.awakenerName).toBe('goliath')
  })

  it('moves posse between teams', () => {
    const teams: Team[] = [
      { ...buildTeam('team-1', 'Team 1'), posseId: '12' },
      { ...buildTeam('team-2', 'Team 2'), posseId: undefined },
    ]

    const result = applyPendingTransfer(teams, {
      kind: 'posse',
      itemName: 'Taverns Opening',
      posseId: '12',
      fromTeamId: 'team-1',
      toTeamId: 'team-2',
    })

    expect(result[0]?.posseId).toBeUndefined()
    expect(result[1]?.posseId).toBe('12')
  })
})
