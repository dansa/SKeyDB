import {useRef} from 'react'

import {DndContext} from '@dnd-kit/core'

import {TabbedContainer} from '@/components/ui/TabbedContainer'
import {Toast} from '@/components/ui/Toast'
import {useTimedToast} from '@/components/ui/useTimedToast'

import {BuilderActiveTeamPanel} from './builder/BuilderActiveTeamPanel'
import {BuilderConfirmDialogs} from './builder/BuilderConfirmDialogs'
import {BuilderDragOverlay} from './builder/BuilderDragOverlay'
import {BuilderImportExportDialogs} from './builder/BuilderImportExportDialogs'
import {BuilderSelectionPanel} from './builder/BuilderSelectionPanel'
import {BuilderTeamsPanel} from './builder/BuilderTeamsPanel'
import {BuilderToolbar} from './builder/BuilderToolbar'
import {awakenerByName} from './builder/constants'
import {createBuilderAwakenerActions} from './builder/createBuilderAwakenerActions'
import {createBuilderCovenantActions} from './builder/createBuilderCovenantActions'
import {createBuilderDndCoordinator} from './builder/createBuilderDndCoordinator'
import {createBuilderPosseActions} from './builder/createBuilderPosseActions'
import {createBuilderWheelActions} from './builder/createBuilderWheelActions'
import {parseTeamPreviewSlotDropZoneId, PICKER_DROP_ZONE_ID} from './builder/dnd-ids'
import {
  addTeam,
  applyTeamTemplate,
  MAX_TEAMS,
  reorderTeams,
  type TeamTemplateId,
} from './builder/team-collection'
import {type TeamStateViolationCode} from './builder/team-state'
import {clearTeamSlotTransfer, swapTeamSlotTransfer} from './builder/transfer-resolution'
import type {TeamSlot} from './builder/types'
import {useBuilderDnd} from './builder/useBuilderDnd'
import {useBuilderDndWrappers} from './builder/useBuilderDndWrappers'
import {useBuilderImportExport} from './builder/useBuilderImportExport'
import {useBuilderResetUndo} from './builder/useBuilderResetUndo'
import {useBuilderViewModel} from './builder/useBuilderViewModel'
import {usePendingDeleteDialog} from './builder/usePendingDeleteDialog'
import {usePendingResetTeamDialog} from './builder/usePendingResetTeamDialog'
import {usePendingTransferDialog} from './builder/usePendingTransferDialog'
import {usePreviewSlotDrag} from './builder/usePreviewSlotDrag'
import {useSelectionDismiss} from './builder/useSelectionDismiss'
import {useTransferConfirm} from './builder/useTransferConfirm'

