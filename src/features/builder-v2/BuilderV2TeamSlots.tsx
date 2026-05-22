import {memo} from 'react'

import {getRealmBadge, getRealmLabel} from '@/domain/realms'

import type {BuilderV2SlotView, BuilderV2WheelSlotView} from './BuilderV2ModelTypes'

type BuilderV2AwakenerRealm = NonNullable<BuilderV2SlotView['awakener']>['realm']

interface BuilderV2TeamSlotsProps {
  slots: BuilderV2SlotView[]
  quickLineupActive?: boolean
  onClearCovenant: (slotId: string) => void
  onClearWheel: (slotId: string, wheelIndex: 0 | 1) => void
  onRemoveAwakener: (slotId: string) => void
  onSelectCovenantSlot: (slotId: string) => void
  onSelectSlot: (slotId: string) => void
  onSelectWheelSlot: (slotId: string, wheelIndex: 0 | 1) => void
}

export function BuilderV2TeamSlots({
  onClearCovenant,
  onClearWheel,
  quickLineupActive = false,
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
          quickLineupActive={quickLineupActive}
          slot={slot}
        />
      ))}
    </div>
  )
}

interface BuilderV2SlotCardProps {
  slot: BuilderV2SlotView
  quickLineupActive: boolean
  onClearCovenant: (slotId: string) => void
  onClearWheel: (slotId: string, wheelIndex: 0 | 1) => void
  onRemoveAwakener: (slotId: string) => void
  onSelectCovenantSlot: (slotId: string) => void
  onSelectSlot: (slotId: string) => void
  onSelectWheelSlot: (slotId: string, wheelIndex: 0 | 1) => void
}

const BuilderV2SlotCard = memo(function BuilderV2SlotCard({
  onClearCovenant,
  onClearWheel,
  onRemoveAwakener,
  onSelectCovenantSlot,
  onSelectSlot,
  onSelectWheelSlot,
  quickLineupActive,
  slot,
}: BuilderV2SlotCardProps) {
  return (
    <article
      className={`builder-v2-slot-card ${slot.isSelected ? 'builder-v2-slot-card--active' : ''}`}
      data-slot-id={slot.slotId}
    >
      <span className='sr-only'>{slot.slotLabel}</span>

      <div className='builder-v2-awakener-frame'>
        <button
          aria-label={`Select ${slot.slotLabel}`}
          aria-pressed={slot.isSelected}
          className='builder-v2-awakener-art-target'
          onClick={() => {
            onSelectSlot(slot.slotId)
          }}
          type='button'
        >
          <span className='builder-v2-awakener-art'>
            {slot.awakener?.cardSrc ?? slot.awakener?.portraitSrc ? (
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
                Delete
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
              aria-label={`Select ${slot.slotLabel} Covenant`}
              aria-pressed={slot.isCovenantSelected}
              className={`builder-v2-covenant-inline ${
                slot.isCovenantSelected ? 'builder-v2-covenant-inline--active' : ''
              }`}
              onClick={() => {
                onSelectCovenantSlot(slot.slotId)
              }}
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
            onSelect={() => {
              onSelectWheelSlot(slot.slotId, wheelSlot.wheelIndex)
            }}
            quickLineupActive={quickLineupActive}
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
    previous.assetSrc === next.assetSrc &&
    previous.enlightenLevel === next.enlightenLevel &&
    previous.isSelected === next.isSelected
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

function BuilderV2EnlightenMeter({
  level,
  variant = 'default',
}: {
  level: number | null
  variant?: 'default' | 'compact'
}) {
  const visibleLevel = Math.max(0, Math.min(level ?? 0, 3))
  const overflowLevel = level !== null ? Math.max(0, level - visibleLevel) : 0
  const label = formatBuilderV2EnlightenLabel(level)
  const diamonds = Array.from({length: 3}, (_, index) => index < visibleLevel)

  return (
    <span
      className={`builder-v2-enlighten-meter builder-v2-enlighten-meter--${variant}`}
      aria-label={label ? `Enlighten ${label}` : 'Enlighten 0'}
    >
      <span aria-hidden className='builder-v2-enlighten-diamonds'>
        {diamonds.map((isFilled, index) => (
          <span
            className={`builder-v2-enlighten-diamond ${
              isFilled ? 'builder-v2-enlighten-diamond--filled' : ''
            }`}
            key={index}
          />
        ))}
      </span>
      {overflowLevel > 0 ? (
        <span className='builder-v2-enlighten-overflow'>+{String(overflowLevel)}</span>
      ) : null}
    </span>
  )
}

function formatBuilderV2EnlightenLabel(level: number | null): string | null {
  if (!level || level <= 0) {
    return null
  }
  const baseLevel = Math.min(level, 3)
  const overflow = level - baseLevel
  return overflow > 0 ? `E${String(baseLevel)}+${String(overflow)}` : `E${String(baseLevel)}`
}

function SlotWheelChip({
  onClear,
  onSelect,
  quickLineupActive,
  wheelSlot,
}: {
  onClear: () => void
  onSelect: () => void
  quickLineupActive: boolean
  wheelSlot: BuilderV2WheelSlotView
}) {
  return (
    <div
      className={`builder-v2-wheel-chip ${
        wheelSlot.isSelected ? 'builder-v2-wheel-chip--active' : ''
      }`}
    >
      <button
        aria-label={`Select ${wheelSlot.label}`}
        aria-pressed={wheelSlot.isSelected}
        className='builder-v2-wheel-target'
        onClick={onSelect}
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
