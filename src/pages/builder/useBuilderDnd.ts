import {
  type DragOverEvent,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import { parseCovenantDropZoneId, parseWheelDropZoneId, PICKER_DROP_ZONE_ID } from './dnd-ids'
import type { DragData } from './types'

type UseBuilderDndOptions = {
  onDropPickerAwakener: (awakenerName: string, targetSlotId: string) => void
  onDropPickerWheel: (wheelId: string, targetSlotId: string, targetWheelIndex?: number) => void
  onDropPickerCovenant: (covenantId: string, targetSlotId: string) => void
  onDropTeamSlot: (sourceSlotId: string, targetSlotId: string) => void
  onDropTeamWheel: (
    sourceSlotId: string,
    sourceWheelIndex: number,
    targetSlotId: string,
    targetWheelIndex: number,
  ) => void
  onDropTeamWheelToSlot: (sourceSlotId: string, sourceWheelIndex: number, targetSlotId: string) => void
  onDropTeamCovenant: (sourceSlotId: string, targetSlotId: string) => void
  onDropTeamCovenantToSlot: (sourceSlotId: string, targetSlotId: string) => void
  onDropTeamSlotToPicker: (sourceSlotId: string) => void
  onDropTeamWheelToPicker: (sourceSlotId: string, sourceWheelIndex: number) => void
  onDropTeamCovenantToPicker: (sourceSlotId: string) => void
}

export function useBuilderDnd({
  onDropPickerAwakener,
  onDropPickerWheel,
  onDropPickerCovenant,
  onDropTeamSlot,
  onDropTeamWheel,
  onDropTeamWheelToSlot,
  onDropTeamCovenant,
  onDropTeamCovenantToSlot,
  onDropTeamSlotToPicker,
  onDropTeamWheelToPicker,
  onDropTeamCovenantToPicker,
}: UseBuilderDndOptions) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [isRemoveIntent, setIsRemoveIntent] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )

  function isTeamSlotId(id: string): boolean {
    return id.startsWith('slot-')
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined
    if (!data) {
      return
    }
    setIsRemoveIntent(false)
    setActiveDrag(data)
  }

  function handleDragOver(event: DragOverEvent) {
    if (activeDrag?.kind !== 'team-slot' && activeDrag?.kind !== 'team-wheel' && activeDrag?.kind !== 'team-covenant') {
      if (isRemoveIntent) {
        setIsRemoveIntent(false)
      }
      return
    }

    const overId = event.over?.id
    const nextRemoveIntent = overId === PICKER_DROP_ZONE_ID
    if (nextRemoveIntent !== isRemoveIntent) {
      setIsRemoveIntent(nextRemoveIntent)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current as DragData | undefined
    const overId = event.over?.id
    setIsRemoveIntent(false)
    setActiveDrag(null)

    if (!data || typeof overId !== 'string') {
      return
    }

    const overWheelZone = parseWheelDropZoneId(overId)
    const overCovenantZone = parseCovenantDropZoneId(overId)

    if (data.kind === 'picker-awakener') {
      const targetSlotId = overWheelZone?.slotId ?? overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null)
      if (!targetSlotId) {
        return
      }
      onDropPickerAwakener(data.awakenerName, targetSlotId)
      return
    }

    if (data.kind === 'picker-wheel') {
      if (overWheelZone) {
        onDropPickerWheel(data.wheelId, overWheelZone.slotId, overWheelZone.wheelIndex)
        return
      }
      const targetSlotId = overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null)
      if (!targetSlotId) {
        return
      }
      onDropPickerWheel(data.wheelId, targetSlotId)
      return
    }

    if (data.kind === 'picker-covenant') {
      const targetSlotId = overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null)
      if (!targetSlotId) {
        return
      }
      onDropPickerCovenant(data.covenantId, targetSlotId)
      return
    }

    if (data.kind === 'team-slot') {
      if (overId === PICKER_DROP_ZONE_ID) {
        onDropTeamSlotToPicker(data.slotId)
        return
      }
      const targetSlotId = overWheelZone?.slotId ?? (isTeamSlotId(overId) ? overId : null)
      const resolvedTargetSlotId = targetSlotId ?? overCovenantZone?.slotId
      if (!resolvedTargetSlotId) {
        return
      }
      onDropTeamSlot(data.slotId, resolvedTargetSlotId)
      return
    }

    if (data.kind === 'team-covenant') {
      if (overId === PICKER_DROP_ZONE_ID) {
        onDropTeamCovenantToPicker(data.slotId)
        return
      }

      if (overCovenantZone) {
        onDropTeamCovenant(data.slotId, overCovenantZone.slotId)
        return
      }

      if (isTeamSlotId(overId)) {
        onDropTeamCovenantToSlot(data.slotId, overId)
      }
      return
    }

    if (data.kind !== 'team-wheel') {
      return
    }

    if (overId === PICKER_DROP_ZONE_ID) {
      onDropTeamWheelToPicker(data.slotId, data.wheelIndex)
      return
    }

    if (!overWheelZone) {
      if (isTeamSlotId(overId)) {
        onDropTeamWheelToSlot(data.slotId, data.wheelIndex, overId)
      }
      return
    }

    onDropTeamWheel(data.slotId, data.wheelIndex, overWheelZone.slotId, overWheelZone.wheelIndex)
  }

  function handleDragCancel() {
    setIsRemoveIntent(false)
    setActiveDrag(null)
  }

  return {
    activeDrag,
    isRemoveIntent,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
