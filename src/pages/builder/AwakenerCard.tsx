import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { getAwakenerCardAsset } from '../../domain/awakener-assets'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { CardWheelZone } from './CardWheelZone'
import type { DragData, TeamSlot } from './types'

const loadedCardAssets = new Set<string>()

type AwakenerCardProps = {
  slot: TeamSlot
  isActive?: boolean
  activeKind?: 'awakener' | 'wheel' | null
  activeWheelIndex?: number | null
  onCardClick?: (slotId: string) => void
  onWheelSlotClick?: (slotId: string, wheelIndex: number) => void
  onRemoveActiveSelection?: () => void
}

export function AwakenerCard({
  slot,
  isActive = false,
  activeKind = null,
  activeWheelIndex = null,
  onCardClick,
  onWheelSlotClick,
  onRemoveActiveSelection,
}: AwakenerCardProps) {
  const hasAwakener = Boolean(slot.awakenerName)
  const displayName = slot.awakenerName ? formatAwakenerNameForUi(slot.awakenerName) : ''
  const cardAsset = slot.awakenerName ? getAwakenerCardAsset(slot.awakenerName) : undefined
  const [loadedCardAsset, setLoadedCardAsset] = useState<string | undefined>(() =>
    cardAsset && loadedCardAssets.has(cardAsset) ? cardAsset : undefined,
  )
  const cardImageLoaded = !cardAsset || loadedCardAsset === cardAsset

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({ id: slot.slotId })
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    isDragging,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `team:${slot.slotId}`,
    disabled: !hasAwakener,
    data: hasAwakener
      ? ({ kind: 'team-slot', slotId: slot.slotId, awakenerName: slot.awakenerName! } satisfies DragData)
      : undefined,
  })
  const hasRemovableSelection =
    (activeKind === 'awakener' && isActive && hasAwakener) ||
    (activeKind === 'wheel' &&
      activeWheelIndex !== null &&
      activeWheelIndex >= 0 &&
      activeWheelIndex <= 1 &&
      Boolean(slot.wheels[activeWheelIndex]))

  return (
    <article
      className={`builder-card group relative aspect-[25/56] w-full border bg-slate-900/80 text-left ${
        isOver ? 'border-amber-200/80 shadow-[0_0_0_1px_rgba(251,191,36,0.24)]' : 'border-slate-500/60'
      } ${isDragging ? 'opacity-60' : ''} ${isActive ? 'builder-card-active' : ''}`}
      data-selection-owner="true"
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('[data-card-remove]') || target.closest('.wheel-tile')) {
          return
        }
        onCardClick?.(slot.slotId)
      }}
      ref={setDroppableRef}
    >
      {hasRemovableSelection ? (
        <button
          aria-label={activeKind === 'wheel' ? 'Remove active wheel' : 'Remove active awakener'}
          className="builder-card-remove-button absolute top-1 right-1 z-40 h-9 w-9"
          data-card-remove="true"
          onClick={onRemoveActiveSelection}
          type="button"
        >
          <span className="sigil-placeholder sigil-placeholder-no-plus sigil-placeholder-remove builder-card-remove-sigil" />
          <span className="sigil-remove-x builder-card-remove-x" />
        </button>
      ) : null}
      <button
        aria-label={hasAwakener ? `Change ${slot.awakenerName}` : 'Deploy awakeners'}
        className="builder-card-hitbox absolute inset-0 z-10"
        ref={hasAwakener ? setDraggableRef : undefined}
        type="button"
        {...(hasAwakener ? dragAttributes : {})}
        {...(hasAwakener ? dragListeners : {})}
      />

      {hasAwakener ? (
        <>
          {cardAsset ? (
            <img
              alt={`${slot.awakenerName} card`}
              className={`absolute inset-0 z-0 h-full w-full object-cover object-top transition-opacity duration-150 ${
                cardImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onError={() => setLoadedCardAsset(cardAsset)}
              onLoad={() => {
                loadedCardAssets.add(cardAsset)
                setLoadedCardAsset(cardAsset)
              }}
              src={cardAsset}
            />
          ) : null}
          {cardImageLoaded ? <div className="builder-card-bottom-shade pointer-events-none absolute inset-0 z-10" /> : null}
          {cardAsset && !cardImageLoaded ? (
            <div className="absolute inset-0 z-30 bg-slate-700/15">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(125,165,215,0.16),rgba(6,12,24,0)_62%)]" />
              <span className="sigil-placeholder sigil-placeholder-card sigil-placeholder-no-plus" />
              <span className="sigil-loading-ring" />
            </div>
          ) : null}

          <div className="builder-card-name-wrap pointer-events-none absolute inset-x-0 top-0 z-20 px-2 pt-1 pb-[18%]">
            <p className="builder-card-name ui-title text-slate-100">{displayName}</p>
          </div>

          {cardImageLoaded ? (
            <CardWheelZone
              activeWheelIndex={activeKind === 'wheel' ? activeWheelIndex : null}
              interactive
              onWheelSlotClick={(wheelIndex) => onWheelSlotClick?.(slot.slotId, wheelIndex)}
              slot={slot}
              wheelKeyPrefix={slot.slotId}
            />
          ) : null}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-10 bg-slate-700/15">
          <span className="sigil-placeholder sigil-placeholder-card" />
        </div>
      )}
    </article>
  )
}
