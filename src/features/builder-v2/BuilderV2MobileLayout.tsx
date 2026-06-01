import {useCallback, useRef, useState} from 'react'

import {FaCaretDown, FaChevronLeft, FaChevronRight, FaXmark} from 'react-icons/fa6'

import {getRealmBadge, getRealmLabel} from '@/domain/realms'
import {useNativeModalDialog} from '@/ui/modal/useNativeModalDialog'

import type {QuickLineupStep, WheelSlotIndex} from '../builder/types'
import {BuilderV2ActiveFooter, BuilderV2ActiveHeader} from './BuilderV2ActiveTeamChrome'
import {BuilderV2PickerContent} from './BuilderV2AwakenerPicker'
import {BuilderV2EnlightenMeter} from './BuilderV2EnlightenMeter'
import {BuilderV2ImportExportActions} from './BuilderV2ImportExportActions'
import type {
  BuilderV2Model,
  BuilderV2PickerTab,
  BuilderV2SlotView,
  BuilderV2TeamSummary,
  BuilderV2TeamSummarySlot,
} from './BuilderV2ModelTypes'
import {BuilderV2TeamManagement} from './BuilderV2TeamManagement'
import {BuilderV2TeamSlots} from './BuilderV2TeamSlots'
import {useStableEvent} from './useStableEvent'

interface BuilderV2MobileLayoutProps {
  isDetailOverlayOpen: boolean
  model: BuilderV2Model
  onOpenAwakenerDetail: (awakenerId: string) => void
  onOpenCovenantDetail: (covenantId: string) => void
  onOpenPosseDetail: (posseId: string) => void
  onOpenWheelDetail: (wheelId: string) => void
}

interface MobilePickerState {
  title: string
  tab: BuilderV2PickerTab
  slotId: string | null
}

interface MobileOpenPickerConfig {
  isTargetSelected?: boolean
  restoreTarget?: HTMLElement | null
  selectTarget: () => void
  slotId: string | null
  tab: BuilderV2PickerTab
  title: string
}

export function BuilderV2MobileLayout({
  isDetailOverlayOpen,
  model,
  onOpenAwakenerDetail,
  onOpenCovenantDetail,
  onOpenPosseDetail,
  onOpenWheelDetail,
}: BuilderV2MobileLayoutProps) {
  const [mobilePicker, setMobilePicker] = useState<MobilePickerState | null>(null)
  const pickerTriggerRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const setPickerTab = useStableEvent(model.setPickerTab)
  const startQuickLineupCommand = useStableEvent(model.startQuickLineup)
  const assignAwakenerCommand = useStableEvent(model.assignAwakener)
  const assignWheelCommand = useStableEvent(model.assignWheel)
  const assignCovenantCommand = useStableEvent(model.assignCovenant)
  const assignPosseCommand = useStableEvent(model.assignPosse)

  const closePicker = useCallback((restoreFocus = true) => {
    setMobilePicker(null)
    if (restoreFocus) {
      pickerTriggerRef.current?.focus()
    }
  }, [])

  const updateMobilePickerTarget = useCallback(
    (slotId: string, tab: BuilderV2PickerTab, title: string) => {
      setMobilePicker((current) => {
        if (current?.slotId !== slotId) {
          return current
        }

        return {...current, tab, title}
      })
    },
    [],
  )

  const openPicker = useCallback(
    ({
      isTargetSelected = false,
      restoreTarget,
      slotId,
      tab,
      title,
      selectTarget,
    }: MobileOpenPickerConfig) => {
      pickerTriggerRef.current = restoreTarget ?? getCurrentFocusRestoreTarget()
      if (!isTargetSelected) {
        selectTarget()
      }
      setPickerTab(tab)
      setMobilePicker({title, tab, slotId})
    },
    [setPickerTab],
  )

  const startQuickLineup = useCallback(() => {
    setMobilePicker(null)
    startQuickLineupCommand()
    scrollToMobileLineupStart()
  }, [startQuickLineupCommand])

  const handleMobileTeamActivated = useCallback(() => {
    setMobilePicker(null)
  }, [])

  const activeMobilePicker = model.quickLineupSession ? null : mobilePicker

  const assignAwakener = useCallback(
    (awakenerId: string) => {
      assignAwakenerCommand(awakenerId)
      if (!mobilePicker?.slotId) {
        closePicker(false)
      }
    },
    [assignAwakenerCommand, closePicker, mobilePicker?.slotId],
  )

  const assignWheel = useCallback(
    (wheelId: string) => {
      assignWheelCommand(wheelId)
      if (!mobilePicker?.slotId) {
        closePicker(false)
      }
    },
    [assignWheelCommand, closePicker, mobilePicker?.slotId],
  )

  const assignCovenant = useCallback(
    (covenantId: string) => {
      assignCovenantCommand(covenantId)
      if (!mobilePicker?.slotId) {
        closePicker(false)
      }
    },
    [assignCovenantCommand, closePicker, mobilePicker?.slotId],
  )

  const assignPosse = useCallback(
    (posseId: string) => {
      assignPosseCommand(posseId)
      closePicker(false)
    },
    [assignPosseCommand, closePicker],
  )
  const openAwakenerDetail = useCallback(
    (awakenerId: string) => {
      onOpenAwakenerDetail(awakenerId)
    },
    [onOpenAwakenerDetail],
  )
  const openWheelDetail = useCallback(
    (wheelId: string) => {
      onOpenWheelDetail(wheelId)
    },
    [onOpenWheelDetail],
  )
  const openCovenantDetail = useCallback(
    (covenantId: string) => {
      onOpenCovenantDetail(covenantId)
    },
    [onOpenCovenantDetail],
  )
  const openPosseDetail = useCallback(
    (posseId: string) => {
      onOpenPosseDetail(posseId)
    },
    [onOpenPosseDetail],
  )

  return (
    <section
      className={`builder-v2-page builder-v2-page--mobile ${
        model.quickLineupSession ? 'builder-v2-page--mobile-lineup' : ''
      }`}
      aria-labelledby='builder-v2-title'
    >
      <h1 className='sr-only' id='builder-v2-title'>
        Builder V2
      </h1>

      {model.quickLineupSession ? (
        <MobileQuickLineupBuilder
          model={model}
          onAssignAwakener={assignAwakener}
          onAssignCovenant={assignCovenant}
          onAssignPosse={assignPosse}
          onAssignWheel={assignWheel}
          onOpenAwakenerDetail={openAwakenerDetail}
          onOpenCovenantDetail={openCovenantDetail}
          onOpenPosseDetail={openPosseDetail}
          onOpenWheelDetail={openWheelDetail}
          searchInputRef={searchInputRef}
        />
      ) : (
        <MobileTeamBuilder
          model={model}
          onTeamActivated={handleMobileTeamActivated}
          onOpenPicker={openPicker}
          onStartQuickLineup={startQuickLineup}
        />
      )}

      {activeMobilePicker ? (
        <MobilePickerDialog
          isDetailOverlayOpen={isDetailOverlayOpen}
          mobilePicker={activeMobilePicker}
          model={model}
          onAssignAwakener={assignAwakener}
          onAssignCovenant={assignCovenant}
          onAssignPosse={assignPosse}
          onAssignWheel={assignWheel}
          onClosePicker={closePicker}
          onOpenAwakenerDetail={openAwakenerDetail}
          onOpenCovenantDetail={openCovenantDetail}
          onOpenPosseDetail={openPosseDetail}
          onOpenWheelDetail={openWheelDetail}
          onUpdateMobilePickerTarget={updateMobilePickerTarget}
          searchInputRef={searchInputRef}
        />
      ) : null}
    </section>
  )
}

