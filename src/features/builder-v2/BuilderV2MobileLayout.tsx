import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'

import {BuilderV2PickerContent} from './BuilderV2AwakenerPicker'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
import type {BuilderV2Model, BuilderV2PickerTab, BuilderV2SlotView} from './BuilderV2ModelTypes'

interface BuilderV2MobileLayoutProps {
  model: BuilderV2Model
}

interface MobilePickerState {
  title: string
  tab: BuilderV2PickerTab
  slotId: string | null
}

export function BuilderV2MobileLayout({model}: BuilderV2MobileLayoutProps) {
  const [manualFocusedSlotId, setManualFocusedSlotId] = useState<string | null>(null)
  const [mobilePicker, setMobilePicker] = useState<MobilePickerState | null>(null)
  const pickerTriggerRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const quickLineupFocusSlotId =
    model.quickLineupSession?.currentStep.kind === 'posse'
      ? null
      : (model.quickLineupSession?.currentStep.slotId ?? undefined)
  const focusedSlotId =
    quickLineupFocusSlotId === undefined ? manualFocusedSlotId : quickLineupFocusSlotId

  const focusedSlot = useMemo(
    () =>
      focusedSlotId ? (model.slots.find((slot) => slot.slotId === focusedSlotId) ?? null) : null,
    [focusedSlotId, model.slots],
  )

  useEffect(() => {
    if (!mobilePicker) {
      return
    }

    searchInputRef.current?.focus()
  }, [mobilePicker, model.pickerTab])

  const closePicker = useCallback((restoreFocus = true) => {
    setMobilePicker(null)
    if (restoreFocus) {
      pickerTriggerRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    if (!mobilePicker) {
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
  }, [closePicker, mobilePicker])

  useEffect(() => {
    if (!mobilePicker) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobilePicker])

  const openFocusedSlot = useCallback((slotId: string) => {
    setManualFocusedSlotId(slotId)
  }, [])

  const openPicker = useCallback(
    ({
      event,
      isTargetSelected = false,
      slotId,
      tab,
      title,
      selectTarget,
    }: {
      event: ReactMouseEvent<HTMLElement>
      isTargetSelected?: boolean
      slotId: string | null
      tab: BuilderV2PickerTab
      title: string
      selectTarget: () => void
    }) => {
      pickerTriggerRef.current = event.currentTarget
      if (slotId) {
        setManualFocusedSlotId(slotId)
      }
      if (!isTargetSelected) {
        selectTarget()
      }
      model.setPickerTab(tab)
      setMobilePicker({title, tab, slotId})
    },
    [model],
  )

  const assignAwakener = useCallback(
    (awakenerId: string) => {
      model.assignAwakener(awakenerId)
      if (mobilePicker?.slotId) {
        setManualFocusedSlotId(mobilePicker.slotId)
      }
      closePicker(false)
    },
    [closePicker, mobilePicker, model],
  )

  const assignWheel = useCallback(
    (wheelId: string) => {
      model.assignWheel(wheelId)
      if (mobilePicker?.slotId) {
        setManualFocusedSlotId(mobilePicker.slotId)
      }
      closePicker(false)
    },
    [closePicker, mobilePicker, model],
  )

  const assignCovenant = useCallback(
    (covenantId: string) => {
      model.assignCovenant(covenantId)
      if (mobilePicker?.slotId) {
        setManualFocusedSlotId(mobilePicker.slotId)
      }
      closePicker(false)
    },
    [closePicker, mobilePicker, model],
  )

  const assignPosse = useCallback(
    (posseId: string) => {
      model.assignPosse(posseId)
      closePicker(false)
    },
    [closePicker, model],
  )

  return (
    <section className='builder-v2-page builder-v2-page--mobile' aria-labelledby='builder-v2-title'>
      <header className='builder-v2-mobile-topbar'>
        <div className='builder-v2-mobile-topbar-identity'>
          <p className='builder-v2-label'>Builder V2 / Beta</p>
          <h1 className='ui-title' id='builder-v2-title'>
            {model.activeTeamName}
          </h1>
        </div>
        <div className='builder-v2-mobile-topbar-actions'>
          <BuilderV2ImportExportActions model={model} />
        </div>
      </header>

      {focusedSlot ? (
        <MobileFocusedBuilder
          focusedSlot={focusedSlot}
          model={model}
          onBack={() => {
            setManualFocusedSlotId(null)
          }}
          onOpenPicker={openPicker}
        />
      ) : (
        <MobileTeamOverview
          model={model}
          onTeamActivated={() => {
            setManualFocusedSlotId(null)
          }}
          onOpenFocusedSlot={openFocusedSlot}
          onOpenPicker={openPicker}
        />
      )}

      {mobilePicker ? (
        <div
          className='builder-v2-mobile-picker-backdrop'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePicker()
            }
          }}
        >
          <div
            aria-labelledby='builder-v2-mobile-picker-title'
            aria-modal='true'
            className='builder-v2-mobile-picker'
            onKeyDown={(event) => {
              trapDialogFocus(event, dialogRef.current)
            }}
            ref={dialogRef}
            role='dialog'
          >
            <header className='builder-v2-mobile-picker-header'>
              <div>
                <p className='builder-v2-label'>Pick</p>
                <h2 className='ui-title' id='builder-v2-mobile-picker-title'>
                  {mobilePicker.title}
                </h2>
              </div>
              <button
                aria-label='Close mobile picker'
                className='builder-v2-mobile-icon-button'
                onClick={() => {
                  closePicker()
                }}
                type='button'
              >
                x
              </button>
            </header>
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

function MobileTeamOverview({
  model,
  onTeamActivated,
  onOpenFocusedSlot,
  onOpenPicker,
}: {
  model: BuilderV2Model
  onTeamActivated: () => void
  onOpenFocusedSlot: (slotId: string) => void
  onOpenPicker: (config: {
    event: ReactMouseEvent<HTMLElement>
    isTargetSelected?: boolean
    slotId: string | null
    tab: BuilderV2PickerTab
    title: string
    selectTarget: () => void
  }) => void
}) {
  const activeTeamSummary = model.teams.find((team) => team.isActive)

  return (
    <section className='builder-v2-mobile-view' aria-label='Mobile team overview'>
      <nav
        aria-label='Mobile team switcher'
        className='builder-v2-mobile-team-strip'
        role='tablist'
      >
        {model.teams.map((team, index) => {
          const teamIndex = String(index + 1).padStart(2, '0')
          return (
            <button
              aria-label={`Switch to ${team.name}`}
              aria-pressed={team.isActive}
              className={`builder-v2-mobile-team-chip ${
                team.isActive ? 'builder-v2-mobile-team-chip--active' : ''
              }`}
              key={team.id}
              onClick={() => {
                model.setActiveTeam(team.id)
                onTeamActivated()
              }}
              role='tab'
              type='button'
            >
              <span className='builder-v2-mobile-team-chip-index'>{teamIndex}</span>
              <span className='builder-v2-mobile-team-chip-name'>{team.name}</span>
            </button>
          )
        })}
        <button
          aria-label='Create team'
          className='builder-v2-mobile-team-chip builder-v2-mobile-team-chip--add'
          disabled={!model.canAddTeam}
          onClick={() => {
            model.addTeam()
            onTeamActivated()
          }}
          type='button'
        >
          <span aria-hidden>+</span>
        </button>
      </nav>

      <div className='builder-v2-mobile-card builder-v2-mobile-team-card'>
        <div className='builder-v2-mobile-team-card-copy'>
          <p className='builder-v2-label'>Active Team</p>
          <h2 className='ui-title'>{model.activeTeamName}</h2>
          <p className='builder-v2-mobile-subline'>
            {String(activeTeamSummary?.deployedCount ?? 0)} / 4 deployed
            {model.activePosse ? ` / ${model.activePosse.name}` : ' / No posse'}
          </p>
        </div>
        <button
          aria-label='Pick posse'
          className={`builder-v2-mobile-posse-target ${
            model.activeTeamTarget?.kind === 'posse'
              ? 'builder-v2-mobile-posse-target--active'
              : ''
          }`}
          onClick={(event) => {
            onOpenPicker({
              event,
              isTargetSelected: model.activeTeamTarget?.kind === 'posse',
              slotId: null,
              tab: 'posses',
              title: `Pick Posse for ${model.activeTeamName}`,
              selectTarget: model.selectPosse,
            })
          }}
          type='button'
        >
          <span aria-hidden className='builder-v2-mobile-posse-icon'>
            {model.activePosse?.assetSrc ? (
              <img alt='' draggable={false} src={model.activePosse.assetSrc} />
            ) : (
              <span className='builder-v2-empty-mark'>+</span>
            )}
          </span>
          <span className='builder-v2-mobile-posse-copy'>
            <span className='builder-v2-label'>Posse</span>
            <span className='builder-v2-mobile-posse-name'>
              {model.activePosse?.name ?? 'Pick Posse'}
            </span>
          </span>
        </button>
      </div>

      <MobileQuickLineupControls
        model={model}
        onStartQuickLineup={() => {
          onOpenFocusedSlot('slot-1')
        }}
      />

      <div className='builder-v2-mobile-slot-strip' aria-label='Mobile team slots'>
        {model.slots.map((slot) => (
          <button
            aria-label={`Open ${slot.slotLabel} builder`}
            className={`builder-v2-mobile-slot-preview ${
              slot.isSelected ? 'builder-v2-mobile-slot-preview--active' : ''
            }`}
            key={slot.slotId}
            onClick={() => {
              onOpenFocusedSlot(slot.slotId)
            }}
            type='button'
          >
            <span className='builder-v2-label'>{slot.slotLabel}</span>
            <MobileSlotArt slot={slot} />
            <span className='builder-v2-mobile-slot-name'>
              {slot.awakener?.displayName ?? 'Empty'}
            </span>
          </button>
        ))}
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
        onTeamActivated={onTeamActivated}
        teams={model.teams}
        variant='mobile'
      />
    </section>
  )
}

function MobileFocusedBuilder({
  focusedSlot,
  model,
  onBack,
  onOpenPicker,
}: {
  focusedSlot: BuilderV2SlotView
  model: BuilderV2Model
  onBack: () => void
  onOpenPicker: (config: {
    event: ReactMouseEvent<HTMLElement>
    isTargetSelected?: boolean
    slotId: string | null
    tab: BuilderV2PickerTab
    title: string
    selectTarget: () => void
  }) => void
}) {
  const focusName = focusedSlot.awakener?.displayName ?? focusedSlot.slotLabel

  return (
    <section className='builder-v2-mobile-view' aria-label='Mobile focused builder'>
      <header className='builder-v2-mobile-focused-header'>
        <button className='builder-v2-mobile-action' onClick={onBack} type='button'>
          Back
        </button>
        <div>
          <p className='builder-v2-label'>{focusedSlot.slotLabel}</p>
          <h2 className='ui-title'>{focusName}</h2>
        </div>
      </header>

      <div className='builder-v2-mobile-card builder-v2-mobile-focus-card'>
        <MobileSlotArt slot={focusedSlot} />
        <div>
          <p className='builder-v2-mobile-subline'>
            {focusedSlot.awakener
              ? `Lv. ${String(focusedSlot.awakener.level)} - ${focusedSlot.awakener.realm}`
              : 'Select an awakener'}
          </p>
          <button
            className='builder-v2-mobile-primary-action'
            onClick={(event) => {
              onOpenPicker({
                event,
                isTargetSelected: focusedSlot.isSelected,
                slotId: focusedSlot.slotId,
                tab: 'awakeners',
                title: `Pick Awakener for ${focusedSlot.slotLabel}`,
                selectTarget: () => {
                  model.selectAwakenerSlot(focusedSlot.slotId)
                },
              })
            }}
            type='button'
          >
            Pick Awakener for {focusedSlot.slotLabel}
          </button>
        </div>
      </div>

      <MobileQuickLineupControls model={model} />

      <div
        className='builder-v2-mobile-loadout'
        aria-label={`${focusedSlot.slotLabel} mobile loadout`}
      >
        {focusedSlot.wheelSlots.map((wheelSlot) => (
          <button
            aria-label={`Pick Wheel ${String(wheelSlot.wheelIndex + 1)} for ${focusName}`}
            className={`builder-v2-mobile-loadout-button ${
              wheelSlot.isSelected ? 'builder-v2-mobile-loadout-button--active' : ''
            }`}
            disabled={!focusedSlot.awakener}
            key={`${focusedSlot.slotId}-mobile-wheel-${String(wheelSlot.wheelIndex)}`}
            onClick={(event) => {
              onOpenPicker({
                event,
                isTargetSelected: wheelSlot.isSelected,
                slotId: focusedSlot.slotId,
                tab: 'wheels',
                title: `Pick Wheel ${String(wheelSlot.wheelIndex + 1)} for ${focusName}`,
                selectTarget: () => {
                  model.selectWheelSlot(focusedSlot.slotId, wheelSlot.wheelIndex)
                },
              })
            }}
            type='button'
          >
            <span className='builder-v2-label'>Wheel {String(wheelSlot.wheelIndex + 1)}</span>
            <span>{wheelSlot.wheelName ?? 'Empty'}</span>
          </button>
        ))}

        <button
          aria-label={`Pick Covenant for ${focusName}`}
          className={`builder-v2-mobile-loadout-button ${
            focusedSlot.isCovenantSelected ? 'builder-v2-mobile-loadout-button--active' : ''
          }`}
          disabled={!focusedSlot.awakener}
          onClick={(event) => {
            onOpenPicker({
              event,
              isTargetSelected: focusedSlot.isCovenantSelected,
              slotId: focusedSlot.slotId,
              tab: 'covenants',
              title: `Pick Covenant for ${focusName}`,
              selectTarget: () => {
                model.selectCovenantSlot(focusedSlot.slotId)
              },
            })
          }}
          type='button'
        >
          <span className='builder-v2-label'>Covenant</span>
          <span>{focusedSlot.covenantName ?? 'Empty'}</span>
        </button>
      </div>

      <p className='builder-v2-editing-line' role={model.violationMessage ? 'alert' : undefined}>
        {model.violationMessage ?? model.editingLabel}
      </p>
    </section>
  )
}

function MobileQuickLineupControls({
  model,
  onStartQuickLineup,
}: {
  model: BuilderV2Model
  onStartQuickLineup?: () => void
}) {
  const session = model.quickLineupSession

  if (!session) {
    return (
      <button
        className='builder-v2-lineup-button'
        onClick={() => {
          model.startQuickLineup()
          onStartQuickLineup?.()
        }}
        type='button'
      >
        Quick Team Lineup
      </button>
    )
  }

  return (
    <div className='builder-v2-lineup-controls' aria-label='Mobile quick lineup controls'>
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

function MobileSlotArt({slot}: {slot: BuilderV2SlotView}) {
  return (
    <span className='builder-v2-mobile-art'>
      {slot.awakener?.portraitSrc ? (
        <img
          alt={`${slot.awakener.displayName} portrait`}
          draggable={false}
          src={slot.awakener.portraitSrc}
        />
      ) : (
        <span aria-hidden className='builder-v2-empty-mark'>
          +
        </span>
      )}
    </span>
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
