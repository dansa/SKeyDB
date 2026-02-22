import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
import { awakenerByName } from './builder/constants'
import { parseCovenantDropZoneId, parseWheelDropZoneId, PICKER_DROP_ZONE_ID } from './builder/dnd-ids'
import { BuilderActiveTeamPanel } from './builder/BuilderActiveTeamPanel'
import { BuilderSelectionPanel } from './builder/BuilderSelectionPanel'
import { BuilderTeamsPanel } from './builder/BuilderTeamsPanel'
import { BuilderImportExportDialogs } from './builder/BuilderImportExportDialogs'
import { BuilderConfirmDialogs } from './builder/BuilderConfirmDialogs'
import { PickerAwakenerGhost, PickerWheelGhost, TeamCardGhost, TeamWheelGhost } from './builder/DragGhosts'
import { Toast } from '../components/ui/Toast'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  clearSlotAssignment,
  type TeamStateViolationCode,
  swapSlotAssignments,
} from './builder/team-state'
import { useBuilderDnd } from './builder/useBuilderDnd'
import { useBuilderDndCoordinator } from './builder/useBuilderDndCoordinator'
import { useTransferConfirm } from './builder/useTransferConfirm'
import { useBuilderViewModel } from './builder/useBuilderViewModel'
import { useBuilderImportExport } from './builder/useBuilderImportExport'
import { usePendingTransferDialog } from './builder/usePendingTransferDialog'
import { usePendingDeleteDialog } from './builder/usePendingDeleteDialog'
import { useBuilderWheelActions } from './builder/useBuilderWheelActions'
import { useBuilderCovenantActions } from './builder/useBuilderCovenantActions'
import { getAwakenerIdentityKey } from '../domain/awakener-identity'
import { addTeam, reorderTeams } from './builder/team-collection'
import type { PredictedDropHover } from './builder/types'
import type { DragData } from './builder/types'

