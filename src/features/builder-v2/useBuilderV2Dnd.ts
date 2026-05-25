import {useState} from 'react'

import {
  closestCenter,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import {
  isBuilderV2DragPayload,
  parseBuilderV2DndId,
  resolveBuilderV2DndAction,
  resolveBuilderV2EffectiveDropTarget,
  type BuilderV2DndAction,
  type BuilderV2DragPreviewDescriptor,
  type BuilderV2DropTargetDescriptor,
} from './builder-v2-dnd'
import type {BuilderV2Model} from './BuilderV2ModelTypes'

interface UseBuilderV2DndOptions {
  model: BuilderV2Model
}

const builderV2CollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args)
}

export function useBuilderV2Dnd({model}: UseBuilderV2DndOptions) {
  const [activePreview, setActivePreview] = useState<BuilderV2DragPreviewDescriptor | null>(null)
  const [activeDropTarget, setActiveDropTarget] = useState<BuilderV2DropTargetDescriptor | null>(
    null,
  )
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {distance: 4},
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    const payload = event.active.data.current
    setActivePreview(isBuilderV2DragPayload(payload) ? payload.preview : null)
    setActiveDropTarget(null)
  }

  function handleDragOver(event: DragOverEvent) {
    const payload = event.active.data.current
    const target = parseBuilderV2DndId(event.over?.id)
    setActiveDropTarget(
      isBuilderV2DragPayload(payload)
        ? resolveBuilderV2EffectiveDropTarget(payload, target, model.slots)
        : null,
    )
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActivePreview(null)
    setActiveDropTarget(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePreview(null)
    setActiveDropTarget(null)
    const payload = event.active.data.current
    if (!isBuilderV2DragPayload(payload)) {
      return
    }

    const target = parseBuilderV2DndId(event.over?.id)
    const action = resolveBuilderV2DndAction(payload, target, {slots: model.slots})
    if (!action) {
      return
    }

    dispatchBuilderV2DndAction(model, action)
  }

  return {
    activeDropTarget,
    activePreview,
    collisionDetection: builderV2CollisionDetection,
    isDragging: Boolean(activePreview),
    sensors,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
  }
}

function dispatchBuilderV2DndAction(model: BuilderV2Model, action: BuilderV2DndAction) {
  switch (action.kind) {
    case 'assign-awakener':
      model.assignAwakenerToSlot(action.awakenerId, action.slotId)
      return
    case 'assign-wheel':
      model.assignWheelToSlot(action.wheelId, action.slotId, action.wheelIndex)
      return
    case 'assign-covenant':
      model.assignCovenantToSlot(action.covenantId, action.slotId)
      return
    case 'assign-posse':
      model.assignPosse(action.posseId)
      return
    case 'remove-awakener':
      model.removeAwakener(action.slotId)
      return
    case 'move-awakener':
      model.moveAwakener(action.fromSlotId, action.toSlotId)
      return
    case 'remove-wheel':
      model.clearWheel(action.slotId, action.wheelIndex)
      return
    case 'remove-covenant':
      model.clearCovenant(action.slotId)
      return
    case 'move-wheel':
      model.moveWheel(
        action.fromSlotId,
        action.fromWheelIndex,
        action.toSlotId,
        action.toWheelIndex,
      )
      return
    case 'move-wheel-to-slot':
      model.moveWheelToSlot(action.fromSlotId, action.fromWheelIndex, action.toSlotId)
      return
    case 'move-covenant':
      model.moveCovenant(action.fromSlotId, action.toSlotId)
      return
  }
}
