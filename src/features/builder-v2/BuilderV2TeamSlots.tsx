import {memo, useCallback} from 'react'

import {useDraggable, useDroppable} from '@dnd-kit/core'

import {getRealmBadge, getRealmLabel} from '@/domain/realms'

import type {WheelSlotIndex} from '../builder/types'
import {
  createBuilderV2TeamAwakenerDragPayload,
  createBuilderV2TeamCovenantDragPayload,
  createBuilderV2TeamWheelDragPayload,
  makeBuilderV2CovenantDndId,
  makeBuilderV2SlotDndId,
  makeBuilderV2TeamAwakenerDragId,
  makeBuilderV2TeamCovenantDragId,
  makeBuilderV2TeamWheelDragId,
  makeBuilderV2WheelDndId,
  type BuilderV2DropTargetDescriptor,
} from './builder-v2-dnd'
import {useBuilderV2DndEnabled} from './BuilderV2DndCapability'
import {BuilderV2EnlightenMeter} from './BuilderV2EnlightenMeter'
import type {BuilderV2SlotView, BuilderV2WheelSlotView} from './BuilderV2ModelTypes'

type BuilderV2AwakenerRealm = NonNullable<BuilderV2SlotView['awakener']>['realm']

interface BuilderV2TeamSlotsProps {
  slots: BuilderV2SlotView[]
  isDragActive?: boolean
  predictedDropTarget?: BuilderV2DropTargetDescriptor | null
  quickLineupActive?: boolean
  onClearCovenant: (slotId: string) => void
  onClearWheel: (slotId: string, wheelIndex: WheelSlotIndex) => void
  onRemoveAwakener: (slotId: string) => void
  onSelectCovenantSlot: (slotId: string, restoreTarget?: HTMLElement | null) => void
  onSelectSlot: (slotId: string, restoreTarget?: HTMLElement | null) => void
  onSelectWheelSlot: (
    slotId: string,
    wheelIndex: WheelSlotIndex,
    restoreTarget?: HTMLElement | null,
  ) => void
}

export function BuilderV2TeamSlots({
  onClearCovenant,
  onClearWheel,
  isDragActive = false,
  quickLineupActive = false,
  predictedDropTarget = null,
  slots,
  onRemoveAwakener,
  onSelectCovenantSlot,
  onSelectSlot,
  onSelectWheelSlot,
}: BuilderV2TeamSlotsProps) {
  return (
    <div className='builder-v2-slot-grid' aria-label='Builder V2 active team slots'>
      {slots.map((slot) => (
        <BuilderV2SlotCard
          key={slot.slotId}
          onClearCovenant={onClearCovenant}
          onClearWheel={onClearWheel}
          onRemoveAwakener={onRemoveAwakener}
          onSelectCovenantSlot={onSelectCovenantSlot}
          onSelectSlot={onSelectSlot}
          onSelectWheelSlot={onSelectWheelSlot}
          isDragActive={isDragActive}
          predictedDropTarget={predictedDropTarget}
          quickLineupActive={quickLineupActive}
          slot={slot}
        />
      ))}
    </div>
  )
}

interface BuilderV2SlotCardProps {
  slot: BuilderV2SlotView
  isDragActive: boolean
  predictedDropTarget: BuilderV2DropTargetDescriptor | null
  quickLineupActive: boolean
  onClearCovenant: (slotId: string) => void
  onClearWheel: (slotId: string, wheelIndex: WheelSlotIndex) => void
  onRemoveAwakener: (slotId: string) => void
  onSelectCovenantSlot: (slotId: string, restoreTarget?: HTMLElement | null) => void
  onSelectSlot: (slotId: string, restoreTarget?: HTMLElement | null) => void
  onSelectWheelSlot: (
    slotId: string,
    wheelIndex: WheelSlotIndex,
    restoreTarget?: HTMLElement | null,
  ) => void
}

