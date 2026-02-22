import { parseCovenantDropZoneId, parseWheelDropZoneId, PICKER_DROP_ZONE_ID } from './dnd-ids'
import type { DragData, PredictedDropHover, TeamSlot } from './types'

function findFirstEmptyWheelIndex(slot: TeamSlot | undefined): number | null {
  if (!slot?.awakenerName) {
    return null
  }
  const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel)
  return firstEmptyIndex === -1 ? null : firstEmptyIndex
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
    if (overWheelZone) {
      return { kind: 'wheel', slotId: overWheelZone.slotId, wheelIndex: overWheelZone.wheelIndex }
    }
    const targetSlotId = overCovenantZone?.slotId ?? (overId.startsWith('slot-') ? overId : null)
    if (!targetSlotId) {
      return null
    }
    const wheelIndex = findFirstEmptyWheelIndex(slotById.get(targetSlotId))
    if (wheelIndex === null) {
      return null
    }
    return { kind: 'wheel', slotId: targetSlotId, wheelIndex }
  }

  if (dragData.kind === 'picker-covenant' || dragData.kind === 'team-covenant') {
    const targetSlotId = overCovenantZone?.slotId ?? overWheelZone?.slotId ?? (overId.startsWith('slot-') ? overId : null)
    if (!targetSlotId) {
      return null
    }
    const slot = slotById.get(targetSlotId)
    if (!slot?.awakenerName) {
      return null
    }
    return { kind: 'covenant', slotId: targetSlotId }
  }

  return null
}

