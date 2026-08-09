import {useCallback, useSyncExternalStore, type ReactNode} from 'react'

import './builder-v2.css'

import {DndContext} from '@dnd-kit/core'

import {ConfirmDialog} from '@/components/ui/ConfirmDialog'
import {Toast} from '@/components/ui/Toast'
import {useTimedToast} from '@/components/ui/useTimedToast'
import {DeferredDatabaseDetailOverlayOutlet} from '@/features/database/detail/DeferredDatabaseDetailOverlayOutlet'
import {useDatabaseDetailOverlay} from '@/features/database/detail/useDatabaseDetailOverlay'

import {BuilderImportExportDialogs} from '../builder/BuilderImportExportDialogs'
import {BuilderTransferConfirmDialog} from '../builder/BuilderTransferConfirmDialog'
import type {BuilderV2DropTargetDescriptor} from './builder-v2-dnd'
import {
  selectBuilderV2TeamPosseEditTarget,
  selectBuilderV2TeamSlotEditTarget,
  type BuilderV2TeamSlotEditTarget,
} from './builder-v2-editing-mode'
import {
  getBuilderV2ActiveWorkspaceClassName,
  getBuilderV2TeamRailDensity,
} from './builder-v2-team-rail-density'
import {BuilderV2ActiveFooter, BuilderV2ActiveHeader} from './BuilderV2ActiveTeamChrome'
import {BuilderV2AdaptiveLayout} from './BuilderV2AdaptiveLayout'
import {BuilderV2AwakenerPicker} from './BuilderV2AwakenerPicker'
import {BuilderV2DndEnabledContext, useBuilderV2DndEnabledForDevice} from './BuilderV2DndCapability'
import type {BuilderV2DndCommandPort} from './BuilderV2DndCommandPort'
import {BuilderV2DragOverlay} from './BuilderV2DragOverlay'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import {BuilderV2MobileLayout} from './BuilderV2MobileLayout'
import type {BuilderV2TeamSummary, BuilderV2TeamSummarySlot} from './BuilderV2ModelTypes'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
import {BuilderV2TeamRail} from './BuilderV2TeamRail'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'
import {useBuilderV2Dnd} from './useBuilderV2Dnd'
import {useBuilderV2Model} from './useBuilderV2Model'

const BUILDER_V2_MOBILE_BREAKPOINT_PX = 640
const BUILDER_V2_ADAPTIVE_BREAKPOINT_PX = 1056
type BuilderV2ViewportMode = 'mobile' | 'adaptive' | 'desktop'

