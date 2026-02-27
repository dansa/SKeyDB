import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { decodeImportCode, encodeMultiTeamCode, encodeSingleTeamCode } from '../../domain/import-export'
import { encodeIngameTeamCode } from '../../domain/ingame-codec'
import {
  applySingleImportStrategy,
  prepareImport,
  type ImportConflict,
  type SingleImportStrategy,
} from './import-planner'
import type { Team, TeamSlot } from './types'

type ReplaceTargetTeam = {
  id: string
  name: string
}

type PendingReplaceImport = {
  teams: Team[]
  activeTeamIndex: number
  importWarningMessage?: string
}

type PendingStrategyImport = {
  team: Team
  conflicts: ImportConflict[]
  plannerBaseTeams: Team[]
  replaceIntoTeam?: ReplaceTargetTeam
  importWarningMessage?: string
}

type UseBuilderImportExportOptions = {
  teams: Team[]
  setTeams: Dispatch<SetStateAction<Team[]>>
  effectiveActiveTeamId: string
  activeTeam: Team | undefined
  teamSlots: TeamSlot[]
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
  setActiveTeamId,
  setActiveSelection,
  clearTransfer,
  clearPendingDelete,
  showToast,
}: UseBuilderImportExportOptions) {
  const [isImportDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialog, setExportDialog] = useState<{ title: string; code: string; kind: 'standard' | 'ingame' } | null>(
    null,
  )
  const [pendingReplaceImport, setPendingReplaceImport] = useState<PendingReplaceImport | null>(null)
  const [pendingStrategyImport, setPendingStrategyImport] = useState<PendingStrategyImport | null>(null)

  const pendingStrategyConflictSummary = useMemo(() => {
    if (!pendingStrategyImport) {
      return ''
    }
    const teamNames = Array.from(new Set(pendingStrategyImport.conflicts.map((entry) => entry.fromTeamName)))
    return `Import conflicts with ${teamNames.join(', ')}. Choose how to handle duplicates.`
  }, [pendingStrategyImport])

  function clearImportFlow() {
    setImportDialogOpen(false)
    setPendingReplaceImport(null)
    setPendingStrategyImport(null)
  }

  function applyImportedTeams(nextTeams: Team[], nextActiveTeamId: string) {
    setTeams(nextTeams)
    setActiveTeamId(nextActiveTeamId)
    setActiveSelection(null)
  }

  function finalizePreparedImport(nextTeams: Team[], importWarningMessage?: string) {
    const importedTeam = nextTeams.at(-1)
    const nextActiveTeamId = importedTeam?.id ?? effectiveActiveTeamId
    applyImportedTeams(nextTeams, nextActiveTeamId)
    clearTransfer()
    clearPendingDelete()
    clearImportFlow()
    showToast(importWarningMessage ? `Team imported. ${importWarningMessage}` : 'Team imported.')
  }

  function mergeImportedIntoExistingTeam(
    plannerResultTeams: Team[],
    plannerBaseTeams: Team[],
    targetTeam: ReplaceTargetTeam,
  ): Team[] {
    const importedTeam = plannerResultTeams.at(-1)
    if (!importedTeam) {
      return teams
    }

    const transformedImported: Team = {
      ...importedTeam,
      id: targetTeam.id,
      name: targetTeam.name,
    }

    const updatedBaseTeamsById = new Map(
      plannerResultTeams
        .filter((team) => plannerBaseTeams.some((baseTeam) => baseTeam.id === team.id))
        .map((team) => [team.id, team]),
    )

    return teams.map((team) => {
      if (team.id === targetTeam.id) {
        return transformedImported
      }
      return updatedBaseTeamsById.get(team.id) ?? team
    })
  }

  function handlePreparedImport(
    result: ReturnType<typeof prepareImport>,
    options?: { plannerBaseTeams?: Team[]; replaceIntoTeam?: ReplaceTargetTeam; importWarningMessage?: string },
  ) {
    if (result.status === 'error') {
      showToast(result.message)
      clearImportFlow()
      return
    }

    if (result.status === 'requires_replace') {
      setImportDialogOpen(false)
      setPendingReplaceImport({
        teams: result.teams,
        activeTeamIndex: result.activeTeamIndex,
        importWarningMessage: options?.importWarningMessage,
      })
      return
    }

    if (result.status === 'requires_strategy') {
      setImportDialogOpen(false)
      setPendingStrategyImport({
        team: result.team,
        conflicts: result.conflicts,
        plannerBaseTeams: options?.plannerBaseTeams ?? teams,
        replaceIntoTeam: options?.replaceIntoTeam,
        importWarningMessage: options?.importWarningMessage,
      })
      return
    }

    if (options?.replaceIntoTeam && options.plannerBaseTeams) {
      const nextTeams = mergeImportedIntoExistingTeam(result.teams, options.plannerBaseTeams, options.replaceIntoTeam)
      applyImportedTeams(nextTeams, options.replaceIntoTeam.id)
      clearTransfer()
      clearPendingDelete()
      clearImportFlow()
      showToast(options.importWarningMessage ? `Team imported. ${options.importWarningMessage}` : 'Team imported.')
      return
    }

    finalizePreparedImport(result.teams, options?.importWarningMessage)
  }

  function getIngameImportWarningMessage(warnings: Exclude<ReturnType<typeof decodeImportCode>, { kind: 'multi' }>['warnings']) {
    if (!warnings || warnings.length === 0) {
      return undefined
    }

    const surfaced = warnings.filter(
      (warning) =>
        warning.reason === 'unknown_token' &&
        (warning.section === 'awakener' || warning.section === 'wheel'),
    )
    if (surfaced.length === 0) {
      return undefined
    }

    const detailParts = surfaced.slice(0, 2).map((warning) => {
      const slotLabel = warning.slotIndex === undefined ? 'unknown slot' : `slot ${warning.slotIndex + 1}`
      if (warning.section === 'awakener') {
        return `${slotLabel} awakener`
      }
      const wheelLabel = warning.field === 'wheelTwo' ? 'wheel 2' : 'wheel 1'
      return `${slotLabel} ${wheelLabel}`
    })
    const suffix = surfaced.length > 2 ? '; ...' : ''
    const details = detailParts.join('; ')
    const tokenLabel = surfaced.length === 1 ? 'token' : 'tokens'

    return `In-game note: ${surfaced.length} unsupported awakener/wheel ${tokenLabel} imported as empty (${details}${suffix}).`
  }

  function submitImportCode(code: string) {
    let decoded
    try {
      decoded = decodeImportCode(code)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to decode import code.')
      return
    }

    const ingameImportWarningMessage = decoded.kind === 'single' ? getIngameImportWarningMessage(decoded.warnings) : undefined

    const shouldImportIntoActiveEmptyTeam = decoded.kind === 'single' && teamSlots.every((slot) => !slot.awakenerName)
    if (shouldImportIntoActiveEmptyTeam && activeTeam) {
      const plannerBaseTeams = teams.filter((team) => team.id !== activeTeam.id)
      handlePreparedImport(prepareImport(decoded, plannerBaseTeams), {
        plannerBaseTeams,
        replaceIntoTeam: { id: activeTeam.id, name: activeTeam.name },
        importWarningMessage: ingameImportWarningMessage,
      })
      return
    }

    handlePreparedImport(prepareImport(decoded, teams), {
      importWarningMessage: ingameImportWarningMessage,
    })
  }

  function openExportAllDialog() {
    setExportDialog({
      title: 'Export All Teams',
      code: encodeMultiTeamCode(teams, effectiveActiveTeamId),
      kind: 'standard',
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
    })
  }

  function confirmReplaceImport() {
    if (!pendingReplaceImport) {
      return
    }
    const nextActive = pendingReplaceImport.teams[pendingReplaceImport.activeTeamIndex]
    const nextActiveTeamId = nextActive?.id ?? pendingReplaceImport.teams[0]?.id ?? ''
    applyImportedTeams(pendingReplaceImport.teams, nextActiveTeamId)
    clearImportFlow()
    clearTransfer()
    clearPendingDelete()
    showToast(
      pendingReplaceImport.importWarningMessage
        ? `All teams imported. ${pendingReplaceImport.importWarningMessage}`
        : 'All teams imported.',
    )
  }

  function applyStrategy(strategy: Exclude<SingleImportStrategy, 'cancel'>) {
    if (!pendingStrategyImport) {
      return
    }
    const result = applySingleImportStrategy(pendingStrategyImport.plannerBaseTeams, pendingStrategyImport.team, strategy)
    if (result.status === 'error') {
      showToast(result.message)
      clearImportFlow()
      return
    }
    if (result.status !== 'ready') {
      showToast('Import strategy failed validation.')
      clearImportFlow()
      return
    }

    if (pendingStrategyImport.replaceIntoTeam) {
      const nextTeams = mergeImportedIntoExistingTeam(
        result.teams,
        pendingStrategyImport.plannerBaseTeams,
        pendingStrategyImport.replaceIntoTeam,
      )
      applyImportedTeams(nextTeams, pendingStrategyImport.replaceIntoTeam.id)
      clearTransfer()
      clearPendingDelete()
      clearImportFlow()
      showToast(
        pendingStrategyImport.importWarningMessage
          ? `Team imported. ${pendingStrategyImport.importWarningMessage}`
          : 'Team imported.',
      )
      return
    }

    finalizePreparedImport(result.teams, pendingStrategyImport.importWarningMessage)
  }

  return {
    isImportDialogOpen,
    openImportDialog: () => setImportDialogOpen(true),
    submitImportCode,
    closeImportFlow: clearImportFlow,
    exportDialog,
    closeExportDialog: () => setExportDialog(null),
    openExportAllDialog,
    openTeamExportDialog,
    openTeamIngameExportDialog,
    pendingReplaceImport,
    cancelReplaceImport: () => setPendingReplaceImport(null),
    confirmReplaceImport,
    pendingStrategyImport,
    pendingStrategyConflictSummary,
    cancelStrategyImport: clearImportFlow,
    applyMoveStrategyImport: () => applyStrategy('move'),
    applySkipStrategyImport: () => applyStrategy('skip'),
  }
}