function MobilePickerDialog({
  isDetailOverlayOpen,
  mobilePicker,
  model,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
  onClosePicker,
  onOpenAwakenerDetail,
  onOpenCovenantDetail,
  onOpenPosseDetail,
  onOpenWheelDetail,
  onUpdateMobilePickerTarget,
  searchInputRef,
}: {
  isDetailOverlayOpen: boolean
  mobilePicker: MobilePickerState
  model: BuilderV2Model
  onAssignAwakener: (awakenerId: string) => void
  onAssignCovenant: (covenantId: string) => void
  onAssignPosse: (posseId: string) => void
  onAssignWheel: (wheelId: string) => void
  onClosePicker: (restoreFocus?: boolean) => void
  onOpenAwakenerDetail: (awakenerId: string) => void
  onOpenCovenantDetail: (covenantId: string) => void
  onOpenPosseDetail: (posseId: string) => void
  onOpenWheelDetail: (wheelId: string) => void
  onUpdateMobilePickerTarget: (slotId: string, tab: BuilderV2PickerTab, title: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const activeSlot = mobilePicker.slotId
    ? (model.slots.find((slot) => slot.slotId === mobilePicker.slotId) ?? null)
    : null
  const updateSlotPickerTarget = useCallback(
    (slot: BuilderV2SlotView, tab: BuilderV2PickerTab, targetLabel: string) => {
      model.setPickerTab(tab)
      onUpdateMobilePickerTarget(
        slot.slotId,
        tab,
        getMobileSlotPickerTitle(model.activeTeamName, slot.slotLabel, targetLabel),
      )
    },
    [model, onUpdateMobilePickerTarget],
  )
  const selectSlotAwakenerTarget = useCallback(
    (slotId: string) => {
      const slot = model.slots.find((candidate) => candidate.slotId === slotId)
      if (!slot) {
        return
      }

      const isAwakenerTargetSelected =
        model.activeSelection?.kind === 'awakener' && model.activeSelection.slotId === slotId
      if (!isAwakenerTargetSelected) {
        model.selectAwakenerSlot(slotId)
      }
      updateSlotPickerTarget(slot, 'awakeners', 'Awakener')
    },
    [model, updateSlotPickerTarget],
  )
  const selectSlotWheelTarget = useCallback(
    (slotId: string, wheelIndex: WheelSlotIndex) => {
      const slot = model.slots.find((candidate) => candidate.slotId === slotId)
      if (!slot) {
        return
      }

      if (slot.isEmpty) {
        const isAwakenerTargetSelected =
          model.activeSelection?.kind === 'awakener' && model.activeSelection.slotId === slotId
        if (!isAwakenerTargetSelected) {
          model.selectAwakenerSlot(slotId)
        }
        updateSlotPickerTarget(slot, 'awakeners', 'Awakener')
        return
      }

      if (!slot.wheelSlots[wheelIndex].isSelected) {
        model.selectWheelSlot(slotId, wheelIndex)
      }
      updateSlotPickerTarget(slot, 'wheels', `Wheel ${String(wheelIndex + 1)}`)
    },
    [model, updateSlotPickerTarget],
  )
  const selectSlotCovenantTarget = useCallback(
    (slotId: string) => {
      const slot = model.slots.find((candidate) => candidate.slotId === slotId)
      if (!slot) {
        return
      }

      if (slot.isEmpty) {
        const isAwakenerTargetSelected =
          model.activeSelection?.kind === 'awakener' && model.activeSelection.slotId === slotId
        if (!isAwakenerTargetSelected) {
          model.selectAwakenerSlot(slotId)
        }
        updateSlotPickerTarget(slot, 'awakeners', 'Awakener')
        return
      }

      if (!slot.isCovenantSelected) {
        model.selectCovenantSlot(slotId)
      }
      updateSlotPickerTarget(slot, 'covenants', 'Covenant')
    },
    [model, updateSlotPickerTarget],
  )

  useNativeModalDialog({
    dialogRef,
    initialFocusRef: closeButtonRef,
    lockBodyScroll: true,
    onCancel: (event) => {
      event.preventDefault()
      onClosePicker()
    },
    onClick: (event) => {
      if (event.target === event.currentTarget) {
        onClosePicker()
      }
    },
    onKeyDown: (event) => {
      trapDialogFocus(event, dialogRef.current)
    },
    restoreFocus: false,
  })

  return (
    <dialog
      aria-labelledby='builder-v2-mobile-picker-title'
      aria-modal={isDetailOverlayOpen ? undefined : true}
      className='builder-v2-mobile-picker-backdrop'
      inert={isDetailOverlayOpen ? true : undefined}
      ref={dialogRef}
    >
      <div className='builder-v2-mobile-picker'>
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
              onClosePicker()
            }}
            ref={closeButtonRef}
            type='button'
          >
            <FaXmark aria-hidden />
          </button>
        </header>
        <BuilderV2PickerContent
          controlsPlacement='bottom'
          onAssignAwakener={onAssignAwakener}
          onAssignCovenant={onAssignCovenant}
          onAssignPosse={onAssignPosse}
          onAssignWheel={onAssignWheel}
          onClearPickerTarget={model.clearPickerTarget}
          onOpenAwakenerDetail={onOpenAwakenerDetail}
          onOpenCovenantDetail={onOpenCovenantDetail}
          onOpenPosseDetail={onOpenPosseDetail}
          onOpenWheelDetail={onOpenWheelDetail}
          picker={model.picker}
          pickerClearTarget={model.pickerClearTarget}
          searchInputRef={searchInputRef}
        />
        {activeSlot ? (
          <BuilderV2MobileSlotTargetPanel
            activeSlot={activeSlot}
            currentStep={model.activeSelection ?? undefined}
            mode='picker'
            onDone={() => {
              onClosePicker()
            }}
            onSelectCovenantSlot={selectSlotCovenantTarget}
            onSelectSlot={selectSlotAwakenerTarget}
            onSelectWheelSlot={selectSlotWheelTarget}
            pickerTargetLabel={getMobileSlotPickerPanelLabel(activeSlot)}
          />
        ) : null}
      </div>
    </dialog>
  )
}

