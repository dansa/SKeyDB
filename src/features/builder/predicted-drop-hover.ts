import {parseCovenantDropZoneId, parseWheelDropZoneId, PICKER_DROP_ZONE_ID} from './dnd-ids'
import type {DragData, PredictedDropHover, TeamSlot, WheelSlotIndex} from './types'
import {getWheelSlotIndex} from './wheel-slot-index'

function findFirstEmptyWheelIndex(slot: TeamSlot | undefined): WheelSlotIndex | null {
  if (!slot?.awakenerId) {
    return null
  }
  const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel)
  return getWheelSlotIndex(firstEmptyIndex)
}

function resolveSlotLevelTarget(
  overId: string,
  overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
  overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
): string | null {
  return (
    overCovenantZone?.slotId ??
    overWheelZone?.slotId ??
    (overId.startsWith('slot-') ? overId : null)
  )
}

function resolveWheelDropHover(
  overId: string,
  overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
  overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  slotById: Map<string, TeamSlot>,
): PredictedDropHover {
  if (overWheelZone) {
    const wheelIndex = getWheelSlotIndex(overWheelZone.wheelIndex)
    return wheelIndex === null ? null : {kind: 'wheel', slotId: overWheelZone.slotId, wheelIndex}
  }

  const targetSlotId = resolveSlotLevelTarget(overId, null, overCovenantZone)
  if (!targetSlotId) {
    return null
  }

  const wheelIndex = findFirstEmptyWheelIndex(slotById.get(targetSlotId))
  return wheelIndex === null ? null : {kind: 'wheel', slotId: targetSlotId, wheelIndex}
}

function resolveCovenantDropHover(
  overId: string,
  overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
  overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  slotById: Map<string, TeamSlot>,
): PredictedDropHover {
  const targetSlotId = resolveSlotLevelTarget(overId, overWheelZone, overCovenantZone)
  if (!targetSlotId) {
    return null
  }

  const slot = slotById.get(targetSlotId)
  return slot?.awakenerId ? {kind: 'covenant', slotId: targetSlotId} : null
}

export function resolvePredictedDropHover(
  dragData: DragData | null | undefined,
  overId: string | undefined,
  slotById: Map<string, TeamSlot>,
): PredictedDropHover {
  if (!dragData || !overId || overId === PICKER_DROP_ZONE_ID) {
    return null
  }

  const overWheelZone = parseWheelDropZoneId(overId)
  const overCovenantZone = parseCovenantDropZoneId(overId)

  if (dragData.kind === 'picker-wheel' || dragData.kind === 'team-wheel') {
    return resolveWheelDropHover(overId, overWheelZone, overCovenantZone, slotById)
  }

  if (dragData.kind === 'picker-covenant' || dragData.kind === 'team-covenant') {
    return resolveCovenantDropHover(overId, overWheelZone, overCovenantZone, slotById)
  }

  return null
}
