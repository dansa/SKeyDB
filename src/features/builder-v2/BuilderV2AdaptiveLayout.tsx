import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import {BuilderV2PickerContent} from './BuilderV2AwakenerPicker'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'
import type {BuilderV2Model} from './useBuilderV2Model'

interface BuilderV2AdaptiveLayoutProps {
  model: BuilderV2Model
}

export function BuilderV2AdaptiveLayout({model}: BuilderV2AdaptiveLayoutProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const pickerTriggerRef = useRef<HTMLButtonElement | null>(null)
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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      closePicker()
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
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

  const openPicker = useCallback(() => {
    if (!model.activeSelection && !model.activeTeamTarget) {
      model.selectAwakenerSlot(model.selectedSlotId ?? 'slot-1')
    }
    setIsPickerOpen(true)
  }, [model])

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
      <header className='builder-v2-page-header' aria-hidden={isPickerOpen ? true : undefined}>
        <div>
          <p className='builder-v2-label'>Local rebuild shell</p>
          <h1 className='ui-title' id='builder-v2-title'>
            Builder V2
          </h1>
        </div>
        <span className='builder-v2-status-pill'>Adaptive</span>
      </header>

      <section
        aria-hidden={isPickerOpen ? true : undefined}
        className='builder-v2-adaptive-workbench'
        aria-label='Adaptive workbench'
      >
        <aside className='builder-v2-panel builder-v2-adaptive-rail'>
          <div className='builder-v2-section-header'>
            <div>
              <p className='builder-v2-label'>Teams</p>
              <h2 className='ui-title'>{model.teams.length} Teams</h2>
            </div>
          </div>

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
                  <span className='builder-v2-team-copy'>
                    <span className='builder-v2-team-name'>{team.name}</span>
                    <span className='builder-v2-team-meta'>{teamMeta}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <main className='builder-v2-adaptive-main' aria-label='Adaptive active team'>
          <section className='builder-v2-panel builder-v2-active-team'>
            <div className='builder-v2-active-header'>
              <div>
                <p className='builder-v2-label'>Active Team</p>
                <h2 className='ui-title'>{model.activeTeamName}</h2>
              </div>
              <div className='builder-v2-posse-summary'>
                <button
                  aria-label='Select team posse'
                  aria-pressed={model.activeTeamTarget?.kind === 'posse'}
                  className={`builder-v2-posse-target ${
                    model.activeTeamTarget?.kind === 'posse'
                      ? 'builder-v2-posse-target--active'
                      : ''
                  }`}
                  onClick={model.selectPosse}
                  type='button'
                >
                  <span className='builder-v2-label'>Posse</span>
                  <span>{model.activePosse?.name ?? 'Not selected'}</span>
                </button>
                {model.activePosse ? (
                  <button
                    className='builder-v2-posse-clear'
                    onClick={model.clearPosse}
                    type='button'
                  >
                    Clear Posse
                  </button>
                ) : null}
              </div>
              <AdaptiveQuickLineupControls model={model} />
              <BuilderV2ImportExportActions model={model} />
              <button
                className='builder-v2-adaptive-picker-trigger'
                onClick={(event) => {
                  pickerTriggerRef.current = event.currentTarget
                  openPicker()
                }}
                type='button'
              >
                Open adaptive picker
              </button>
            </div>

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

            <p
              className='builder-v2-editing-line'
              role={model.violationMessage ? 'alert' : undefined}
            >
              {model.violationMessage ?? model.editingLabel}
            </p>
          </section>

          <BuilderV2TeamManagement model={model} variant='adaptive' />
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
            onKeyDown={(event) => {
              trapDialogFocus(event, dialogRef.current)
            }}
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
              awakeners={model.awakeners}
              covenants={model.covenants}
              onAssignAwakener={assignAwakener}
              onAssignCovenant={assignCovenant}
              onAssignPosse={assignPosse}
              onAssignWheel={assignWheel}
              onPickerTabChange={model.setPickerTab}
              onSearchChange={model.setSearchQuery}
              pickerTab={model.pickerTab}
              posses={model.posses}
              searchInputRef={searchInputRef}
              searchQuery={model.searchQuery}
              wheels={model.wheels}
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

function getSelectedLoadoutSlot(model: BuilderV2Model) {
  const selection = model.activeSelection
  if (!selection) {
    return null
  }

  return model.slots.find((slot) => slot.slotId === selection.slotId) ?? null
}

function AdaptiveQuickLineupControls({model}: {model: BuilderV2Model}) {
  const session = model.quickLineupSession

  if (!session) {
    return (
      <button className='builder-v2-lineup-button' onClick={model.startQuickLineup} type='button'>
        Quick Team Lineup
      </button>
    )
  }

  return (
    <div className='builder-v2-lineup-controls' aria-label='Adaptive quick lineup controls'>
      <p className='builder-v2-lineup-step'>
        Step {String(session.currentStepIndex + 1)} / {String(session.totalSteps)}:{' '}
        {model.quickLineupStepLabel ?? 'Current step'}
      </p>
      <div className='builder-v2-lineup-actions'>
        <button
          className='builder-v2-lineup-action'
          disabled={!session.canGoBack}
          onClick={model.goBackQuickLineupStep}
          type='button'
        >
          Back
        </button>
        <button
          className='builder-v2-lineup-action'
          onClick={model.skipQuickLineupStep}
          type='button'
        >
          Next
        </button>
        <button
          className='builder-v2-lineup-action builder-v2-lineup-action--danger'
          onClick={model.cancelQuickLineup}
          type='button'
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function trapDialogFocus(event: ReactKeyboardEvent, dialog: HTMLDivElement | null) {
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

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}
