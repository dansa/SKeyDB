import {useCallback, useMemo, useRef} from 'react'

import {useTimedToast} from '@/components/ui/useTimedToast'
import {getPosses} from '@/domain/posses'

import type {BuilderDraftPayload} from '../builder-persistence'
import {awakenerByName} from '../constants'
import {createBuilderAwakenerActions} from '../createBuilderAwakenerActions'
import {createBuilderCovenantActions} from '../createBuilderCovenantActions'
import {createBuilderPosseActions} from '../createBuilderPosseActions'
import {createBuilderWheelActions} from '../createBuilderWheelActions'
import {createInitialTeams} from '../team-collection'
import type {TeamStateViolationCode} from '../team-state'
import {
  buildUsedAwakenerByIdentityKey,
  buildUsedPosseByTeamOrder,
  buildUsedWheelByTeamOrder,
  hasSupportAwakener,
} from '../usage-maps'
import {useBuilderImportExport} from '../useBuilderImportExport'
import {useBuilderResetUndo} from '../useBuilderResetUndo'
import {usePendingTransferDialog} from '../usePendingTransferDialog'
import {useBuilderStore} from './store/builder-store'
import {
  selectActiveSelection,
  selectActiveTeam,
  selectActiveTeamId,
  selectActiveTeamSlots,
  selectPendingTransfer,
  selectTeams,
} from './store/selectors'

const pickerPosses = getPosses()

function noop() {
  /* intentional no-op for unused dialog callbacks */
}

function getViolationMessage(violation: TeamStateViolationCode): string {
  if (violation === 'TOO_MANY_REALMS_IN_TEAM') {
    return 'A team can only include up to 2 realms.'
  }
  return 'This move would break the current duplicate rules.'
}

function takePickerResultSnapshot() {
  const state = useBuilderStore.getState()
  const activeTeam = state.teams.find((team) => team.id === state.activeTeamId)

  return {
    pendingTransfer: state.pendingTransfer,
    posseId: activeTeam?.posseId,
    slots: activeTeam?.slots,
  }
}

