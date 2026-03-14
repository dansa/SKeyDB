import {useCallback} from 'react'

import {useTimedToast} from '@/components/ui/useTimedToast'

import type {BuilderDraftPayload} from '../builder-persistence'
import {createInitialTeams} from '../team-collection'
import {useBuilderImportExport} from '../useBuilderImportExport'
import {useBuilderResetUndo} from '../useBuilderResetUndo'
import {useBuilderStore} from './store/builder-store'
import {
  selectActiveTeam,
  selectActiveTeamId,
  selectActiveTeamSlots,
  selectTeams,
} from './store/selectors'

function noop() {
  /* intentional no-op for unused dialog callbacks */
}

export function useBuilderV2Actions() {
  const teams = useBuilderStore(selectTeams)
  const activeTeamId = useBuilderStore(selectActiveTeamId)
  const activeTeam = useBuilderStore(selectActiveTeam)
  const teamSlots = useBuilderStore(selectActiveTeamSlots)
  const allowDupes = useBuilderStore((s) => s.allowDupes)
  const storeSetTeams = useBuilderStore((s) => s.setTeams)
  const storeSetActiveTeamId = useBuilderStore((s) => s.setActiveTeamId)
  const storeSetAllowDupes = useBuilderStore((s) => s.setAllowDupes)
  const storeClearSelection = useBuilderStore((s) => s.clearSelection)

  const {toastEntries, showToast} = useTimedToast()

  const setTeamsAdapter = useCallback(
    (teamsOrUpdater: typeof teams | ((prev: typeof teams) => typeof teams)) => {
      if (typeof teamsOrUpdater === 'function') {
        const current = useBuilderStore.getState().teams
        storeSetTeams(teamsOrUpdater(current))
      } else {
        storeSetTeams(teamsOrUpdater)
      }
    },
    [storeSetTeams],
  )

  const clearSelectionAdapter = useCallback(
    (_selection: null) => {
      storeClearSelection()
    },
    [storeClearSelection],
  )

  const {
    openImportDialog,
    openExportAllDialog,
    openTeamIngameExportDialog,
    importExportDialogProps,
  } = useBuilderImportExport({
    teams,
    setTeams: setTeamsAdapter,
    effectiveActiveTeamId: activeTeamId,
    activeTeam,
    teamSlots,
    allowDupes,
    setAllowDupes: storeSetAllowDupes,
    setActiveTeamId: storeSetActiveTeamId,
    setActiveSelection: clearSelectionAdapter,
    clearTransfer: noop,
    clearPendingDelete: noop,
    showToast,
  })

  const resetBuilderDraft = useCallback(() => {
    const fresh = createInitialTeams()
    storeSetTeams(fresh)
    storeSetActiveTeamId(fresh[0].id)
  }, [storeSetTeams, storeSetActiveTeamId])

  const replaceBuilderDraft = useCallback(
    (payload: BuilderDraftPayload) => {
      storeSetTeams(payload.teams)
      storeSetActiveTeamId(payload.activeTeamId)
    },
    [storeSetTeams, storeSetActiveTeamId],
  )

  const {resetDialog, canUndoReset, requestReset, cancelReset, undoReset} = useBuilderResetUndo({
    teams,
    effectiveActiveTeamId: activeTeamId,
    resetBuilderDraft,
    replaceBuilderDraft,
    clearActiveSelection: storeClearSelection,
    showToast,
  })

  const handleExportIngame = useCallback(() => {
    openTeamIngameExportDialog(activeTeamId)
  }, [openTeamIngameExportDialog, activeTeamId])

  return {
    teams,
    activeTeam,
    toastEntries,
    openImportDialog,
    openExportAllDialog,
    handleExportIngame,
    importExportDialogProps,
    resetDialog,
    canUndoReset,
    requestReset,
    cancelReset,
    undoReset,
    noop,
  }
}
