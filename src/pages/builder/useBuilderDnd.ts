import {
  type DragOverEvent,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { DragData } from './types'

export const PICKER_DROP_ZONE_ID = 'dropzone:picker'

type UseBuilderDndOptions = {
  onDropPickerAwakener: (awakenerName: string, targetSlotId: string) => void
  onDropTeamSlot: (sourceSlotId: string, targetSlotId: string) => void
  onDropTeamSlotToPicker: (sourceSlotId: string) => void
}

export function useBuilderDnd({ onDropPickerAwakener, onDropTeamSlot, onDropTeamSlotToPicker }: UseBuilderDndOptions) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [isRemoveIntent, setIsRemoveIntent] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined
    if (!data) {
      return
    }
    setIsRemoveIntent(false)
    setActiveDrag(data)
  }

  function handleDragOver(event: DragOverEvent) {
    if (activeDrag?.kind !== 'team-slot') {
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

    if (data.kind === 'picker-awakener') {
      onDropPickerAwakener(data.awakenerName, overId)
      return
    }

    if (overId === PICKER_DROP_ZONE_ID) {
      onDropTeamSlotToPicker(data.slotId)
      return
    }

    onDropTeamSlot(data.slotId, overId)
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
