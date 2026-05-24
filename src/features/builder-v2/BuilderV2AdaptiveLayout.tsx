import {useEffect, useRef, useState} from 'react'

import {FaChevronDown, FaChevronUp} from 'react-icons/fa6'

import type {WheelSlotIndex} from '../builder/types'
import type {BuilderV2DropTargetDescriptor} from './builder-v2-dnd'
import {BuilderV2ActiveFooter, BuilderV2ActiveHeader} from './BuilderV2ActiveTeamChrome'
import {BuilderV2PickerContent} from './BuilderV2AwakenerPicker'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import type {BuilderV2Model} from './BuilderV2ModelTypes'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
import {BuilderV2TeamRail} from './BuilderV2TeamRail'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'
import {useStableEvent} from './useStableEvent'

interface BuilderV2AdaptiveLayoutProps {
  activeDropTarget: BuilderV2DropTargetDescriptor | null
  isDragActive: boolean
  model: BuilderV2Model
}

export function BuilderV2AdaptiveLayout({
  activeDropTarget,
  isDragActive,
  model,
}: BuilderV2AdaptiveLayoutProps) {
  const [isPickerExpanded, setIsPickerExpanded] = useState(false)
  const pickerTriggerRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isPickerExpanded) {
      return
    }

    searchInputRef.current?.focus()
  }, [isPickerExpanded, model.pickerTab])

  const closePicker = useStableEvent((restoreFocus = true) => {
    setIsPickerExpanded(false)
    if (restoreFocus) {
      pickerTriggerRef.current?.focus()
    }
  })

  useEffect(() => {
    if (!isPickerExpanded) {
      return
    }

    const handlePickerKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      closePicker()
    }

    document.addEventListener('keydown', handlePickerKeyDown)
    return () => {
      document.removeEventListener('keydown', handlePickerKeyDown)
    }
  }, [closePicker, isPickerExpanded])

  const openPicker = useStableEvent(
    (restoreTarget?: HTMLElement | null, options?: {ensureTarget?: boolean}) => {
      pickerTriggerRef.current = restoreTarget ?? getCurrentFocusRestoreTarget()

      if (options?.ensureTarget !== false && !model.activeSelection && !model.activeTeamTarget) {
        model.selectAwakenerSlot(model.selectedSlotId ?? 'slot-1')
      }
      setIsPickerExpanded(true)
    },
  )

  const selectAwakenerSlotAndOpenPicker = useStableEvent(
    (slotId: string, restoreTarget?: HTMLElement | null) => {
      const focusRestoreTarget = restoreTarget ?? getCurrentFocusRestoreTarget()
      model.selectAwakenerSlot(slotId)
      openPicker(focusRestoreTarget, {ensureTarget: false})
    },
  )

  const selectWheelSlotAndOpenPicker = useStableEvent(
    (slotId: string, wheelIndex: WheelSlotIndex, restoreTarget?: HTMLElement | null) => {
      const focusRestoreTarget = restoreTarget ?? getCurrentFocusRestoreTarget()
      model.selectWheelSlot(slotId, wheelIndex)
      openPicker(focusRestoreTarget, {ensureTarget: false})
    },
  )

  const selectCovenantSlotAndOpenPicker = useStableEvent(
    (slotId: string, restoreTarget?: HTMLElement | null) => {
      const focusRestoreTarget = restoreTarget ?? getCurrentFocusRestoreTarget()
      model.selectCovenantSlot(slotId)
      openPicker(focusRestoreTarget, {ensureTarget: false})
    },
  )

  const selectPosseAndOpenPicker = useStableEvent(() => {
    const restoreTarget = getCurrentFocusRestoreTarget()
    model.selectPosse()
    openPicker(restoreTarget, {ensureTarget: false})
  })

  const assignAwakener = useStableEvent((awakenerId: string) => {
    model.assignAwakener(awakenerId)
  })

  const assignWheel = useStableEvent((wheelId: string) => {
    model.assignWheel(wheelId)
  })

  const assignCovenant = useStableEvent((covenantId: string) => {
    model.assignCovenant(covenantId)
  })

  const assignPosse = useStableEvent((posseId: string) => {
    model.assignPosse(posseId)
  })

  return (
    <section
      className='builder-v2-page builder-v2-page--adaptive'
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
          <p className='builder-v2-mast-tagline'>Tablet workbench - picker dock mode.</p>
          <BuilderV2ImportExportActions model={model} />
        </div>
      </header>

      <section className='builder-v2-adaptive-workbench' aria-label='Adaptive workbench'>
        <main className='builder-v2-adaptive-main' aria-label='Adaptive active team'>
          <div className='builder-v2-active-workspace'>
            <BuilderV2TeamRail
              canAddTeam={model.canAddTeam}
              maxTeams={model.maxTeams}
              onAddTeam={model.addTeam}
              onSetActiveTeam={model.setActiveTeam}
              onTeamActivated={() => {
                model.selectAwakenerSlot('slot-1')
              }}
              teams={model.teams}
            />

            <section className='builder-v2-panel builder-v2-active-team'>
              <BuilderV2ActiveHeader
                activePosse={model.activePosse}
                activeTeamName={model.activeTeamName}
                activeTeamTarget={model.activeTeamTarget}
                isDragActive={isDragActive}
                onClearPosse={model.clearPosse}
                onSelectPosse={selectPosseAndOpenPicker}
                predictedDropTarget={activeDropTarget}
              />

              <BuilderV2TeamSlots
                isDragActive={isDragActive}
                onClearCovenant={model.clearCovenant}
                onClearWheel={model.clearWheel}
                onRemoveAwakener={model.removeAwakener}
                onSelectCovenantSlot={selectCovenantSlotAndOpenPicker}
                onSelectSlot={selectAwakenerSlotAndOpenPicker}
                onSelectWheelSlot={selectWheelSlotAndOpenPicker}
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

          <section
            aria-labelledby='builder-v2-adaptive-picker-title'
            className={`builder-v2-panel builder-v2-adaptive-picker ${
              isPickerExpanded ? 'builder-v2-adaptive-picker--expanded' : ''
            }`}
          >
            <h2 className='sr-only' id='builder-v2-adaptive-picker-title'>
              Adaptive Picker
            </h2>
            {model.violationMessage && isPickerExpanded ? (
              <p className='builder-v2-adaptive-picker-message' role='alert'>
                {model.violationMessage}
              </p>
            ) : null}
            <div className='builder-v2-adaptive-picker-body'>
              <BuilderV2PickerContent
                isCollapsed={!isPickerExpanded}
                isDragActive={isDragActive}
                onAssignAwakener={assignAwakener}
                onAssignCovenant={assignCovenant}
                onAssignPosse={assignPosse}
                onAssignWheel={assignWheel}
                onRequestExpand={() => {
                  setIsPickerExpanded(true)
                }}
                picker={model.picker}
                predictedDropTarget={activeDropTarget}
                searchInputRef={searchInputRef}
              />
              <button
                aria-expanded={isPickerExpanded}
                aria-label={
                  isPickerExpanded ? 'Collapse adaptive picker' : 'Expand adaptive picker'
                }
                className='builder-v2-adaptive-picker-close'
                onClick={() => {
                  if (isPickerExpanded) {
                    closePicker()
                    return
                  }
                  setIsPickerExpanded(true)
                }}
                type='button'
              >
                {isPickerExpanded ? (
                  <FaChevronDown aria-hidden className='builder-v2-adaptive-picker-close-icon' />
                ) : (
                  <FaChevronUp aria-hidden className='builder-v2-adaptive-picker-close-icon' />
                )}
              </button>
            </div>
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
            variant='adaptive'
          />
        </main>
      </section>
    </section>
  )
}

function getCurrentFocusRestoreTarget(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}