export function useBuilderV2Actions() {
  const teams = useBuilderStore(selectTeams)
  const activeTeamId = useBuilderStore(selectActiveTeamId)
  const activeTeam = useBuilderStore(selectActiveTeam)
  const teamSlots = useBuilderStore(selectActiveTeamSlots)
  const activeSelection = useBuilderStore(selectActiveSelection)
  const pendingTransfer = useBuilderStore(selectPendingTransfer)
  const allowDupes = useBuilderStore((s) => s.allowDupes)
  const storeSetTeams = useBuilderStore((s) => s.setTeams)
  const storeSetActiveTeamId = useBuilderStore((s) => s.setActiveTeamId)
  const storeSetAllowDupes = useBuilderStore((s) => s.setAllowDupes)
  const storeClearSelection = useBuilderStore((s) => s.clearSelection)
  const storeSetActiveSelection = useBuilderStore((s) => s.setActiveSelection)
  const storeSetActiveTeamSlots = useBuilderStore((s) => s.setActiveTeamSlots)
  const storeUpdateActiveTeam = useBuilderStore((s) => s.updateActiveTeam)
  const requestAwakenerTransfer = useBuilderStore((s) => s.requestAwakenerTransfer)
  const requestPosseTransfer = useBuilderStore((s) => s.requestPosseTransfer)
  const requestWheelTransfer = useBuilderStore((s) => s.requestWheelTransfer)
  const clearTransfer = useBuilderStore((s) => s.clearTransfer)

  const {toastEntries, showToast} = useTimedToast()
  const pendingPickerCompletionRef = useRef<(() => void) | null>(null)

  const resolvedActiveSelection = useMemo(() => {
    if (!activeSelection) {
      return null
    }
    return teamSlots.some((slot) => slot.slotId === activeSelection.slotId) ? activeSelection : null
  }, [activeSelection, teamSlots])

  const usedAwakenerByIdentityKey = useMemo(() => buildUsedAwakenerByIdentityKey(teams), [teams])
  const usedPosseByTeamOrder = useMemo(() => buildUsedPosseByTeamOrder(teams), [teams])
  const usedWheelByTeamOrder = useMemo(() => buildUsedWheelByTeamOrder(teams), [teams])
  const hasAnySupportAwakener = useMemo(() => hasSupportAwakener(teams), [teams])

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

  const notifyViolation = useCallback(
    (violation: TeamStateViolationCode | undefined) => {
      if (!violation) {
        return
      }
      showToast(getViolationMessage(violation))
    },
    [showToast],
  )

  const runPickerInteraction = useCallback((action: () => void, onResolved?: () => void) => {
    const before = takePickerResultSnapshot()
    action()
    const after = takePickerResultSnapshot()

    const changedImmediately = before.posseId !== after.posseId || before.slots !== after.slots
    if (changedImmediately) {
      pendingPickerCompletionRef.current = null
      onResolved?.()
      return
    }

    if (before.pendingTransfer !== after.pendingTransfer) {
      pendingPickerCompletionRef.current = onResolved ?? null
      return
    }

    pendingPickerCompletionRef.current = null
  }, [])

  const awakenerActions = useMemo(
    () =>
      createBuilderAwakenerActions({
        teamSlots,
        awakenerByName,
        effectiveActiveTeamId: activeTeamId,
        usedAwakenerByIdentityKey,
        resolvedActiveSelection,
        setActiveTeamSlots: storeSetActiveTeamSlots,
        setActiveSelection: storeSetActiveSelection,
        requestAwakenerTransfer,
        clearPendingDelete: noop,
        clearTransfer,
        notifyViolation,
        allowDupes,
        hasSupportAwakener: hasAnySupportAwakener,
      }),
    [
      teamSlots,
      activeTeamId,
      usedAwakenerByIdentityKey,
      resolvedActiveSelection,
      storeSetActiveTeamSlots,
      storeSetActiveSelection,
      requestAwakenerTransfer,
      clearTransfer,
      notifyViolation,
      allowDupes,
      hasAnySupportAwakener,
    ],
  )

  const wheelActions = useMemo(
    () =>
      createBuilderWheelActions({
        teamSlots,
        effectiveActiveTeamId: activeTeamId,
        usedWheelByTeamOrder,
        resolvedActiveSelection,
        setActiveTeamSlots: storeSetActiveTeamSlots,
        setActiveSelection: storeSetActiveSelection,
        requestWheelTransfer,
        clearPendingDelete: noop,
        clearTransfer,
        showToast,
        allowDupes,
      }),
    [
      teamSlots,
      activeTeamId,
      usedWheelByTeamOrder,
      resolvedActiveSelection,
      storeSetActiveTeamSlots,
      storeSetActiveSelection,
      requestWheelTransfer,
      clearTransfer,
      showToast,
      allowDupes,
    ],
  )

  const covenantActions = useMemo(
    () =>
      createBuilderCovenantActions({
        teamSlots,
        resolvedActiveSelection,
        setActiveTeamSlots: storeSetActiveTeamSlots,
        setActiveSelection: storeSetActiveSelection,
        clearPendingDelete: noop,
        clearTransfer,
        showToast,
      }),
    [
      teamSlots,
      resolvedActiveSelection,
      storeSetActiveTeamSlots,
      storeSetActiveSelection,
      clearTransfer,
      showToast,
    ],
  )

  const posseActions = useMemo(
    () =>
      createBuilderPosseActions({
        allowDupes,
        effectiveActiveTeamId: activeTeamId,
        teams,
        pickerPosses,
        usedPosseByTeamOrder,
        quickLineupPosseStep: false,
        updateActiveTeam: storeUpdateActiveTeam,
        advanceQuickLineupStep: noop,
        requestPosseTransfer,
        clearPendingDelete: noop,
        clearTransfer,
      }),
    [
      allowDupes,
      activeTeamId,
      teams,
      usedPosseByTeamOrder,
      storeUpdateActiveTeam,
      requestPosseTransfer,
      clearTransfer,
    ],
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
    clearTransfer,
    clearPendingDelete: noop,
    showToast,
  })

  const baseTransferDialog = usePendingTransferDialog({
    pendingTransfer,
    teams,
    setTeams: setTeamsAdapter,
    clearTransfer,
  })
  const transferDialog = useMemo(() => {
    if (!baseTransferDialog) {
      return null
    }

    return {
      ...baseTransferDialog,
      onConfirm: () => {
        baseTransferDialog.onConfirm()
        pendingPickerCompletionRef.current?.()
        pendingPickerCompletionRef.current = null
      },
      onSupport: baseTransferDialog.onSupport
        ? () => {
            baseTransferDialog.onSupport?.()
            pendingPickerCompletionRef.current?.()
            pendingPickerCompletionRef.current = null
          }
        : undefined,
    }
  }, [baseTransferDialog])

  const resetBuilderDraft = useCallback(() => {
    const fresh = createInitialTeams()
    storeSetTeams(fresh)
    storeSetActiveTeamId(fresh[0].id)
    clearTransfer()
  }, [storeSetTeams, storeSetActiveTeamId, clearTransfer])

  const replaceBuilderDraft = useCallback(
    (payload: BuilderDraftPayload) => {
      storeSetTeams(payload.teams)
      storeSetActiveTeamId(payload.activeTeamId)
      clearTransfer()
    },
    [storeSetTeams, storeSetActiveTeamId, clearTransfer],
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

  const cancelTransfer = useCallback(() => {
    pendingPickerCompletionRef.current = null
    clearTransfer()
  }, [clearTransfer])

  const handlePickerAwakenerClick = useCallback(
    (awakenerName: string, onResolved?: () => void) => {
      runPickerInteraction(() => {
        awakenerActions.handlePickerAwakenerClick(awakenerName)
      }, onResolved)
    },
    [awakenerActions, runPickerInteraction],
  )

  const handleDropPickerAwakener = useCallback(
    (awakenerName: string, targetSlotId: string) => {
      awakenerActions.handleDropPickerAwakener(awakenerName, targetSlotId)
    },
    [awakenerActions],
  )

  const handlePickerWheelClick = useCallback(
    (wheelId?: string, onResolved?: () => void) => {
      runPickerInteraction(() => {
        wheelActions.handlePickerWheelClick(wheelId)
      }, onResolved)
    },
    [runPickerInteraction, wheelActions],
  )

  const handleDropPickerWheel = useCallback(
    (wheelId: string, targetSlotId: string, targetWheelIndex?: number) => {
      wheelActions.handleDropPickerWheel(wheelId, targetSlotId, targetWheelIndex)
    },
    [wheelActions],
  )

  const handlePickerCovenantClick = useCallback(
    (covenantId?: string, onResolved?: () => void) => {
      runPickerInteraction(() => {
        covenantActions.handlePickerCovenantClick(covenantId)
      }, onResolved)
    },
    [covenantActions, runPickerInteraction],
  )

  const handleDropPickerCovenant = useCallback(
    (covenantId: string, targetSlotId: string) => {
      covenantActions.handleDropPickerCovenant(covenantId, targetSlotId)
    },
    [covenantActions],
  )

  const handleSetActivePosse = useCallback(
    (posseId?: string, onResolved?: () => void) => {
      runPickerInteraction(() => {
        posseActions.handleSetActivePosse(posseId)
      }, onResolved)
    },
    [posseActions, runPickerInteraction],
  )

  return {
    teams,
    activeTeam,
    toastEntries,
    openImportDialog,
    openExportAllDialog,
    handleExportIngame,
    importExportDialogProps,
    resetDialog,
    transferDialog,
    canUndoReset,
    requestReset,
    cancelReset,
    cancelTransfer,
    undoReset,
    handlePickerAwakenerClick,
    handleDropPickerAwakener,
    handlePickerWheelClick,
    handleDropPickerWheel,
    handleDropTeamWheel: wheelActions.handleDropTeamWheel,
    handleDropTeamWheelToSlot: wheelActions.handleDropTeamWheelToSlot,
    handlePickerCovenantClick,
    handleDropPickerCovenant,
    handleDropTeamCovenant: covenantActions.handleDropTeamCovenant,
    handleDropTeamCovenantToSlot: covenantActions.handleDropTeamCovenantToSlot,
    handleSetActivePosse,
    noop,
  }
}

export type BuilderV2ActionsResult = ReturnType<typeof useBuilderV2Actions>
