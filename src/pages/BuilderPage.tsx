import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
import type { BuilderDraftPayload } from './builder/builder-persistence'
import { awakenerByName } from './builder/constants'
import { BuilderActiveTeamPanel } from './builder/BuilderActiveTeamPanel'
import { BuilderSelectionPanel } from './builder/BuilderSelectionPanel'
import { BuilderTeamsPanel } from './builder/BuilderTeamsPanel'
import { BuilderImportExportDialogs } from './builder/BuilderImportExportDialogs'
import { BuilderConfirmDialogs } from './builder/BuilderConfirmDialogs'
import { PickerAwakenerGhost, PickerWheelGhost, TeamCardGhost, TeamWheelGhost } from './builder/DragGhosts'
import { Toast } from '../components/ui/Toast'
import { useTimedToast } from '../components/ui/useTimedToast'
import { PageToolkitBar } from '../components/ui/PageToolkitBar'
import { Button } from '../components/ui/Button'
import { TabbedContainer } from '../components/ui/TabbedContainer'
import { FaDownload, FaRotateLeft, FaUpload, FaXmark } from 'react-icons/fa6'
import {
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
import { usePendingResetTeamDialog } from './builder/usePendingResetTeamDialog'
import { useBuilderWheelActions } from './builder/useBuilderWheelActions'
import { useBuilderCovenantActions } from './builder/useBuilderCovenantActions'
import { useBuilderAwakenerActions } from './builder/useBuilderAwakenerActions'
import { resolvePredictedDropHover } from './builder/predicted-drop-hover'
import { addTeam, applyTeamTemplate, reorderTeams, type TeamTemplateId } from './builder/team-collection'
import type { PredictedDropHover } from './builder/types'
import type { DragData } from './builder/types'

export function BuilderPage() {
  const [predictedDropHover, setPredictedDropHover] = useState<PredictedDropHover>(null)
  const [pendingResetBuilder, setPendingResetBuilder] = useState(false)
  const [undoResetSnapshot, setUndoResetSnapshot] = useState<BuilderDraftPayload | null>(null)
  const { toastMessage, showToast } = useTimedToast({ defaultDurationMs: 3200 })
  const suppressTeamEditRef = useRef(false)
  const suppressTeamEditTimeoutRef = useRef<number | null>(null)
  const resetUndoTimeoutRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const { pendingTransfer, requestAwakenerTransfer, requestPosseTransfer, requestWheelTransfer, clearTransfer } =
    useTransferConfirm()
  const {
    displayUnowned,
    setDisplayUnowned,
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
    awakenerSortGroupByFaction,
    setAwakenerSortGroupByFaction,
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
    replaceBuilderDraft,
    resetBuilderDraft,
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
  const {
    clearPendingResetTeam,
    requestResetTeam,
    pendingResetTeamDialog,
  } = usePendingResetTeamDialog({
    teams,
    setTeams,
    effectiveActiveTeamId,
    clearActiveSelection: () => setActiveSelection(null),
  })

  function notifyViolation(violation: TeamStateViolationCode | undefined) {
    if (violation !== 'TOO_MANY_FACTIONS_IN_TEAM') {
      return
    }
    showToast('Invalid move: a team can only contain up to 2 factions.')
  }

  const {
    handleDropPickerAwakener,
    handlePickerAwakenerClick,
  } = useBuilderAwakenerActions({
    awakenerByName,
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
  })

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
      if (suppressTeamEditTimeoutRef.current) {
        window.clearTimeout(suppressTeamEditTimeoutRef.current)
      }
      if (resetUndoTimeoutRef.current) {
        window.clearTimeout(resetUndoTimeoutRef.current)
      }
    }
  }, [])

  function requestResetBuilder() {
    clearPendingDelete()
    clearPendingResetTeam()
    clearTransfer()
    cancelTeamRename()
    setPendingResetBuilder(true)
  }

  function cancelResetBuilder() {
    setPendingResetBuilder(false)
  }

  function confirmResetBuilder() {
    const snapshot: BuilderDraftPayload = {
      teams,
      activeTeamId: effectiveActiveTeamId,
    }

    resetBuilderDraft()
    setActiveSelection(null)
    setPendingResetBuilder(false)
    setUndoResetSnapshot(snapshot)
    showToast('Builder reset. Undo is available for 15 seconds.')

    if (resetUndoTimeoutRef.current) {
      window.clearTimeout(resetUndoTimeoutRef.current)
    }
    resetUndoTimeoutRef.current = window.setTimeout(() => {
      setUndoResetSnapshot(null)
      resetUndoTimeoutRef.current = null
    }, 15_000)
  }

  function undoResetBuilder() {
    if (!undoResetSnapshot) {
      return
    }

    replaceBuilderDraft(undoResetSnapshot)
    setActiveSelection(null)
    setUndoResetSnapshot(null)
    showToast('Builder reset has been undone.')

    if (resetUndoTimeoutRef.current) {
      window.clearTimeout(resetUndoTimeoutRef.current)
      resetUndoTimeoutRef.current = null
    }
  }

  const { activeDrag, isRemoveIntent, sensors, handleDragCancel, handleDragEnd, handleDragOver, handleDragStart } = useBuilderDnd({
    onDropPickerAwakener: (awakenerName, targetSlotId) => {
      handleDropPickerAwakener(awakenerName, targetSlotId)
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
      clearPendingResetTeam()
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

  function handleDndDragStart(event: Parameters<typeof handleCoordinatedDragStart>[0]) {
    suppressTeamEditRef.current = true
    setPredictedDropHover(null)
    handleCoordinatedDragStart(event)
  }

  function handleDndDragOver(event: Parameters<typeof handleCoordinatedDragOver>[0]) {
    const overId = typeof event.over?.id === 'string' ? event.over.id : undefined
    const dragData = event.active.data.current as DragData | undefined
    setPredictedDropHover(resolvePredictedDropHover(dragData, overId, slotById))
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

  const activeDraggedSlot = activeDrag?.kind === 'team-slot' ? slotById.get(activeDrag.slotId) : undefined
  const activeDraggedAwakenerOwnedLevel =
    activeDraggedSlot?.awakenerName ? (ownedAwakenerLevelByName.get(activeDraggedSlot.awakenerName) ?? null) : null
  const activeDraggedWheelOwnedLevels: [number | null, number | null] = [
    activeDraggedSlot?.wheels[0] ? (ownedWheelLevelById.get(activeDraggedSlot.wheels[0]) ?? null) : null,
    activeDraggedSlot?.wheels[1] ? (ownedWheelLevelById.get(activeDraggedSlot.wheels[1]) ?? null) : null,
  ]
  const canUndoReset = Boolean(undoResetSnapshot)

  return (
    <DndContext
      onDragCancel={handleDndDragCancel}
      onDragEnd={handleDndDragEnd}
      onDragOver={handleDndDragOver}
      onDragStart={handleDndDragStart}
      sensors={sensors}
    >
      <section className="space-y-4">
        <PageToolkitBar className="collection-toolkit-drawer">
          <Button
            className="px-2 py-1 text-[10px] uppercase tracking-wide"
            onClick={() => {
              clearPendingDelete()
              clearTransfer()
              cancelTeamRename()
              openImportDialog()
            }}
            type="button"
          >
            <span className="inline-flex items-center gap-1">
              <FaUpload aria-hidden className="text-[9px]" />
              <span>Import</span>
            </span>
          </Button>
          <Button
            className="px-2 py-1 text-[10px] uppercase tracking-wide"
            disabled={teams.length === 0}
            onClick={() => {
              openExportAllDialog()
            }}
            type="button"
          >
            <span className="inline-flex items-center gap-1">
              <FaDownload aria-hidden className="text-[9px]" />
              <span>Export All</span>
            </span>
          </Button>
          <Button
            className={`px-2 py-1 text-[10px] uppercase tracking-wide ${
              canUndoReset
                ? 'border-amber-300/65 bg-amber-500/15 text-amber-100 hover:border-amber-200/85'
                : 'border-rose-300/70 bg-rose-500/14 text-rose-100 hover:border-rose-200/85'
            }`}
            onClick={canUndoReset ? undoResetBuilder : requestResetBuilder}
            type="button"
          >
            <span className="inline-flex items-center gap-1">
              {canUndoReset ? (
                <FaRotateLeft aria-hidden className="text-[9px]" />
              ) : (
                <FaXmark aria-hidden className="text-[9px]" />
              )}
              <span>{canUndoReset ? 'Undo Reset' : 'Reset Builder'}</span>
            </span>
          </Button>
        </PageToolkitBar>

        <div className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="min-w-0 space-y-3">
            <TabbedContainer
              activeTabId={effectiveActiveTeamId}
              bodyClassName="p-0"
              className="overflow-hidden"
              leftEarMaxWidth="100%"
              onTabChange={(teamId) => {
                if (suppressTeamEditRef.current) {
                  return
                }
                clearPendingDelete()
                clearTransfer()
                cancelTeamRename()
                setActiveTeamId(teamId)
                setActiveSelection(null)
              }}
              tone="amber"
              tabSizing="content"
              tabs={teams.map((team) => ({ id: team.id, label: team.name }))}
            >
              <BuilderActiveTeamPanel
                activeTeamId={effectiveActiveTeamId}
                activeTeamName={activeTeam?.name ?? 'Team'}
                isEditingTeamName={editingTeamId === effectiveActiveTeamId && editingTeamSurface === 'header'}
                editingTeamName={editingTeamName}
                activePosseAsset={activePosseAsset}
                activePosseName={activePosse?.name}
                isActivePosseOwned={activePosseId ? (ownedPosseLevelById.get(activePosseId) ?? null) !== null : true}
                activeDragKind={activeDrag?.kind ?? null}
                onBeginTeamRename={beginTeamRename}
                onCommitTeamRename={commitTeamRename}
                onCancelTeamRename={cancelTeamRename}
                onEditingTeamNameChange={setEditingTeamName}
                onOpenPossePicker={() => setPickerTab('posses')}
                onCardClick={handleCardClick}
                onRemoveActiveSelection={handleRemoveActiveSelection}
                onCovenantSlotClick={handleCovenantSlotClick}
                onWheelSlotClick={handleWheelSlotClick}
                awakenerLevelByName={awakenerLevelByName}
                ownedAwakenerLevelByName={ownedAwakenerLevelByName}
                ownedWheelLevelById={ownedWheelLevelById}
                predictedDropHover={predictedDropHover}
                resolvedActiveSelection={resolvedActiveSelection}
                teamFactions={teamFactionSet}
                teamSlots={teamSlots}
              />
            </TabbedContainer>

            <BuilderTeamsPanel
              activeTeamId={effectiveActiveTeamId}
              editingTeamId={editingTeamId}
              editingTeamName={editingTeamName}
              editingTeamSurface={editingTeamSurface}
              onAddTeam={() => {
                const result = addTeam(teams)
                setTeams(result.nextTeams)
              }}
              onApplyTeamTemplate={(templateId: TeamTemplateId) => {
                clearPendingDelete()
                clearPendingResetTeam()
                clearTransfer()
                cancelTeamRename()
                const result = applyTeamTemplate(teams, templateId)
                setTeams(result.nextTeams)
                const templateLabel = templateId === 'DTIDE_10' ? 'D-Tide (10)' : 'D-Tide (5)'
                if (result.createdCount === 0 && result.renamedCount === 0 && result.removedCount === 0) {
                  showToast(`${templateLabel} already matches current team layout.`)
                  return
                }
                showToast(
                  `Applied ${templateLabel}: renamed ${result.renamedCount}, created ${result.createdCount}, removed ${result.removedCount}.`,
                )
              }}
              onExportTeam={(teamId) => {
                openTeamExportDialog(teamId)
              }}
              onBeginTeamRename={(teamId, currentName, surface) => {
                clearPendingDelete()
                clearTransfer()
                beginTeamRename(teamId, currentName, surface)
              }}
              onCancelTeamRename={cancelTeamRename}
              onCommitTeamRename={commitTeamRename}
              onDeleteTeam={(teamId, teamName) => {
                clearTransfer()
                cancelTeamRename()
                requestDeleteTeam(teamId, teamName)
              }}
              onResetTeam={(teamId, teamName) => {
                clearTransfer()
                cancelTeamRename()
                requestResetTeam(teamId, teamName)
              }}
              onEditTeam={(teamId) => {
                if (suppressTeamEditRef.current) {
                  return
                }
                clearPendingDelete()
                clearPendingResetTeam()
                clearTransfer()
                cancelTeamRename()
                setActiveTeamId(teamId)
                setActiveSelection(null)
              }}
              onEditingTeamNameChange={setEditingTeamName}
              ownedAwakenerLevelByName={ownedAwakenerLevelByName}
              ownedPosseLevelById={ownedPosseLevelById}
              posses={pickerPosses}
              teams={teams}
            />
          </div>

          <BuilderSelectionPanel
            activePosseId={activePosseId}
            activeSearchQuery={activeSearchQuery}
            awakenerFilter={awakenerFilter}
            awakenerSortDirection={awakenerSortDirection}
            awakenerSortGroupByFaction={awakenerSortGroupByFaction}
            awakenerSortKey={awakenerSortKey}
            displayUnowned={displayUnowned}
            effectiveActiveTeamId={effectiveActiveTeamId}
            filteredAwakeners={filteredAwakeners}
            filteredPosses={filteredPosses}
            ownedAwakenerLevelByName={ownedAwakenerLevelByName}
            ownedPosseLevelById={ownedPosseLevelById}
            ownedWheelLevelById={ownedWheelLevelById}
            onDisplayUnownedChange={setDisplayUnowned}
            onAwakenerClick={(awakenerName) => {
              handlePickerAwakenerClick(awakenerName)
            }}
            onAwakenerFilterChange={setAwakenerFilter}
            onAwakenerSortDirectionToggle={toggleAwakenerSortDirection}
            onAwakenerSortGroupByFactionChange={setAwakenerSortGroupByFaction}
            onAwakenerSortKeyChange={setAwakenerSortKey}
            onPickerTabChange={setPickerTab}
            onPosseFilterChange={setPosseFilter}
            onWheelRarityFilterChange={setWheelRarityFilter}
            onWheelMainstatFilterChange={setWheelMainstatFilter}
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
            wheelMainstatFilter={wheelMainstatFilter}
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
          <TeamCardGhost
            removeIntent={isRemoveIntent}
            slot={activeDraggedSlot}
            awakenerOwnedLevel={activeDraggedAwakenerOwnedLevel}
            wheelOwnedLevels={activeDraggedWheelOwnedLevels}
          />
        ) : null}
        {activeDrag?.kind === 'team-wheel' ? (
          <TeamWheelGhost
            removeIntent={isRemoveIntent}
            wheelId={activeDrag.wheelId}
            ownedLevel={ownedWheelLevelById.get(activeDrag.wheelId) ?? null}
          />
        ) : null}
        {activeDrag?.kind === 'team-covenant' ? (
          <TeamWheelGhost removeIntent={isRemoveIntent} wheelId={activeDrag.covenantId} isCovenant />
        ) : null}
      </DragOverlay>

      <BuilderConfirmDialogs
        deleteDialog={pendingDeleteDialog}
        onCancelDelete={clearPendingDelete}
        onCancelReset={cancelResetBuilder}
        onCancelResetTeam={clearPendingResetTeam}
        onCancelTransfer={clearTransfer}
        resetDialog={
          pendingResetBuilder
            ? {
                title: 'Reset Builder',
                message: 'Reset all teams back to a fresh builder state?',
                onConfirm: confirmResetBuilder,
              }
            : null
        }
        resetTeamDialog={pendingResetTeamDialog}
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
