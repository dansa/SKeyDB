import {parseCovenantDropZoneId, parseWheelDropZoneId, PICKER_DROP_ZONE_ID} from './dnd-ids'
import type {DragData, PredictedDropHover, TeamSlot} from './types'

function findFirstEmptyWheelIndex(slot: TeamSlot | undefined): number | null {
  if (!slot?.awakenerName) {
    return null
  }
  const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel)
  return firstEmptyIndex === -1 ? null : firstEmptyIndex
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
    return {kind: 'wheel', slotId: overWheelZone.slotId, wheelIndex: overWheelZone.wheelIndex}
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
  return slot?.awakenerName ? {kind: 'covenant', slotId: targetSlotId} : null
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
