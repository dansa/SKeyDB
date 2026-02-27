import { useState, type Dispatch, type SetStateAction } from 'react'
import { isTeamEmpty, resetTeam } from './team-collection'
import type { Team } from './types'

type PendingResetTeam = {
  id: string
  name: string
}

type UsePendingResetTeamDialogOptions = {
  teams: Team[]
  setTeams: Dispatch<SetStateAction<Team[]>>
  effectiveActiveTeamId: string
  clearActiveSelection: () => void
}

export function usePendingResetTeamDialog({
  teams,
  setTeams,
  effectiveActiveTeamId,
  clearActiveSelection,
}: UsePendingResetTeamDialogOptions) {
  const [pendingResetTeam, setPendingResetTeam] = useState<PendingResetTeam | null>(null)

  function clearPendingResetTeam() {
    setPendingResetTeam(null)
  }

  function applyResetTeam(teamId: string) {
    setTeams((prev) => resetTeam(prev, teamId))
    if (teamId === effectiveActiveTeamId) {
      clearActiveSelection()
    }
  }

  function requestResetTeam(teamId: string, teamName: string) {
    const team = teams.find((entry) => entry.id === teamId)
    if (isTeamEmpty(team)) {
      applyResetTeam(teamId)
      return
    }
    setPendingResetTeam({ id: teamId, name: teamName })
  }

  function confirmResetTeam() {
    if (!pendingResetTeam) {
      return
    }
    applyResetTeam(pendingResetTeam.id)
    clearPendingResetTeam()
  }

  const pendingResetTeamDialog = pendingResetTeam
    ? {
        title: `Reset ${pendingResetTeam.name}`,
        message: `Reset ${pendingResetTeam.name}? This clears assigned awakeners, wheels, covenant, and posse.`,
        onConfirm: confirmResetTeam,
      }
    : null

  return {
    clearPendingResetTeam,
    requestResetTeam,
    pendingResetTeamDialog,
  }
}