export function BuilderV2Page() {
  const detailOverlay = useDatabaseDetailOverlay()
  const openDetail = detailOverlay.open
  const {toastEntries, showToast} = useTimedToast({defaultDurationMs: 3200})
  const model = useBuilderV2Model({showToast})
  const viewportMode = useBuilderV2ViewportMode()
  const isDndEnabledForDevice = useBuilderV2DndEnabledForDevice()
  const isDndEnabled = viewportMode !== 'mobile' && isDndEnabledForDevice
  const openAwakenerDetail = useCallback(
    (awakenerId: string) => {
      openDetail({kind: 'awakener', id: awakenerId})
    },
    [openDetail],
  )
  const openWheelDetail = useCallback(
    (wheelId: string) => {
      openDetail({kind: 'wheel', id: wheelId})
    },
    [openDetail],
  )
  const openCovenantDetail = useCallback(
    (covenantId: string) => {
      openDetail({kind: 'covenant', id: covenantId})
    },
    [openDetail],
  )
  const openPosseDetail = useCallback(
    (posseId: string) => {
      openDetail({kind: 'posse', id: posseId})
    },
    [openDetail],
  )
  const dndCommandPort: BuilderV2DndCommandPort = {
    slots: model.slots,
    teams: model.teams,
    teamPreviewMode: model.teamPreviewMode,
    moveTeamToIndex: model.moveTeamToIndex,
    swapTeamSlots: model.swapTeamSlots,
    assignAwakenerToTeamSlot: model.assignAwakenerToTeamSlot,
    assignWheelToTeamSlot: model.assignWheelToTeamSlot,
    assignCovenantToTeamSlot: model.assignCovenantToTeamSlot,
    clearTeamSlot: model.clearTeamSlot,
    clearTeamWheel: model.clearTeamWheel,
    moveTeamWheel: model.moveTeamWheel,
    moveTeamWheelToTeamSlot: model.moveTeamWheelToTeamSlot,
    clearTeamCovenant: model.clearTeamCovenant,
    moveTeamCovenant: model.moveTeamCovenant,
    assignAwakenerToSlot: model.assignAwakenerToSlot,
    assignWheelToSlot: model.assignWheelToSlot,
    assignCovenantToSlot: model.assignCovenantToSlot,
    assignPosse: model.assignPosse,
    removeAwakener: model.removeAwakener,
    moveAwakener: model.moveAwakener,
    clearWheel: model.clearWheel,
    moveWheel: model.moveWheel,
    moveWheelToSlot: model.moveWheelToSlot,
    clearCovenant: model.clearCovenant,
    moveCovenant: model.moveCovenant,
  }
  const dnd = useBuilderV2Dnd({model: dndCommandPort})
  const activeDropTarget = isDndEnabled ? dnd.activeDropTarget : null
  const isDragActive = isDndEnabled && dnd.isLoadoutDragging
  const {
    activeSelection,
    activeTeamId,
    activeTeamTarget,
    selectAwakenerSlot,
    selectCovenantSlot,
    selectPosse,
    selectWheelSlot,
    setActiveTeam,
  } = model
  const selectTeamListSlot = useCallback(
    (
      team: BuilderV2TeamSummary,
      slot: BuilderV2TeamSummarySlot,
      _restoreTarget: HTMLElement | null,
      target: BuilderV2TeamSlotEditTarget = {kind: 'awakener'},
    ) => {
      selectBuilderV2TeamSlotEditTarget({
        commands: {
          selectAwakenerSlot,
          selectCovenantSlot,
          selectWheelSlot,
          setActiveTeam,
        },
        slotId: slot.slotId,
        state: {activeSelection, activeTeamId},
        target,
        teamId: team.id,
      })
    },
    [
      activeSelection,
      activeTeamId,
      selectAwakenerSlot,
      selectCovenantSlot,
      selectWheelSlot,
      setActiveTeam,
    ],
  )
  const selectTeamListPosse = useCallback(
    (team: BuilderV2TeamSummary) => {
      selectBuilderV2TeamPosseEditTarget({
        commands: {selectPosse, setActiveTeam},
        state: {activeTeamId, activeTeamTarget},
        teamId: team.id,
      })
    },
    [activeTeamId, activeTeamTarget, selectPosse, setActiveTeam],
  )
  const activeWorkspaceClassName = getBuilderV2ActiveWorkspaceClassName(
    getBuilderV2TeamRailDensity({
      canAddTeam: model.canAddTeam,
      maxTeams: model.maxTeams,
      teamCount: model.teams.length,
    }),
  )

  let content

  if (viewportMode === 'mobile') {
    content = (
      <BuilderV2MobileLayout
        isDetailOverlayOpen={detailOverlay.isOpen}
        model={model}
        onOpenAwakenerDetail={openAwakenerDetail}
        onOpenCovenantDetail={openCovenantDetail}
        onOpenPosseDetail={openPosseDetail}
        onOpenWheelDetail={openWheelDetail}
      />
    )
  } else if (viewportMode === 'adaptive') {
    content = (
      <BuilderV2DndBoundary dnd={dnd} enabled={isDndEnabled}>
        <BuilderV2AdaptiveLayout
          activeDropTarget={activeDropTarget}
          isDragActive={isDragActive}
          model={model}
          onOpenAwakenerDetail={openAwakenerDetail}
          onOpenCovenantDetail={openCovenantDetail}
          onOpenPosseDetail={openPosseDetail}
          onOpenWheelDetail={openWheelDetail}
        />
      </BuilderV2DndBoundary>
    )
  } else {
    content = (
      <BuilderV2DndBoundary dnd={dnd} enabled={isDndEnabled}>
        <BuilderV2DesktopLayout
          activeDropTarget={activeDropTarget}
          activeWorkspaceClassName={activeWorkspaceClassName}
          isDragActive={isDragActive}
          model={model}
          onOpenAwakenerDetail={openAwakenerDetail}
          onOpenCovenantDetail={openCovenantDetail}
          onOpenPosseDetail={openPosseDetail}
          onOpenWheelDetail={openWheelDetail}
          onSelectTeamListPosse={selectTeamListPosse}
          onSelectTeamListSlot={selectTeamListSlot}
        />
      </BuilderV2DndBoundary>
    )
  }

  return (
    <BuilderV2DndEnabledContext.Provider value={isDndEnabled}>
      {content}
      <BuilderTransferConfirmDialog dialog={model.transferDialog} onCancel={model.cancelTransfer} />
      {model.teamActionDialog ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel={model.teamActionDialog.confirmLabel}
          confirmVariant={model.teamActionDialog.confirmVariant}
          message={model.teamActionDialog.message}
          onCancel={model.cancelTeamAction}
          onConfirm={model.teamActionDialog.onConfirm}
          title={model.teamActionDialog.title}
        />
      ) : null}
      <BuilderImportExportDialogs {...model.importExportDialogProps} />
      <DeferredDatabaseDetailOverlayOutlet session={detailOverlay.session} />
      <Toast entries={toastEntries} />
    </BuilderV2DndEnabledContext.Provider>
  )
}

