import {useDraggable, useDroppable} from '@dnd-kit/core'

import {getCovenantAssetById} from '@/domain/covenant-assets'

import {makeCovenantDropZoneId} from './dnd-ids'
import type {DragData, PredictedDropHover} from './types'

export interface CardCovenantTileProps {
  slotId: string
  covenantId: string | undefined
  interactive: boolean
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  isActive: boolean
  onClick?: () => void
}

function CovenantPlaceholderSvg() {
  return (
    <svg
      aria-hidden
      className='builder-covenant-placeholder-svg'
      preserveAspectRatio='xMidYMid meet'
      shapeRendering='geometricPrecision'
      viewBox='0 0 15 15'
    >
      <circle
        className='builder-covenant-placeholder-ring'
        cx='7.5'
        cy='7.5'
        r='9.5'
        stroke='#eff0de33'
        strokeWidth='0.65'
        fill='none'
      />
      <path
        d='M14 4.213 7.5.42 1 4.213v6.574l6.5 3.792 6.5-3.792z'
        stroke='#eff0de33'
        strokeWidth='0.65'
        fill='none'
      />
      <rect
        className='builder-covenant-placeholder-diamond'
        stroke='#080e18'
        strokeWidth='0.4'
        fill='none'
        width='72%'
        height='72%'
        y='14%'
        x='14%'
        transform='rotate(45 7.5 7.5)'
      />
      <rect
        className='builder-covenant-placeholder-diamond-accent'
        stroke='#e6d6a67a'
        strokeWidth='0.65'
        fill='none'
        width='64%'
        height='64%'
        y='18%'
        x='18%'
        transform='rotate(45 7.5 7.5)'
      />
      <line className='builder-covenant-placeholder-plus' x1='4' x2='11' y1='7.5' y2='7.5' />
      <line className='builder-covenant-placeholder-plus' x1='7.5' x2='7.5' y1='4' y2='11' />
    </svg>
  )
}

function renderCovenantTileVisual(covenantId: string | undefined) {
  const contentClassName = 'covenant-tile-content absolute inset-0 rounded-full'

  if (!covenantId) {
    return (
      <span className={`${contentClassName} flex items-center justify-center bg-slate-900/60`}>
        <CovenantPlaceholderSvg />
      </span>
    )
  }

  const asset = getCovenantAssetById(covenantId)
  if (!asset) {
    return (
      <span
        className={`${contentClassName} bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]`}
      />
    )
  }

  return (
    <span className={`${contentClassName} bg-slate-950/85`}>
      <img
        alt=''
        className='builder-card-covenant-image h-full w-full object-cover'
        draggable={false}
        src={asset}
      />
    </span>
  )
}

export function CardCovenantTile({
  slotId,
  covenantId,
  interactive,
  activeDragKind,
  predictedDropHover,
  isActive,
  onClick,
}: CardCovenantTileProps) {
  const dropZoneId = makeCovenantDropZoneId(slotId)
  const {isOver, setNodeRef: setDroppableRef} = useDroppable({id: dropZoneId})
  const draggableCovenantId = interactive && covenantId ? covenantId : undefined
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `team-covenant:${slotId}`,
    data: draggableCovenantId
      ? ({kind: 'team-covenant', slotId, covenantId: draggableCovenantId} satisfies DragData)
      : undefined,
    disabled: !draggableCovenantId,
  })
  const canShowDirectOver =
    activeDragKind === 'picker-covenant' || activeDragKind === 'team-covenant'
  const isPredictedOver =
    predictedDropHover?.kind === 'covenant' && predictedDropHover.slotId === slotId
  const showOver = isPredictedOver || (isOver && canShowDirectOver)

  const tileClassName = `covenant-tile group/covenant relative z-20 aspect-square ${
    isActive ? 'covenant-tile-active' : ''
  } ${showOver ? 'covenant-tile-over' : ''} ${isDragging ? 'opacity-65' : ''}`
  const tileVisual = <>{renderCovenantTileVisual(covenantId)}</>

  if (!interactive) {
    return <div className={tileClassName}>{tileVisual}</div>
  }

  return (
    <div className={tileClassName} ref={setDroppableRef}>
      <button
        aria-label={covenantId ? 'Edit covenant' : 'Set covenant'}
        className='absolute inset-0 z-20'
        onClick={onClick}
        ref={draggableCovenantId ? setDraggableRef : undefined}
        type='button'
        {...(draggableCovenantId ? attributes : {})}
        {...(draggableCovenantId ? listeners : {})}
      />
      {tileVisual}
    </div>
  )
}