export function BuilderPage() {
  const {toastEntries, showToast} = useTimedToast({defaultDurationMs: 3200})
  const searchInputRef = useRef<HTMLInputElement | null>(null)
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
    allowDupes,
    setAllowDupes,
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
    if (dndWrappers.isTeamEditSuppressed.current) {
      return
    }
    clearAllTransientState()
    setActiveTeamId(teamId)
    setActiveSelection(null)
  }

  return (
    <DndContext
      onDragCancel={dndWrappers.handleDndDragCancel}
      onDragEnd={dndWrappers.handleDndDragEnd}
      onDragOver={dndWrappers.handleDndDragOver}
      onDragStart={dndWrappers.handleDndDragStart}
      sensors={sensors}
    >
      <section className='space-y-4'>
        <BuilderToolbar
          hasTeams={teams.length > 0}
          hasActiveTeam={Boolean(activeTeam)}
          canUndoReset={resetUndo.canUndoReset}
          onImport={handleImportClick}
          onExportAll={openExportAllDialog}
          onExportIngame={handleExportIngameClick}
          onUndoReset={resetUndo.undoReset}
          onRequestReset={() => {
            clearAllTransientState()
            resetUndo.requestReset()
          }}
        />

        <div className='grid items-start gap-4 lg:grid-cols-[2fr_1fr]'>
          <div className='min-w-0 space-y-3'>
            <TabbedContainer
              activeTabId={effectiveActiveTeamId}
              bodyClassName='p-0'
              canCloseTab={() => teams.length > 1}
              className='overflow-hidden'
              getTabCloseAriaLabel={(tab) => `Close ${tab.label}`}
              leftEarMaxWidth='100%'
              leftTrailingAction={
                teams.length < MAX_TEAMS ? (
                  <button
                    aria-label='Add team tab'
                    className='tabbed-container-tab tabbed-container-tab-inactive h-full px-3 text-[11px] tracking-wide text-slate-300 transition-colors'
                    onClick={handleAddTeamTab}
                    type='button'
                  >
                    +
                  </button>
                ) : null
              }
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              tone='amber'
              tabSizing='content'
              tabs={teams.map((team) => ({id: team.id, label: team.name}))}
            >
              <BuilderActiveTeamPanel
                activeTeamId={effectiveActiveTeamId}
                activeTeamName={activeTeam.name}
                isEditingTeamName={
                  editingTeamId === effectiveActiveTeamId && editingTeamSurface === 'header'
                }
                editingTeamName={editingTeamName}
                activePosseAsset={activePosseAsset}
                activePosseName={activePosse?.name}
                isActivePosseOwned={
                  activePosseId ? (ownedPosseLevelById.get(activePosseId) ?? null) !== null : true
                }
                quickLineupSession={quickLineupSession}
                activeDragKind={activeDrag?.kind ?? null}
                onBackQuickLineupStep={goBackQuickLineupStep}
                onBeginTeamRename={beginTeamRename}
                onCancelQuickLineup={cancelQuickLineup}
                onCommitTeamRename={commitTeamRename}
                onCancelTeamRename={cancelTeamRename}
                onEditingTeamNameChange={setEditingTeamName}
                onFinishQuickLineup={finishQuickLineup}
                onOpenPossePicker={() => {
                  setPickerTab('posses')
                }}
                onStartQuickLineup={startQuickLineup}
                onCardClick={handleCardClick}
                onRemoveActiveSelection={handleRemoveActiveSelection}
                onCovenantSlotClick={handleCovenantSlotClick}
                onSkipQuickLineupStep={skipQuickLineupStep}
                onWheelSlotClick={handleWheelSlotClick}
                awakenerLevelByName={awakenerLevelByName}
                ownedAwakenerLevelByName={ownedAwakenerLevelByName}
                ownedWheelLevelById={ownedWheelLevelById}
                predictedDropHover={dndWrappers.predictedDropHover}
                resolvedActiveSelection={resolvedActiveSelection}
                teamRealms={teamRealmSet}
                teamSlots={teamSlots}
              />
            </TabbedContainer>

            <BuilderTeamsPanel
              activeTeamId={effectiveActiveTeamId}
              editingTeamId={editingTeamId}
              editingTeamName={editingTeamName}
              editingTeamSurface={editingTeamSurface}
              onAddTeam={handleAddTeamTab}
              onApplyTeamTemplate={handleApplyTeamTemplate}
              onExportTeam={openTeamExportDialog}
              onBeginTeamRename={handleBeginTeamRename}
              onCancelTeamRename={cancelTeamRename}
              onCommitTeamRename={commitTeamRename}
              onDeleteTeam={handleDeleteTeam}
              onResetTeam={handleResetTeam}
              onEditTeam={handleEditTeam}
              onEditingTeamNameChange={setEditingTeamName}
              onTeamPreviewModeChange={setTeamPreviewMode}
              ownedAwakenerLevelByName={ownedAwakenerLevelByName}
              ownedPosseLevelById={ownedPosseLevelById}
              ownedWheelLevelById={ownedWheelLevelById}
              posses={pickerPosses}
              teamPreviewMode={teamPreviewMode}
              teams={teams}
            />
          </div>

          <BuilderSelectionPanel
            activePosseId={activePosseId}
            activeSearchQuery={activeSearchQuery}
            awakenerFilter={awakenerFilter}
            awakenerSortDirection={awakenerSortDirection}
            awakenerSortGroupByRealm={awakenerSortGroupByRealm}
            awakenerSortKey={awakenerSortKey}
            allowDupes={allowDupes}
            displayUnowned={displayUnowned}
            effectiveActiveTeamId={effectiveActiveTeamId}
            filteredAwakeners={filteredAwakeners}
            filteredPosses={filteredPosses}
            ownedAwakenerLevelByName={ownedAwakenerLevelByName}
            ownedPosseLevelById={ownedPosseLevelById}
            ownedWheelLevelById={ownedWheelLevelById}
            onDisplayUnownedChange={setDisplayUnowned}
            onAwakenerClick={handlePickerAwakenerClick}
            onAwakenerFilterChange={setAwakenerFilter}
            onAwakenerSortDirectionToggle={toggleAwakenerSortDirection}
            onAwakenerSortGroupByRealmChange={setAwakenerSortGroupByRealm}
            onAwakenerSortKeyChange={setAwakenerSortKey}
            onAllowDupesChange={setAllowDupes}
            onPickerTabChange={setPickerTab}
            onPosseFilterChange={setPosseFilter}
            onWheelRarityFilterChange={setWheelRarityFilter}
            onWheelMainstatFilterChange={setWheelMainstatFilter}
            onSearchChange={(nextValue) => {
              setPickerSearchByTab((prev) => ({
                ...prev,
                [pickerTab]: nextValue,
              }))
            }}
            onSetActivePosse={handleSetActivePosse}
            onSetActiveWheel={handlePickerWheelClick}
            onSetActiveCovenant={handlePickerCovenantClick}
            pickerTab={pickerTab}
            posseFilter={posseFilter}
            wheelRarityFilter={wheelRarityFilter}
            wheelMainstatFilter={wheelMainstatFilter}
            searchInputRef={searchInputRef}
            teamRealmSet={teamRealmSet}
            teams={teams}
            usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
            usedPosseByTeamOrder={usedPosseByTeamOrder}
            usedWheelByTeamOrder={usedWheelByTeamOrder}
            filteredWheels={filteredWheels}
            filteredCovenants={filteredCovenants}
          />
        </div>
      </section>

      <BuilderDragOverlay
        activeDrag={activeDrag}
        isRemoveIntent={isRemoveIntent}
        teamPreviewMode={teamPreviewMode}
        previewDraggedTeam={previewDrag.previewDraggedTeam}
        previewDraggedSlot={previewDrag.previewDraggedSlot}
        isPreviewRemoveIntent={previewDrag.isPreviewRemoveIntent}
        slotById={slotById}
        ownedAwakenerLevelByName={ownedAwakenerLevelByName}
        ownedWheelLevelById={ownedWheelLevelById}
      />

      <BuilderConfirmDialogs
        deleteDialog={pendingDeleteDialog}
        onCancelDelete={clearPendingDelete}
        onCancelReset={resetUndo.cancelReset}
        onCancelResetTeam={clearPendingResetTeam}
        onCancelTransfer={clearTransfer}
        resetDialog={resetUndo.resetDialog}
        resetTeamDialog={pendingResetTeamDialog}
        transferDialog={pendingTransferDialog}
      />

      <BuilderImportExportDialogs {...importExportDialogProps} />

      <Toast entries={toastEntries} />
    </DndContext>
  )
}