const BuilderV2SlotCard = memo(function BuilderV2SlotCard({
  onClearCovenant,
  onClearWheel,
  onRemoveAwakener,
  onSelectCovenantSlot,
  onSelectSlot,
  onSelectWheelSlot,
  isDragActive,
  predictedDropTarget,
  quickLineupActive,
  slot,
}: BuilderV2SlotCardProps) {
  const isDndEnabled = useBuilderV2DndEnabled()
  const awakenerDragPayload = createBuilderV2TeamAwakenerDragPayload(slot)
  const covenantDragPayload = createBuilderV2TeamCovenantDragPayload(slot)
  const {isOver: isSlotOver, setNodeRef: setSlotDropRef} = useDroppable({
    id: makeBuilderV2SlotDndId(slot.slotId),
    disabled: !isDndEnabled,
  })
  const {isOver: isCovenantOver, setNodeRef: setCovenantDropRef} = useDroppable({
    id: makeBuilderV2CovenantDndId(slot.slotId),
    disabled: !isDndEnabled,
  })
  const {listeners: awakenerDragListeners, setNodeRef: setAwakenerDragRef} = useDraggable({
    id: makeBuilderV2TeamAwakenerDragId(slot.slotId),
    data: awakenerDragPayload ?? undefined,
    disabled: !isDndEnabled || !awakenerDragPayload,
  })
  const {listeners: covenantDragListeners, setNodeRef: setCovenantDragRef} = useDraggable({
    id: makeBuilderV2TeamCovenantDragId(slot.slotId),
    data: covenantDragPayload ?? undefined,
    disabled: !isDndEnabled || !covenantDragPayload,
  })
  const setCovenantDragDropRef = useMergedRefs(setCovenantDropRef, setCovenantDragRef)
  const canDragAwakener = isDndEnabled && Boolean(awakenerDragPayload)
  const canDragCovenant = isDndEnabled && Boolean(covenantDragPayload)
  const setCovenantNodeRef = canDragCovenant ? setCovenantDragDropRef : setCovenantDropRef
  const isSlotDropTarget =
    isDndEnabled &&
    (isDragActive ? isPredictedSlotDropTarget(predictedDropTarget, slot.slotId) : isSlotOver)
  const isCovenantDropTarget =
    isDndEnabled &&
    (isDragActive
      ? isPredictedCovenantDropTarget(predictedDropTarget, slot.slotId)
      : isCovenantOver)

  return (
    <article
      className={`builder-v2-slot-card ${slot.isSelected ? 'builder-v2-slot-card--active' : ''} ${
        isSlotDropTarget ? 'builder-v2-slot-card--drop-target' : ''
      }`}
      data-slot-id={slot.slotId}
      ref={isDndEnabled ? setSlotDropRef : undefined}
    >
      <span className='sr-only'>{slot.slotLabel}</span>

      <div className='builder-v2-awakener-frame'>
        <button
          {...(canDragAwakener && awakenerDragListeners ? awakenerDragListeners : {})}
          aria-label={`Select ${slot.slotLabel}`}
          aria-pressed={slot.isSelected}
          className='builder-v2-awakener-art-target'
          onClick={(event) => {
            onSelectSlot(slot.slotId, event.currentTarget)
          }}
          ref={canDragAwakener ? setAwakenerDragRef : undefined}
          type='button'
        >
          <span className='builder-v2-awakener-art'>
            {(slot.awakener?.cardSrc ?? slot.awakener?.portraitSrc) ? (
              <img
                alt=''
                className='builder-v2-awakener-art-image'
                decoding='async'
                draggable={false}
                fetchPriority='low'
                src={slot.awakener.cardSrc ?? slot.awakener.portraitSrc}
              />
            ) : slot.awakener ? (
              <span aria-hidden className='builder-v2-empty-mark builder-v2-empty-mark--art'>
                {slot.awakener.displayName.slice(0, 1)}
              </span>
            ) : (
              <span aria-hidden className='builder-v2-empty-mark builder-v2-empty-mark--art'>
                +
              </span>
            )}
          </span>
        </button>

        <div className='builder-v2-awakener-top-meta'>
          {slot.awakener ? (
            <AwakenerRealmBadge realm={slot.awakener.realm} />
          ) : (
            <span aria-hidden className='builder-v2-awakener-realm-placeholder' />
          )}
          {slot.awakener?.isSupport ? (
            <span className='builder-v2-slot-tag builder-v2-slot-tag--support'>Support</span>
          ) : null}
          <span className='builder-v2-awakener-action-row'>
            {slot.awakener && !quickLineupActive ? (
              <button
                aria-label={`Remove ${slot.awakener.displayName}`}
                className='builder-v2-awakener-action'
                onClick={() => {
                  onRemoveAwakener(slot.slotId)
                }}
                type='button'
              >
                <span aria-hidden>×</span>
              </button>
            ) : null}
          </span>
        </div>

        <div className='builder-v2-awakener-bottom-meta'>
          <div className='builder-v2-awakener-meta-copy'>
            {slot.awakener ? (
              <span className='builder-v2-slot-level'>Lv. {String(slot.awakener.level)}</span>
            ) : null}
            <span className='builder-v2-slot-name ui-title'>
              {slot.awakener?.displayName ?? 'Empty Slot'}
            </span>
            {slot.awakener ? (
              <BuilderV2EnlightenMeter level={slot.awakener.enlightenLevel} />
            ) : (
              <span className='builder-v2-slot-meta'>Select an awakener</span>
            )}
          </div>

          <div className='builder-v2-covenant-slot'>
            <button
              {...(canDragCovenant && covenantDragListeners ? covenantDragListeners : {})}
              aria-label={`Select ${slot.slotLabel} Covenant`}
              aria-pressed={slot.isCovenantSelected}
              className={`builder-v2-covenant-inline ${
                slot.isCovenantSelected ? 'builder-v2-covenant-inline--active' : ''
              } ${isCovenantDropTarget ? 'builder-v2-covenant-inline--drop-target' : ''}`}
              onClick={(event) => {
                onSelectCovenantSlot(slot.slotId, event.currentTarget)
              }}
              ref={isDndEnabled ? setCovenantNodeRef : undefined}
              title={slot.covenantName ?? 'Covenant'}
              type='button'
            >
              {slot.covenantAssetSrc ? (
                <img
                  alt=''
                  decoding='async'
                  draggable={false}
                  fetchPriority='low'
                  src={slot.covenantAssetSrc}
                />
              ) : (
                <span aria-hidden>+</span>
              )}
              <span className='sr-only'>{slot.covenantName ?? 'Covenant'}</span>
            </button>
            {slot.covenantId && !quickLineupActive ? (
              <button
                aria-label={`Clear ${slot.slotLabel} Covenant`}
                className='builder-v2-covenant-inline-clear'
                onClick={() => {
                  onClearCovenant(slot.slotId)
                }}
                type='button'
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className='builder-v2-wheel-pair' aria-label={`${slot.slotLabel} wheels`}>
        {slot.wheelSlots.map((wheelSlot) => (
          <SlotWheelChip
            key={`${slot.slotId}-wheel-${String(wheelSlot.wheelIndex)}`}
            onClear={() => {
              onClearWheel(slot.slotId, wheelSlot.wheelIndex)
            }}
            onSelect={(restoreTarget) => {
              onSelectWheelSlot(slot.slotId, wheelSlot.wheelIndex, restoreTarget)
            }}
            quickLineupActive={quickLineupActive}
            isDragActive={isDragActive}
            predictedDropTarget={predictedDropTarget}
            slot={slot}
            wheelSlot={wheelSlot}
          />
        ))}
      </div>
    </article>
  )
}, areSlotCardPropsEqual)

function areSlotCardPropsEqual(
  previous: BuilderV2SlotCardProps,
  next: BuilderV2SlotCardProps,
): boolean {
  return (
    previous.quickLineupActive === next.quickLineupActive &&
    previous.isDragActive === next.isDragActive &&
    isSameDropTarget(previous.predictedDropTarget, next.predictedDropTarget) &&
    previous.onClearCovenant === next.onClearCovenant &&
    previous.onClearWheel === next.onClearWheel &&
    previous.onRemoveAwakener === next.onRemoveAwakener &&
    previous.onSelectCovenantSlot === next.onSelectCovenantSlot &&
    previous.onSelectSlot === next.onSelectSlot &&
    previous.onSelectWheelSlot === next.onSelectWheelSlot &&
    areSlotViewsEqual(previous.slot, next.slot)
  )
}

function areSlotViewsEqual(previous: BuilderV2SlotView, next: BuilderV2SlotView): boolean {
  return (
    previous.slotId === next.slotId &&
    previous.slotNumber === next.slotNumber &&
    previous.slotLabel === next.slotLabel &&
    previous.isSelected === next.isSelected &&
    previous.isEmpty === next.isEmpty &&
    previous.covenantId === next.covenantId &&
    previous.covenantName === next.covenantName &&
    previous.covenantAssetSrc === next.covenantAssetSrc &&
    previous.isCovenantSelected === next.isCovenantSelected &&
    previous.wheels[0] === next.wheels[0] &&
    previous.wheels[1] === next.wheels[1] &&
    areSlotAwakenersEqual(previous.awakener, next.awakener) &&
    areWheelSlotViewsEqual(previous.wheelSlots[0], next.wheelSlots[0]) &&
    areWheelSlotViewsEqual(previous.wheelSlots[1], next.wheelSlots[1])
  )
}

function areSlotAwakenersEqual(
  previous: BuilderV2SlotView['awakener'],
  next: BuilderV2SlotView['awakener'],
): boolean {
  if (previous === next) {
    return true
  }
  if (!previous || !next) {
    return false
  }
  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.displayName === next.displayName &&
    previous.realm === next.realm &&
    previous.level === next.level &&
    previous.enlightenLevel === next.enlightenLevel &&
    previous.cardSrc === next.cardSrc &&
    previous.portraitSrc === next.portraitSrc &&
    previous.isSupport === next.isSupport
  )
}

function areWheelSlotViewsEqual(
  previous: BuilderV2WheelSlotView,
  next: BuilderV2WheelSlotView,
): boolean {
  return (
    previous.wheelIndex === next.wheelIndex &&
    previous.label === next.label &&
    previous.wheelId === next.wheelId &&
    previous.wheelName === next.wheelName &&
    previous.miniAssetSrc === next.miniAssetSrc &&
    previous.assetSrc === next.assetSrc &&
    previous.enlightenLevel === next.enlightenLevel &&
    previous.isSelected === next.isSelected
  )
}

function isPredictedSlotDropTarget(
  target: BuilderV2DropTargetDescriptor | null,
  slotId: string,
): boolean {
  return target?.kind === 'slot' && target.slotId === slotId
}

function isPredictedCovenantDropTarget(
  target: BuilderV2DropTargetDescriptor | null,
  slotId: string,
): boolean {
  return target?.kind === 'covenant' && target.slotId === slotId
}

function isPredictedWheelDropTarget(
  target: BuilderV2DropTargetDescriptor | null,
  slotId: string,
  wheelIndex: WheelSlotIndex,
): boolean {
  return target?.kind === 'wheel' && target.slotId === slotId && target.wheelIndex === wheelIndex
}

function isSameDropTarget(
  previous: BuilderV2DropTargetDescriptor | null,
  next: BuilderV2DropTargetDescriptor | null,
): boolean {
  if (previous === next) {
    return true
  }
  if (!previous || previous.kind !== next?.kind) {
    return false
  }

  switch (previous.kind) {
    case 'slot':
    case 'covenant':
      return next.kind === previous.kind && previous.slotId === next.slotId
    case 'wheel':
      return (
        next.kind === 'wheel' &&
        previous.slotId === next.slotId &&
        previous.wheelIndex === next.wheelIndex
      )
    case 'picker':
    case 'posse':
      return true
  }
}

function useMergedRefs<T extends HTMLElement>(
  firstRef: (element: T | null) => void,
  secondRef: (element: T | null) => void,
) {
  return useCallback(
    (element: T | null) => {
      firstRef(element)
      secondRef(element)
    },
    [firstRef, secondRef],
  )
}

function AwakenerRealmBadge({realm}: {realm: BuilderV2AwakenerRealm}) {
  const realmBadge = getRealmBadge(realm)
  const realmLabel = getRealmLabel(realm)

  if (!realmBadge) {
    return <span className='builder-v2-awakener-realm-text'>{realmLabel}</span>
  }

  return (
    <span className='builder-v2-awakener-realm'>
      <img alt='' draggable={false} src={realmBadge} />
      <span className='sr-only'>{realmLabel}</span>
    </span>
  )
}

function SlotWheelChip({
  onClear,
  onSelect,
  quickLineupActive,
  isDragActive,
  predictedDropTarget,
  slot,
  wheelSlot,
}: {
  onClear: () => void
  onSelect: (restoreTarget?: HTMLElement | null) => void
  quickLineupActive: boolean
  isDragActive: boolean
  predictedDropTarget: BuilderV2DropTargetDescriptor | null
  slot: BuilderV2SlotView
  wheelSlot: BuilderV2WheelSlotView
}) {
  const isDndEnabled = useBuilderV2DndEnabled()
  const wheelDragPayload = createBuilderV2TeamWheelDragPayload(slot, wheelSlot.wheelIndex)
  const {isOver: isWheelOver, setNodeRef: setWheelDropRef} = useDroppable({
    id: makeBuilderV2WheelDndId(slot.slotId, wheelSlot.wheelIndex),
    disabled: !isDndEnabled,
  })
  const {listeners: wheelDragListeners, setNodeRef: setWheelDragRef} = useDraggable({
    id: makeBuilderV2TeamWheelDragId(slot.slotId, wheelSlot.wheelIndex),
    data: wheelDragPayload ?? undefined,
    disabled: !isDndEnabled || !wheelDragPayload,
  })
  const setWheelDragDropRef = useMergedRefs(setWheelDropRef, setWheelDragRef)
  const canDragWheel = isDndEnabled && Boolean(wheelDragPayload)
  const setWheelNodeRef = canDragWheel ? setWheelDragDropRef : setWheelDropRef
  const isWheelDropTarget =
    isDndEnabled &&
    (isDragActive
      ? isPredictedWheelDropTarget(predictedDropTarget, slot.slotId, wheelSlot.wheelIndex)
      : isWheelOver)

  return (
    <div
      className={`builder-v2-wheel-chip ${
        wheelSlot.isSelected ? 'builder-v2-wheel-chip--active' : ''
      } ${isWheelDropTarget ? 'builder-v2-wheel-chip--drop-target' : ''}`}
    >
      <button
        {...(canDragWheel && wheelDragListeners ? wheelDragListeners : {})}
        aria-label={`Select ${wheelSlot.label}`}
        aria-pressed={wheelSlot.isSelected}
        className='builder-v2-wheel-target'
        onClick={(event) => {
          onSelect(event.currentTarget)
        }}
        ref={isDndEnabled ? setWheelNodeRef : undefined}
        type='button'
      >
        <span className='builder-v2-wheel-art' aria-hidden>
          {wheelSlot.assetSrc ? (
            <img
              alt=''
              decoding='async'
              draggable={false}
              fetchPriority='low'
              src={wheelSlot.assetSrc}
            />
          ) : (
            <span className='builder-v2-empty-mark builder-v2-empty-mark--wheel'>+</span>
          )}
        </span>
        <span className='builder-v2-wheel-copy'>
          {wheelSlot.wheelId ? (
            <BuilderV2EnlightenMeter level={wheelSlot.enlightenLevel} variant='compact' />
          ) : (
            <span className='builder-v2-wheel-empty-label'>Empty</span>
          )}
        </span>
      </button>
      {wheelSlot.wheelId && !quickLineupActive ? (
        <button
          aria-label={`Clear ${wheelSlot.label}`}
          className='builder-v2-equipment-clear builder-v2-equipment-clear--wheel'
          onClick={onClear}
          type='button'
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}
