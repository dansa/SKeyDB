import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {CardWheelZone} from './CardWheelZone'
import type {DragData, PredictedDropHover, TeamSlot} from './types'
import {useAwakenerCardDnd} from './useAwakenerCardDnd'
import {useAwakenerCardImage} from './useAwakenerCardImage'

interface AwakenerCardProps {
  slot: TeamSlot
  isActive?: boolean
  activeKind?: 'awakener' | 'wheel' | 'covenant' | null
  activeWheelIndex?: number | null
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  awakenerLevel?: number
  awakenerOwnedLevel?: number | null
  wheelOwnedLevels?: [number | null, number | null]
  allowActiveRemoval?: boolean
  onCardClick?: (slotId: string) => void
  onWheelSlotClick?: (slotId: string, wheelIndex: number) => void
  onCovenantSlotClick?: (slotId: string) => void
  onRemoveActiveSelection?: () => void
}

function shouldIgnoreCardClick(target: HTMLElement): boolean {
  return (
    target.closest('[data-card-remove]') !== null ||
    target.closest('.wheel-tile') !== null ||
    target.closest('.covenant-tile') !== null
  )
}

function getAwakenerCardHitboxLabel(hasAwakener: boolean, awakenerName?: string): string {
  return hasAwakener ? `Change ${awakenerName ?? 'awakener'}` : 'Deploy awakeners'
}

function getAwakenerCardClassName(
  showCardOver: boolean,
  isDragging: boolean,
  isActive: boolean,
): string {
  return `builder-card group relative aspect-[25/56] w-full border bg-slate-900/80 text-left ${
    showCardOver
      ? 'border-amber-200/80 shadow-[0_0_0_1px_rgba(251,191,36,0.24)]'
      : 'border-slate-500/60'
  } ${isDragging ? 'opacity-60' : ''} ${isActive ? 'builder-card-active' : ''}`
}

function renderAwakenerCardImage(
  slot: TeamSlot,
  cardAsset: string | undefined,
  cardImageLoaded: boolean,
  awakenerOwnedLevel: number | null,
  onCardImageError: () => void,
  onCardImageLoad: () => void,
) {
  if (!cardAsset || !slot.awakenerName) {
    return null
  }

  return (
    <img
      alt={`${slot.awakenerName} card`}
      className={`absolute inset-0 z-0 h-full w-full object-cover object-top transition-opacity duration-150 ${
        cardImageLoaded ? 'opacity-100' : 'opacity-0'
      } ${awakenerOwnedLevel === null ? 'builder-card-art-unowned' : ''}`}
      onError={onCardImageError}
      onLoad={onCardImageLoad}
      src={cardAsset}
    />
  )
}

function renderAwakenerCardOverlay(cardAsset: string | undefined, cardImageLoaded: boolean) {
  if (cardImageLoaded) {
    return <div className='builder-card-bottom-shade pointer-events-none absolute inset-0 z-10' />
  }

  if (!cardAsset) {
    return null
  }

  return (
    <div className='absolute inset-0 z-30 bg-slate-700/15'>
      <span className='absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(125,165,215,0.16),rgba(6,12,24,0)_62%)]' />
      <span className='sigil-placeholder sigil-placeholder-card sigil-placeholder-no-plus' />
      <span className='sigil-loading-ring' />
    </div>
  )
}

function renderAwakenerCardHeader(
  displayName: string,
  isSupport: boolean | undefined,
  awakenerOwnedLevel: number | null,
) {
  return (
    <div className='builder-card-name-wrap pointer-events-none absolute inset-x-0 top-0 z-20 px-2 pt-1 pb-[18%]'>
      <p className='builder-card-name ui-title text-slate-100'>{displayName}</p>
      {isSupport ? <span className='builder-support-badge'>Support Awakener</span> : null}
      {awakenerOwnedLevel === null ? <span className='builder-unowned-badge'>Unowned</span> : null}
    </div>
  )
}

function renderEmptyAwakenerCardState() {
  return (
    <div className='pointer-events-none absolute inset-0 z-10 bg-slate-700/15'>
      <span className='sigil-placeholder sigil-placeholder-card' />
    </div>
  )
}

function renderRemoveAwakenerButton(
  hasRemovableAwakenerSelection: boolean,
  onRemoveActiveSelection?: () => void,
) {
  if (!hasRemovableAwakenerSelection) {
    return null
  }

  return (
    <button
      aria-label='Remove active awakener'
      className='builder-card-remove-button absolute top-1 right-1 z-40 h-9 w-9'
      data-card-remove='true'
      onClick={onRemoveActiveSelection}
      type='button'
    >
      <span className='sigil-placeholder sigil-placeholder-no-plus sigil-placeholder-remove builder-card-remove-sigil' />
      <span className='sigil-remove-x builder-card-remove-x' />
    </button>
  )
}

