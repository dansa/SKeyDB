import {useState, type Dispatch, type SetStateAction} from 'react'

import {encodeMultiTeamCode, encodeSingleTeamCode} from '@/domain/import-export'
import {encodeIngameTeamCode} from '@/domain/ingame-codec'

import {hasDuplicateRuleViolation, validateBuilderTeamsStrict} from './team-validation'
import type {Team, TeamSlot} from './types'
import {useBuilderImportFlow} from './useBuilderImportFlow'

interface ExportDialogState {
  title: string
  code: string
  kind: 'standard' | 'ingame'
  duplicateWarning?: string
}

interface UseBuilderImportExportOptions {
  teams: Team[]
  setTeams: Dispatch<SetStateAction<Team[]>>
  effectiveActiveTeamId: string
  activeTeam: Team | undefined
  teamSlots: TeamSlot[]
  allowDupes: boolean
  setAllowDupes: (allowDupes: boolean) => void
  setActiveTeamId: (teamId: string) => void
  setActiveSelection: (selection: null) => void
  clearTransfer: () => void
  clearPendingDelete: () => void
  showToast: (message: string) => void
}

export function useBuilderImportExport({
  teams,
  setTeams,
  effectiveActiveTeamId,
  activeTeam,
  teamSlots,
  allowDupes,
  setAllowDupes,
  setActiveTeamId,
  setActiveSelection,
  clearTransfer,
  clearPendingDelete,
  showToast,
}: UseBuilderImportExportOptions) {
  const [exportDialog, setExportDialog] = useState<ExportDialogState | null>(null)
  const {openImportDialog, importDialogProps} = useBuilderImportFlow({
    teams,
    setTeams,
    effectiveActiveTeamId,
    activeTeam,
    teamSlots,
    allowDupes,
    setAllowDupes,
    setActiveTeamId,
    setActiveSelection,
    clearTransfer,
    clearPendingDelete,
    showToast,
  })

  function getDuplicateExportWarning(exportTeams: Team[]): string | undefined {
    const validation = validateBuilderTeamsStrict(exportTeams)
    const hasDuplicateViolation = hasDuplicateRuleViolation(validation.violations)
    if (!hasDuplicateViolation) {
      return undefined
    }
    return exportTeams.length > 1
      ? 'These teams reuse units, wheels, or posses across teams and are not in-game legal together.'
      : 'This team reuses units or wheels and is not in-game legal.'
  }

  function openExportAllDialog() {
    setExportDialog({
      title: 'Export All Teams',
      code: encodeMultiTeamCode(teams, effectiveActiveTeamId),
      kind: 'standard',
      duplicateWarning: getDuplicateExportWarning(teams),
    })
  }

  function openTeamExportDialog(teamId: string) {
    const team = teams.find((entry) => entry.id === teamId)
    if (!team) {
      showToast('Unable to export: team not found.')
      return
    }
    setExportDialog({
      title: `Export ${team.name}`,
      code: encodeSingleTeamCode(team),
      kind: 'standard',
      duplicateWarning: getDuplicateExportWarning([team]),
    })
  }

  function openTeamIngameExportDialog(teamId: string) {
    const team = teams.find((entry) => entry.id === teamId)
    if (!team) {
      showToast('Unable to export: team not found.')
      return
    }
    setExportDialog({
      title: `Export In-Game ${team.name}`,
      code: encodeIngameTeamCode(team),
      kind: 'ingame',
      duplicateWarning: getDuplicateExportWarning([team]),
    })
  }

  return {
    openImportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openTeamIngameExportDialog,
    importExportDialogProps: {
      ...importDialogProps,
      exportDialog,
      onCloseExportDialog: () => {
        setExportDialog(null)
      },
    },
  }
}
