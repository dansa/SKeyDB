import {useCallback, useEffect, useRef, useState} from 'react'

import {BuilderV2ActiveFooter, BuilderV2ActiveHeader} from './BuilderV2ActiveTeamChrome'
import {BuilderV2PickerContent} from './BuilderV2AwakenerPicker'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import type {BuilderV2Model} from './BuilderV2ModelTypes'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'

interface BuilderV2AdaptiveLayoutProps {
  model: BuilderV2Model
}

export function BuilderV2AdaptiveLayout({model}: BuilderV2AdaptiveLayoutProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const pickerTriggerRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isPickerOpen) {
      return
    }

    searchInputRef.current?.focus()
  }, [isPickerOpen, model.pickerTab])

  const closePicker = useCallback((restoreFocus = true) => {
    setIsPickerOpen(false)
    if (restoreFocus) {
      pickerTriggerRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    if (!isPickerOpen) {
      return
    }

    const handlePickerKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        trapDialogFocus(event, dialogRef.current)
        return
      }

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
  }, [closePicker, isPickerOpen])

  useEffect(() => {
    if (!isPickerOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isPickerOpen])

  const openPicker = useCallback(
    (restoreTarget?: HTMLElement | null, options: {ensureTarget?: boolean} = {}) => {
      pickerTriggerRef.current = restoreTarget ?? getCurrentFocusRestoreTarget()

      if (options.ensureTarget !== false && !model.activeSelection && !model.activeTeamTarget) {
        model.selectAwakenerSlot(model.selectedSlotId ?? 'slot-1')
      }
      setIsPickerOpen(true)
    },
    [model],
  )

  const selectAwakenerSlotAndOpenPicker = useCallback(
    (slotId: string) => {
      const restoreTarget = getCurrentFocusRestoreTarget()
      model.selectAwakenerSlot(slotId)
      openPicker(restoreTarget, {ensureTarget: false})
    },
    [model, openPicker],
  )

  const selectWheelSlotAndOpenPicker = useCallback(
    (slotId: string, wheelIndex: 0 | 1) => {
      const restoreTarget = getCurrentFocusRestoreTarget()
      model.selectWheelSlot(slotId, wheelIndex)
      openPicker(restoreTarget, {ensureTarget: false})
    },
    [model, openPicker],
  )

  const selectCovenantSlotAndOpenPicker = useCallback(
    (slotId: string) => {
      const restoreTarget = getCurrentFocusRestoreTarget()
      model.selectCovenantSlot(slotId)
      openPicker(restoreTarget, {ensureTarget: false})
    },
    [model, openPicker],
  )

  const selectPosseAndOpenPicker = useCallback(() => {
    const restoreTarget = getCurrentFocusRestoreTarget()
    model.selectPosse()
    openPicker(restoreTarget, {ensureTarget: false})
  }, [model, openPicker])

  const assignAwakener = useCallback(
    (awakenerId: string) => {
      const shouldClosePicker = canCloseAfterAwakenerAssignment(model, awakenerId)
      model.assignAwakener(awakenerId)
      if (shouldClosePicker) {
        closePicker(false)
      }
    },
    [closePicker, model],
  )

  const assignWheel = useCallback(
    (wheelId: string) => {
      const shouldClosePicker = canCloseAfterWheelAssignment(model, wheelId)
      model.assignWheel(wheelId)
      if (shouldClosePicker) {
        closePicker(false)
      }
    },
    [closePicker, model],
  )

  const assignCovenant = useCallback(
    (covenantId: string) => {
      const shouldClosePicker = canCloseAfterCovenantAssignment(model, covenantId)
      model.assignCovenant(covenantId)
      if (shouldClosePicker) {
        closePicker(false)
      }
    },
    [closePicker, model],
  )

  const assignPosse = useCallback(
    (posseId: string) => {
      const shouldClosePicker = canCloseAfterPosseAssignment(model, posseId)
      model.assignPosse(posseId)
      if (shouldClosePicker) {
        closePicker(false)
      }
    },
    [closePicker, model],
  )

  return (
    <section
      className='builder-v2-page builder-v2-page--adaptive'
      aria-labelledby='builder-v2-title'
    >
      <header className='builder-v2-mast' aria-hidden={isPickerOpen ? true : undefined}>
        <div className='builder-v2-mast-identity'>
          <span aria-hidden className='builder-v2-mast-glyph' />
          <h1 className='builder-v2-mast-title' id='builder-v2-title'>
            Builder V2
          </h1>
          <span className='builder-v2-status-pill'>Beta</span>
        </div>
        <div className='builder-v2-mast-end'>
          <p className='builder-v2-mast-tagline'>Tablet workbench - picker drawer mode.</p>
          <BuilderV2ImportExportActions model={model} />
        </div>
      </header>

      <section
        aria-hidden={isPickerOpen ? true : undefined}
        className='builder-v2-adaptive-workbench'
        aria-label='Adaptive workbench'
      >
        <aside className='builder-v2-panel builder-v2-adaptive-rail' aria-label='Compact teams'>
          <div className='builder-v2-adaptive-teams' role='group' aria-label='Adaptive teams'>
            {model.teams.map((team, index) => {
              const teamIndex = String(index + 1).padStart(2, '0')
              const teamMeta = `${String(team.deployedCount)} / 4 deployed`
              return (
                <button
                  aria-label={`${teamIndex} ${team.name} ${teamMeta}`}
                  aria-pressed={team.isActive}
                  className={`builder-v2-adaptive-team-button ${
                    team.isActive ? 'builder-v2-adaptive-team-button--active' : ''
                  }`}
                  key={team.id}
                  onClick={() => {
                    model.setActiveTeam(team.id)
                    model.selectAwakenerSlot('slot-1')
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
                className='builder-v2-adaptive-team-button builder-v2-adaptive-team-button--add'
                onClick={model.addTeam}
                type='button'
              >
                <span className='builder-v2-team-index'>+</span>
              </button>
            ) : null}
          </div>
        </aside>

        <main className='builder-v2-adaptive-main' aria-label='Adaptive active team'>
          <section className='builder-v2-panel builder-v2-active-team'>
            <BuilderV2ActiveHeader
              activePosse={model.activePosse}
              activeTeamName={model.activeTeamName}
              activeTeamTarget={model.activeTeamTarget}
              onClearPosse={model.clearPosse}
              onSelectPosse={selectPosseAndOpenPicker}
            />

            <BuilderV2TeamSlots
              onClearCovenant={model.clearCovenant}
              onClearWheel={model.clearWheel}
              onRemoveAwakener={model.removeAwakener}
              onSelectCovenantSlot={selectCovenantSlotAndOpenPicker}
              onSelectSlot={selectAwakenerSlotAndOpenPicker}
              onSelectWheelSlot={selectWheelSlotAndOpenPicker}
              quickLineupActive={Boolean(model.quickLineupSession)}
              slots={model.slots}
            />

            <BuilderV2ActiveFooter
              editingLabel={model.editingLabel}
              leadingAction={
                <button
                  aria-label='Open adaptive picker'
                  className='builder-v2-adaptive-picker-trigger'
                  onClick={(event) => {
                    openPicker(event.currentTarget)
                  }}
                  type='button'
                >
                  Open Picker
                </button>
              }
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
            variant='adaptive'
          />
        </main>
      </section>

      {isPickerOpen ? (
        <div
          className='builder-v2-adaptive-picker-backdrop'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePicker()
            }
          }}
        >
          <div
            aria-labelledby='builder-v2-adaptive-picker-title'
            aria-modal='true'
            className='builder-v2-adaptive-picker'
            ref={dialogRef}
            role='dialog'
          >
            <header className='builder-v2-mobile-picker-header'>
              <div>
                <p className='builder-v2-label'>Pick</p>
                <h2 className='ui-title' id='builder-v2-adaptive-picker-title'>
                  Adaptive Picker
                </h2>
              </div>
              <button
                aria-label='Close adaptive picker'
                className='builder-v2-mobile-icon-button'
                onClick={() => {
                  closePicker()
                }}
                type='button'
              >
                x
              </button>
            </header>
            {model.violationMessage ? (
              <p className='builder-v2-adaptive-picker-message' role='alert'>
                {model.violationMessage}
              </p>
            ) : null}
            <BuilderV2PickerContent
              onAssignAwakener={assignAwakener}
              onAssignCovenant={assignCovenant}
              onAssignPosse={assignPosse}
              onAssignWheel={assignWheel}
              picker={model.picker}
              searchInputRef={searchInputRef}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

function canCloseAfterAwakenerAssignment(model: BuilderV2Model, awakenerId: string) {
  const awakener = model.awakeners.find((option) => option.id === awakenerId)
  if (!awakener?.inUse) {
    return true
  }

  return model.activeSelection?.kind === 'awakener' || model.slots.some((slot) => !slot.awakener)
}

function canCloseAfterWheelAssignment(model: BuilderV2Model, _wheelId: string) {
  const selectedSlot = getSelectedLoadoutSlot(model)
  if (!selectedSlot?.awakener) {
    return false
  }

  if (model.activeSelection?.kind === 'wheel') {
    return true
  }

  return (
    model.activeSelection?.kind === 'awakener' &&
    selectedSlot.wheelSlots.some((wheelSlot) => !wheelSlot.wheelId)
  )
}

function canCloseAfterCovenantAssignment(model: BuilderV2Model, covenantId: string) {
  const covenant = model.covenants.find((option) => option.id === covenantId)
  const selectedSlot = getSelectedLoadoutSlot(model)
  return Boolean(selectedSlot?.awakener) && !covenant?.inUse
}

function canCloseAfterPosseAssignment(_model: BuilderV2Model, _posseId: string) {
  return true
}

function getCurrentFocusRestoreTarget(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}

function getSelectedLoadoutSlot(model: BuilderV2Model) {
  const selection = model.activeSelection
  if (!selection) {
    return null
  }

  return model.slots.find((slot) => slot.slotId === selection.slotId) ?? null
}

function trapDialogFocus(event: KeyboardEvent, dialog: HTMLDivElement | null) {
  if (event.key !== 'Tab' || !dialog) {
    return
  }

  const focusableElements = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  )

  if (focusableElements.length === 0) {
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (!(activeElement instanceof HTMLElement) || !dialog.contains(activeElement)) {
    event.preventDefault()
    const fallbackTarget = event.shiftKey ? lastElement : firstElement
    fallbackTarget.focus()
    return
  }

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}