export function BuilderPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [predictedDropHover, setPredictedDropHover] = useState<PredictedDropHover>(null)
  const toastTimeoutRef = useRef<number | null>(null)
  const suppressTeamEditRef = useRef(false)
  const suppressTeamEditTimeoutRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const { pendingTransfer, requestAwakenerTransfer, requestPosseTransfer, requestWheelTransfer, clearTransfer } =
    useTransferConfirm()
  const {
    teams,
    setTeams,
    setActiveTeamId,
    editingTeamId,
    editingTeamName,
    setEditingTeamName,
    pickerTab,
    setPickerTab,
    awakenerFilter,
    setAwakenerFilter,
    posseFilter,
    setPosseFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
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
    filteredAwakeners,
    filteredPosses,
    filteredWheels,
    filteredCovenants,
    teamFactionSet,
    usedAwakenerByIdentityKey,
    usedAwakenerIdentityKeys,
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
  } = useBuilderViewModel({ searchInputRef })

  const {
    clearPendingDelete,
    requestDeleteTeam,
    pendingDeleteDialog,
  } = usePendingDeleteDialog({
    teams,
    setTeams,
    effectiveActiveTeamId,
    setActiveTeamId,
    clearActiveSelection: () => setActiveSelection(null),
  })

  function showToast(message: string, duration = 2200) {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }

    setToastMessage(message)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimeoutRef.current = null
    }, duration)
  }

  function notifyViolation(violation: TeamStateViolationCode | undefined) {
    if (violation !== 'TOO_MANY_FACTIONS_IN_TEAM') {
      return
    }
    showToast('Invalid move: a team can only contain up to 2 factions.')
  }

  const {
    handleDropPickerWheel,
    handleDropTeamWheel,
    handleDropTeamWheelToPicker,
    handleDropTeamWheelToSlot,
    handlePickerWheelClick,
  } = useBuilderWheelActions({
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
  })

  const {
    handleDropPickerCovenant,
    handleDropTeamCovenant,
    handleDropTeamCovenantToPicker,
    handleDropTeamCovenantToSlot,
    handlePickerCovenantClick,
  } = useBuilderCovenantActions({
    clearPendingDelete,
    clearTransfer,
    resolvedActiveSelection,
    setActiveSelection,
    setActiveTeamSlots,
    showToast,
    teamSlots,
  })

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }
      if (target.closest('[data-picker-zone="true"]')) {
        return
      }
      if (target.closest('[data-card-remove]')) {
        return
      }
      if (target.closest('[data-selection-owner="true"]')) {
        return
      }
      setActiveSelection(null)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [setActiveSelection])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
      if (suppressTeamEditTimeoutRef.current) {
        window.clearTimeout(suppressTeamEditTimeoutRef.current)
      }
    }
  }, [])

  const { activeDrag, isRemoveIntent, sensors, handleDragCancel, handleDragEnd, handleDragOver, handleDragStart } = useBuilderDnd({
    onDropPickerAwakener: (awakenerName, targetSlotId) => {
      const result = assignAwakenerToSlot(teamSlots, awakenerName, targetSlotId, awakenerByName)
      notifyViolation(result.violation)
      if (result.nextSlots === teamSlots) {
        return
      }

      const identityKey = getAwakenerIdentityKey(awakenerName)
      const owningTeamId = usedAwakenerByIdentityKey.get(identityKey)
      if (owningTeamId && owningTeamId !== effectiveActiveTeamId) {
        clearPendingDelete()
        requestAwakenerTransfer({
          awakenerName,
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
        })
        return
      }

      clearTransfer()
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection({ kind: 'awakener', slotId: targetSlotId })
    },
    onDropPickerWheel: (wheelId, targetSlotId, targetWheelIndex) => {
      handleDropPickerWheel(wheelId, targetSlotId, targetWheelIndex)
    },
    onDropPickerCovenant: (covenantId, targetSlotId) => {
      handleDropPickerCovenant(covenantId, targetSlotId)
    },
    onDropTeamSlot: (sourceSlotId, targetSlotId) => {
      const result = swapSlotAssignments(teamSlots, sourceSlotId, targetSlotId)
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection({ kind: 'awakener', slotId: targetSlotId })
    },
    onDropTeamSlotToPicker: (sourceSlotId) => {
      const result = clearSlotAssignment(teamSlots, sourceSlotId)
      setActiveTeamSlots(result.nextSlots)
    },
    onDropTeamWheel: (sourceSlotId, sourceWheelIndex, targetSlotId, targetWheelIndex) => {
      handleDropTeamWheel(sourceSlotId, sourceWheelIndex, targetSlotId, targetWheelIndex)
    },
    onDropTeamWheelToSlot: (sourceSlotId, sourceWheelIndex, targetSlotId) => {
      handleDropTeamWheelToSlot(sourceSlotId, sourceWheelIndex, targetSlotId)
    },
    onDropTeamWheelToPicker: (sourceSlotId, sourceWheelIndex) => {
      handleDropTeamWheelToPicker(sourceSlotId, sourceWheelIndex)
    },
    onDropTeamCovenant: (sourceSlotId, targetSlotId) => {
      handleDropTeamCovenant(sourceSlotId, targetSlotId)
    },
    onDropTeamCovenantToSlot: (sourceSlotId, targetSlotId) => {
      handleDropTeamCovenantToSlot(sourceSlotId, targetSlotId)
    },
    onDropTeamCovenantToPicker: (sourceSlotId) => {
      handleDropTeamCovenantToPicker(sourceSlotId)
    },
  })

  const {
    handleDragCancel: handleCoordinatedDragCancel,
    handleDragEnd: handleCoordinatedDragEnd,
    handleDragOver: handleCoordinatedDragOver,
    handleDragStart: handleCoordinatedDragStart,
  } = useBuilderDndCoordinator({
    onTeamRowDragStart: () => {
      clearPendingDelete()
      clearTransfer()
      cancelTeamRename()
    },
    onTeamRowReorder: (sourceTeamId, targetTeamId) => {
      setTeams((prev) => reorderTeams(prev, sourceTeamId, targetTeamId))
    },
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  })

  const {
    isImportDialogOpen,
    openImportDialog,
    submitImportCode,
    closeImportFlow,
    exportDialog,
    closeExportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    pendingReplaceImport,
    cancelReplaceImport,
    confirmReplaceImport,
    pendingStrategyImport,
    pendingStrategyConflictSummary,
    cancelStrategyImport,
    applyMoveStrategyImport,
    applySkipStrategyImport,
  } = useBuilderImportExport({
    teams,
    setTeams,
    effectiveActiveTeamId,
    activeTeam,
    teamSlots,
    setActiveTeamId,
    setActiveSelection: () => setActiveSelection(null),
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

  function clearTeamEditSuppressionSoon() {
    if (suppressTeamEditTimeoutRef.current) {
      window.clearTimeout(suppressTeamEditTimeoutRef.current)
    }
    suppressTeamEditTimeoutRef.current = window.setTimeout(() => {
      suppressTeamEditRef.current = false
      suppressTeamEditTimeoutRef.current = null
    }, 0)
  }

  function findFirstEmptyWheelIndex(slotId: string): number | null {
    const slot = slotById.get(slotId)
    if (!slot?.awakenerName) {
      return null
    }
    const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel)
    return firstEmptyIndex === -1 ? null : firstEmptyIndex
  }

  function resolvePredictedDropHover(
    dragData: DragData | null | undefined,
    overId: string | undefined,
  ): PredictedDropHover {
    if (!dragData || !overId || overId === PICKER_DROP_ZONE_ID) {
      return null
    }

    const overWheelZone = parseWheelDropZoneId(overId)
    const overCovenantZone = parseCovenantDropZoneId(overId)

    if (dragData.kind === 'picker-wheel' || dragData.kind === 'team-wheel') {
      if (overWheelZone) {
        return { kind: 'wheel', slotId: overWheelZone.slotId, wheelIndex: overWheelZone.wheelIndex }
      }
      const targetSlotId = overCovenantZone?.slotId ?? (overId.startsWith('slot-') ? overId : null)
      if (!targetSlotId) {
        return null
      }
      const wheelIndex = findFirstEmptyWheelIndex(targetSlotId)
      if (wheelIndex === null) {
        return null
      }
      return { kind: 'wheel', slotId: targetSlotId, wheelIndex }
    }

    if (dragData.kind === 'picker-covenant' || dragData.kind === 'team-covenant') {
      const targetSlotId = overCovenantZone?.slotId ?? overWheelZone?.slotId ?? (overId.startsWith('slot-') ? overId : null)
      if (!targetSlotId) {
        return null
      }
      const slot = slotById.get(targetSlotId)
      if (!slot?.awakenerName) {
        return null
      }
      return { kind: 'covenant', slotId: targetSlotId }
    }

    return null
  }

  function handleDndDragStart(event: Parameters<typeof handleCoordinatedDragStart>[0]) {
    suppressTeamEditRef.current = true
    setPredictedDropHover(null)
    handleCoordinatedDragStart(event)
  }

  function handleDndDragOver(event: Parameters<typeof handleCoordinatedDragOver>[0]) {
    const overId = typeof event.over?.id === 'string' ? event.over.id : undefined
    const dragData = event.active.data.current as DragData | undefined
    setPredictedDropHover(resolvePredictedDropHover(dragData, overId))
    handleCoordinatedDragOver(event)
  }

  function handleDndDragEnd(event: Parameters<typeof handleCoordinatedDragEnd>[0]) {
    setPredictedDropHover(null)
    handleCoordinatedDragEnd(event)
    clearTeamEditSuppressionSoon()
  }

  function handleDndDragCancel() {
    setPredictedDropHover(null)
    handleCoordinatedDragCancel()
    clearTeamEditSuppressionSoon()
  }

  return (
    <DndContext
      onDragCancel={handleDndDragCancel}
      onDragEnd={handleDndDragEnd}
      onDragOver={handleDndDragOver}
      onDragStart={handleDndDragStart}
      sensors={sensors}
    >
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="ui-title text-2xl text-amber-100">Builder</h2>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <BuilderActiveTeamPanel
              activeTeamName={activeTeam?.name ?? 'Team'}
              activePosseAsset={activePosseAsset}
              activePosseName={activePosse?.name}
              activeDragKind={activeDrag?.kind ?? null}
              onOpenPossePicker={() => setPickerTab('posses')}
              onCardClick={handleCardClick}
              onRemoveActiveSelection={handleRemoveActiveSelection}
              onCovenantSlotClick={handleCovenantSlotClick}
              onWheelSlotClick={handleWheelSlotClick}
              predictedDropHover={predictedDropHover}
              resolvedActiveSelection={resolvedActiveSelection}
              teamFactions={teamFactionSet}
              teamSlots={teamSlots}
            />

            <BuilderTeamsPanel
              activeTeamId={effectiveActiveTeamId}
              editingTeamId={editingTeamId}
              editingTeamName={editingTeamName}
              onAddTeam={() => {
                const result = addTeam(teams)
                setTeams(result.nextTeams)
              }}
              onExportAll={() => {
                openExportAllDialog()
              }}
              onExportTeam={(teamId) => {
                openTeamExportDialog(teamId)
              }}
              onBeginTeamRename={(teamId, currentName) => {
                clearPendingDelete()
                clearTransfer()
                beginTeamRename(teamId, currentName)
              }}
              onCancelTeamRename={cancelTeamRename}
              onCommitTeamRename={commitTeamRename}
              onDeleteTeam={(teamId, teamName) => {
                clearTransfer()
                cancelTeamRename()
                requestDeleteTeam(teamId, teamName)
              }}
              onEditTeam={(teamId) => {
                if (suppressTeamEditRef.current) {
                  return
                }
                clearPendingDelete()
                clearTransfer()
                cancelTeamRename()
                setActiveTeamId(teamId)
                setActiveSelection(null)
              }}
              onEditingTeamNameChange={setEditingTeamName}
              onOpenImport={() => {
                clearPendingDelete()
                clearTransfer()
                cancelTeamRename()
                openImportDialog()
              }}
              posses={pickerPosses}
              teams={teams}
            />
          </div>

          <BuilderSelectionPanel
            activePosseId={activePosseId}
            activeSearchQuery={activeSearchQuery}
            awakenerFilter={awakenerFilter}
            effectiveActiveTeamId={effectiveActiveTeamId}
            filteredAwakeners={filteredAwakeners}
            filteredPosses={filteredPosses}
            onAwakenerClick={(awakenerName) => {
              clearPendingDelete()
              clearTransfer()
              const result =
                resolvedActiveSelection?.kind === 'awakener'
                  ? assignAwakenerToSlot(teamSlots, awakenerName, resolvedActiveSelection.slotId, awakenerByName)
                  : assignAwakenerToFirstEmptySlot(teamSlots, awakenerName, awakenerByName)
              notifyViolation(result.violation)
              if (result.nextSlots === teamSlots) {
                return
              }
              const identityKey = getAwakenerIdentityKey(awakenerName)
              const owningTeamId = usedAwakenerByIdentityKey.get(identityKey)
              if (owningTeamId && owningTeamId !== effectiveActiveTeamId) {
                requestAwakenerTransfer({
                  awakenerName,
                  fromTeamId: owningTeamId,
                  toTeamId: effectiveActiveTeamId,
                  targetSlotId: resolvedActiveSelection?.kind === 'awakener' ? resolvedActiveSelection.slotId : undefined,
                })
                return
              }
              setActiveTeamSlots(result.nextSlots)
              clearTransfer()
            }}
            onAwakenerFilterChange={setAwakenerFilter}
            onPickerTabChange={setPickerTab}
            onPosseFilterChange={setPosseFilter}
            onWheelRarityFilterChange={setWheelRarityFilter}
            onSearchChange={(nextValue) =>
              setPickerSearchByTab((prev) => ({
                ...prev,
                [pickerTab]: nextValue,
              }))
            }
            onSetActivePosse={(posseId) => {
              clearPendingDelete()
              clearTransfer()
              if (!posseId) {
                updateActiveTeam((team) => ({ ...team, posseId: undefined }))
                clearTransfer()
                return
              }

              const usedByTeamOrder = usedPosseByTeamOrder.get(posseId)
              const usedByTeam = usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder]
              const isUsedByOtherTeam = usedByTeam && usedByTeam.id !== effectiveActiveTeamId
              if (isUsedByOtherTeam) {
                const posse = pickerPosses.find((entry) => entry.id === posseId)
                requestPosseTransfer({
                  posseId,
                  posseName: posse?.name ?? 'Posse',
                  fromTeamId: usedByTeam.id,
                  toTeamId: effectiveActiveTeamId,
                })
                return
              }

              updateActiveTeam((team) => ({ ...team, posseId }))
              clearTransfer()
            }}
            onSetActiveWheel={(wheelId) => {
              handlePickerWheelClick(wheelId)
            }}
            onSetActiveCovenant={(covenantId) => {
              handlePickerCovenantClick(covenantId)
            }}
            pickerTab={pickerTab}
            posseFilter={posseFilter}
            wheelRarityFilter={wheelRarityFilter}
            searchInputRef={searchInputRef}
            teamFactionSet={teamFactionSet}
            teams={teams}
            usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
            usedPosseByTeamOrder={usedPosseByTeamOrder}
            usedWheelByTeamOrder={usedWheelByTeamOrder}
            filteredWheels={filteredWheels}
            filteredCovenants={filteredCovenants}
          />
        </div>
      </section>

      <DragOverlay dropAnimation={null}>
        {activeDrag?.kind === 'picker-awakener' ? <PickerAwakenerGhost awakenerName={activeDrag.awakenerName} /> : null}
        {activeDrag?.kind === 'picker-wheel' ? <PickerWheelGhost wheelId={activeDrag.wheelId} /> : null}
        {activeDrag?.kind === 'picker-covenant' ? <PickerWheelGhost wheelId={activeDrag.covenantId} isCovenant /> : null}
        {activeDrag?.kind === 'team-slot' ? (
          <TeamCardGhost removeIntent={isRemoveIntent} slot={slotById.get(activeDrag.slotId)} />
        ) : null}
        {activeDrag?.kind === 'team-wheel' ? (
          <TeamWheelGhost removeIntent={isRemoveIntent} wheelId={activeDrag.wheelId} />
        ) : null}
        {activeDrag?.kind === 'team-covenant' ? (
          <TeamWheelGhost removeIntent={isRemoveIntent} wheelId={activeDrag.covenantId} isCovenant />
        ) : null}
      </DragOverlay>

      <BuilderConfirmDialogs
        deleteDialog={pendingDeleteDialog}
        onCancelDelete={clearPendingDelete}
        onCancelTransfer={clearTransfer}
        transferDialog={pendingTransferDialog}
      />

      <BuilderImportExportDialogs
        exportDialog={exportDialog}
        isImportDialogOpen={isImportDialogOpen}
        onCancelImport={closeImportFlow}
        onCancelReplaceImport={cancelReplaceImport}
        onCancelStrategyImport={cancelStrategyImport}
        onCloseExportDialog={closeExportDialog}
        onConfirmReplaceImport={confirmReplaceImport}
        onMoveStrategyImport={applyMoveStrategyImport}
        onSkipStrategyImport={applySkipStrategyImport}
        onSubmitImport={submitImportCode}
        pendingReplaceImport={pendingReplaceImport}
        pendingStrategyConflictSummary={pendingStrategyConflictSummary}
        pendingStrategyImport={pendingStrategyImport}
      />

      <Toast message={toastMessage} />
    </DndContext>
  )
}
