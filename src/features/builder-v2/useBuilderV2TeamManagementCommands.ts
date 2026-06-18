import {useCallback, useMemo, useState, type SetStateAction} from 'react'

import {builderDraftStore, type BuilderDraftFocus} from '@/stores/builderDraftStore'

import {
  addTeam as addTeamToCollection,
  applyTeamTemplate,
  deleteTeam,
  isTeamEmpty,
  reorderTeams,
  resetTeam,
  type TeamTemplateId,
} from '../builder/team-collection'
import type {Team} from '../builder/types'
import type {BuilderV2EditingTarget} from './builder-v2-editing-mode'
import type {BuilderV2PendingTeamAction, BuilderV2TeamActionDialog} from './BuilderV2ModelTypes'

interface UseBuilderV2TeamManagementCommandsOptions {
  clearTransfer: () => void
  applyEditingTarget: (target: BuilderV2EditingTarget) => void
  setActiveTeamId: (teamId: string) => void
  setTeamsInStore: (teams: SetStateAction<Team[]>) => void
  storeBeginTeamRename: (teamId: string, teamName: string, source: 'list') => void
  storeCancelTeamRename: () => void
  storeCommitTeamRename: (teamId: string) => void
  storeCancelQuickLineup: () => BuilderDraftFocus | null
  syncQuickLineupFocus: (focus: BuilderDraftFocus | null) => void
  setViolationMessage: (message: string | null) => void
  showToast: (message: string) => void
}