function MobileQuickLineupBuilder({
  model,
  onAssignAwakener,
  onAssignCovenant,
  onAssignPosse,
  onAssignWheel,
  onOpenAwakenerDetail,
  onOpenCovenantDetail,
  onOpenPosseDetail,
  onOpenWheelDetail,
  searchInputRef,
}: {
  model: BuilderV2Model
  onAssignAwakener: (awakenerId: string) => void
  onAssignCovenant: (covenantId: string) => void
  onAssignPosse: (posseId: string) => void
  onAssignWheel: (wheelId: string) => void
  onOpenAwakenerDetail: (awakenerId: string) => void
  onOpenCovenantDetail: (covenantId: string) => void
  onOpenPosseDetail: (posseId: string) => void
  onOpenWheelDetail: (wheelId: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const session = model.quickLineupSession

  if (!session) {
    return null
  }

  const pickerTitle = getQuickLineupPickingTitle(session.currentStep, model.slots)
  const activeSlot = getQuickLineupActiveSlot(session.currentStep, model.slots)
  const activeSlotIndex = activeSlot
    ? model.slots.findIndex((slot) => slot.slotId === activeSlot.slotId)
    : -1
  const selectSlotByIndex = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= model.slots.length) {
      return
    }
    const nextSlot = model.slots[slotIndex]
    model.selectAwakenerSlot(nextSlot.slotId)
  }

  return (
    <section
      className='builder-v2-mobile-view builder-v2-mobile-view--lineup'
      aria-label='Mobile quick team lineup'
    >
      <header className='builder-v2-mobile-lineup-header'>
        <div className='builder-v2-mobile-lineup-heading'>
          <p className='builder-v2-lineup-title'>Quick Lineup · {model.activeTeamName}</p>
          <div
            className='builder-v2-mobile-lineup-header-commands'
            aria-label='Quick lineup session actions'
          >
            <button
              aria-label='Finish quick team lineup'
              className='builder-v2-mobile-lineup-header-action builder-v2-mobile-lineup-header-action--finish'
              onClick={model.finishQuickLineup}
              type='button'
            >
              Finish
            </button>
            <button
              aria-label='Cancel quick team lineup'
              className='builder-v2-mobile-lineup-header-action builder-v2-mobile-lineup-header-action--danger'
              onClick={model.cancelQuickLineup}
              type='button'
            >
              Cancel
            </button>
          </div>
        </div>
        <button
          aria-current={session.currentStep.kind === 'posse' ? 'step' : undefined}
          aria-label='Select team posse'
          aria-pressed={session.currentStep.kind === 'posse'}
          className={`builder-v2-mobile-lineup-posse-target ${
            session.currentStep.kind === 'posse'
              ? 'builder-v2-mobile-lineup-posse-target--active'
              : ''
          }`}
          onClick={model.selectPosse}
          type='button'
        >
          <span className='builder-v2-posse-copy builder-v2-mobile-lineup-posse-copy'>
            <span className='builder-v2-label'>Posse</span>
            <span className='builder-v2-posse-name'>
              {model.activePosse?.name ?? 'Not selected'}
            </span>
          </span>
          <span className='builder-v2-posse-icon builder-v2-mobile-lineup-posse-icon' aria-hidden>
            {model.activePosse?.assetSrc ? (
              <img alt='' decoding='async' draggable={false} src={model.activePosse.assetSrc} />
            ) : (
              <span className='builder-v2-empty-mark'>+</span>
            )}
          </span>
        </button>
      </header>

      <section className='builder-v2-panel builder-v2-mobile-lineup-team'>
        <BuilderV2MobileQuickLineupOverview
          onSelectCovenantSlot={(slotId) => {
            model.selectCovenantSlot(slotId)
          }}
          onSelectSlot={(slotId) => {
            model.selectAwakenerSlot(slotId)
          }}
          onSelectWheelSlot={(slotId, wheelIndex) => {
            model.selectWheelSlot(slotId, wheelIndex)
          }}
          slots={model.slots}
        />
      </section>

      <section className='builder-v2-mobile-lineup-picker' aria-label={pickerTitle}>
        <BuilderV2PickerContent
          controlsPlacement='bottom'
          onAssignAwakener={onAssignAwakener}
          onAssignCovenant={onAssignCovenant}
          onAssignPosse={onAssignPosse}
          onAssignWheel={onAssignWheel}
          onClearPickerTarget={model.clearPickerTarget}
          onOpenAwakenerDetail={onOpenAwakenerDetail}
          onOpenCovenantDetail={onOpenCovenantDetail}
          onOpenPosseDetail={onOpenPosseDetail}
          onOpenWheelDetail={onOpenWheelDetail}
          picker={model.picker}
          pickerClearTarget={model.pickerClearTarget}
          searchInputRef={searchInputRef}
        />
      </section>

      <BuilderV2MobileSlotTargetPanel
        activeSlot={activeSlot}
        currentStep={session.currentStep}
        mode='lineup'
        onNextSlot={() => {
          selectSlotByIndex(activeSlotIndex + 1)
        }}
        onPreviousSlot={() => {
          selectSlotByIndex(activeSlotIndex - 1)
        }}
        onSelectCovenantSlot={model.selectCovenantSlot}
        onSelectSlot={model.selectAwakenerSlot}
        onSelectWheelSlot={model.selectWheelSlot}
        quickLineupStepLabel={model.quickLineupStepLabel}
        session={session}
        canGoNextSlot={activeSlotIndex >= 0 && activeSlotIndex < model.slots.length - 1}
        canGoPreviousSlot={activeSlotIndex > 0}
      />
    </section>
  )
}

