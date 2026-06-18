import {DndContext} from '@dnd-kit/core'

import './builder-v2.css'

import {useEffect, useMemo, useState, useSyncExternalStore, type ReactNode} from 'react'

import {ConfirmDialog} from '@/components/ui/ConfirmDialog'
import {Toast} from '@/components/ui/Toast'
import {useTimedToast} from '@/components/ui/useTimedToast'
import {getWheels} from '@/domain/wheels'
import {DbDetailModalHost} from '@/features/database/detail/DbDetailModalHost'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {BuilderImportExportDialogs} from '../builder/BuilderImportExportDialogs'
import {BuilderTransferConfirmDialog} from '../builder/BuilderTransferConfirmDialog'
import {allAwakeners} from '../builder/constants'
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
import {BuilderV2TeamManagement, type BuilderV2TeamSlotEditTarget} from './BuilderV2TeamManagement'
import {BuilderV2TeamRail} from './BuilderV2TeamRail'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'
import {useBuilderV2Dnd} from './useBuilderV2Dnd'
import {useBuilderV2Model} from './useBuilderV2Model'
import {useStableEvent} from './useStableEvent'

const BUILDER_V2_MOBILE_BREAKPOINT_PX = 640
const BUILDER_V2_ADAPTIVE_BREAKPOINT_PX = 1056
type BuilderV2ViewportMode = 'mobile' | 'adaptive' | 'desktop'

export function BuilderV2Page() {
  const {toastEntries, showToast} = useTimedToast({defaultDurationMs: 3200})
  const model = useBuilderV2Model({showToast})
  const viewportMode = useBuilderV2ViewportMode()
  const isDndEnabledForDevice = useBuilderV2DndEnabledForDevice()
  const isDndEnabled = viewportMode !== 'mobile' && isDndEnabledForDevice
  const assignAwakener = useStableEvent(model.assignAwakener)
  const assignWheel = useStableEvent(model.assignWheel)
  const assignCovenant = useStableEvent(model.assignCovenant)
  const assignPosse = useStableEvent(model.assignPosse)
  const openAwakenerDetail = useStableEvent((awakenerId: string) => {
    dbDetailStore.getState().openDetail({kind: 'awakener', id: awakenerId}, 'builder-overlay')
  })
  const openWheelDetail = useStableEvent((wheelId: string) => {
    dbDetailStore.getState().openDetail({kind: 'wheel', id: wheelId}, 'builder-overlay')
  })
  const openCovenantDetail = useStableEvent((covenantId: string) => {
    dbDetailStore.getState().openDetail({kind: 'covenant', id: covenantId}, 'builder-overlay')
  })
  const openPosseDetail = useStableEvent((posseId: string) => {
    dbDetailStore.getState().openDetail({kind: 'posse', id: posseId}, 'builder-overlay')
  })
  const detailWheels = useMemo(() => getWheels(), [])
  const detailModalCallbacks = useMemo(
    () => ({
      onClose: () => {
        dbDetailStore.getState().popDetail()
      },
      onSelectAwakener: () => undefined,
      onSelectCovenant: () => undefined,
      onSelectPosse: (posse: {id: string}) => {
        dbDetailStore.getState().pushReferenceDetail({kind: 'posse', id: posse.id})
      },
      onSelectWheel: () => undefined,
      onTabChange: () => undefined,
    }),
    [],
  )
  const isBuilderDetailOverlayOpen = useSyncExternalStore(
    subscribeToDbDetailStore,
    hasBuilderDetailOverlayOpen,
    hasBuilderDetailOverlayOpen,
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
  const selectTeamListSlot = useStableEvent(
    (
      team: BuilderV2TeamSummary,
      slot: BuilderV2TeamSummarySlot,
      _restoreTarget: HTMLElement | null,
      target: BuilderV2TeamSlotEditTarget = {kind: 'awakener'},
    ) => {
      const isCurrentTarget = isTeamSlotEditTargetSelected({
        activeSelection: model.activeSelection,
        activeTeamId: model.activeTeamId,
        slotId: slot.slotId,
        target,
        teamId: team.id,
      })

      if (model.activeTeamId !== team.id) {
        model.setActiveTeam(team.id)
      }
      if (!isCurrentTarget) {
        selectBuilderV2TeamSlotTarget(model, slot.slotId, target)
      }
    },
  )
  const selectTeamListPosse = useStableEvent((team: BuilderV2TeamSummary) => {
    const isCurrentTarget =
      model.activeTeamId === team.id && model.activeTeamTarget?.kind === 'posse'

    if (model.activeTeamId !== team.id) {
      model.setActiveTeam(team.id)
    }
    if (!isCurrentTarget) {
      model.selectPosse()
    }
  })
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
        isDetailOverlayOpen={isBuilderDetailOverlayOpen}
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
                onRequestEditTeamPosse={selectTeamListPosse}
                onRequestEditTeamSlot={selectTeamListSlot}
                onRequestResetTeam={model.requestResetTeam}
                onSetActiveTeam={model.setActiveTeam}
                onSetEditingTeamName={model.setEditingTeamName}
                onTeamPreviewModeChange={model.setTeamPreviewMode}
                teamPreviewMode={model.teamPreviewMode}
                teams={model.teams}
                utilityActions={<BuilderV2ImportExportActions model={model} />}
                variant='desktop'
              />
            </main>

            <BuilderV2AwakenerPicker
              isDragActive={isDragActive}
              onAssignCovenant={assignCovenant}
              onAssignAwakener={assignAwakener}
              onAssignPosse={assignPosse}
              onAssignWheel={assignWheel}
              onClearPickerTarget={model.clearPickerTarget}
              onOpenAwakenerDetail={openAwakenerDetail}
              onOpenCovenantDetail={openCovenantDetail}
              onOpenPosseDetail={openPosseDetail}
              onOpenWheelDetail={openWheelDetail}
              picker={model.picker}
              pickerClearTarget={model.pickerClearTarget}
              predictedDropTarget={activeDropTarget}
            />
          </div>
        </section>
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
      <DbDetailModalHost
        awakeners={allAwakeners}
        callbacks={detailModalCallbacks}
        routeItem={null}
        wheels={detailWheels}
      />
      <Toast entries={toastEntries} />
    </BuilderV2DndEnabledContext.Provider>
  )
}

