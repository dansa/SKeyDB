import {DndContext} from '@dnd-kit/core'

import {TabbedContainer} from '@/components/ui/TabbedContainer'
import {Toast} from '@/components/ui/Toast'
import type {Awakener} from '@/domain/awakeners'
import type {Covenant} from '@/domain/covenants'
import type {Posse} from '@/domain/posses'
import {getWheels, type Wheel} from '@/domain/wheels'
import {DbDetailModalHost} from '@/features/database/detail/DbDetailModalHost'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {BuilderActiveTeamPanel} from './BuilderActiveTeamPanel'
import {BuilderConfirmDialogs} from './BuilderConfirmDialogs'
import {BuilderDragOverlay} from './BuilderDragOverlay'
import {BuilderImportExportDialogs} from './BuilderImportExportDialogs'
import {BuilderSelectionPanel} from './BuilderSelectionPanel'
import {BuilderTeamsPanel} from './BuilderTeamsPanel'
import {BuilderToolbar} from './BuilderToolbar'
import {allAwakeners} from './constants'
import {MAX_TEAMS} from './team-collection'
import {useBuilderPageState} from './useBuilderPageState'

function openAwakenerDetailOverlay(awakener: Awakener) {
  dbDetailStore.getState().openDetail({kind: 'awakener', id: awakener.id}, 'builder-overlay')
}

function openWheelDetailOverlay(wheelId: string) {
  dbDetailStore.getState().openDetail({kind: 'wheel', id: wheelId}, 'builder-overlay')
}

function openPickerWheelDetailOverlay(wheel: Wheel) {
  openWheelDetailOverlay(wheel.id)
}

function openCovenantDetailOverlay(covenant: Covenant) {
  dbDetailStore.getState().openDetail({kind: 'covenant', id: covenant.id}, 'builder-overlay')
}

function openPosseDetailOverlay(posse: Posse) {
  dbDetailStore.getState().openDetail({kind: 'posse', id: posse.id}, 'builder-overlay')
}

