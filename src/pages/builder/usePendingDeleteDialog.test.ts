import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { Team } from './types'
import { usePendingDeleteDialog } from './usePendingDeleteDialog'

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

describe('usePendingDeleteDialog', () => {
  it('deletes empty teams immediately without pending dialog', () => {
    const initialTeams = [buildTeam('team-1', 'Team 1', 'goliath'), buildTeam('team-2', 'Team 2')]
    const { result } = renderHook(() => {
      const [teams, setTeams] = useState(initialTeams)
      const [activeTeamId, setActiveTeamId] = useState('team-1')
      const [selectionCleared, setSelectionCleared] = useState(false)
      const hook = usePendingDeleteDialog({
        teams,
        setTeams,
        effectiveActiveTeamId: activeTeamId,
        setActiveTeamId,
        clearActiveSelection: () => setSelectionCleared(true),
      })
      return { ...hook, teams, activeTeamId, selectionCleared }
    })

    act(() => {
      result.current.requestDeleteTeam('team-2', 'Team 2')
    })

    expect(result.current.pendingDeleteDialog).toBeNull()
    expect(result.current.teams).toHaveLength(1)
    expect(result.current.teams[0]?.id).toBe('team-1')
    expect(result.current.selectionCleared).toBe(false)
  })

  it('requires confirmation for non-empty active team and clears selection after confirm', () => {
    const initialTeams = [buildTeam('team-1', 'Team 1', 'goliath'), buildTeam('team-2', 'Team 2')]
    const { result } = renderHook(() => {
      const [teams, setTeams] = useState(initialTeams)
      const [activeTeamId, setActiveTeamId] = useState('team-1')
      const [selectionCleared, setSelectionCleared] = useState(false)
      const hook = usePendingDeleteDialog({
        teams,
        setTeams,
        effectiveActiveTeamId: activeTeamId,
        setActiveTeamId,
        clearActiveSelection: () => setSelectionCleared(true),
      })
      return { ...hook, teams, activeTeamId, selectionCleared }
    })

    act(() => {
      result.current.requestDeleteTeam('team-1', 'Team 1')
    })

    expect(result.current.pendingDeleteDialog?.title).toBe('Delete Team 1')

    act(() => {
      result.current.pendingDeleteDialog?.onConfirm()
    })

    expect(result.current.pendingDeleteDialog).toBeNull()
    expect(result.current.teams).toHaveLength(1)
    expect(result.current.teams[0]?.id).toBe('team-2')
    expect(result.current.activeTeamId).toBe('team-2')
    expect(result.current.selectionCleared).toBe(true)
  })
})