function BuilderV2MobileQuickLineupOverview({
  onSelectCovenantSlot,
  onSelectSlot,
  onSelectWheelSlot,
  slots,
}: {
  onSelectCovenantSlot: (slotId: string) => void
  onSelectSlot: (slotId: string) => void
  onSelectWheelSlot: BuilderV2TeamSlotsProps['onSelectWheelSlot']
  slots: BuilderV2SlotView[]
}) {
  return (
    <ul aria-label='Quick lineup team overview' className='builder-v2-mobile-lineup-overview'>
      {slots.map((slot) => {
        const isCardActive =
          slot.isSelected ||
          slot.isCovenantSelected ||
          slot.wheelSlots.some((wheel) => wheel.isSelected)

        return (
          <li
            aria-label={`${slot.slotLabel} quick overview`}
            className={`builder-v2-mobile-lineup-overview-card ${
              isCardActive ? 'builder-v2-mobile-lineup-overview-card--active' : ''
            }`}
            key={slot.slotId}
          >
            <button
              aria-label={`Select ${slot.slotLabel}`}
              aria-pressed={slot.isSelected}
              className='builder-v2-mobile-lineup-awakener-target'
              onClick={() => {
                onSelectSlot(slot.slotId)
              }}
              type='button'
            >
              <span className='builder-v2-mobile-lineup-card-art' aria-hidden>
                {(slot.awakener?.cardSrc ?? slot.awakener?.portraitSrc) ? (
                  <img
                    alt=''
                    decoding='async'
                    draggable={false}
                    fetchPriority='low'
                    src={slot.awakener.cardSrc ?? slot.awakener.portraitSrc}
                  />
                ) : (
                  <span className='builder-v2-mobile-lineup-empty-mark'>+</span>
                )}
              </span>

              <span className='builder-v2-mobile-lineup-card-topline' aria-hidden>
                {slot.awakener ? (
                  <MobileLineupRealmBadge realm={slot.awakener.realm} />
                ) : (
                  <span className='builder-v2-mobile-lineup-slot-number'>
                    {String(slot.slotNumber)}
                  </span>
                )}
              </span>

              <span className='builder-v2-mobile-lineup-card-copy'>
                <span className='builder-v2-mobile-lineup-card-name'>
                  {slot.awakener?.displayName ?? 'Empty Slot'}
                </span>
                {slot.awakener ? (
                  <BuilderV2EnlightenMeter level={slot.awakener.enlightenLevel} variant='compact' />
                ) : null}
              </span>
            </button>

            <div className='builder-v2-mobile-lineup-card-gear'>
              {slot.wheelSlots.map((wheelSlot) => {
                const wheelNumber = String(wheelSlot.wheelIndex + 1)
                const wheelActionLabel = slot.isEmpty
                  ? `Select ${slot.slotLabel} awakener before Wheel ${wheelNumber}`
                  : `Select ${wheelSlot.label}`
                const wheelTitle = slot.isEmpty
                  ? `${slot.slotLabel}: select an awakener before Wheel ${wheelNumber}`
                  : (wheelSlot.wheelName ?? wheelSlot.label)

                return (
                  <button
                    aria-label={wheelActionLabel}
                    aria-pressed={wheelSlot.isSelected}
                    className={`builder-v2-mobile-lineup-gear-button ${
                      wheelSlot.isSelected ? 'builder-v2-mobile-lineup-gear-button--active' : ''
                    }`}
                    key={`${slot.slotId}-lineup-wheel-${String(wheelSlot.wheelIndex)}`}
                    onClick={() => {
                      if (slot.isEmpty) {
                        onSelectSlot(slot.slotId)
                        return
                      }

                      onSelectWheelSlot(slot.slotId, wheelSlot.wheelIndex)
                    }}
                    title={wheelTitle}
                    type='button'
                  >
                    {(wheelSlot.miniAssetSrc ?? wheelSlot.assetSrc) ? (
                      <img
                        alt=''
                        decoding='async'
                        draggable={false}
                        src={wheelSlot.miniAssetSrc ?? wheelSlot.assetSrc}
                      />
                    ) : (
                      <span aria-hidden>+</span>
                    )}
                  </button>
                )
              })}

              <button
                aria-label={
                  slot.isEmpty
                    ? `Select ${slot.slotLabel} awakener before Covenant`
                    : `Select ${slot.slotLabel} Covenant`
                }
                aria-pressed={slot.isCovenantSelected}
                className={`builder-v2-mobile-lineup-gear-button ${
                  slot.isCovenantSelected ? 'builder-v2-mobile-lineup-gear-button--active' : ''
                }`}
                onClick={() => {
                  if (slot.isEmpty) {
                    onSelectSlot(slot.slotId)
                    return
                  }

                  onSelectCovenantSlot(slot.slotId)
                }}
                title={
                  slot.isEmpty
                    ? `${slot.slotLabel}: select an awakener before Covenant`
                    : (slot.covenantName ?? `${slot.slotLabel} Covenant`)
                }
                type='button'
              >
                {slot.covenantAssetSrc ? (
                  <img alt='' decoding='async' draggable={false} src={slot.covenantAssetSrc} />
                ) : (
                  <span aria-hidden>+</span>
                )}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function BuilderV2MobileSlotTargetPanel({
  activeSlot,
  canGoNextSlot,
  canGoPreviousSlot,
  currentStep,
  mode,
  onDone,
  onNextSlot,
  onPreviousSlot,
  onSelectCovenantSlot,
  onSelectSlot,
  onSelectWheelSlot,
  pickerTargetLabel,
  quickLineupStepLabel,
  session,
}: {
  activeSlot: BuilderV2SlotView | null
  canGoNextSlot?: boolean
  canGoPreviousSlot?: boolean
  currentStep?: QuickLineupStep
  mode: 'lineup' | 'picker'
  onDone?: () => void
  onNextSlot?: () => void
  onPreviousSlot?: () => void
  onSelectCovenantSlot: (slotId: string) => void
  onSelectSlot: (slotId: string) => void
  onSelectWheelSlot: BuilderV2TeamSlotsProps['onSelectWheelSlot']
  pickerTargetLabel?: string
  quickLineupStepLabel?: string | null
  session?: NonNullable<BuilderV2Model['quickLineupSession']>
}) {
  if (!activeSlot) {
    return null
  }

  const currentTargetLabel = (quickLineupStepLabel ?? 'Current step').replace(' - ', ' · ')
  const avatarSrc = activeSlot.awakener?.portraitSrc ?? activeSlot.awakener?.cardSrc
  const isAwakenerActive =
    currentStep?.kind === 'awakener' && currentStep.slotId === activeSlot.slotId
  const isCovenantActive =
    currentStep?.kind === 'covenant' && currentStep.slotId === activeSlot.slotId

  return (
    <section
      aria-label={mode === 'lineup' ? 'Quick lineup slot controls' : 'Mobile slot picker controls'}
      className={`builder-v2-mobile-lineup-slot-panel builder-v2-mobile-lineup-slot-panel--${mode}`}
    >
      {mode === 'lineup' && session ? (
        <div className='builder-v2-mobile-lineup-slot-meta'>
          <button
            aria-label='Previous slot'
            className='builder-v2-mobile-lineup-slot-nav'
            disabled={!canGoPreviousSlot}
            onClick={onPreviousSlot}
            type='button'
          >
            <FaChevronLeft aria-hidden />
          </button>

          <p className='builder-v2-mobile-lineup-slot-step'>
            Step {String(session.currentStepIndex + 1)} / {String(session.totalSteps)}{' '}
            <span>{currentTargetLabel}</span>
          </p>

          <button
            aria-label='Next slot'
            className='builder-v2-mobile-lineup-slot-nav'
            disabled={!canGoNextSlot}
            onClick={onNextSlot}
            type='button'
          >
            <FaChevronRight aria-hidden />
          </button>
        </div>
      ) : (
        <div className='builder-v2-mobile-lineup-slot-meta builder-v2-mobile-lineup-slot-meta--picker'>
          <p className='builder-v2-mobile-lineup-slot-step builder-v2-mobile-lineup-slot-step--picker'>
            <span className='builder-v2-mobile-lineup-slot-kicker'>Editing</span>
            <span>{pickerTargetLabel ?? activeSlot.slotLabel}</span>
          </p>
          <button className='builder-v2-mobile-lineup-done-button' onClick={onDone} type='button'>
            Close
          </button>
        </div>
      )}

      {activeSlot.isEmpty ? (
        <button
          aria-current={isAwakenerActive ? 'step' : undefined}
          aria-label={`Select ${activeSlot.slotLabel} Awakener`}
          className={`builder-v2-mobile-lineup-empty-choice ${
            isAwakenerActive ? 'builder-v2-mobile-lineup-empty-choice--active' : ''
          }`}
          onClick={() => {
            onSelectSlot(activeSlot.slotId)
          }}
          type='button'
        >
          <span>Select Awakener</span>
          <small>{activeSlot.slotLabel}</small>
        </button>
      ) : (
        <div className='builder-v2-mobile-lineup-target-row'>
          <button
            aria-current={isAwakenerActive ? 'step' : undefined}
            aria-label={`Select ${activeSlot.slotLabel} Awakener`}
            aria-pressed={isAwakenerActive}
            className={`builder-v2-mobile-lineup-target-button builder-v2-mobile-lineup-target-button--avatar ${
              isAwakenerActive ? 'builder-v2-mobile-lineup-target-button--active' : ''
            }`}
            onClick={() => {
              onSelectSlot(activeSlot.slotId)
            }}
            type='button'
          >
            <span className='builder-v2-mobile-lineup-target-avatar' aria-hidden>
              {avatarSrc ? (
                <img alt='' decoding='async' draggable={false} src={avatarSrc} />
              ) : (
                <span>{String(activeSlot.slotNumber)}</span>
              )}
            </span>
          </button>

          {activeSlot.wheelSlots.map((wheelSlot) => {
            const isWheelActive =
              currentStep?.kind === 'wheel' &&
              currentStep.slotId === activeSlot.slotId &&
              currentStep.wheelIndex === wheelSlot.wheelIndex
            const wheelNumber = String(wheelSlot.wheelIndex + 1)

            return (
              <button
                aria-current={isWheelActive ? 'step' : undefined}
                aria-label={`Select ${activeSlot.slotLabel} Wheel ${wheelNumber}`}
                aria-pressed={isWheelActive}
                className={`builder-v2-mobile-lineup-target-button ${
                  isWheelActive ? 'builder-v2-mobile-lineup-target-button--active' : ''
                }`}
                key={`${activeSlot.slotId}-lineup-control-wheel-${String(wheelSlot.wheelIndex)}`}
                onClick={() => {
                  onSelectWheelSlot(activeSlot.slotId, wheelSlot.wheelIndex)
                }}
                type='button'
              >
                <span className='builder-v2-mobile-lineup-target-icon' aria-hidden>
                  {(wheelSlot.miniAssetSrc ?? wheelSlot.assetSrc) ? (
                    <img
                      alt=''
                      decoding='async'
                      draggable={false}
                      src={wheelSlot.miniAssetSrc ?? wheelSlot.assetSrc}
                    />
                  ) : (
                    <span>+</span>
                  )}
                </span>
                <span className='builder-v2-mobile-lineup-target-label'>Wheel {wheelNumber}</span>
              </button>
            )
          })}

          <button
            aria-current={isCovenantActive ? 'step' : undefined}
            aria-label={`Select ${activeSlot.slotLabel} Covenant`}
            aria-pressed={isCovenantActive}
            className={`builder-v2-mobile-lineup-target-button ${
              isCovenantActive ? 'builder-v2-mobile-lineup-target-button--active' : ''
            }`}
            onClick={() => {
              onSelectCovenantSlot(activeSlot.slotId)
            }}
            type='button'
          >
            <span className='builder-v2-mobile-lineup-target-icon' aria-hidden>
              {activeSlot.covenantAssetSrc ? (
                <img alt='' decoding='async' draggable={false} src={activeSlot.covenantAssetSrc} />
              ) : (
                <span>+</span>
              )}
            </span>
            <span className='builder-v2-mobile-lineup-target-label'>Covenant</span>
          </button>
        </div>
      )}
    </section>
  )
}

function MobileTeamBuilder({
  model,
  onTeamActivated,
  onOpenPicker,
  onStartQuickLineup,
}: {
  model: BuilderV2Model
  onTeamActivated: () => void
  onOpenPicker: (config: MobileOpenPickerConfig) => void
  onStartQuickLineup: () => void
}) {
  const activeTeamIndex = Math.max(
    model.teams.findIndex((team) => team.isActive),
    0,
  )
  const activeTeamNumber = activeTeamIndex + 1
  const canCycleTeams = model.teams.length > 1

  const activateTeamAt = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= model.teams.length) {
      return
    }
    const nextTeam = model.teams[nextIndex]
    model.setActiveTeam(nextTeam.id)
    onTeamActivated()
  }

  const cycleTeam = (offset: number) => {
    if (model.teams.length === 0) {
      return
    }
    const nextIndex = (activeTeamIndex + offset + model.teams.length) % model.teams.length
    activateTeamAt(nextIndex)
  }

  const getSlotTitle = (slotId: string, target: string) => {
    const slot = model.slots.find((candidate) => candidate.slotId === slotId)
    return `${model.activeTeamName} · ${slot?.slotLabel ?? 'Slot'} · ${target}`
  }

  const getSlotView = (slotId: string) =>
    model.slots.find((candidate) => candidate.slotId === slotId)

  const openTeamListSlotPicker = (
    team: BuilderV2TeamSummary,
    slot: BuilderV2TeamSummarySlot,
    restoreTarget: HTMLElement | null,
  ) => {
    onOpenPicker({
      isTargetSelected:
        model.activeTeamId === team.id &&
        model.activeSelection?.kind === 'awakener' &&
        model.activeSelection.slotId === slot.slotId,
      restoreTarget,
      selectTarget: () => {
        if (model.activeTeamId !== team.id) {
          model.setActiveTeam(team.id)
        }
        model.selectAwakenerSlot(slot.slotId)
      },
      slotId: slot.slotId,
      tab: 'awakeners',
      title: getMobileSlotPickerTitle(team.name, slot.label, 'Awakener'),
    })
  }

  const openTeamListPossePicker = (
    team: BuilderV2TeamSummary,
    restoreTarget: HTMLElement | null,
  ) => {
    onOpenPicker({
      isTargetSelected: model.activeTeamId === team.id && model.activeTeamTarget?.kind === 'posse',
      restoreTarget,
      selectTarget: () => {
        if (model.activeTeamId !== team.id) {
          model.setActiveTeam(team.id)
        }
        model.selectPosse()
      },
      slotId: null,
      tab: 'posses',
      title: `${team.name} · Posse`,
    })
  }

  return (
    <section className='builder-v2-mobile-view' aria-label='Mobile team builder'>
      <div className='builder-v2-mobile-team-switcher' aria-label='Mobile team switcher'>
        <button
          aria-label='Previous team'
          className='builder-v2-mobile-switch-button'
          disabled={!canCycleTeams}
          onClick={() => {
            cycleTeam(-1)
          }}
          type='button'
        >
          <FaChevronLeft aria-hidden />
        </button>

        <label className='builder-v2-mobile-team-select-shell'>
          <span className='sr-only'>Active team</span>
          <select
            aria-label='Active team'
            className='builder-v2-mobile-team-select'
            onChange={(event) => {
              const nextIndex = model.teams.findIndex((team) => team.id === event.target.value)
              if (nextIndex >= 0) {
                activateTeamAt(nextIndex)
              }
            }}
            value={model.activeTeamId}
          >
            {model.teams.map((team, index) => (
              <option key={team.id} value={team.id}>
                {`Team ${String(index + 1)} · ${team.name}`}
              </option>
            ))}
          </select>
          <span aria-hidden className='builder-v2-mobile-team-select-label'>
            <span className='builder-v2-mobile-team-select-name'>
              Team {String(activeTeamNumber)}
            </span>
          </span>
          <FaCaretDown aria-hidden className='builder-v2-mobile-team-select-icon' />
        </label>

        <button
          aria-label='Next team'
          className='builder-v2-mobile-switch-button'
          disabled={!canCycleTeams}
          onClick={() => {
            cycleTeam(1)
          }}
          type='button'
        >
          <FaChevronRight aria-hidden />
        </button>

        {model.canAddTeam ? (
          <button
            aria-label='Create team'
            className='builder-v2-mobile-switch-button builder-v2-mobile-switch-button--add'
            onClick={() => {
              model.addTeam()
              onTeamActivated()
            }}
            type='button'
          >
            <span aria-hidden>+</span>
          </button>
        ) : null}
      </div>

      <section className='builder-v2-panel builder-v2-active-team builder-v2-mobile-active-team'>
        <BuilderV2ActiveHeader
          activePosse={model.activePosse}
          activeTeamName={model.activeTeamName}
          activeTeamTarget={model.activeTeamTarget}
          onClearPosse={model.clearPosse}
          onSelectPosse={() => {
            onOpenPicker({
              isTargetSelected: model.activeTeamTarget?.kind === 'posse',
              restoreTarget: getCurrentFocusRestoreTarget(),
              selectTarget: model.selectPosse,
              slotId: null,
              tab: 'posses',
              title: `${model.activeTeamName} · Posse`,
            })
          }}
        />

        <BuilderV2TeamSlots
          covenantPlacement='rail'
          onClearCovenant={model.clearCovenant}
          onClearWheel={model.clearWheel}
          onRemoveAwakener={model.removeAwakener}
          onSelectCovenantSlot={(slotId, restoreTarget) => {
            const slot = getSlotView(slotId)
            const shouldSelectAwakenerFirst = Boolean(slot?.isEmpty)
            const targetTab: BuilderV2PickerTab = shouldSelectAwakenerFirst
              ? 'awakeners'
              : 'covenants'

            onOpenPicker({
              isTargetSelected: shouldSelectAwakenerFirst
                ? model.activeSelection?.kind === 'awakener' &&
                  model.activeSelection.slotId === slotId
                : model.activeSelection?.kind === 'covenant' &&
                  model.activeSelection.slotId === slotId,
              restoreTarget,
              selectTarget: () => {
                if (shouldSelectAwakenerFirst) {
                  model.selectAwakenerSlot(slotId)
                  return
                }

                model.selectCovenantSlot(slotId)
              },
              slotId,
              tab: targetTab,
              title: getSlotTitle(slotId, shouldSelectAwakenerFirst ? 'Awakener' : 'Covenant'),
            })
          }}
          onSelectSlot={(slotId, restoreTarget) => {
            onOpenPicker({
              isTargetSelected:
                model.activeSelection?.kind === 'awakener' &&
                model.activeSelection.slotId === slotId,
              restoreTarget,
              selectTarget: () => {
                model.selectAwakenerSlot(slotId)
              },
              slotId,
              tab: 'awakeners',
              title: getSlotTitle(slotId, 'Awakener'),
            })
          }}
          onSelectWheelSlot={(slotId, wheelIndex, restoreTarget) => {
            const slot = getSlotView(slotId)
            const shouldSelectAwakenerFirst = Boolean(slot?.isEmpty)
            const targetTab: BuilderV2PickerTab = shouldSelectAwakenerFirst ? 'awakeners' : 'wheels'

            onOpenPicker({
              isTargetSelected: shouldSelectAwakenerFirst
                ? model.activeSelection?.kind === 'awakener' &&
                  model.activeSelection.slotId === slotId
                : model.activeSelection?.kind === 'wheel' &&
                  model.activeSelection.slotId === slotId &&
                  model.activeSelection.wheelIndex === wheelIndex,
              restoreTarget,
              selectTarget: () => {
                if (shouldSelectAwakenerFirst) {
                  model.selectAwakenerSlot(slotId)
                  return
                }

                model.selectWheelSlot(slotId, wheelIndex)
              },
              slotId,
              tab: targetTab,
              title: getSlotTitle(
                slotId,
                shouldSelectAwakenerFirst ? 'Awakener' : `Wheel ${String(wheelIndex + 1)}`,
              ),
            })
          }}
          quickLineupActive={Boolean(model.quickLineupSession)}
          slots={model.slots}
        />

        <BuilderV2ActiveFooter
          editingLabel={model.editingLabel}
          onCancelQuickLineup={model.cancelQuickLineup}
          onFinishQuickLineup={model.finishQuickLineup}
          onGoBackQuickLineupStep={model.goBackQuickLineupStep}
          onSkipQuickLineupStep={model.skipQuickLineupStep}
          onStartQuickLineup={onStartQuickLineup}
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
        onRequestExportTeam={model.openTeamExportDialog}
        onRequestApplyTeamTemplate={model.requestApplyTeamTemplate}
        onRequestDeleteTeam={model.requestDeleteTeam}
        onRequestEditTeamPosse={openTeamListPossePicker}
        onRequestEditTeamSlot={openTeamListSlotPicker}
        onRequestResetTeam={model.requestResetTeam}
        onSetActiveTeam={model.setActiveTeam}
        onSetEditingTeamName={model.setEditingTeamName}
        onTeamActivated={onTeamActivated}
        onTeamPreviewModeChange={model.setTeamPreviewMode}
        teamPreviewMode={model.teamPreviewMode}
        teams={model.teams}
        utilityActions={<BuilderV2ImportExportActions model={model} />}
        variant='mobile'
      />
    </section>
  )
}

function getQuickLineupPickingTitle(step: QuickLineupStep, slots: BuilderV2SlotView[]): string {
  if (step.kind === 'posse') {
    return 'Team · Posse'
  }

  const slot = slots.find((candidate) => candidate.slotId === step.slotId)
  const slotLabel = slot?.slotLabel ?? 'Slot'
  if (step.kind === 'awakener') {
    return `${slotLabel} · Awakener`
  }
  if (step.kind === 'covenant') {
    return `${slotLabel} · Covenant`
  }
  return `${slotLabel} · Wheel ${String(step.wheelIndex + 1)}`
}

function getMobileSlotPickerTitle(
  activeTeamName: string,
  slotLabel: string,
  targetLabel: string,
): string {
  return `${activeTeamName} · ${slotLabel} · ${targetLabel}`
}

function getMobileSlotPickerPanelLabel(slot: BuilderV2SlotView): string {
  return `${slot.slotLabel} · ${slot.awakener?.displayName ?? 'Empty Slot'}`
}

function getQuickLineupActiveSlot(
  step: QuickLineupStep,
  slots: BuilderV2SlotView[],
): BuilderV2SlotView | null {
  if (step.kind === 'posse') {
    return slots[slots.length - 1] ?? null
  }

  return slots.find((slot) => slot.slotId === step.slotId) ?? null
}

type BuilderV2TeamSlotsProps = Parameters<typeof BuilderV2TeamSlots>[0]

function MobileLineupRealmBadge({
  realm,
}: {
  realm: NonNullable<BuilderV2SlotView['awakener']>['realm']
}) {
  const realmBadge = getRealmBadge(realm)
  const realmLabel = getRealmLabel(realm)

  if (!realmBadge) {
    return <span className='builder-v2-mobile-lineup-realm-text'>{realmLabel.slice(0, 1)}</span>
  }

  return (
    <span className='builder-v2-mobile-lineup-realm-badge'>
      <img alt='' draggable={false} src={realmBadge} />
      <span className='sr-only'>{realmLabel}</span>
    </span>
  )
}

function scrollToMobileLineupStart() {
  if (window.navigator.userAgent.toLowerCase().includes('jsdom')) {
    return
  }

  window.requestAnimationFrame(() => {
    window.scrollTo({top: 0, behavior: 'smooth'})
  })
}

function getCurrentFocusRestoreTarget(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}

function trapDialogFocus(event: KeyboardEvent, dialog: HTMLElement | null) {
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
