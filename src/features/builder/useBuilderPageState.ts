import {useRef, useState} from 'react'

import {useTimedToast} from '@/components/ui/useTimedToast'

import {awakenerById} from './constants'
import {createBuilderAwakenerActions} from './createBuilderAwakenerActions'
import {createBuilderCovenantActions} from './createBuilderCovenantActions'
import {createBuilderDndCoordinator} from './createBuilderDndCoordinator'
import {createBuilderPosseActions} from './createBuilderPosseActions'
import {createBuilderWheelActions} from './createBuilderWheelActions'
import {parseTeamPreviewSlotDropZoneId, PICKER_DROP_ZONE_ID} from './dnd-ids'
import {addTeam, applyTeamTemplate, reorderTeams, type TeamTemplateId} from './team-collection'
import {type TeamStateViolationCode} from './team-state'
import {clearTeamSlotTransfer, swapTeamSlotTransfer} from './transfer-resolution'
import type {TeamSlot} from './types'
import {useBuilderDnd} from './useBuilderDnd'
import {useBuilderDndWrappers} from './useBuilderDndWrappers'
import {useBuilderImportExport} from './useBuilderImportExport'
import {useBuilderPageLayoutObserver} from './useBuilderPageLayoutObserver'
import {useBuilderResetUndo} from './useBuilderResetUndo'
import {useBuilderViewModel} from './useBuilderViewModel'
import {usePendingDeleteDialog} from './usePendingDeleteDialog'
import {usePendingResetTeamDialog} from './usePendingResetTeamDialog'
import {usePendingTransferDialog} from './usePendingTransferDialog'
import {usePreviewSlotDrag} from './usePreviewSlotDrag'
import {useSelectionDismiss} from './useSelectionDismiss'
import {useTransferConfirm} from './useTransferConfirm'

