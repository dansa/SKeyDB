import {useState} from 'react'

import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import {parseCovenantDropZoneId, parseWheelDropZoneId, PICKER_DROP_ZONE_ID} from './dnd-ids'
import type {DragData} from './types'

interface UseBuilderDndOptions {
  onDropPickerAwakener: (awakenerName: string, targetSlotId: string) => void
  onDropPickerWheel: (wheelId: string, targetSlotId: string, targetWheelIndex?: number) => void
  onDropPickerCovenant: (covenantId: string, targetSlotId: string) => void
  onDropPickerPosse: (posseId: string) => void
  onDropTeamSlot: (sourceSlotId: string, targetSlotId: string) => void
  onDropTeamWheel: (
    sourceSlotId: string,
    sourceWheelIndex: number,
    targetSlotId: string,
    targetWheelIndex: number,
  ) => void
  onDropTeamWheelToSlot: (
    sourceSlotId: string,
    sourceWheelIndex: number,
    targetSlotId: string,
  ) => void
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
  onDropPickerPosse,
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
      activationConstraint: {distance: 4},
    }),
  )

  function isTeamSlotId(id: string): boolean {
    return id.startsWith('slot-')
  }

  function getSlotDropTarget(
    overId: string,
    overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
    overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  ): string | null {
    return (
      overWheelZone?.slotId ?? overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null)
    )
  }

  function handlePickerAwakenerDrop(
    data: Extract<DragData, {kind: 'picker-awakener'}>,
    overId: string,
    overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
    overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  ) {
    const targetSlotId = getSlotDropTarget(overId, overWheelZone, overCovenantZone)
    if (!targetSlotId) {
      return
    }

    onDropPickerAwakener(data.awakenerName, targetSlotId)
  }

  function handlePickerWheelDrop(
    data: Extract<DragData, {kind: 'picker-wheel'}>,
    overId: string,
    overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
    overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  ) {
    if (overWheelZone) {
      onDropPickerWheel(data.wheelId, overWheelZone.slotId, overWheelZone.wheelIndex)
      return
    }

    const targetSlotId = overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null)
    if (!targetSlotId) {
      return
    }

    onDropPickerWheel(data.wheelId, targetSlotId)
  }

  function handlePickerCovenantDrop(
    data: Extract<DragData, {kind: 'picker-covenant'}>,
    overId: string,
    overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  ) {
    const targetSlotId = overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null)
    if (!targetSlotId) {
      return
    }

    onDropPickerCovenant(data.covenantId, targetSlotId)
  }

  function handleTeamSlotDrop(
    data: Extract<DragData, {kind: 'team-slot'}>,
    overId: string,
    overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
    overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  ) {
    if (overId === PICKER_DROP_ZONE_ID) {
      onDropTeamSlotToPicker(data.slotId)
      return
    }

    const targetSlotId = getSlotDropTarget(overId, overWheelZone, overCovenantZone)
    if (!targetSlotId) {
      return
    }

    onDropTeamSlot(data.slotId, targetSlotId)
  }

  function handleTeamCovenantDrop(
    data: Extract<DragData, {kind: 'team-covenant'}>,
    overId: string,
    overCovenantZone: ReturnType<typeof parseCovenantDropZoneId>,
  ) {
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
  }

  function handleTeamWheelDrop(
    data: Extract<DragData, {kind: 'team-wheel'}>,
    overId: string,
    overWheelZone: ReturnType<typeof parseWheelDropZoneId>,
  ) {
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

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined
    if (!data) {
      return
    }
    setIsRemoveIntent(false)
    setActiveDrag(data)
  }

  function handleDragOver(event: DragOverEvent) {
    if (
      activeDrag?.kind !== 'team-slot' &&
      activeDrag?.kind !== 'team-wheel' &&
      activeDrag?.kind !== 'team-covenant'
    ) {
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

    switch (data.kind) {
      case 'picker-awakener':
        handlePickerAwakenerDrop(data, overId, overWheelZone, overCovenantZone)
        return
      case 'picker-wheel':
        handlePickerWheelDrop(data, overId, overWheelZone, overCovenantZone)
        return
      case 'picker-covenant':
        handlePickerCovenantDrop(data, overId, overCovenantZone)
        return
      case 'picker-posse':
        onDropPickerPosse(data.posseId)
        return
      case 'team-slot':
        handleTeamSlotDrop(data, overId, overWheelZone, overCovenantZone)
        return
      case 'team-covenant':
        handleTeamCovenantDrop(data, overId, overCovenantZone)
        return
      case 'team-wheel':
        handleTeamWheelDrop(data, overId, overWheelZone)
        return
      default:
        return
    }
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
