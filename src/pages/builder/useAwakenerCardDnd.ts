import {useDraggable, useDroppable} from '@dnd-kit/core'

import type {DragData, PredictedDropHover, TeamSlot} from './types'

function getTeamSlotDragData(slot: TeamSlot): DragData | undefined {
  if (!slot.awakenerName) {
    return undefined
  }

  return {
    kind: 'team-slot',
    slotId: slot.slotId,
    awakenerName: slot.awakenerName,
  }
}

function canShowCardDropOverlay(activeDragKind: DragData['kind'] | null): boolean {
  return (
    activeDragKind === 'picker-awakener' ||
    activeDragKind === 'team-slot' ||
    activeDragKind === 'picker-wheel' ||
    activeDragKind === 'team-wheel' ||
    activeDragKind === 'picker-covenant' ||
    activeDragKind === 'team-covenant'
  )
}

export function useAwakenerCardDnd(
  slot: TeamSlot,
  hasAwakener: boolean,
  activeDragKind: DragData['kind'] | null,
  predictedDropHover: PredictedDropHover | null,
) {
  const {isOver, setNodeRef: setDroppableRef} = useDroppable({id: slot.slotId})
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    isDragging,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `team:${slot.slotId}`,
    disabled: !hasAwakener,
    data: getTeamSlotDragData(slot),
  })

  const isPredictedForThisCard =
    predictedDropHover !== null && predictedDropHover.slotId === slot.slotId
  const showCardOver = (isOver || isPredictedForThisCard) && canShowCardDropOverlay(activeDragKind)

  return {
    dragAttributes,
    dragListeners,
    isDragging,
    setDraggableRef,
    setDroppableRef,
    showCardOver,
  }
}