type BuilderV2DndController = ReturnType<typeof useBuilderV2Dnd>

function BuilderV2DesktopLayout({
  activeDropTarget,
  activeWorkspaceClassName,
  isDragActive,
  model,
  onOpenAwakenerDetail,
  onOpenCovenantDetail,
  onOpenPosseDetail,
  onOpenWheelDetail,
  onSelectTeamListPosse,
  onSelectTeamListSlot,
}: {
  activeDropTarget: BuilderV2DropTargetDescriptor | null
  activeWorkspaceClassName: string
  isDragActive: boolean
  model: ReturnType<typeof useBuilderV2Model>
  onOpenAwakenerDetail: (awakenerId: string) => void
  onOpenCovenantDetail: (covenantId: string) => void
  onOpenPosseDetail: (posseId: string) => void
  onOpenWheelDetail: (wheelId: string) => void
  onSelectTeamListPosse: (team: BuilderV2TeamSummary) => void
  onSelectTeamListSlot: (
    team: BuilderV2TeamSummary,
    slot: BuilderV2TeamSummarySlot,
    restoreTarget: HTMLElement | null,
    target?: BuilderV2TeamSlotEditTarget,
  ) => void
}) {
  return (
    <section
      className='builder-v2-page builder-v2-page--desktop'
      aria-labelledby='builder-v2-title'
    >
      <header className='builder-v2-mast'>
        <div className='builder-v2-mast-identity'>
          <span aria-hidden className='builder-v2-mast-glyph' />
          <h1 className='builder-v2-mast-title' id='builder-v2-title'>
            Builder V2
          </h1>
        </div>
      </header>

      <div className='builder-v2-shell'>
        <main className='builder-v2-workbench' aria-label='Active builder workspace'>
          <div className={activeWorkspaceClassName}>
            <BuilderV2TeamRail
              canAddTeam={model.canAddTeam}
              maxTeams={model.maxTeams}
              onAddTeam={model.addTeam}
              onSetActiveTeam={model.setActiveTeam}
              teams={model.teams}
            />

            <section className='builder-v2-panel builder-v2-active-team'>
              <BuilderV2ActiveHeader
                activePosse={model.activePosse}
                activeTeamName={model.activeTeamName}
                activeTeamTarget={model.activeTeamTarget}
                isDragActive={isDragActive}
                onClearPosse={model.clearPosse}
                onSelectPosse={model.selectPosse}
                predictedDropTarget={activeDropTarget}
              />

              <BuilderV2TeamSlots
                isDragActive={isDragActive}
                onClearCovenant={model.clearCovenant}
                onClearWheel={model.clearWheel}
                onRemoveAwakener={model.removeAwakener}
                onSelectCovenantSlot={model.selectCovenantSlot}
                onSelectSlot={model.selectAwakenerSlot}
                onSelectWheelSlot={model.selectWheelSlot}
                predictedDropTarget={activeDropTarget}
                quickLineupActive={Boolean(model.quickLineupSession)}
                slots={model.slots}
              />

              <BuilderV2ActiveFooter
                editingLabel={model.editingLabel}
                onCancelQuickLineup={model.cancelQuickLineup}
                onFinishQuickLineup={model.finishQuickLineup}
                onGoBackQuickLineupStep={model.goBackQuickLineupStep}
                onSkipQuickLineupStep={model.skipQuickLineupStep}
                onStartQuickLineup={model.startQuickLineup}
                quickLineupSession={model.quickLineupSession}
                quickLineupStepLabel={model.quickLineupStepLabel}
                violationMessage={model.violationMessage}
              />
            </section>
          </div>

          <BuilderV2TeamManagement
            canAddTeam={model.canAddTeam}
            editingTeamId={model.editingTeamId}
            editingTeamName={model.editingTeamName}
            isDragActive={isDragActive}
            maxTeams={model.maxTeams}
            onAddTeam={model.addTeam}
            onBeginTeamRename={model.beginTeamRename}
            onCancelTeamRename={model.cancelTeamRename}
            onCommitTeamRename={model.commitTeamRename}
            onMoveTeamDown={model.moveTeamDown}
            onMoveTeamUp={model.moveTeamUp}
            onRequestExportTeam={model.openTeamExportDialog}
            onRequestApplyTeamTemplate={model.requestApplyTeamTemplate}
            onRequestDeleteTeam={model.requestDeleteTeam}
            onRequestEditTeamPosse={onSelectTeamListPosse}
            onRequestEditTeamSlot={onSelectTeamListSlot}
            onRequestResetTeam={model.requestResetTeam}
            onSetActiveTeam={model.setActiveTeam}
            onSetEditingTeamName={model.setEditingTeamName}
            onTeamPreviewModeChange={model.setTeamPreviewMode}
            teamPreviewMode={model.teamPreviewMode}
            teams={model.teams}
            predictedDropTarget={activeDropTarget}
            utilityActions={<BuilderV2ImportExportActions model={model} />}
            variant='desktop'
          />
        </main>

        <BuilderV2AwakenerPicker
          isDragActive={isDragActive}
          onAssignCovenant={model.assignCovenant}
          onAssignAwakener={model.assignAwakener}
          onAssignPosse={model.assignPosse}
          onAssignWheel={model.assignWheel}
          onClearPickerTarget={model.clearPickerTarget}
          onOpenAwakenerDetail={onOpenAwakenerDetail}
          onOpenCovenantDetail={onOpenCovenantDetail}
          onOpenPosseDetail={onOpenPosseDetail}
          onOpenWheelDetail={onOpenWheelDetail}
          picker={model.picker}
          pickerClearTarget={model.pickerClearTarget}
          predictedDropTarget={activeDropTarget}
        />
      </div>
    </section>
  )
}

