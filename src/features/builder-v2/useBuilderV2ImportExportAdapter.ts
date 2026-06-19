import {useCallback, type SetStateAction} from 'react'

import {builderDraftStore} from '@/stores/builderDraftStore'

import type {Team} from '../builder/types'
import {useBuilderImportExport} from '../builder/useBuilderImportExport'
import type {BuilderV2EditingTarget} from './builder-v2-editing-mode'

interface UseBuilderV2ImportExportAdapterOptions {
  teams: Team[]
  effectiveActiveTeamId: string
  activeTeam: Team | undefined
  activeTeamSlots: Team['slots']
  allowDuplicateAwakenerIdentities: boolean
  setAllowDuplicateAwakenerIdentities: (nextAllowDupes: boolean) => void
  setActiveTeamId: (teamId: string) => void
  finishQuickLineup: () => void
  applyEditingTarget: (target: BuilderV2EditingTarget) => void
  clearViolationMessage: () => void
  clearTransfer: () => void
  showToast: (message: string) => void
}

export function useBuilderV2ImportExportAdapter({
  teams,
  effectiveActiveTeamId,
  activeTeam,
  activeTeamSlots,
  allowDuplicateAwakenerIdentities,
  setAllowDuplicateAwakenerIdentities,
  setActiveTeamId,
  finishQuickLineup,
  applyEditingTarget,
  clearViolationMessage,
  clearTransfer,
  showToast,
}: UseBuilderV2ImportExportAdapterOptions) {
  const setTeamsForImportExport = useCallback((nextTeams: SetStateAction<Team[]>) => {
    builderDraftStore
      .getState()
      .setTeams((currentTeams) =>
        typeof nextTeams === 'function' ? nextTeams(currentTeams) : nextTeams,
      )
  }, [])

  const clearImportExportTransientState = useCallback(() => {
    finishQuickLineup()
    applyEditingTarget(null)
    clearViolationMessage()
    clearTransfer()
  }, [applyEditingTarget, clearTransfer, clearViolationMessage, finishQuickLineup])

  const {
    openImportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openTeamIngameExportDialog,
    importExportDialogProps,
  } = useBuilderImportExport({
    teams,
    setTeams: setTeamsForImportExport,
    effectiveActiveTeamId,
    activeTeam,
    teamSlots: activeTeamSlots,
    allowDupes: allowDuplicateAwakenerIdentities,
    setAllowDupes: setAllowDuplicateAwakenerIdentities,
    setActiveTeamId,
    setActiveSelection: () => {
      clearImportExportTransientState()
    },
    clearTransfer: clearImportExportTransientState,
    clearPendingDelete: clearImportExportTransientState,
    showToast,
  })

  const openActiveTeamExportDialog = useCallback(() => {
    openTeamExportDialog(effectiveActiveTeamId)
  }, [effectiveActiveTeamId, openTeamExportDialog])

  const openActiveTeamIngameExportDialog = useCallback(() => {
    openTeamIngameExportDialog(effectiveActiveTeamId)
  }, [effectiveActiveTeamId, openTeamIngameExportDialog])

  return {
    openImportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openActiveTeamExportDialog,
    openActiveTeamIngameExportDialog,
    importExportDialogProps,
  }
}
