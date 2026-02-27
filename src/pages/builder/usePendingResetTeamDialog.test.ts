import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { Team } from './types'
import { usePendingResetTeamDialog } from './usePendingResetTeamDialog'

function buildTeam(id: string, name: string, awakenerName?: string, posseId?: string): Team {
  return {
    id,
    name,
    posseId,
    slots: [
      { slotId: `${id}-slot-1`, awakenerName, faction: awakenerName ? 'AEQUOR' : undefined, level: awakenerName ? 60 : undefined, wheels: [null, null] },
      { slotId: `${id}-slot-2`, wheels: [null, null] },
      { slotId: `${id}-slot-3`, wheels: [null, null] },
      { slotId: `${id}-slot-4`, wheels: [null, null] },
    ],
  }
}

describe('usePendingResetTeamDialog', () => {
  it('resets empty teams immediately without pending dialog', () => {
    const initialTeams = [buildTeam('team-1', 'Team 1', 'goliath'), buildTeam('team-2', 'Team 2')]
    const { result } = renderHook(() => {
      const [teams, setTeams] = useState(initialTeams)
      const [selectionCleared, setSelectionCleared] = useState(false)
      const hook = usePendingResetTeamDialog({
        teams,
        setTeams,
        effectiveActiveTeamId: 'team-1',
        clearActiveSelection: () => setSelectionCleared(true),
      })
      return { ...hook, teams, selectionCleared }
    })

    act(() => {
      result.current.requestResetTeam('team-2', 'Team 2')
    })

    expect(result.current.pendingResetTeamDialog).toBeNull()
    expect(result.current.teams[1]?.slots.every((slot) => !slot.awakenerName)).toBe(true)
    expect(result.current.selectionCleared).toBe(false)
  })

  it('requires confirmation for non-empty active team and clears selection on confirm', () => {
    const initialTeams = [buildTeam('team-1', 'Team 1', 'goliath', 'taverns-opening')]
    const { result } = renderHook(() => {
      const [teams, setTeams] = useState(initialTeams)
      const [selectionCleared, setSelectionCleared] = useState(false)
      const hook = usePendingResetTeamDialog({
        teams,
        setTeams,
        effectiveActiveTeamId: 'team-1',
        clearActiveSelection: () => setSelectionCleared(true),
      })
      return { ...hook, teams, selectionCleared }
    })

    act(() => {
      result.current.requestResetTeam('team-1', 'Team 1')
    })

    expect(result.current.pendingResetTeamDialog?.title).toBe('Reset Team 1')

    act(() => {
      result.current.pendingResetTeamDialog?.onConfirm()
    })

    expect(result.current.pendingResetTeamDialog).toBeNull()
    expect(result.current.teams[0]?.posseId).toBeUndefined()
    expect(result.current.teams[0]?.slots.every((slot) => !slot.awakenerName)).toBe(true)
    expect(result.current.selectionCleared).toBe(true)
  })
})