export function useBuilderPageState() {
  const {toastEntries, showToast} = useTimedToast({defaultDurationMs: 3200})
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const builderSectionRef = useRef<HTMLElement | null>(null)
  const mainBuilderZoneRef = useRef<HTMLDivElement | null>(null)
  const pickerZoneRef = useRef<HTMLElement | null>(null)
  const [mainBuilderZoneHeight, setMainBuilderZoneHeight] = useState<number | null>(null)
  const [pickerShellHeight, setPickerShellHeight] = useState<number | null>(null)

  const {
    pendingTransfer,
    requestAwakenerTransfer,
    requestPosseTransfer,
    requestWheelTransfer,
    clearTransfer,
  } = useTransferConfirm()

  const {
    displayUnowned,
    setDisplayUnowned,
    sinkUnownedToBottom,
    setSinkUnownedToBottom,
    allowDupes,
    setAllowDupes,
    promoteRecommendedGear,
    setPromoteRecommendedGear,
    promoteMatchingWheelMainstats,
    setPromoteMatchingWheelMainstats,
    teamPreviewMode,
    setTeamPreviewMode,
    quickLineupSession,
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
    teams,
    setTeams,
    setActiveTeamId,
    editingTeamId,
    editingTeamName,
    editingTeamSurface,
    setEditingTeamName,
    pickerTab,
    setPickerTab,
    awakenerFilter,
    setAwakenerFilter,
    posseFilter,
    setPosseFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
    wheelMainstatFilter,
    setWheelMainstatFilter,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection,
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    setPickerSearchByTab,
    setActiveSelection,
    effectiveActiveTeamId,
    teamSlots,
    activeTeam,
    activePosseId,
    pickerPosses,
    activePosse,
    activePosseAsset,
    activeSearchQuery,
    activeBuild,
    teamRecommendedPosseIds,
    filteredAwakeners,
    filteredPosses,
    filteredWheels,
    filteredCovenants,
    teamRealmSet,
    usedAwakenerByIdentityKey,
    usedAwakenerIdentityKeys,
    hasSupportAwakener,
    usedPosseByTeamOrder,
    usedWheelByTeamOrder,
    resolvedActiveSelection,
    slotById,
    updateActiveTeam,
    setActiveTeamSlots,
    beginTeamRename,
    cancelTeamRename,
    commitTeamRename,
    handleCardClick,
    handleWheelSlotClick,
    handleCovenantSlotClick,
    handleRemoveActiveSelection,
    clearTeamSlot,
    swapActiveTeamSlots,
    replaceBuilderDraft,
    resetBuilderDraft,
    startQuickLineup,
    advanceQuickLineupStep,
    skipQuickLineupStep,
    goBackQuickLineupStep,
    finishQuickLineup,
    cancelQuickLineup,
    restoreQuickLineupFocus,
    clearTeamWheel,
    clearTeamCovenant,
  } = useBuilderViewModel({searchInputRef})

  const clearActiveSelection = () => {
    setActiveSelection(null)
  }

  const {clearPendingDelete, requestDeleteTeam, pendingDeleteDialog} = usePendingDeleteDialog({
    teams,
    setTeams,
    effectiveActiveTeamId,
    setActiveTeamId,
    clearActiveSelection,
  })

  const {clearPendingResetTeam, requestResetTeam, pendingResetTeamDialog} =
    usePendingResetTeamDialog({
      teams,
      setTeams,
      effectiveActiveTeamId,
      clearActiveSelection,
    })

  const resetUndo = useBuilderResetUndo({
    teams,
    effectiveActiveTeamId,
    resetBuilderDraft,
    replaceBuilderDraft,
    clearActiveSelection,
    showToast,
  })

  const previewDrag = usePreviewSlotDrag(teams)

  const {handleSetActivePosse} = createBuilderPosseActions({
    allowDupes,
    effectiveActiveTeamId,
    teams,
    pickerPosses,
    usedPosseByTeamOrder,
    quickLineupPosseStep: quickLineupSession?.currentStep.kind === 'posse',
    updateActiveTeam,
    advanceQuickLineupStep,
    requestPosseTransfer,
    clearPendingDelete,
    clearTransfer,
  })

  useSelectionDismiss({
    quickLineupSession,
    restoreQuickLineupFocus,
    setActiveSelection,
  })

  useBuilderPageLayoutObserver({
    builderSectionRef,
    mainBuilderZoneRef,
    pickerZoneRef,
    setMainBuilderZoneHeight,
    setPickerShellHeight,
  })

  const onPickerAssignSuccess: ((nextSlots: TeamSlot[]) => void) | undefined = quickLineupSession
    ? (nextSlots) => {
        advanceQuickLineupStep(nextSlots)
      }
    : undefined

  function clearAllTransientState() {
    clearPendingDelete()
    clearPendingResetTeam()
    clearTransfer()
    cancelTeamRename()
  }

  function notifyViolation(violation: TeamStateViolationCode | undefined) {
    if (violation !== 'TOO_MANY_REALMS_IN_TEAM') {
      if (violation === 'INVALID_BUILD_RULES') {
        showToast('Invalid move: this would break duplicate or support team rules.')
      }
      return
    }
    showToast('Invalid move: a team can only contain up to 2 realms.')
  }

  const {handleDropPickerAwakener, handlePickerAwakenerClick} = createBuilderAwakenerActions({
    allowDupes,
    awakenerById,
    clearPendingDelete,
    clearTransfer,
    effectiveActiveTeamId,
    notifyViolation,
    requestAwakenerTransfer,
    resolvedActiveSelection,
    setActiveSelection,
    setActiveTeamSlots,
    teamSlots,
    usedAwakenerByIdentityKey,
    hasSupportAwakener,
    onPickerAssignSuccess,
  })

  const {
    handleDropPickerWheel,
    handleDropTeamWheel,
    handleDropTeamWheelToSlot,
    handlePickerWheelClick,
  } = createBuilderWheelActions({
    allowDupes,
    clearPendingDelete,
    clearTransfer,
    effectiveActiveTeamId,
    requestWheelTransfer,
    resolvedActiveSelection,
    setActiveSelection,
    setActiveTeamSlots,
    showToast,
    teamSlots,
    usedWheelByTeamOrder,
    onPickerAssignSuccess,
  })

  const {
    handleDropPickerCovenant,
    handleDropTeamCovenant,
    handleDropTeamCovenantToSlot,
    handlePickerCovenantClick,
  } = createBuilderCovenantActions({
    clearPendingDelete,
    clearTransfer,
    resolvedActiveSelection,
    setActiveSelection,
    setActiveTeamSlots,
    showToast,
    teamSlots,
    onPickerAssignSuccess,
  })

  const {
    activeDrag,
    isRemoveIntent,
    sensors,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
  } = useBuilderDnd({
    onDropPickerAwakener: handleDropPickerAwakener,
    onDropPickerWheel: handleDropPickerWheel,
    onDropPickerCovenant: handleDropPickerCovenant,
    onDropPickerPosse: handleSetActivePosse,
    onDropTeamSlot: swapActiveTeamSlots,
    onDropTeamSlotToPicker: clearTeamSlot,
    onDropTeamWheel: handleDropTeamWheel,
    onDropTeamWheelToSlot: handleDropTeamWheelToSlot,
    onDropTeamWheelToPicker: clearTeamWheel,
    onDropTeamCovenant: handleDropTeamCovenant,
    onDropTeamCovenantToSlot: handleDropTeamCovenantToSlot,
    onDropTeamCovenantToPicker: clearTeamCovenant,
  })

  function handlePreviewSlotDragEnd(
    sourceTeamId: string | null,
    sourceSlotId: string | null,
    overId: string | null,
  ) {
    if (!sourceTeamId || !sourceSlotId) {
      previewDrag.clearPreviewDrag()
      return
    }

    if (overId === PICKER_DROP_ZONE_ID) {
      setTeams((prev) => clearTeamSlotTransfer(prev, sourceTeamId, sourceSlotId))
      previewDrag.clearPreviewDrag()
      return
    }

    const previewTarget = overId ? parseTeamPreviewSlotDropZoneId(overId) : null
    if (!previewTarget) {
      previewDrag.clearPreviewDrag()
      return
    }

    setTeams((prev) => {
      const result = swapTeamSlotTransfer(
        prev,
        sourceTeamId,
        sourceSlotId,
        previewTarget.teamId,
        previewTarget.slotId,
        {allowDupes},
      )
      if (result.violation) {
        notifyViolation(result.violation)
      }
      return result.nextTeams
    })
    previewDrag.clearPreviewDrag()
  }

  const {
    handleDragCancel: handleCoordinatedDragCancel,
    handleDragEnd: handleCoordinatedDragEnd,
    handleDragOver: handleCoordinatedDragOver,
    handleDragStart: handleCoordinatedDragStart,
  } = createBuilderDndCoordinator({
    onTeamRowDragStart: clearAllTransientState,
    onTeamPreviewSlotDragStart: (teamId, slotId) => {
      previewDrag.startPreviewDrag(teamId, slotId)
      clearAllTransientState()
    },
    onTeamPreviewSlotDragOver: (overId) => {
      previewDrag.setPreviewRemoveIntent(overId === PICKER_DROP_ZONE_ID)
    },
    onTeamPreviewSlotDragEnd: handlePreviewSlotDragEnd,
    onTeamPreviewSlotDragCancel: previewDrag.clearPreviewDrag,
    onTeamRowReorder: (sourceTeamId, targetTeamId) => {
      setTeams((prev) => reorderTeams(prev, sourceTeamId, targetTeamId))
    },
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  })

  const {
    openImportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openTeamIngameExportDialog,
    importExportDialogProps,
  } = useBuilderImportExport({
    teams,
    setTeams,
    effectiveActiveTeamId,
    activeTeam,
    teamSlots,
    allowDupes,
    setAllowDupes,
    setActiveTeamId,
    setActiveSelection: clearActiveSelection,
    clearTransfer,
    clearPendingDelete,
    showToast,
  })

  const pendingTransferDialog = usePendingTransferDialog({
    pendingTransfer,
    teams,
    setTeams,
    clearTransfer,
  })

  const dndWrappers = useBuilderDndWrappers({
    coordinated: {
      handleDragStart: handleCoordinatedDragStart,
      handleDragOver: handleCoordinatedDragOver,
      handleDragEnd: handleCoordinatedDragEnd,
      handleDragCancel: handleCoordinatedDragCancel,
    },
    slotById,
  })

  function handleImportClick() {
    clearPendingDelete()
    clearTransfer()
    cancelTeamRename()
    openImportDialog()
  }

  function handleExportIngameClick() {
    openTeamIngameExportDialog(activeTeam.id)
  }

  function handleAddTeamTab() {
    clearAllTransientState()
    const result = addTeam(teams)
    setTeams(result.nextTeams)
  }

  function handleTabChange(teamId: string) {
    if (dndWrappers.isTeamEditSuppressed.current) {
      return
    }
    clearPendingDelete()
    clearTransfer()
    cancelTeamRename()
    setActiveTeamId(teamId)
    setActiveSelection(null)
  }

  function handleTabClose(teamId: string) {
    const team = teams.find((entry) => entry.id === teamId)
    if (!team) {
      return
    }
    clearTransfer()
    cancelTeamRename()
    requestDeleteTeam(team.id, team.name)
  }

  function handleApplyTeamTemplate(templateId: TeamTemplateId) {
    clearAllTransientState()
    const result = applyTeamTemplate(teams, templateId)
    setTeams(result.nextTeams)
    const templateLabel = templateId === 'DTIDE_10' ? 'D-Tide (10)' : 'D-Tide (5)'
    if (result.createdCount === 0 && result.renamedCount === 0 && result.removedCount === 0) {
      showToast(`${templateLabel} already matches current team layout.`)
      return
    }
    showToast(
      `Applied ${templateLabel}: renamed ${String(result.renamedCount)}, created ${String(result.createdCount)}, removed ${String(result.removedCount)}.`,
    )
  }

  function handleBeginTeamRename(teamId: string, currentName: string, surface?: 'header' | 'list') {
    clearPendingDelete()
    clearTransfer()
    beginTeamRename(teamId, currentName, surface)
  }

  function handleDeleteTeam(teamId: string, teamName: string) {
    clearTransfer()
    cancelTeamRename()
    requestDeleteTeam(teamId, teamName)
  }

  function handleResetTeam(teamId: string, teamName: string) {
    clearTransfer()
    cancelTeamRename()
    requestResetTeam(teamId, teamName)
  }

  function handleEditTeam(teamId: string) {
    handleTabChange(teamId)
  }

  return {
    toast: {
      toastEntries,
    },
    layout: {
      builderSectionRef,
      mainBuilderZoneRef,
      pickerZoneRef,
      mainBuilderZoneHeight,
      pickerShellHeight,
      searchInputRef,
    },
    dnd: {
      sensors,
      dndWrappers,
      activeDrag,
      isRemoveIntent,
      previewDrag,
      slotById,
    },
    dialogs: {
      pendingDeleteDialog,
      clearPendingDelete,
      pendingResetTeamDialog,
      clearPendingResetTeam,
      pendingTransferDialog,
      clearTransfer,
      resetUndo,
      importExportDialogProps,
    },
    viewModel: {
      displayUnowned,
      setDisplayUnowned,
      sinkUnownedToBottom,
      setSinkUnownedToBottom,
      allowDupes,
      setAllowDupes,
      promoteRecommendedGear,
      setPromoteRecommendedGear,
      promoteMatchingWheelMainstats,
      setPromoteMatchingWheelMainstats,
      teamPreviewMode,
      setTeamPreviewMode,
      quickLineupSession,
      ownedAwakenerLevelByName,
      awakenerLevelByName,
      ownedWheelLevelById,
      ownedPosseLevelById,
      teams,
      setTeams,
      setActiveTeamId,
      editingTeamId,
      editingTeamName,
      editingTeamSurface,
      setEditingTeamName,
      pickerTab,
      setPickerTab,
      awakenerFilter,
      setAwakenerFilter,
      posseFilter,
      setPosseFilter,
      wheelRarityFilter,
      setWheelRarityFilter,
      wheelMainstatFilter,
      setWheelMainstatFilter,
      awakenerSortKey,
      setAwakenerSortKey,
      awakenerSortDirection,
      toggleAwakenerSortDirection,
      awakenerSortGroupByRealm,
      setAwakenerSortGroupByRealm,
      setPickerSearchByTab,
      setActiveSelection,
      effectiveActiveTeamId,
      teamSlots,
      activeTeam,
      activePosseId,
      pickerPosses,
      activePosse,
      activePosseAsset,
      activeSearchQuery,
      activeBuild,
      teamRecommendedPosseIds,
      filteredAwakeners,
      filteredPosses,
      filteredWheels,
      filteredCovenants,
      teamRealmSet,
      usedAwakenerByIdentityKey,
      usedAwakenerIdentityKeys,
      hasSupportAwakener,
      usedPosseByTeamOrder,
      usedWheelByTeamOrder,
      resolvedActiveSelection,
      updateActiveTeam,
      setActiveTeamSlots,
      beginTeamRename,
      cancelTeamRename,
      commitTeamRename,
      handleCardClick,
      handleWheelSlotClick,
      handleCovenantSlotClick,
      handleRemoveActiveSelection,
      clearTeamSlot,
      swapActiveTeamSlots,
      replaceBuilderDraft,
      resetBuilderDraft,
      startQuickLineup,
      advanceQuickLineupStep,
      skipQuickLineupStep,
      goBackQuickLineupStep,
      finishQuickLineup,
      cancelQuickLineup,
      restoreQuickLineupFocus,
      clearTeamWheel,
      clearTeamCovenant,
      clearAllTransientState,
      handleImportClick,
      handleExportIngameClick,
      handleAddTeamTab,
      handleTabChange,
      handleTabClose,
      handleApplyTeamTemplate,
      handleBeginTeamRename,
      handleDeleteTeam,
      handleResetTeam,
      handleEditTeam,
      handleSetActivePosse,
      handlePickerAwakenerClick,
      handlePickerWheelClick,
      handlePickerCovenantClick,
      openExportAllDialog,
      openTeamExportDialog,
    },
  }
}
