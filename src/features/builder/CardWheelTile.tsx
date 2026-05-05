import {useDraggable, useDroppable} from '@dnd-kit/core'
import {FaArrowUpRightFromSquare, FaCircleInfo} from 'react-icons/fa6'

import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheels} from '@/domain/wheels'

import {makeWheelDropZoneId} from './dnd-ids'
import type {DragData, PredictedDropHover} from './types'

export interface CardWheelTileProps {
  slotId: string
  wheelId: string | null
  wheelIndex: number
  interactive: boolean
  allowActiveRemoval?: boolean
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  isActive: boolean
  ownedLevel?: number | null
  showOwnership?: boolean
  onRemove?: () => void
  onOpenDatabasePage?: (wheelId: string) => void
  onOpenDetail?: (wheelId: string) => void
  onClick?: (wheelIndex: number) => void
}

const wheelNameById = new Map(getWheels().map((wheel) => [wheel.id, wheel.name]))

function renderWheelTileVisual(wheelId: string | null) {
  if (!wheelId) {
    return (
      <span className='wheel-tile-content absolute inset-[2px] border border-slate-700/70 bg-slate-900/60'>
        <span className='sigil-placeholder sigil-placeholder-wheel' />
      </span>
    )
  }

  const asset = getWheelAssetById(wheelId)
  if (!asset) {
    return (
      <span className='wheel-tile-content absolute inset-[2px] border border-slate-200/20 bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]' />
    )
  }

  return (
    <span className='wheel-tile-content absolute inset-[2px] overflow-hidden border border-slate-200/20'>
      <img
        alt={`${wheelId} wheel`}
        className='builder-card-wheel-image h-full w-full object-cover'
        draggable={false}
        src={asset}
      />
    </span>
  )
}

function getTeamWheelDragData(
  draggableEnabled: boolean,
  slotId: string,
  wheelIndex: number,
  wheelId: string | null,
): DragData | undefined {
  if (!draggableEnabled || !wheelId) {
    return undefined
  }

  return {kind: 'team-wheel', slotId, wheelIndex, wheelId}
}

function getWheelTileClassName(
  isActive: boolean,
  showOver: boolean,
  isDragging: boolean,
  isOwned: boolean,
  wheelId: string | null,
): string {
  return `wheel-tile group/wheel relative z-20 aspect-[75/113] overflow-hidden bg-slate-700/30 p-[1px] ${
    isActive ? 'wheel-tile-active' : ''
  } ${showOver ? 'wheel-tile-over' : ''} ${isDragging ? 'opacity-65' : ''} ${!isOwned && wheelId ? 'wheel-tile-unowned' : ''}`
}

function renderWheelOwnership(
  showOwnership: boolean,
  wheelId: string | null,
  isOwned: boolean,
  ownedLevel: number | null,
) {
  if (!showOwnership || !wheelId) {
    return null
  }

  if (isOwned) {
    return (
      <DupeLevelDisplay
        className='builder-wheel-dupe builder-wheel-dupe-stacked builder-dupe-owned pb-1'
        level={ownedLevel}
      />
    )
  }

  return <span className='builder-unowned-chip'>Unowned</span>
}

export function CardWheelTile({
  slotId,
  wheelId,
  wheelIndex,
  interactive,
  allowActiveRemoval = true,
  activeDragKind,
  predictedDropHover,
  isActive,
  ownedLevel = null,
  showOwnership = true,
  onRemove,
  onOpenDatabasePage,
  onOpenDetail,
  onClick,
}: CardWheelTileProps) {
  const dropZoneId = makeWheelDropZoneId(slotId, wheelIndex)
  const {isOver, setNodeRef: setDroppableRef} = useDroppable({id: dropZoneId})
  const draggableEnabled = interactive && Boolean(wheelId)
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `team-wheel:${slotId}:${String(wheelIndex)}`,
    data: getTeamWheelDragData(draggableEnabled, slotId, wheelIndex, wheelId),
    disabled: !draggableEnabled,
  })
  const canShowDirectOver = activeDragKind === 'picker-wheel' || activeDragKind === 'team-wheel'
  const isPredictedOver =
    predictedDropHover?.kind === 'wheel' &&
    predictedDropHover.slotId === slotId &&
    predictedDropHover.wheelIndex === wheelIndex
  const showOver = isPredictedOver || (isOver && canShowDirectOver)

  const isOwned = ownedLevel !== null
  const tileClassName = getWheelTileClassName(isActive, showOver, isDragging, isOwned, wheelId)
  const tileVisual = (
    <>
      <span className='wheel-tile-frame absolute inset-0 border border-slate-200/45' />
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
        className='absolute inset-0 z-20'
        onClick={() => onClick?.(wheelIndex)}
        ref={draggableEnabled ? setDraggableRef : undefined}
        type='button'
        {...(draggableEnabled ? attributes : {})}
        {...(draggableEnabled ? listeners : {})}
      />
      {allowActiveRemoval && isActive && wheelId ? (
        <button
          aria-label='Remove active wheel'
          className='builder-card-remove-button absolute -top-0.5 -right-0.5 z-40 h-7 w-7'
          data-card-remove='true'
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onRemove?.()
          }}
          type='button'
        >
          <span className='sigil-placeholder sigil-placeholder-no-plus sigil-placeholder-remove builder-card-remove-sigil builder-card-remove-sigil-wheel' />
          <span className='sigil-remove-x builder-card-remove-x' />
        </button>
      ) : null}
      {wheelId ? (
        <div className='absolute top-0.5 left-0.5 z-40 flex gap-0.5'>
          <button
            aria-label='Open details overlay'
            className='inline-flex h-5 w-5 items-center justify-center border border-slate-200/25 bg-slate-950/85 text-slate-200 hover:border-amber-200/55 hover:text-amber-100'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onOpenDetail?.(wheelId)
            }}
            type='button'
            title={`Open ${wheelNameById.get(wheelId) ?? wheelId} details overlay`}
          >
            <FaCircleInfo aria-hidden className='h-2.5 w-2.5' />
          </button>
          <button
            aria-label='Open database page'
            className='inline-flex h-5 w-5 items-center justify-center border border-slate-200/25 bg-slate-950/85 text-slate-200 hover:border-amber-200/55 hover:text-amber-100'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onOpenDatabasePage?.(wheelId)
            }}
            type='button'
            title={`Open ${wheelNameById.get(wheelId) ?? wheelId} database page`}
          >
            <FaArrowUpRightFromSquare aria-hidden className='h-2.5 w-2.5' />
          </button>
        </div>
      ) : null}
      {renderWheelOwnership(showOwnership, wheelId, isOwned, ownedLevel)}
      {tileVisual}
    </div>
  )
}
