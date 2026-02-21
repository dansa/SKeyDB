import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
import { awakenerByName } from './builder/constants'
import { BuilderActiveTeamPanel } from './builder/BuilderActiveTeamPanel'
import { BuilderSelectionPanel } from './builder/BuilderSelectionPanel'
import { BuilderTeamsPanel } from './builder/BuilderTeamsPanel'
import { BuilderImportExportDialogs } from './builder/BuilderImportExportDialogs'
import { BuilderConfirmDialogs } from './builder/BuilderConfirmDialogs'
import { PickerAwakenerGhost, TeamCardGhost } from './builder/DragGhosts'
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
import { getAwakenerIdentityKey } from '../domain/awakener-identity'
import { addTeam, reorderTeams } from './builder/team-collection'

export function BuilderPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const { pendingTransfer, requestAwakenerTransfer, requestPosseTransfer, clearTransfer } = useTransferConfirm()
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
    teamFactionSet,
    usedAwakenerByIdentityKey,
    usedAwakenerIdentityKeys,
    usedPosseByTeamOrder,
    resolvedActiveSelection,
    slotById,
    updateActiveTeam,
    setActiveTeamSlots,
    beginTeamRename,
    cancelTeamRename,
    commitTeamRename,
    handleCardClick,
    handleWheelSlotClick,
    handleRemoveActiveSelection,
  } = useBuilderViewModel({ searchInputRef })

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

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
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
    },
    onDropTeamSlot: (sourceSlotId, targetSlotId) => {
      const result = swapSlotAssignments(teamSlots, sourceSlotId, targetSlotId)
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection((prev) => {
        if (!prev) {
          return prev
        }
        if (prev.slotId === sourceSlotId) {
          return { ...prev, slotId: targetSlotId }
        }
        if (prev.slotId === targetSlotId) {
          return { ...prev, slotId: sourceSlotId }
        }
        return prev
      })
    },
    onDropTeamSlotToPicker: (sourceSlotId) => {
      const result = clearSlotAssignment(teamSlots, sourceSlotId)
      setActiveTeamSlots(result.nextSlots)
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

  return (
    <DndContext
      onDragCancel={handleCoordinatedDragCancel}
      onDragEnd={handleCoordinatedDragEnd}
      onDragOver={handleCoordinatedDragOver}
      onDragStart={handleCoordinatedDragStart}
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
              onOpenPossePicker={() => setPickerTab('posses')}
              onCardClick={handleCardClick}
              onRemoveActiveSelection={handleRemoveActiveSelection}
              onWheelSlotClick={handleWheelSlotClick}
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
            pickerTab={pickerTab}
            posseFilter={posseFilter}
            searchInputRef={searchInputRef}
            teamFactionSet={teamFactionSet}
            teams={teams}
            usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
            usedPosseByTeamOrder={usedPosseByTeamOrder}
          />
        </div>
      </section>

      <DragOverlay dropAnimation={null}>
        {activeDrag?.kind === 'picker-awakener' ? <PickerAwakenerGhost awakenerName={activeDrag.awakenerName} /> : null}
        {activeDrag?.kind === 'team-slot' ? (
          <TeamCardGhost removeIntent={isRemoveIntent} slot={slotById.get(activeDrag.slotId)} />
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
