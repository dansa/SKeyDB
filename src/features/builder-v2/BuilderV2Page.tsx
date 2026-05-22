import './builder-v2.css'

import {useCallback, useEffect, useRef, useState} from 'react'

import {ConfirmDialog} from '@/components/ui/ConfirmDialog'
import {Toast} from '@/components/ui/Toast'
import {useTimedToast} from '@/components/ui/useTimedToast'

import {BuilderImportExportDialogs} from '../builder/BuilderImportExportDialogs'
import {BuilderTransferConfirmDialog} from '../builder/BuilderTransferConfirmDialog'
import {BuilderV2ActiveFooter, BuilderV2ActiveHeader} from './BuilderV2ActiveTeamChrome'
import {BuilderV2AdaptiveLayout} from './BuilderV2AdaptiveLayout'
import {BuilderV2AwakenerPicker} from './BuilderV2AwakenerPicker'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import {BuilderV2MobileLayout} from './BuilderV2MobileLayout'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'
import {useBuilderV2Model} from './useBuilderV2Model'

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

  let content

  if (viewportMode === 'mobile') {
    content = <BuilderV2MobileLayout model={model} />
  } else if (viewportMode === 'adaptive') {
    content = <BuilderV2AdaptiveLayout model={model} />
  } else {
    content = (
      <section className='builder-v2-page builder-v2-page--desktop' aria-labelledby='builder-v2-title'>
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
          <aside className='builder-v2-panel builder-v2-rail' aria-label='My teams'>
            <div className='builder-v2-team-list'>
              {model.teams.map((team, index) => {
                const teamIndex = String(index + 1).padStart(2, '0')
                const teamMeta = `${String(team.deployedCount)} / 4 deployed`

                return (
                  <button
                    aria-label={`${teamIndex} ${team.name} ${teamMeta}`}
                    aria-pressed={team.isActive}
                    className={`builder-v2-team-row ${
                      team.isActive ? 'builder-v2-team-row--active' : ''
                    }`}
                    key={team.id}
                    onClick={() => {
                      model.setActiveTeam(team.id)
                    }}
                    type='button'
                  >
                    <span className='builder-v2-team-index'>{teamIndex}</span>
                  </button>
                )
              })}
              {model.canAddTeam ? (
                <button
                  aria-label='Create team'
                  className='builder-v2-team-row builder-v2-team-row--add'
                  onClick={model.addTeam}
                  type='button'
                >
                  <span className='builder-v2-team-index'>+</span>
                </button>
              ) : null}
            </div>
          </aside>

          <main className='builder-v2-workbench' aria-label='Active builder workspace'>
            <section className='builder-v2-panel builder-v2-active-team'>
              <BuilderV2ActiveHeader
                activePosse={model.activePosse}
                activeTeamName={model.activeTeamName}
                activeTeamTarget={model.activeTeamTarget}
                onClearPosse={model.clearPosse}
                onSelectPosse={model.selectPosse}
              />

              <BuilderV2TeamSlots
                onClearCovenant={model.clearCovenant}
                onClearWheel={model.clearWheel}
                onRemoveAwakener={model.removeAwakener}
                onSelectCovenantSlot={model.selectCovenantSlot}
                onSelectSlot={model.selectAwakenerSlot}
                onSelectWheelSlot={model.selectWheelSlot}
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
            onAssignCovenant={assignCovenant}
            onAssignAwakener={assignAwakener}
            onAssignPosse={assignPosse}
            onAssignWheel={assignWheel}
            picker={model.picker}
          />
        </div>
      </section>
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

function useStableEvent<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  return useCallback((...args: TArgs) => handlerRef.current(...args), [])
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