function BuilderV2DndBoundary({
  children,
  dnd,
  enabled,
}: {
  children: ReactNode
  dnd: BuilderV2DndController
  enabled: boolean
}) {
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <DndContext
      collisionDetection={dnd.collisionDetection}
      sensors={dnd.sensors}
      onDragCancel={dnd.handleDragCancel}
      onDragEnd={dnd.handleDragEnd}
      onDragOver={dnd.handleDragOver}
      onDragStart={dnd.handleDragStart}
    >
      {children}
      <BuilderV2DragOverlay
        isRemoveIntent={dnd.activeDropTarget?.kind === 'picker'}
        preview={dnd.activePreview}
        teamPreview={dnd.activeTeamPreview}
      />
    </DndContext>
  )
}

function useBuilderV2ViewportMode() {
  return useSyncExternalStore(
    subscribeToBuilderV2ViewportMode,
    getBuilderV2ViewportMode,
    getBuilderV2ServerViewportMode,
  )
}

function subscribeToBuilderV2ViewportMode(onStoreChange: () => void): () => void {
  window.addEventListener('resize', onStoreChange)
  return () => {
    window.removeEventListener('resize', onStoreChange)
  }
}

function getBuilderV2ServerViewportMode(): BuilderV2ViewportMode {
  return 'desktop'
}

function getBuilderV2ViewportMode(): BuilderV2ViewportMode {
  if (window.innerWidth <= BUILDER_V2_MOBILE_BREAKPOINT_PX) {
    return 'mobile'
  }

  if (window.innerWidth <= BUILDER_V2_ADAPTIVE_BREAKPOINT_PX) {
    return 'adaptive'
  }

  return 'desktop'
}
