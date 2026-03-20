import {useState} from 'react'

import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import {
  parseCovenantDropZoneId,
  parseWheelDropZoneId,
  PICKER_DROP_ZONE_ID,
  POSSE_DROP_ZONE_ID,
} from '../dnd-ids'
import {
  clearCovenantAssignment,
  clearSlotAssignment,
  clearWheelAssignment,
  swapSlotAssignments,
} from '../team-state'
import type {DragData} from '../types'
import {useBuilderStore} from './store/builder-store'
import type {BuilderV2ActionsResult} from './useBuilderV2Actions'

interface UseBuilderV2DndResult {
  activeDrag: DragData | null
  isRemoveIntent: boolean
  sensors: ReturnType<typeof useSensors>
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

export function useBuilderV2Dnd(
  actions: Pick<
    BuilderV2ActionsResult,
    | 'handleDropPickerAwakener'
    | 'handleDropPickerCovenant'
    | 'handleDropPickerWheel'
    | 'handleDropTeamCovenant'
    | 'handleDropTeamCovenantToSlot'
    | 'handleDropTeamWheel'
    | 'handleDropTeamWheelToSlot'
    | 'handleSetActivePosse'
  >,
): UseBuilderV2DndResult {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [isRemoveIntent, setIsRemoveIntent] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
    useSensor(TouchSensor, {activationConstraint: {delay: 250, tolerance: 5}}),
  )

  function isTeamSlotId(id: string): boolean {
    return id.startsWith('slot-')
  }

  function resolveSlotTarget(
    overId: string,
    overWheel: ReturnType<typeof parseWheelDropZoneId>,
    overCovenant: ReturnType<typeof parseCovenantDropZoneId>,
  ): string | null {
    return overWheel?.slotId ?? overCovenant?.slotId ?? (isTeamSlotId(overId) ? overId : null)
  }

  function applySlots(nextSlots: ReturnType<typeof clearSlotAssignment>['nextSlots']) {
    useBuilderStore.getState().setActiveTeamSlots(nextSlots)
  }

  function getActiveSlots() {
    const state = useBuilderStore.getState()
    const team = state.teams.find((t) => t.id === state.activeTeamId)
    return team?.slots ?? []
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
    const isTeamItem =
      activeDrag?.kind === 'team-slot' ||
      activeDrag?.kind === 'team-wheel' ||
      activeDrag?.kind === 'team-covenant'

    if (!isTeamItem) {
      if (isRemoveIntent) {
        setIsRemoveIntent(false)
      }
      return
    }

    const overId = event.over?.id
    const nextIntent = overId === PICKER_DROP_ZONE_ID
    if (nextIntent !== isRemoveIntent) {
      setIsRemoveIntent(nextIntent)
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

    const overWheel = parseWheelDropZoneId(overId)
    const overCovenant = parseCovenantDropZoneId(overId)

    switch (data.kind) {
      case 'picker-awakener': {
        const targetSlotId = resolveSlotTarget(overId, overWheel, overCovenant)
        if (targetSlotId) {
          actions.handleDropPickerAwakener(data.awakenerName, targetSlotId)
        }
        return
      }

      case 'picker-wheel': {
        if (overWheel) {
          actions.handleDropPickerWheel(data.wheelId, overWheel.slotId, overWheel.wheelIndex)
          return
        }
        const targetSlotId = overCovenant?.slotId ?? (isTeamSlotId(overId) ? overId : null)
        if (targetSlotId) {
          actions.handleDropPickerWheel(data.wheelId, targetSlotId)
        }
        return
      }

      case 'picker-covenant': {
        const targetSlotId = overCovenant?.slotId ?? (isTeamSlotId(overId) ? overId : null)
        if (targetSlotId) {
          actions.handleDropPickerCovenant(data.covenantId, targetSlotId)
        }
        return
      }

      case 'picker-posse': {
        if (overId === POSSE_DROP_ZONE_ID) {
          actions.handleSetActivePosse(data.posseId)
        }
        return
      }

      case 'team-slot': {
        if (overId === PICKER_DROP_ZONE_ID) {
          const slots = getActiveSlots()
          applySlots(clearSlotAssignment(slots, data.slotId).nextSlots)
          return
        }
        const targetSlotId = resolveSlotTarget(overId, overWheel, overCovenant)
        if (targetSlotId) {
          const slots = getActiveSlots()
          applySlots(swapSlotAssignments(slots, data.slotId, targetSlotId).nextSlots)
        }
        return
      }

      case 'team-wheel': {
        if (overId === PICKER_DROP_ZONE_ID) {
          const slots = getActiveSlots()
          applySlots(clearWheelAssignment(slots, data.slotId, data.wheelIndex).nextSlots)
          return
        }
        if (overWheel) {
          actions.handleDropTeamWheel(
            data.slotId,
            data.wheelIndex,
            overWheel.slotId,
            overWheel.wheelIndex,
          )
          return
        }
        if (isTeamSlotId(overId)) {
          actions.handleDropTeamWheelToSlot(data.slotId, data.wheelIndex, overId)
        }
        return
      }

      case 'team-row': {
        useBuilderStore.getState().reorderTeams(data.teamId, overId)
        return
      }

      case 'team-covenant': {
        if (overId === PICKER_DROP_ZONE_ID) {
          const slots = getActiveSlots()
          applySlots(clearCovenantAssignment(slots, data.slotId).nextSlots)
          return
        }
        if (overCovenant) {
          actions.handleDropTeamCovenant(data.slotId, overCovenant.slotId)
          return
        }
        if (isTeamSlotId(overId)) {
          actions.handleDropTeamCovenantToSlot(data.slotId, overId)
        }
        return
      }

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
