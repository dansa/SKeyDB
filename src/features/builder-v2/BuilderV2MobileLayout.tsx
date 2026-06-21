import {useCallback, useRef, useState, type ReactNode} from 'react'

import {FaCaretDown, FaCheck, FaChevronLeft, FaChevronRight, FaXmark} from 'react-icons/fa6'

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
import {BuilderV2RealmBadge} from './BuilderV2RealmBadge'
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

type MobilePickerTargetRequest =
  | {kind: 'slot'; slotId: string; team?: BuilderV2TeamSummary; slotLabel?: string}
  | {kind: 'wheel'; slotId: string; wheelIndex: WheelSlotIndex}
  | {kind: 'covenant'; slotId: string}
  | {kind: 'posse'; team?: BuilderV2TeamSummary}

type MobilePickerTargetConfig = Omit<MobileOpenPickerConfig, 'restoreTarget'>

function resolveMobilePickerTarget(
  model: BuilderV2Model,
  request: MobilePickerTargetRequest,
): MobilePickerTargetConfig {
  if (request.kind === 'posse') {
    const team = request.team
    const teamName = team?.name ?? model.activeTeamName
    const teamId = team?.id ?? model.activeTeamId
    return {
      isTargetSelected: model.activeTeamId === teamId && model.activeTeamTarget?.kind === 'posse',
      selectTarget: () => {
        if (model.activeTeamId !== teamId) {
          model.setActiveTeam(teamId)
        }
        model.selectPosse()
      },
      slotId: null,
      tab: 'posses',
      title: `${teamName} · Posse`,
    }
  }

  const slot = model.slots.find((candidate) => candidate.slotId === request.slotId)
  const team = request.kind === 'slot' ? request.team : undefined
  const teamName = team?.name ?? model.activeTeamName
  const teamId = team?.id ?? model.activeTeamId
  const slotLabel =
    request.kind === 'slot' ? (request.slotLabel ?? slot?.slotLabel) : slot?.slotLabel
  const titleFor = (target: string) =>
    getMobileSlotPickerTitle(teamName, slotLabel ?? 'Slot', target)
  const shouldSelectAwakenerFirst = request.kind !== 'slot' && Boolean(slot?.isEmpty)

  if (request.kind === 'slot' || shouldSelectAwakenerFirst) {
    return {
      isTargetSelected:
        model.activeTeamId === teamId &&
        model.activeSelection?.kind === 'awakener' &&
        model.activeSelection.slotId === request.slotId,
      selectTarget: () => {
        if (model.activeTeamId !== teamId) {
          model.setActiveTeam(teamId)
        }
        model.selectAwakenerSlot(request.slotId)
      },
      slotId: request.slotId,
      tab: 'awakeners',
      title: titleFor('Awakener'),
    }
  }

  if (request.kind === 'wheel') {
    return {
      isTargetSelected:
        model.activeSelection?.kind === 'wheel' &&
        model.activeSelection.slotId === request.slotId &&
        model.activeSelection.wheelIndex === request.wheelIndex,
      selectTarget: () => {
        model.selectWheelSlot(request.slotId, request.wheelIndex)
      },
      slotId: request.slotId,
      tab: 'wheels',
      title: titleFor(`Wheel ${String(request.wheelIndex + 1)}`),
    }
  }

  return {
    isTargetSelected:
      model.activeSelection?.kind === 'covenant' && model.activeSelection.slotId === request.slotId,
    selectTarget: () => {
      model.selectCovenantSlot(request.slotId)
    },
    slotId: request.slotId,
    tab: 'covenants',
    title: titleFor('Covenant'),
  }
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
    (target: MobilePickerTargetConfig) => {
      if (!target.isTargetSelected) {
        target.selectTarget()
      }
      model.setPickerTab(target.tab)
      if (target.slotId) {
        onUpdateMobilePickerTarget(target.slotId, target.tab, target.title)
      }
    },
    [model, onUpdateMobilePickerTarget],
  )
  const selectSlotAwakenerTarget = useCallback(
    (slotId: string) => {
      updateSlotPickerTarget(resolveMobilePickerTarget(model, {kind: 'slot', slotId}))
    },
    [model, updateSlotPickerTarget],
  )
  const selectSlotWheelTarget = useCallback(
    (slotId: string, wheelIndex: WheelSlotIndex) => {
      updateSlotPickerTarget(resolveMobilePickerTarget(model, {kind: 'wheel', slotId, wheelIndex}))
    },
    [model, updateSlotPickerTarget],
  )
  const selectSlotCovenantTarget = useCallback(
    (slotId: string) => {
      updateSlotPickerTarget(resolveMobilePickerTarget(model, {kind: 'covenant', slotId}))
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
              <FaCheck aria-hidden className='builder-v2-mobile-lineup-header-action-icon' />
              <span>Finish</span>
            </button>
            <button
              aria-label='Cancel quick team lineup'
              className='builder-v2-mobile-lineup-header-action builder-v2-mobile-lineup-header-action--danger'
              onClick={model.cancelQuickLineup}
              type='button'
            >
              <FaXmark aria-hidden className='builder-v2-mobile-lineup-header-action-icon' />
              <span>Cancel</span>
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
          categoryTabs='hidden'
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
                if (slot.isEmpty) {
                  return (
                    <BuilderV2MobileOverviewGearCell
                      ariaLabel={wheelSlot.label}
                      isInert
                      key={`${slot.slotId}-lineup-wheel-${String(wheelSlot.wheelIndex)}`}
                    >
                      <span aria-hidden>+</span>
                    </BuilderV2MobileOverviewGearCell>
                  )
                }

                const wheelActionLabel = `Select ${wheelSlot.label}`
                const wheelTitle = wheelSlot.wheelName ?? wheelSlot.label

                return (
                  <BuilderV2MobileOverviewGearCell
                    ariaLabel={wheelActionLabel}
                    isActive={wheelSlot.isSelected}
                    key={`${slot.slotId}-lineup-wheel-${String(wheelSlot.wheelIndex)}`}
                    onClick={() => {
                      onSelectWheelSlot(slot.slotId, wheelSlot.wheelIndex)
                    }}
                    title={wheelTitle}
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
                  </BuilderV2MobileOverviewGearCell>
                )
              })}

              {slot.isEmpty ? (
                <BuilderV2MobileOverviewGearCell ariaLabel={`${slot.slotLabel} Covenant`} isInert>
                  <span aria-hidden>+</span>
                </BuilderV2MobileOverviewGearCell>
              ) : (
                <BuilderV2MobileOverviewGearCell
                  ariaLabel={`Select ${slot.slotLabel} Covenant`}
                  isActive={slot.isCovenantSelected}
                  onClick={() => {
                    onSelectCovenantSlot(slot.slotId)
                  }}
                  title={slot.covenantName ?? `${slot.slotLabel} Covenant`}
                >
                  {slot.covenantAssetSrc ? (
                    <img alt='' decoding='async' draggable={false} src={slot.covenantAssetSrc} />
                  ) : (
                    <span aria-hidden>+</span>
                  )}
                </BuilderV2MobileOverviewGearCell>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function BuilderV2MobileOverviewGearCell({
  ariaLabel,
  children,
  isActive,
  isInert,
  onClick,
  title,
}: {
  ariaLabel: string
  children: ReactNode
  isActive?: boolean
  isInert?: boolean
  onClick?: () => void
  title?: string
}) {
  if (isInert) {
    return (
      <span
        aria-hidden='true'
        className='builder-v2-mobile-lineup-gear-button builder-v2-mobile-lineup-gear-button--inert'
      >
        {children}
      </span>
    )
  }

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`builder-v2-mobile-lineup-gear-button ${
        isActive ? 'builder-v2-mobile-lineup-gear-button--active' : ''
      }`}
      onClick={onClick}
      title={title}
      type='button'
    >
      {children}
    </button>
  )
}

