import { useState, type Dispatch, type SetStateAction } from 'react'
import { deleteTeam } from './team-collection'
import type { Team } from './types'

type PendingDeleteTeam = {
  id: string
  name: string
}

type UsePendingDeleteDialogOptions = {
  teams: Team[]
  setTeams: Dispatch<SetStateAction<Team[]>>
  effectiveActiveTeamId: string
  setActiveTeamId: (teamId: string) => void
  clearActiveSelection: () => void
}

export function usePendingDeleteDialog({
  teams,
  setTeams,
  effectiveActiveTeamId,
  setActiveTeamId,
  clearActiveSelection,
}: UsePendingDeleteDialogOptions) {
  const [pendingDeleteTeam, setPendingDeleteTeam] = useState<PendingDeleteTeam | null>(null)

  function clearPendingDelete() {
    setPendingDeleteTeam(null)
  }

  function applyDeleteTeam(teamId: string) {
    const result = deleteTeam(teams, teamId, effectiveActiveTeamId)
    setTeams(result.nextTeams)
    setActiveTeamId(result.nextActiveTeamId)
    if (teamId === effectiveActiveTeamId) {
      clearActiveSelection()
    }
  }

  function requestDeleteTeam(teamId: string, teamName: string) {
    const team = teams.find((entry) => entry.id === teamId)
    const hasAnyAwakener = team?.slots.some((slot) => slot.awakenerName)
    if (!hasAnyAwakener) {
      applyDeleteTeam(teamId)
      return
    }
    setPendingDeleteTeam({ id: teamId, name: teamName })
  }

  function confirmDeleteTeam() {
    if (!pendingDeleteTeam) {
      return
    }
    applyDeleteTeam(pendingDeleteTeam.id)
    clearPendingDelete()
  }

  const pendingDeleteDialog = pendingDeleteTeam
    ? {
        title: `Delete ${pendingDeleteTeam.name}`,
        message: `Remove ${pendingDeleteTeam.name}? This cannot be undone.`,
        onConfirm: confirmDeleteTeam,
      }
    : null

  return {
    clearPendingDelete,
    requestDeleteTeam,
    pendingDeleteDialog,
  }
}
