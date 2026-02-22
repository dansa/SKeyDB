import { useDraggable, useDroppable } from '@dnd-kit/core'
import { getFactionTint } from '../../domain/factions'
import { getWheelAssetById } from '../../domain/wheel-assets'
import { makeWheelDropZoneId } from './dnd-ids'
import type { DragData } from './types'
import type { TeamSlot } from './types'

type CardWheelZoneProps = {
  slot: TeamSlot
  interactive: boolean
  wheelKeyPrefix: string
  activeWheelIndex?: number | null
  onRemoveActiveWheel?: () => void
  onWheelSlotClick?: (wheelIndex: number) => void
}

type CardWheelTileProps = {
  slotId: string
  wheelId: string | null
  wheelIndex: number
  interactive: boolean
  isActive: boolean
  onRemove?: () => void
  onClick?: (wheelIndex: number) => void
}

function CardWheelTile({
  slotId,
  wheelId,
  wheelIndex,
  interactive,
  isActive,
  onRemove,
  onClick,
}: CardWheelTileProps) {
  const dropZoneId = makeWheelDropZoneId(slotId, wheelIndex)
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({ id: dropZoneId })
  const draggableEnabled = interactive && Boolean(wheelId)
  const { attributes, listeners, isDragging, setNodeRef: setDraggableRef } = useDraggable({
    id: `team-wheel:${slotId}:${wheelIndex}`,
    data: draggableEnabled
      ? ({ kind: 'team-wheel', slotId, wheelIndex, wheelId: wheelId! } satisfies DragData)
      : undefined,
    disabled: !draggableEnabled,
  })

  const tileClassName = `wheel-tile group/wheel relative z-20 aspect-[75/113] overflow-hidden bg-slate-700/30 p-[1px] ${
    isActive ? 'wheel-tile-active' : ''
  } ${isOver ? 'wheel-tile-over' : ''} ${isDragging ? 'opacity-65' : ''}`

  if (!interactive) {
    return (
      <div className={tileClassName}>
        <span className="wheel-tile-frame absolute inset-0 border border-slate-200/45" />
        {wheelId ? (
          (() => {
            const asset = getWheelAssetById(wheelId)
            return asset ? (
              <span className="wheel-tile-content absolute inset-[2px] overflow-hidden border border-slate-200/20">
                <img
                  alt={`${wheelId} wheel`}
                  className="builder-card-wheel-image h-full w-full object-cover"
                  draggable={false}
                  src={asset}
                />
              </span>
            ) : (
              <span className="wheel-tile-content absolute inset-[2px] border border-slate-200/20 bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]" />
            )
          })()
        ) : (
          <span className="wheel-tile-content absolute inset-[2px] border border-slate-700/70 bg-slate-900/60">
            <span className="sigil-placeholder sigil-placeholder-wheel" />
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={tileClassName} ref={setDroppableRef}>
      <button
        aria-label={wheelId ? 'Edit wheel' : 'Set wheel'}
        className="absolute inset-0 z-20"
        onClick={() => onClick?.(wheelIndex)}
        ref={draggableEnabled ? setDraggableRef : undefined}
        type="button"
        {...(draggableEnabled ? attributes : {})}
        {...(draggableEnabled ? listeners : {})}
      />
      {isActive && wheelId ? (
        <button
          aria-label="Remove active wheel"
          className="builder-card-remove-button absolute -top-0.5 -right-0.5 z-40 h-7 w-7"
          data-card-remove="true"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onRemove?.()
          }}
          type="button"
        >
          <span className="sigil-placeholder sigil-placeholder-no-plus sigil-placeholder-remove builder-card-remove-sigil builder-card-remove-sigil-wheel" />
          <span className="sigil-remove-x builder-card-remove-x" />
        </button>
      ) : null}
      <span className="wheel-tile-frame absolute inset-0 border border-slate-200/45" />
      {wheelId ? (
        (() => {
          const asset = getWheelAssetById(wheelId)
          return asset ? (
            <span className="wheel-tile-content absolute inset-[2px] overflow-hidden border border-slate-200/20">
              <img alt={`${wheelId} wheel`} className="builder-card-wheel-image h-full w-full object-cover" draggable={false} src={asset} />
            </span>
          ) : (
            <span className="wheel-tile-content absolute inset-[2px] border border-slate-200/20 bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]" />
          )
        })()
      ) : (
        <span className="wheel-tile-content absolute inset-[2px] border border-slate-700/70 bg-slate-900/60">
          <span className="sigil-placeholder sigil-placeholder-wheel" />
        </span>
      )}
    </div>
  )
}

export function CardWheelZone({
  slot,
  interactive,
  wheelKeyPrefix,
  activeWheelIndex = null,
  onRemoveActiveWheel,
  onWheelSlotClick,
}: CardWheelZoneProps) {
  const factionColor = slot.faction ? getFactionTint(slot.faction) : undefined

  return (
    <div className="builder-card-wheel-zone absolute inset-x-0 bottom-0 z-20 p-2">
      <p className="text-xs text-slate-200">
        Lv.{slot.level ?? 1}{' '}
        <span className="ml-1 text-[10px]" style={factionColor ? { color: factionColor } : undefined}>
          {slot.faction ?? ''}
        </span>
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {slot.wheels.map((wheelId, index) => (
          <CardWheelTile
            interactive={interactive}
            isActive={activeWheelIndex === index}
            key={`${wheelKeyPrefix}-wheel-${index}`}
            onClick={onWheelSlotClick}
            onRemove={onRemoveActiveWheel}
            slotId={slot.slotId}
            wheelId={wheelId}
            wheelIndex={index}
          />
        ))}
      </div>
    </div>
  )
}
