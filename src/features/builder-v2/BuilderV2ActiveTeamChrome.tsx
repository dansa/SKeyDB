import {memo, type ReactNode} from 'react'

import {useDroppable} from '@dnd-kit/core'

import {makeBuilderV2PosseDndId, type BuilderV2DropTargetDescriptor} from './builder-v2-dnd'
import {useBuilderV2DndEnabled} from './BuilderV2DndCapability'
import type {
  BuilderV2ActivePosseView,
  BuilderV2Model,
  BuilderV2TeamTarget,
} from './BuilderV2ModelTypes'

interface BuilderV2ActiveHeaderProps {
  activePosse: BuilderV2ActivePosseView | null
  activeTeamName: string
  activeTeamTarget: BuilderV2TeamTarget
  isDragActive?: boolean
  onClearPosse: () => void
  onSelectPosse: () => void
  predictedDropTarget?: BuilderV2DropTargetDescriptor | null
}

interface BuilderV2ActiveFooterProps {
  leadingAction?: ReactNode
  editingLabel: string
  editingMessageId?: string
  onCancelQuickLineup: () => void
  onFinishQuickLineup: () => void
  onGoBackQuickLineupStep: () => void
  onSkipQuickLineupStep: () => void
  onStartQuickLineup: () => void
  quickLineupSession: BuilderV2Model['quickLineupSession']
  quickLineupStepLabel: string | null
  violationMessage: string | null
}

export const BuilderV2ActiveHeader = memo(function BuilderV2ActiveHeader({
  activePosse,
  activeTeamName,
  activeTeamTarget,
  isDragActive = false,
  onClearPosse,
  onSelectPosse,
  predictedDropTarget = null,
}: BuilderV2ActiveHeaderProps) {
  const isDndEnabled = useBuilderV2DndEnabled()
  const {isOver: isPosseOver, setNodeRef: setPosseDropRef} = useDroppable({
    id: makeBuilderV2PosseDndId(),
    disabled: !isDndEnabled,
  })
  const isPosseDropTarget =
    isDndEnabled && (isDragActive ? predictedDropTarget?.kind === 'posse' : isPosseOver)

  return (
    <div className='builder-v2-active-header'>
      <div className='builder-v2-active-identity'>
        <h2 className='ui-title'>{activeTeamName}</h2>
      </div>

      <div className='builder-v2-posse-summary' ref={isDndEnabled ? setPosseDropRef : undefined}>
        <button
          aria-label='Select team posse'
          aria-pressed={activeTeamTarget?.kind === 'posse'}
          className={`builder-v2-posse-target ${
            activeTeamTarget?.kind === 'posse' ? 'builder-v2-posse-target--active' : ''
          } ${isPosseDropTarget ? 'builder-v2-posse-target--drop-target' : ''}`}
          onClick={onSelectPosse}
          type='button'
        >
          <span className='builder-v2-posse-copy'>
            <span className='builder-v2-label'>Posse</span>
            <span className='builder-v2-posse-name'>{activePosse?.name ?? 'Not selected'}</span>
          </span>
          <span aria-hidden className='builder-v2-posse-icon'>
            {activePosse?.assetSrc ? (
              <img alt='' draggable={false} src={activePosse.assetSrc} />
            ) : (
              <span className='builder-v2-empty-mark'>+</span>
            )}
          </span>
        </button>
        {activePosse ? (
          <button
            aria-label='Clear posse'
            className='builder-v2-posse-clear'
            onClick={onClearPosse}
            type='button'
          >
            x
          </button>
        ) : null}
      </div>
    </div>
  )
})

export const BuilderV2ActiveFooter = memo(function BuilderV2ActiveFooter({
  editingLabel,
  editingMessageId,
  leadingAction,
  onCancelQuickLineup,
  onFinishQuickLineup,
  onGoBackQuickLineupStep,
  onSkipQuickLineupStep,
  onStartQuickLineup,
  quickLineupSession,
  quickLineupStepLabel,
  violationMessage,
}: BuilderV2ActiveFooterProps) {
  const session = quickLineupSession

  if (!session) {
    return (
      <footer className='builder-v2-active-footer builder-v2-active-footer--default'>
        <div className='builder-v2-footer-cell builder-v2-footer-cell--start'>{leadingAction}</div>
        <p
          className='builder-v2-editing-line'
          id={editingMessageId}
          role={violationMessage ? 'alert' : undefined}
        >
          {violationMessage ?? editingLabel}
        </p>
        <div className='builder-v2-footer-cell builder-v2-footer-cell--end'>
          <button className='builder-v2-lineup-button' onClick={onStartQuickLineup} type='button'>
            Quick Team Lineup
          </button>
        </div>
      </footer>
    )
  }

  return (
    <footer className='builder-v2-active-footer builder-v2-active-footer--lineup'>
      <div
        className='builder-v2-lineup-actions builder-v2-lineup-actions--nav'
        aria-label='Quick lineup navigation'
      >
        <button
          className='builder-v2-lineup-action'
          disabled={!session.canGoBack}
          onClick={onGoBackQuickLineupStep}
          type='button'
        >
          Back
        </button>
        <button className='builder-v2-lineup-action' onClick={onSkipQuickLineupStep} type='button'>
          Next
        </button>
      </div>

      <p className='builder-v2-lineup-step'>
        Step {String(session.currentStepIndex + 1)} / {String(session.totalSteps)}:{' '}
        {quickLineupStepLabel ?? 'Current step'}
      </p>

      <div
        className='builder-v2-lineup-actions builder-v2-lineup-actions--finish'
        aria-label='Quick lineup session actions'
      >
        <button
          aria-label='Cancel quick team lineup'
          className='builder-v2-lineup-action builder-v2-lineup-action--danger'
          onClick={onCancelQuickLineup}
          type='button'
        >
          Cancel
        </button>
        <button
          aria-label='Finish quick team lineup'
          className='builder-v2-lineup-action builder-v2-lineup-action--success'
          onClick={onFinishQuickLineup}
          type='button'
        >
          Finish
        </button>
      </div>
    </footer>
  )
})
