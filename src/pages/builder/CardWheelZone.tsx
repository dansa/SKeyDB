import { useDraggable, useDroppable } from '@dnd-kit/core'
import { DupeLevelDisplay } from '../../components/ui/DupeLevelDisplay'
import { getCovenantAssetById } from '../../domain/covenant-assets'
import { getWheelAssetById } from '../../domain/wheel-assets'
import { makeCovenantDropZoneId, makeWheelDropZoneId } from './dnd-ids'
import type { DragData } from './types'
import type { PredictedDropHover, TeamSlot } from './types'

type CardWheelZoneProps = {
  slot: TeamSlot
  interactive: boolean
  wheelKeyPrefix: string
  showOwnership?: boolean
  compactCovenant?: boolean
  activeWheelIndex?: number | null
  isCovenantActive?: boolean
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  onRemoveActiveWheel?: () => void
  onWheelSlotClick?: (wheelIndex: number) => void
  onCovenantSlotClick?: () => void
  awakenerOwnedLevel?: number | null
  wheelOwnedLevels?: [number | null, number | null]
}

type CardWheelTileProps = {
  slotId: string
  wheelId: string | null
  wheelIndex: number
  interactive: boolean
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  isActive: boolean
  ownedLevel?: number | null
  showOwnership?: boolean
  onRemove?: () => void
  onClick?: (wheelIndex: number) => void
}

type CardCovenantTileProps = {
  slotId: string
  covenantId: string | undefined
  interactive: boolean
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  isActive: boolean
  onClick?: () => void
}

function renderCovenantTileVisual(covenantId: string | undefined) {
  if (!covenantId) {
    return (
      <span className="covenant-tile-content absolute inset-[2px] rounded-full border border-slate-700/70 bg-slate-900/60">
        <span className="sigil-placeholder sigil-placeholder-wheel sigil-placeholder-covenant-empty">
          <span className="sigil-covenant-diamond" />
        </span>
      </span>
    )
  }

  const asset = getCovenantAssetById(covenantId)
  if (!asset) {
    return <span className="covenant-tile-content absolute inset-[2px] rounded-full bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]" />
  }

  return (
    <span className="covenant-tile-content absolute inset-[2px] rounded-full bg-slate-950/85">
      <img alt={`${covenantId} covenant`} className="builder-card-covenant-image h-full w-full object-cover" draggable={false} src={asset} />
    </span>
  )
}

function renderWheelTileVisual(wheelId: string | null) {
  if (!wheelId) {
    return (
      <span className="wheel-tile-content absolute inset-[2px] border border-slate-700/70 bg-slate-900/60">
        <span className="sigil-placeholder sigil-placeholder-wheel" />
      </span>
    )
  }

  const asset = getWheelAssetById(wheelId)
  if (!asset) {
    return <span className="wheel-tile-content absolute inset-[2px] border border-slate-200/20 bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]" />
  }

  return (
    <span className="wheel-tile-content absolute inset-[2px] overflow-hidden border border-slate-200/20">
      <img alt={`${wheelId} wheel`} className="builder-card-wheel-image h-full w-full object-cover" draggable={false} src={asset} />
    </span>
  )
}

function CardCovenantTile({
  slotId,
  covenantId,
  interactive,
  activeDragKind,
  predictedDropHover,
  isActive,
  onClick,
}: CardCovenantTileProps) {
  const dropZoneId = makeCovenantDropZoneId(slotId)
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({ id: dropZoneId })
  const draggableEnabled = interactive && Boolean(covenantId)
  const { attributes, listeners, isDragging, setNodeRef: setDraggableRef } = useDraggable({
    id: `team-covenant:${slotId}`,
    data: draggableEnabled
      ? ({ kind: 'team-covenant', slotId, covenantId: covenantId! } satisfies DragData)
      : undefined,
    disabled: !draggableEnabled,
  })
  const canShowDirectOver = activeDragKind === 'picker-covenant' || activeDragKind === 'team-covenant'
  const isPredictedOver = predictedDropHover?.kind === 'covenant' && predictedDropHover.slotId === slotId
  const showOver = isPredictedOver || (isOver && canShowDirectOver)

  const tileClassName = `covenant-tile group/covenant relative z-20 aspect-square ${
    isActive ? 'covenant-tile-active' : ''
  } ${showOver ? 'covenant-tile-over' : ''} ${isDragging ? 'opacity-65' : ''}`
  const tileVisual = (
    <>
      <span className="covenant-tile-frame absolute inset-0 rounded-full border border-slate-200/45" />
      {renderCovenantTileVisual(covenantId)}
    </>
  )

  if (!interactive) {
    return <div className={tileClassName}>{tileVisual}</div>
  }

  return (
    <div className={tileClassName} ref={setDroppableRef}>
      <button
        aria-label={covenantId ? 'Edit covenant' : 'Set covenant'}
        className="absolute inset-0 z-20"
        onClick={onClick}
        ref={draggableEnabled ? setDraggableRef : undefined}
        type="button"
        {...(draggableEnabled ? attributes : {})}
        {...(draggableEnabled ? listeners : {})}
      />
      {tileVisual}
    </div>
  )
}