export function BuilderPage() {
  const {toast, layout, dnd, dialogs, viewModel} = useBuilderPageState()
  const {
    builderSectionRef,
    mainBuilderZoneRef,
    pickerZoneRef,
    mainBuilderZoneHeight,
    pickerShellHeight,
    searchInputRef,
  } = layout

  return (
    <DndContext
      onDragCancel={dnd.dndWrappers.handleDndDragCancel}
      onDragEnd={dnd.dndWrappers.handleDndDragEnd}
      onDragOver={dnd.dndWrappers.handleDndDragOver}
      onDragStart={dnd.dndWrappers.handleDndDragStart}
      sensors={dnd.sensors}
    >
      <section className='space-y-4' ref={builderSectionRef}>
        <BuilderToolbar
          hasTeams={viewModel.teams.length > 0}
          hasActiveTeam={Boolean(viewModel.activeTeam)}
          canUndoReset={dialogs.resetUndo.canUndoReset}
          onImport={viewModel.handleImportClick}
          onExportAll={viewModel.openExportAllDialog}
          onExportIngame={viewModel.handleExportIngameClick}
          onUndoReset={dialogs.resetUndo.undoReset}
          onRequestReset={() => {
            viewModel.clearAllTransientState()
            dialogs.resetUndo.requestReset()
          }}
        />

        <div className='grid items-start gap-4 lg:grid-cols-[2fr_1fr]'>
          <div className='min-w-0 space-y-3'>
            <div data-builder-main-zone='true' ref={mainBuilderZoneRef}>
              <TabbedContainer
                activeTabId={viewModel.effectiveActiveTeamId}
                bodyClassName='p-0'
                canCloseTab={() => viewModel.teams.length > 1}
                className='overflow-hidden'
                getTabCloseAriaLabel={(tab) => `Close ${tab.label}`}
                leftEarMaxWidth='100%'
                leftTrailingAction={
                  viewModel.teams.length < MAX_TEAMS ? (
                    <button
                      aria-label='Add team tab'
                      className='tabbed-container-tab tabbed-container-tab-inactive h-full px-3 text-[11px] tracking-wide text-slate-300 transition-colors'
                      onClick={viewModel.handleAddTeamTab}
                      type='button'
                    >
                      +
                    </button>
                  ) : null
                }
                onTabChange={viewModel.handleTabChange}
                onTabClose={viewModel.handleTabClose}
                tone='amber'
                tabSizing='content'
                tabs={viewModel.teams.map((team) => ({id: team.id, label: team.name}))}
              >
                <BuilderActiveTeamPanel
                  activeTeamId={viewModel.effectiveActiveTeamId}
                  activeTeamName={viewModel.activeTeam.name}
                  isEditingTeamName={
                    viewModel.editingTeamId === viewModel.effectiveActiveTeamId &&
                    viewModel.editingTeamSurface === 'header'
                  }
                  editingTeamName={viewModel.editingTeamName}
                  activePosseAsset={viewModel.activePosseAsset}
                  activePosseName={viewModel.activePosse?.name}
                  isActivePosseOwned={
                    viewModel.activePosseId
                      ? (viewModel.ownedPosseLevelById.get(viewModel.activePosseId) ?? null) !==
                        null
                      : true
                  }
                  quickLineupSession={viewModel.quickLineupSession}
                  activeDragKind={dnd.activeDrag?.kind ?? null}
                  onBackQuickLineupStep={viewModel.goBackQuickLineupStep}
                  onBeginTeamRename={viewModel.beginTeamRename}
                  onCancelQuickLineup={viewModel.cancelQuickLineup}
                  onCommitTeamRename={viewModel.commitTeamRename}
                  onCancelTeamRename={viewModel.cancelTeamRename}
                  onEditingTeamNameChange={viewModel.setEditingTeamName}
                  onFinishQuickLineup={viewModel.finishQuickLineup}
                  onOpenPossePicker={() => {
                    viewModel.setPickerTab('posses')
                  }}
                  onStartQuickLineup={viewModel.startQuickLineup}
                  onCardClick={viewModel.handleCardClick}
                  onRemoveActiveSelection={viewModel.handleRemoveActiveSelection}
                  onCovenantSlotClick={viewModel.handleCovenantSlotClick}
                  onSkipQuickLineupStep={viewModel.skipQuickLineupStep}
                  onWheelSlotClick={viewModel.handleWheelSlotClick}
                  awakenerLevelByName={viewModel.awakenerLevelByName}
                  ownedAwakenerLevelByName={viewModel.ownedAwakenerLevelByName}
                  ownedWheelLevelById={viewModel.ownedWheelLevelById}
                  predictedDropHover={dnd.dndWrappers.predictedDropHover}
                  resolvedActiveSelection={viewModel.resolvedActiveSelection}
                  teamRealms={viewModel.teamRealmSet}
                  teamSlots={viewModel.teamSlots}
                />
              </TabbedContainer>
            </div>

            <BuilderTeamsPanel
              activeTeamId={viewModel.effectiveActiveTeamId}
              editingTeamId={viewModel.editingTeamId}
              editingTeamName={viewModel.editingTeamName}
              editingTeamSurface={viewModel.editingTeamSurface}
              onAddTeam={viewModel.handleAddTeamTab}
              onApplyTeamTemplate={viewModel.handleApplyTeamTemplate}
              onExportTeam={viewModel.openTeamExportDialog}
              onBeginTeamRename={viewModel.handleBeginTeamRename}
              onCancelTeamRename={viewModel.cancelTeamRename}
              onCommitTeamRename={viewModel.commitTeamRename}
              onDeleteTeam={viewModel.handleDeleteTeam}
              onResetTeam={viewModel.handleResetTeam}
              onEditTeam={viewModel.handleEditTeam}
              onEditingTeamNameChange={viewModel.setEditingTeamName}
              onTeamPreviewModeChange={viewModel.setTeamPreviewMode}
              ownedAwakenerLevelByName={viewModel.ownedAwakenerLevelByName}
              ownedPosseLevelById={viewModel.ownedPosseLevelById}
              ownedWheelLevelById={viewModel.ownedWheelLevelById}
              posses={viewModel.pickerPosses}
              teamPreviewMode={viewModel.teamPreviewMode}
              teams={viewModel.teams}
            />
          </div>

          <BuilderSelectionPanel
            activePosseId={viewModel.activePosseId}
            activeSearchQuery={viewModel.activeSearchQuery}
            awakenerFilter={viewModel.awakenerFilter}
            awakenerSortDirection={viewModel.awakenerSortDirection}
            awakenerSortGroupByRealm={viewModel.awakenerSortGroupByRealm}
            awakenerSortKey={viewModel.awakenerSortKey}
            allowDupes={viewModel.allowDupes}
            activeBuild={viewModel.activeBuild}
            teamRecommendedPosseIds={viewModel.teamRecommendedPosseIds}
            displayUnowned={viewModel.displayUnowned}
            sinkUnownedToBottom={viewModel.sinkUnownedToBottom}
            effectiveActiveTeamId={viewModel.effectiveActiveTeamId}
            filteredAwakeners={viewModel.filteredAwakeners}
            filteredCovenants={viewModel.filteredCovenants}
            filteredPosses={viewModel.filteredPosses}
            filteredWheels={viewModel.filteredWheels}
            mainBuilderZoneHeight={mainBuilderZoneHeight}
            pickerShellHeight={pickerShellHeight}
            ownedAwakenerLevelByName={viewModel.ownedAwakenerLevelByName}
            ownedPosseLevelById={viewModel.ownedPosseLevelById}
            ownedWheelLevelById={viewModel.ownedWheelLevelById}
            onDisplayUnownedChange={viewModel.setDisplayUnowned}
            onSinkUnownedToBottomChange={viewModel.setSinkUnownedToBottom}
            onAwakenerClick={viewModel.handlePickerAwakenerClick}
            onOpenAwakenerDetail={openAwakenerDetailOverlay}
            onOpenWheelDetail={openPickerWheelDetailOverlay}
            onOpenCovenantDetail={openCovenantDetailOverlay}
            onOpenPosseDetail={openPosseDetailOverlay}
            onAwakenerFilterChange={viewModel.setAwakenerFilter}
            onAwakenerSortDirectionToggle={viewModel.toggleAwakenerSortDirection}
            onAwakenerSortGroupByRealmChange={viewModel.setAwakenerSortGroupByRealm}
            onAwakenerSortKeyChange={viewModel.setAwakenerSortKey}
            onAllowDupesChange={viewModel.setAllowDupes}
            onPickerTabChange={viewModel.setPickerTab}
            onPosseFilterChange={viewModel.setPosseFilter}
            onPromoteMatchingWheelMainstatsChange={viewModel.setPromoteMatchingWheelMainstats}
            onPromoteRecommendedGearChange={viewModel.setPromoteRecommendedGear}
            onWheelRarityFilterChange={viewModel.setWheelRarityFilter}
            onWheelMainstatFilterChange={viewModel.setWheelMainstatFilter}
            onSearchChange={(nextValue) => {
              viewModel.setPickerSearchByTab((prev) => ({
                ...prev,
                [viewModel.pickerTab]: nextValue,
              }))
            }}
            onSetActivePosse={viewModel.handleSetActivePosse}
            onSetActiveWheel={viewModel.handlePickerWheelClick}
            onSetActiveCovenant={viewModel.handlePickerCovenantClick}
            pickerTab={viewModel.pickerTab}
            posseFilter={viewModel.posseFilter}
            promoteMatchingWheelMainstats={viewModel.promoteMatchingWheelMainstats}
            promoteRecommendedGear={viewModel.promoteRecommendedGear}
            wheelRarityFilter={viewModel.wheelRarityFilter}
            wheelMainstatFilter={viewModel.wheelMainstatFilter}
            searchInputRef={searchInputRef}
            teamRealmSet={viewModel.teamRealmSet}
            teams={viewModel.teams}
            usedAwakenerIdentityKeys={viewModel.usedAwakenerIdentityKeys}
            usedPosseByTeamOrder={viewModel.usedPosseByTeamOrder}
            usedWheelByTeamOrder={viewModel.usedWheelByTeamOrder}
            pickerZoneRef={pickerZoneRef}
          />
        </div>
      </section>

      <BuilderDragOverlay
        activeDrag={dnd.activeDrag}
        isRemoveIntent={dnd.isRemoveIntent}
        teamPreviewMode={viewModel.teamPreviewMode}
        previewDraggedTeam={dnd.previewDrag.previewDraggedTeam}
        previewDraggedSlot={dnd.previewDrag.previewDraggedSlot}
        isPreviewRemoveIntent={dnd.previewDrag.isPreviewRemoveIntent}
        slotById={dnd.slotById}
        ownedAwakenerLevelByName={viewModel.ownedAwakenerLevelByName}
        ownedWheelLevelById={viewModel.ownedWheelLevelById}
      />

      <BuilderConfirmDialogs
        deleteDialog={dialogs.pendingDeleteDialog}
        onCancelDelete={dialogs.clearPendingDelete}
        onCancelReset={dialogs.resetUndo.cancelReset}
        onCancelResetTeam={dialogs.clearPendingResetTeam}
        onCancelTransfer={dialogs.clearTransfer}
        resetDialog={dialogs.resetUndo.resetDialog}
        resetTeamDialog={dialogs.pendingResetTeamDialog}
        transferDialog={dialogs.pendingTransferDialog}
      />

      <BuilderImportExportDialogs {...dialogs.importExportDialogProps} />

      <DbDetailModalHost
        awakeners={allAwakeners}
        callbacks={{
          onClose: () => {
            dbDetailStore.getState().popDetail()
          },
          onSelectAwakener: () => undefined,
          onSelectCovenant: () => undefined,
          onSelectPosse: (posse) => {
            dbDetailStore.getState().pushReferenceDetail({kind: 'posse', id: posse.id})
          },
          onSelectWheel: () => undefined,
          onTabChange: () => undefined,
        }}
        routeItem={null}
        wheels={getWheels()}
      />

      <Toast entries={toast.toastEntries} />
    </DndContext>
  )
}