function BuilderV2MobileLineupTargetButton({
  ariaLabel,
  children,
  className,
  isActive,
  isCurrentStep,
  onClick,
}: {
  ariaLabel: string
  children: ReactNode
  className?: string
  isActive?: boolean
  isCurrentStep: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-current={isCurrentStep ? 'step' : undefined}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`builder-v2-mobile-lineup-target-button ${
        className ? `${className} ` : ''
      }${isActive ? 'builder-v2-mobile-lineup-target-button--active' : ''}`}
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
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
          <BuilderV2MobileLineupTargetButton
            ariaLabel={`Select ${activeSlot.slotLabel} Awakener`}
            className='builder-v2-mobile-lineup-target-button--avatar'
            isActive={isAwakenerActive}
            isCurrentStep={isAwakenerActive}
            onClick={() => {
              onSelectSlot(activeSlot.slotId)
            }}
          >
            <span className='builder-v2-mobile-lineup-target-avatar' aria-hidden>
              {avatarSrc ? (
                <img alt='' decoding='async' draggable={false} src={avatarSrc} />
              ) : (
                <span>{String(activeSlot.slotNumber)}</span>
              )}
            </span>
          </BuilderV2MobileLineupTargetButton>

          {activeSlot.wheelSlots.map((wheelSlot) => {
            const isWheelActive =
              currentStep?.kind === 'wheel' &&
              currentStep.slotId === activeSlot.slotId &&
              currentStep.wheelIndex === wheelSlot.wheelIndex
            const wheelNumber = String(wheelSlot.wheelIndex + 1)

            return (
              <BuilderV2MobileLineupTargetButton
                ariaLabel={`Select ${activeSlot.slotLabel} Wheel ${wheelNumber}`}
                isActive={isWheelActive}
                isCurrentStep={isWheelActive}
                key={`${activeSlot.slotId}-lineup-control-wheel-${String(wheelSlot.wheelIndex)}`}
                onClick={() => {
                  onSelectWheelSlot(activeSlot.slotId, wheelSlot.wheelIndex)
                }}
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
              </BuilderV2MobileLineupTargetButton>
            )
          })}

          <BuilderV2MobileLineupTargetButton
            ariaLabel={`Select ${activeSlot.slotLabel} Covenant`}
            isActive={isCovenantActive}
            isCurrentStep={isCovenantActive}
            onClick={() => {
              onSelectCovenantSlot(activeSlot.slotId)
            }}
          >
            <span className='builder-v2-mobile-lineup-target-icon' aria-hidden>
              {activeSlot.covenantAssetSrc ? (
                <img alt='' decoding='async' draggable={false} src={activeSlot.covenantAssetSrc} />
              ) : (
                <span>+</span>
              )}
            </span>
            <span className='builder-v2-mobile-lineup-target-label'>Covenant</span>
          </BuilderV2MobileLineupTargetButton>
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

  const openTeamListSlotPicker = (
    team: BuilderV2TeamSummary,
    slot: BuilderV2TeamSummarySlot,
    restoreTarget: HTMLElement | null,
  ) => {
    onOpenPicker({
      ...resolveMobilePickerTarget(model, {
        kind: 'slot',
        slotId: slot.slotId,
        slotLabel: slot.label,
        team,
      }),
      restoreTarget,
    })
  }

  const openTeamListPossePicker = (
    team: BuilderV2TeamSummary,
    restoreTarget: HTMLElement | null,
  ) => {
    onOpenPicker({
      ...resolveMobilePickerTarget(model, {kind: 'posse', team}),
      restoreTarget,
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
              ...resolveMobilePickerTarget(model, {kind: 'posse'}),
              restoreTarget: getCurrentFocusRestoreTarget(),
            })
          }}
        />

        <BuilderV2TeamSlots
          covenantPlacement='rail'
          onClearCovenant={model.clearCovenant}
          onClearWheel={model.clearWheel}
          onRemoveAwakener={model.removeAwakener}
          onSelectCovenantSlot={(slotId, restoreTarget) => {
            onOpenPicker({
              ...resolveMobilePickerTarget(model, {kind: 'covenant', slotId}),
              restoreTarget,
            })
          }}
          onSelectSlot={(slotId, restoreTarget) => {
            onOpenPicker({
              ...resolveMobilePickerTarget(model, {kind: 'slot', slotId}),
              restoreTarget,
            })
          }}
          onSelectWheelSlot={(slotId, wheelIndex, restoreTarget) => {
            onOpenPicker({
              ...resolveMobilePickerTarget(model, {kind: 'wheel', slotId, wheelIndex}),
              restoreTarget,
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
  return (
    <BuilderV2RealmBadge
      badgeClassName='builder-v2-mobile-lineup-realm-badge'
      fallbackClassName='builder-v2-mobile-lineup-realm-text'
      fallbackLabel={(realmLabel) => realmLabel.slice(0, 1)}
      realm={realm}
    />
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