function CardWheelTile({
  slotId,
  wheelId,
  wheelIndex,
  interactive,
  activeDragKind,
  predictedDropHover,
  isActive,
  ownedLevel = null,
  showOwnership = true,
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
  const canShowDirectOver = activeDragKind === 'picker-wheel' || activeDragKind === 'team-wheel'
  const isPredictedOver =
    predictedDropHover?.kind === 'wheel' &&
    predictedDropHover.slotId === slotId &&
    predictedDropHover.wheelIndex === wheelIndex
  const showOver = isPredictedOver || (isOver && canShowDirectOver)

  const isOwned = ownedLevel !== null
  const tileClassName = `wheel-tile group/wheel relative z-20 aspect-[75/113] overflow-hidden bg-slate-700/30 p-[1px] ${
    isActive ? 'wheel-tile-active' : ''
  } ${showOver ? 'wheel-tile-over' : ''} ${isDragging ? 'opacity-65' : ''} ${!isOwned && wheelId ? 'wheel-tile-unowned' : ''}`
  const tileVisual = (
    <>
      <span className="wheel-tile-frame absolute inset-0 border border-slate-200/45" />
      {renderWheelTileVisual(wheelId)}
    </>
  )

  if (!interactive) {
    return <div className={tileClassName}>{tileVisual}</div>
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
  {showOwnership && wheelId ? (
        isOwned ? (
          <DupeLevelDisplay
            className="pb-1 builder-wheel-dupe builder-wheel-dupe-stacked builder-dupe-owned"
            level={ownedLevel}
          />
        ) : (
          <span className="builder-unowned-chip">Unowned</span>
        )
      ) : null}
      {tileVisual}
    </div>
  )
}

export function CardWheelZone({
  slot,
  interactive,
  wheelKeyPrefix,
  showOwnership = true,
  compactCovenant = false,
  activeWheelIndex = null,
  isCovenantActive = false,
  activeDragKind = null,
  predictedDropHover = null,
  onRemoveActiveWheel,
  onWheelSlotClick,
  onCovenantSlotClick,
  awakenerOwnedLevel = null,
  wheelOwnedLevels = [null, null],
}: CardWheelZoneProps) {
  return (
    <div
      className={`builder-card-wheel-zone pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2 ${
        compactCovenant ? 'builder-card-wheel-zone-ghost' : ''
      }`}
    >
      <div className="builder-card-meta-row flex items-start justify-between gap-2 pb-2">
        <div className="builder-card-meta-left pointer-events-none self-end min-w-0 flex-1 pb-1">
          {showOwnership && awakenerOwnedLevel !== null ? (
            <DupeLevelDisplay
              className="builder-awakener-dupe builder-awakener-dupe-meta builder-dupe-owned"
              level={awakenerOwnedLevel}
            />
          ) : null}
        </div>
        <div className="builder-card-covenant-wrap shrink-0">
          <CardCovenantTile
            activeDragKind={activeDragKind}
            covenantId={slot.covenantId}
            interactive={interactive}
            isActive={isCovenantActive}
            onClick={onCovenantSlotClick}
            predictedDropHover={predictedDropHover}
            slotId={slot.slotId}
          />
        </div>
      </div>

      <div className="builder-card-wheel-grid mt-1.5 grid grid-cols-2 gap-1.5">
        {slot.wheels.map((wheelId, index) => (
          <CardWheelTile
            activeDragKind={activeDragKind}
            interactive={interactive}
            isActive={activeWheelIndex === index}
            key={`${wheelKeyPrefix}-wheel-${index}`}
            onClick={onWheelSlotClick}
            ownedLevel={wheelOwnedLevels[index] ?? null}
            showOwnership={showOwnership}
            onRemove={onRemoveActiveWheel}
            predictedDropHover={predictedDropHover}
            slotId={slot.slotId}
            wheelId={wheelId}
            wheelIndex={index}
          />
        ))}
      </div>
    </div>
  )
}
