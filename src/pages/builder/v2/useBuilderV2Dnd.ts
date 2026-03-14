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

import {awakenerByName} from '../constants'
import {parseCovenantDropZoneId, parseWheelDropZoneId, PICKER_DROP_ZONE_ID} from '../dnd-ids'
import {
  assignAwakenerToSlot,
  assignCovenantToSlot,
  assignWheelToSlot,
  clearCovenantAssignment,
  clearSlotAssignment,
  clearWheelAssignment,
  swapCovenantAssignments,
  swapSlotAssignments,
  swapWheelAssignments,
} from '../team-state'
import type {DragData} from '../types'
import {useBuilderStore} from './store/builder-store'

interface UseBuilderV2DndResult {
  activeDrag: DragData | null
  isRemoveIntent: boolean
  sensors: ReturnType<typeof useSensors>
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

export function useBuilderV2Dnd(): UseBuilderV2DndResult {
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

  function applySlots(nextSlots: ReturnType<typeof assignAwakenerToSlot>['nextSlots']) {
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
          const slots = getActiveSlots()
          const result = assignAwakenerToSlot(
            slots,
            data.awakenerName,
            targetSlotId,
            awakenerByName,
          )
          applySlots(result.nextSlots)
        }
        return
      }

      case 'picker-wheel': {
        if (overWheel) {
          const slots = getActiveSlots()
          const result = assignWheelToSlot(
            slots,
            overWheel.slotId,
            overWheel.wheelIndex,
            data.wheelId,
          )
          applySlots(result.nextSlots)
          return
        }
        const targetSlotId = overCovenant?.slotId ?? (isTeamSlotId(overId) ? overId : null)
        if (targetSlotId) {
          const slots = getActiveSlots()
          const result = assignWheelToSlot(slots, targetSlotId, 0, data.wheelId)
          applySlots(result.nextSlots)
        }
        return
      }

      case 'picker-covenant': {
        const targetSlotId = overCovenant?.slotId ?? (isTeamSlotId(overId) ? overId : null)
        if (targetSlotId) {
          const slots = getActiveSlots()
          const result = assignCovenantToSlot(slots, targetSlotId, data.covenantId)
          applySlots(result.nextSlots)
        }
        return
      }

      case 'picker-posse': {
        useBuilderStore.getState().setPosseForActiveTeam(data.posseId)
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
          const slots = getActiveSlots()
          applySlots(
            swapWheelAssignments(
              slots,
              data.slotId,
              data.wheelIndex,
              overWheel.slotId,
              overWheel.wheelIndex,
            ).nextSlots,
          )
          return
        }
        if (isTeamSlotId(overId)) {
          const slots = getActiveSlots()
          applySlots(assignWheelToSlot(slots, overId, 0, data.wheelId).nextSlots)
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
          const slots = getActiveSlots()
          applySlots(swapCovenantAssignments(slots, data.slotId, overCovenant.slotId).nextSlots)
          return
        }
        if (isTeamSlotId(overId)) {
          const slots = getActiveSlots()
          applySlots(assignCovenantToSlot(slots, overId, data.covenantId).nextSlots)
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
