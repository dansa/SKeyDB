import {DndContext} from '@dnd-kit/core'

import './builder-v2.css'

import {useEffect, useState} from 'react'

import {ConfirmDialog} from '@/components/ui/ConfirmDialog'
import {Toast} from '@/components/ui/Toast'
import {useTimedToast} from '@/components/ui/useTimedToast'

import {BuilderImportExportDialogs} from '../builder/BuilderImportExportDialogs'
import {BuilderTransferConfirmDialog} from '../builder/BuilderTransferConfirmDialog'
import {BuilderV2ActiveFooter, BuilderV2ActiveHeader} from './BuilderV2ActiveTeamChrome'
import {BuilderV2AdaptiveLayout} from './BuilderV2AdaptiveLayout'
import {BuilderV2AwakenerPicker} from './BuilderV2AwakenerPicker'
import {BuilderV2DragOverlay} from './BuilderV2DragOverlay'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import {BuilderV2MobileLayout} from './BuilderV2MobileLayout'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
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
  const assignAwakener = useStableEvent(model.assignAwakener)
  const assignWheel = useStableEvent(model.assignWheel)
  const assignCovenant = useStableEvent(model.assignCovenant)
  const assignPosse = useStableEvent(model.assignPosse)
  const dnd = useBuilderV2Dnd({model})

  let content

  if (viewportMode === 'mobile') {
    content = <BuilderV2MobileLayout model={model} />
  } else if (viewportMode === 'adaptive') {
    content = (
      <DndContext
        collisionDetection={dnd.collisionDetection}
        sensors={dnd.sensors}
        onDragCancel={dnd.handleDragCancel}
        onDragEnd={dnd.handleDragEnd}
        onDragOver={dnd.handleDragOver}
        onDragStart={dnd.handleDragStart}
      >
        <BuilderV2AdaptiveLayout
          activeDropTarget={dnd.activeDropTarget}
          isDragActive={dnd.isDragging}
          model={model}
        />
        <BuilderV2DragOverlay
          isRemoveIntent={dnd.activeDropTarget?.kind === 'picker'}
          preview={dnd.activePreview}
        />
      </DndContext>
    )
  } else {
    content = (
      <DndContext
        collisionDetection={dnd.collisionDetection}
        sensors={dnd.sensors}
        onDragCancel={dnd.handleDragCancel}
        onDragEnd={dnd.handleDragEnd}
        onDragOver={dnd.handleDragOver}
        onDragStart={dnd.handleDragStart}
      >
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
              <span className='builder-v2-status-pill'>Beta</span>
            </div>
            <div className='builder-v2-mast-end'>
              <p className='builder-v2-mast-tagline'>Local team builder - dark archive workflow.</p>
              <BuilderV2ImportExportActions model={model} />
            </div>
          </header>

          <div className='builder-v2-shell'>
            <main className='builder-v2-workbench' aria-label='Active builder workspace'>
              <div className='builder-v2-active-workspace'>
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
                    isDragActive={dnd.isDragging}
                    onClearPosse={model.clearPosse}
                    onSelectPosse={model.selectPosse}
                    predictedDropTarget={dnd.activeDropTarget}
                  />

                  <BuilderV2TeamSlots
                    isDragActive={dnd.isDragging}
                    onClearCovenant={model.clearCovenant}
                    onClearWheel={model.clearWheel}
                    onRemoveAwakener={model.removeAwakener}
                    onSelectCovenantSlot={model.selectCovenantSlot}
                    onSelectSlot={model.selectAwakenerSlot}
                    onSelectWheelSlot={model.selectWheelSlot}
                    predictedDropTarget={dnd.activeDropTarget}
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
                onRequestApplyTeamTemplate={model.requestApplyTeamTemplate}
                onRequestDeleteTeam={model.requestDeleteTeam}
                onRequestResetTeam={model.requestResetTeam}
                onSetActiveTeam={model.setActiveTeam}
                onSetEditingTeamName={model.setEditingTeamName}
                teams={model.teams}
                variant='desktop'
              />
            </main>

            <BuilderV2AwakenerPicker
              isDragActive={dnd.isDragging}
              onAssignCovenant={assignCovenant}
              onAssignAwakener={assignAwakener}
              onAssignPosse={assignPosse}
              onAssignWheel={assignWheel}
              picker={model.picker}
              predictedDropTarget={dnd.activeDropTarget}
            />
          </div>
        </section>
        <BuilderV2DragOverlay
          isRemoveIntent={dnd.activeDropTarget?.kind === 'picker'}
          preview={dnd.activePreview}
        />
      </DndContext>
    )
  }

  return (
    <>
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
      <Toast entries={toastEntries} />
    </>
  )
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