function renderAwakenerCardWheelZone({
  cardImageLoaded,
  activeDragKind,
  activeKind,
  activeWheelIndex,
  slot,
  onCovenantSlotClick,
  onRemoveActiveSelection,
  onWheelSlotClick,
  awakenerLevel,
  awakenerOwnedLevel,
  allowActiveRemoval,
  wheelOwnedLevels,
  predictedDropHover,
}: {
  cardImageLoaded: boolean
  activeDragKind: DragData['kind'] | null
  activeKind: 'awakener' | 'wheel' | 'covenant' | null
  activeWheelIndex: number | null
  slot: TeamSlot
  onCovenantSlotClick?: (slotId: string) => void
  onRemoveActiveSelection?: () => void
  onWheelSlotClick?: (slotId: string, wheelIndex: number) => void
  awakenerLevel: number
  awakenerOwnedLevel: number | null
  allowActiveRemoval: boolean
  wheelOwnedLevels: [number | null, number | null]
  predictedDropHover: PredictedDropHover | null
}) {
  if (!cardImageLoaded) {
    return null
  }

  return (
    <CardWheelZone
      activeDragKind={activeDragKind}
      activeWheelIndex={activeKind === 'wheel' ? activeWheelIndex : null}
      isCovenantActive={activeKind === 'covenant'}
      interactive
      onCovenantSlotClick={() => onCovenantSlotClick?.(slot.slotId)}
      onRemoveActiveWheel={onRemoveActiveSelection}
      onWheelSlotClick={(wheelIndex) => onWheelSlotClick?.(slot.slotId, wheelIndex)}
      awakenerLevel={awakenerLevel}
      awakenerOwnedLevel={awakenerOwnedLevel}
      allowActiveRemoval={allowActiveRemoval}
      wheelOwnedLevels={wheelOwnedLevels}
      predictedDropHover={predictedDropHover}
      slot={slot}
      wheelKeyPrefix={slot.slotId}
    />
  )
}

export function AwakenerCard({
  slot,
  isActive = false,
  activeKind = null,
  activeWheelIndex = null,
  activeDragKind = null,
  predictedDropHover = null,
  awakenerLevel = 60,
  awakenerOwnedLevel = null,
  wheelOwnedLevels = [null, null],
  allowActiveRemoval = true,
  onCardClick,
  onWheelSlotClick,
  onCovenantSlotClick,
  onRemoveActiveSelection,
}: AwakenerCardProps) {
  const hasAwakener = Boolean(slot.awakenerName)
  const displayName = slot.awakenerName ? formatAwakenerNameForUi(slot.awakenerName) : ''
  const cardAsset = slot.awakenerName ? getAwakenerCardAsset(slot.awakenerName) : undefined
  const {cardImageLoaded, handleCardImageError, handleCardImageLoad} =
    useAwakenerCardImage(cardAsset)

  const {
    dragAttributes,
    dragListeners,
    isDragging,
    setDraggableRef,
    setDroppableRef,
    showCardOver,
  } = useAwakenerCardDnd(slot, hasAwakener, activeDragKind, predictedDropHover)
  const hasRemovableAwakenerSelection =
    allowActiveRemoval && activeKind === 'awakener' && isActive && hasAwakener
  const cardClassName = getAwakenerCardClassName(showCardOver, isDragging, isActive)
  const hitboxLabel = getAwakenerCardHitboxLabel(hasAwakener, slot.awakenerName)

  return (
    <article
      className={cardClassName}
      data-selection-owner='true'
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (shouldIgnoreCardClick(target)) {
          return
        }
        onCardClick?.(slot.slotId)
      }}
      ref={setDroppableRef}
    >
      {renderRemoveAwakenerButton(hasRemovableAwakenerSelection, onRemoveActiveSelection)}
      <button
        aria-label={hitboxLabel}
        className='builder-card-hitbox absolute inset-0 z-10'
        ref={hasAwakener ? setDraggableRef : undefined}
        type='button'
        {...(hasAwakener ? dragAttributes : {})}
        {...(hasAwakener ? dragListeners : {})}
      />

      {hasAwakener ? (
        <>
          {renderAwakenerCardImage(
            slot,
            cardAsset,
            cardImageLoaded,
            awakenerOwnedLevel,
            handleCardImageError,
            handleCardImageLoad,
          )}
          {renderAwakenerCardOverlay(cardAsset, cardImageLoaded)}
          {renderAwakenerCardHeader(displayName, slot.isSupport, awakenerOwnedLevel)}

          {renderAwakenerCardWheelZone({
            cardImageLoaded,
            activeDragKind,
            activeKind,
            activeWheelIndex,
            slot,
            onCovenantSlotClick,
            onRemoveActiveSelection,
            onWheelSlotClick,
            awakenerLevel,
            awakenerOwnedLevel,
            allowActiveRemoval,
            wheelOwnedLevels,
            predictedDropHover,
          })}
        </>
      ) : (
        renderEmptyAwakenerCardState()
      )}
    </article>
  )
}