type BuilderV2DndController = ReturnType<typeof useBuilderV2Dnd>

function hasBuilderDetailOverlayOpen(): boolean {
  return dbDetailStore.getState().stack.some((entry) => entry.source === 'builder-overlay')
}

function subscribeToDbDetailStore(onStoreChange: () => void): () => void {
  return dbDetailStore.subscribe(onStoreChange)
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

function isTeamSlotEditTargetSelected({
  activeSelection,
  activeTeamId,
  slotId,
  target,
  teamId,
}: {
  activeSelection: ReturnType<typeof useBuilderV2Model>['activeSelection']
  activeTeamId: string
  slotId: string
  target: BuilderV2TeamSlotEditTarget
  teamId: string
}) {
  if (activeTeamId !== teamId || activeSelection?.slotId !== slotId) {
    return false
  }

  switch (target.kind) {
    case 'awakener':
      return activeSelection.kind === 'awakener'
    case 'covenant':
      return activeSelection.kind === 'covenant'
    case 'wheel':
      return activeSelection.kind === 'wheel' && activeSelection.wheelIndex === target.wheelIndex
  }
}

function selectBuilderV2TeamSlotTarget(
  model: ReturnType<typeof useBuilderV2Model>,
  slotId: string,
  target: BuilderV2TeamSlotEditTarget,
) {
  switch (target.kind) {
    case 'awakener':
      model.selectAwakenerSlot(slotId)
      return
    case 'covenant':
      model.selectCovenantSlot(slotId)
      return
    case 'wheel':
      model.selectWheelSlot(slotId, target.wheelIndex)
      return
  }
}

function useBuilderV2ViewportMode() {
  const [viewportMode, setViewportMode] = useState(() => getBuilderV2ViewportMode())

  useEffect(() => {
    const handleResize = () => {
      setViewportMode(getBuilderV2ViewportMode())
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return viewportMode
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