export function useBuilderV2TeamManagementCommands({
  clearTransfer,
  applyEditingTarget,
  setActiveTeamId,
  setTeamsInStore,
  storeBeginTeamRename,
  storeCancelTeamRename,
  storeCommitTeamRename,
  storeCancelQuickLineup,
  syncQuickLineupFocus,
  setViolationMessage,
  showToast,
}: UseBuilderV2TeamManagementCommandsOptions) {
  const [pendingTeamAction, setPendingTeamAction] = useState<BuilderV2PendingTeamAction | null>(
    null,
  )

  const setActiveTeam = useCallback(
    (teamId: string) => {
      if (builderDraftStore.getState().quickLineupState) {
        syncQuickLineupFocus(storeCancelQuickLineup())
      }
      setPendingTeamAction(null)
      storeCancelTeamRename()
      clearTransfer()
      setViolationMessage(null)
      applyEditingTarget(null)
      setActiveTeamId(teamId)
    },
    [
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setViolationMessage,
      storeCancelQuickLineup,
      storeCancelTeamRename,
      syncQuickLineupFocus,
    ],
  )

  const clearTeamTransientState = useCallback(() => {
    if (builderDraftStore.getState().quickLineupState) {
      syncQuickLineupFocus(storeCancelQuickLineup())
    }
    clearTransfer()
    setPendingTeamAction(null)
    storeCancelTeamRename()
    setViolationMessage(null)
    applyEditingTarget(null)
  }, [
    applyEditingTarget,
    clearTransfer,
    setViolationMessage,
    storeCancelQuickLineup,
    storeCancelTeamRename,
    syncQuickLineupFocus,
  ])

  const applyDeleteTeam = useCallback(
    (teamId: string) => {
      clearTeamTransientState()
      const state = builderDraftStore.getState()
      const result = deleteTeam(state.teams, teamId, state.activeTeamId)
      setTeamsInStore(result.nextTeams)
      setActiveTeamId(result.nextActiveTeamId)
    },
    [clearTeamTransientState, setActiveTeamId, setTeamsInStore],
  )

  const applyResetTeam = useCallback(
    (teamId: string) => {
      clearTeamTransientState()
      setTeamsInStore((currentTeams) => resetTeam(currentTeams, teamId))
    },
    [clearTeamTransientState, setTeamsInStore],
  )

  const addTeam = useCallback(() => {
    clearTeamTransientState()
    const result = addTeamToCollection(builderDraftStore.getState().teams)
    setTeamsInStore(result.nextTeams)
    if (result.addedTeamId) {
      setActiveTeamId(result.addedTeamId)
    }
  }, [clearTeamTransientState, setActiveTeamId, setTeamsInStore])

  const beginTeamRename = useCallback(
    (teamId: string) => {
      const team = builderDraftStore.getState().teams.find((entry) => entry.id === teamId)
      if (!team) {
        return
      }
      clearTransfer()
      setPendingTeamAction(null)
      setViolationMessage(null)
      storeBeginTeamRename(team.id, team.name, 'list')
    },
    [clearTransfer, setViolationMessage, storeBeginTeamRename],
  )

  const commitTeamRename = useCallback(
    (teamId: string) => {
      storeCommitTeamRename(teamId)
      setViolationMessage(null)
    },
    [setViolationMessage, storeCommitTeamRename],
  )

  const cancelTeamRename = useCallback(() => {
    storeCancelTeamRename()
    setViolationMessage(null)
  }, [setViolationMessage, storeCancelTeamRename])

  const requestDeleteTeam = useCallback(
    (teamId: string) => {
      const team = builderDraftStore.getState().teams.find((entry) => entry.id === teamId)
      if (!team) {
        return
      }
      clearTransfer()
      storeCancelTeamRename()
      setViolationMessage(null)
      if (isTeamEmpty(team)) {
        applyDeleteTeam(team.id)
        return
      }
      setPendingTeamAction({kind: 'delete', teamId: team.id, teamName: team.name})
    },
    [applyDeleteTeam, clearTransfer, setViolationMessage, storeCancelTeamRename],
  )

  const requestResetTeam = useCallback(
    (teamId: string) => {
      const team = builderDraftStore.getState().teams.find((entry) => entry.id === teamId)
      if (!team) {
        return
      }
      clearTransfer()
      storeCancelTeamRename()
      setViolationMessage(null)
      if (isTeamEmpty(team)) {
        applyResetTeam(team.id)
        return
      }
      setPendingTeamAction({kind: 'reset', teamId: team.id, teamName: team.name})
    },
    [applyResetTeam, clearTransfer, setViolationMessage, storeCancelTeamRename],
  )

  const requestApplyTeamTemplate = useCallback(
    (templateId: TeamTemplateId) => {
      clearTransfer()
      storeCancelTeamRename()
      setViolationMessage(null)
      const templateLabel = getTeamTemplateLabel(templateId)
      setPendingTeamAction({kind: 'template', templateId, templateLabel})
    },
    [clearTransfer, setViolationMessage, storeCancelTeamRename],
  )

  const moveTeam = useCallback(
    (teamId: string, direction: -1 | 1) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)
      setViolationMessage(null)

      const state = builderDraftStore.getState()
      const sourceIndex = state.teams.findIndex((team) => team.id === teamId)
      const targetTeam = state.teams.at(sourceIndex + direction)
      if (sourceIndex === -1 || !targetTeam) {
        return
      }

      setTeamsInStore(reorderTeams(state.teams, teamId, targetTeam.id))
      setActiveTeamId(state.activeTeamId)
    },
    [clearTransfer, setActiveTeamId, setTeamsInStore, setViolationMessage, storeCancelTeamRename],
  )

  const moveTeamToIndex = useCallback(
    (teamId: string, nextIndex: number) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)
      setViolationMessage(null)

      const state = builderDraftStore.getState()
      const sourceIndex = state.teams.findIndex((team) => team.id === teamId)
      const boundedNextIndex = Math.max(0, Math.min(nextIndex, state.teams.length - 1))
      const targetTeam = state.teams[boundedNextIndex]
      if (sourceIndex === -1 || sourceIndex === boundedNextIndex) {
        return
      }

      setTeamsInStore(reorderTeams(state.teams, teamId, targetTeam.id))
      setActiveTeamId(state.activeTeamId)
    },
    [clearTransfer, setActiveTeamId, setTeamsInStore, setViolationMessage, storeCancelTeamRename],
  )

  const moveTeamUp = useCallback(
    (teamId: string) => {
      moveTeam(teamId, -1)
    },
    [moveTeam],
  )

  const moveTeamDown = useCallback(
    (teamId: string) => {
      moveTeam(teamId, 1)
    },
    [moveTeam],
  )

  const cancelTeamAction = useCallback(() => {
    setPendingTeamAction(null)
    setViolationMessage(null)
  }, [setViolationMessage])

  const confirmTeamAction = useCallback(() => {
    if (!pendingTeamAction) {
      return
    }

    if (pendingTeamAction.kind === 'delete') {
      applyDeleteTeam(pendingTeamAction.teamId)
      setPendingTeamAction(null)
      return
    }

    if (pendingTeamAction.kind === 'reset') {
      applyResetTeam(pendingTeamAction.teamId)
      setPendingTeamAction(null)
      return
    }

    clearTeamTransientState()
    const result = applyTeamTemplate(
      builderDraftStore.getState().teams,
      pendingTeamAction.templateId,
    )
    setTeamsInStore(result.nextTeams)
    showToast(
      `Applied ${pendingTeamAction.templateLabel}: renamed ${String(result.renamedCount)}, created ${String(result.createdCount)}, removed ${String(result.removedCount)}.`,
    )
    setPendingTeamAction(null)
  }, [
    applyDeleteTeam,
    applyResetTeam,
    clearTeamTransientState,
    pendingTeamAction,
    setTeamsInStore,
    showToast,
  ])

  const teamActionDialog = useMemo<BuilderV2TeamActionDialog | null>(() => {
    if (!pendingTeamAction) {
      return null
    }

    if (pendingTeamAction.kind === 'delete') {
      return {
        title: `Delete ${pendingTeamAction.teamName}`,
        message: `Remove ${pendingTeamAction.teamName}? This cannot be undone.`,
        confirmLabel: 'Delete Team',
        confirmVariant: 'danger',
        onConfirm: confirmTeamAction,
      }
    }

    if (pendingTeamAction.kind === 'reset') {
      return {
        title: `Reset ${pendingTeamAction.teamName}`,
        message: `Reset ${pendingTeamAction.teamName}? This clears assigned awakeners, wheels, covenant, and posse.`,
        confirmLabel: 'Reset Team',
        confirmVariant: 'danger',
        onConfirm: confirmTeamAction,
      }
    }

    return {
      title: `Apply ${pendingTeamAction.templateLabel}`,
      message: `Apply ${pendingTeamAction.templateLabel} to your teams? Existing teams may be renamed, created, or removed when empty.`,
      confirmLabel: 'Apply',
      onConfirm: confirmTeamAction,
    }
  }, [confirmTeamAction, pendingTeamAction])

  return {
    setActiveTeam,
    addTeam,
    beginTeamRename,
    commitTeamRename,
    cancelTeamRename,
    requestDeleteTeam,
    requestResetTeam,
    requestApplyTeamTemplate,
    moveTeamUp,
    moveTeamDown,
    moveTeamToIndex,
    cancelTeamAction,
    teamActionDialog,
    setPendingTeamAction,
  }
}

function getTeamTemplateLabel(templateId: TeamTemplateId): string {
  return templateId === 'DTIDE_10' ? 'D-Tide 10' : 'D-Tide 5'
}
