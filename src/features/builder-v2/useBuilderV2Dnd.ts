import {useMemo, useState} from 'react'

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
  isBuilderV2TeamSortDragPayload,
  parseBuilderV2DndId,
  resolveBuilderV2DndAction,
  resolveBuilderV2EffectiveDropTarget,
  type BuilderV2DndAction,
  type BuilderV2DragPayload,
  type BuilderV2DragPreviewDescriptor,
  type BuilderV2DropTargetDescriptor,
  type BuilderV2TeamDragPreviewDescriptor,
} from './builder-v2-dnd'
import type {BuilderV2DndCommandPort} from './BuilderV2DndCommandPort'

interface UseBuilderV2DndOptions {
  model: BuilderV2DndCommandPort
}

export function useBuilderV2Dnd({model}: UseBuilderV2DndOptions) {
  const [activePreview, setActivePreview] = useState<BuilderV2DragPreviewDescriptor | null>(null)
  const [activeTeamPreview, setActiveTeamPreview] =
    useState<BuilderV2TeamDragPreviewDescriptor | null>(null)
  const [activeDropTarget, setActiveDropTarget] = useState<BuilderV2DropTargetDescriptor | null>(
    null,
  )
  const teamSortIds = useMemo(() => new Set(model.teams.map((team) => team.id)), [model.teams])
  const collisionDetection = useMemo(
    () => createBuilderV2CollisionDetection(teamSortIds),
    [teamSortIds],
  )
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {distance: 4},
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    const payload = event.active.data.current
    const teamPreview = createBuilderV2TeamSortPreview(payload, model)
    setActiveTeamPreview(teamPreview)
    setActivePreview(!teamPreview && isBuilderV2DragPayload(payload) ? payload.preview : null)
    setActiveDropTarget(null)
  }

  function handleDragOver(event: DragOverEvent) {
    const payload = event.active.data.current
    if (isBuilderV2TeamSortDragPayload(payload)) {
      setActiveDropTarget((current) => (current === null ? current : null))
      return
    }

    const target = parseBuilderV2DndId(event.over?.id)
    const nextDropTarget = isBuilderV2DragPayload(payload)
      ? resolveBuilderV2EffectiveDropTarget(payload, target, model.slots, model.teams)
      : null
    setActiveDropTarget((current) =>
      areBuilderV2DropTargetsEqual(current, nextDropTarget) ? current : nextDropTarget,
    )
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActivePreview(null)
    setActiveTeamPreview(null)
    setActiveDropTarget(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePreview(null)
    setActiveTeamPreview(null)
    setActiveDropTarget(null)
    const payload = event.active.data.current
    if (isBuilderV2TeamSortDragPayload(payload)) {
      dispatchBuilderV2TeamSort(model, payload.teamId, event.over?.id)
      return
    }

    if (!isBuilderV2DragPayload(payload)) {
      return
    }

    const target = parseBuilderV2DndId(event.over?.id)
    const action = resolveBuilderV2DndAction(payload, target, {
      slots: model.slots,
      teams: model.teams,
    })
    if (!action) {
      return
    }

    dispatchBuilderV2DndAction(model, action)
  }

  return {
    activeDropTarget,
    activePreview,
    activeTeamPreview,
    collisionDetection,
    isDragging: Boolean(activePreview) || Boolean(activeTeamPreview),
    isLoadoutDragging: Boolean(activePreview),
    sensors,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
  }
}

export function filterBuilderV2TeamSortDroppables<TDroppable extends {id: unknown}>(
  droppableContainers: TDroppable[],
  teamSortIds: ReadonlySet<string>,
): TDroppable[] {
  return droppableContainers.filter(
    (droppable) => typeof droppable.id === 'string' && teamSortIds.has(droppable.id),
  )
}

export function filterBuilderV2LoadoutDroppables<TDroppable extends {id: unknown}>(
  droppableContainers: TDroppable[],
): TDroppable[] {
  return droppableContainers.filter((droppable) => parseBuilderV2DndId(droppable.id) !== null)
}

export function orderBuilderV2LoadoutCollisions<TCollision extends {id: unknown}>(
  collisions: TCollision[],
  payload: BuilderV2DragPayload,
): TCollision[] {
  return [...collisions].sort((left, right) => {
    const priorityDelta =
      getBuilderV2CollisionPriority(left.id, payload) -
      getBuilderV2CollisionPriority(right.id, payload)
    return priorityDelta
  })
}

export function createBuilderV2CollisionDetection(
  teamSortIds: ReadonlySet<string>,
): CollisionDetection {
  return (args) => {
    if (isBuilderV2TeamSortDragPayload(args.active.data.current)) {
      return closestCenter({
        ...args,
        droppableContainers: filterBuilderV2TeamSortDroppables(
          args.droppableContainers,
          teamSortIds,
        ),
      })
    }

    const payload = args.active.data.current
    if (!isBuilderV2DragPayload(payload)) {
      const pointerCollisions = pointerWithin(args)
      return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args)
    }

    const loadoutArgs = {
      ...args,
      droppableContainers: filterBuilderV2LoadoutDroppables(args.droppableContainers),
    }
    const pointerCollisions = pointerWithin(loadoutArgs)
    const collisions = pointerCollisions.length > 0 ? pointerCollisions : closestCenter(loadoutArgs)
    return orderBuilderV2LoadoutCollisions(collisions, payload)
  }
}

function getBuilderV2CollisionPriority(id: unknown, payload: BuilderV2DragPayload): number {
  const target = parseBuilderV2DndId(id)
  if (!target) {
    return 4
  }

  if (target.kind === 'picker') {
    return payload.source === 'team' || payload.source === 'team-management' ? 2 : 4
  }

  switch (payload.kind) {
    case 'wheel':
      return target.kind === 'wheel' || target.kind === 'team-management-wheel'
        ? 0
        : getBuilderV2SlotFallbackPriority(target)
    case 'covenant':
      return target.kind === 'covenant' || target.kind === 'team-management-covenant'
        ? 0
        : getBuilderV2SlotFallbackPriority(target)
    case 'awakener':
      return target.kind === 'slot' || target.kind === 'team-management-slot'
        ? 0
        : getBuilderV2SlotFallbackPriority(target)
    case 'posse':
      return target.kind === 'posse' ? 0 : 4
  }
}

function getBuilderV2SlotFallbackPriority(target: BuilderV2DropTargetDescriptor): number {
  switch (target.kind) {
    case 'slot':
    case 'team-management-slot':
      return 1
    case 'wheel':
    case 'covenant':
    case 'team-management-wheel':
    case 'team-management-covenant':
      return 2
    default:
      return 4
  }
}

function createBuilderV2TeamSortPreview(
  payload: unknown,
  model: BuilderV2DndCommandPort,
): BuilderV2TeamDragPreviewDescriptor | null {
  if (!isBuilderV2TeamSortDragPayload(payload)) {
    return null
  }

  const index = model.teams.findIndex((team) => team.id === payload.teamId)
  if (index === -1) {
    return null
  }

  const team = model.teams[index]
  return {team, index, previewMode: model.teamPreviewMode}
}

function dispatchBuilderV2TeamSort(
  model: BuilderV2DndCommandPort,
  activeTeamId: string,
  overId: unknown,
) {
  if (typeof overId !== 'string' || activeTeamId === overId) {
    return
  }

  const targetIndex = model.teams.findIndex((team) => team.id === overId)
  if (targetIndex === -1) {
    return
  }

  model.moveTeamToIndex(activeTeamId, targetIndex)
}

function dispatchBuilderV2DndAction(model: BuilderV2DndCommandPort, action: BuilderV2DndAction) {
  switch (action.kind) {
    case 'assign-awakener':
      model.assignAwakenerToSlot(action.awakenerId, action.slotId)
      return
    case 'assign-awakener-to-team-slot':
      model.assignAwakenerToTeamSlot(action.awakenerId, action.teamId, action.slotId)
      return
    case 'assign-wheel':
      model.assignWheelToSlot(action.wheelId, action.slotId, action.wheelIndex)
      return
    case 'assign-wheel-to-team-slot':
      model.assignWheelToTeamSlot(action.wheelId, action.teamId, action.slotId, action.wheelIndex)
      return
    case 'assign-covenant':
      model.assignCovenantToSlot(action.covenantId, action.slotId)
      return
    case 'assign-covenant-to-team-slot':
      model.assignCovenantToTeamSlot(action.covenantId, action.teamId, action.slotId)
      return
    case 'assign-posse':
      model.assignPosse(action.posseId)
      return
    case 'remove-awakener':
      model.removeAwakener(action.slotId)
      return
    case 'remove-team-slot':
      model.clearTeamSlot(action.teamId, action.slotId)
      return
    case 'move-awakener':
      model.moveAwakener(action.fromSlotId, action.toSlotId)
      return
    case 'swap-team-slots':
      model.swapTeamSlots(
        action.sourceTeamId,
        action.sourceSlotId,
        action.targetTeamId,
        action.targetSlotId,
      )
      return
    case 'remove-team-wheel':
      model.clearTeamWheel(action.teamId, action.slotId, action.wheelIndex)
      return
    case 'move-team-wheel':
      model.moveTeamWheel(
        action.sourceTeamId,
        action.sourceSlotId,
        action.sourceWheelIndex,
        action.targetTeamId,
        action.targetSlotId,
        action.targetWheelIndex,
      )
      return
    case 'move-team-wheel-to-team-slot':
      model.moveTeamWheelToTeamSlot(
        action.sourceTeamId,
        action.sourceSlotId,
        action.sourceWheelIndex,
        action.targetTeamId,
        action.targetSlotId,
      )
      return
    case 'remove-team-covenant':
      model.clearTeamCovenant(action.teamId, action.slotId)
      return
    case 'move-team-covenant':
      model.moveTeamCovenant(
        action.sourceTeamId,
        action.sourceSlotId,
        action.targetTeamId,
        action.targetSlotId,
      )
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

function areBuilderV2DropTargetsEqual(
  current: BuilderV2DropTargetDescriptor | null,
  next: BuilderV2DropTargetDescriptor | null,
): boolean {
  if (current === next) {
    return true
  }
  if (!current || current.kind !== next?.kind) {
    return false
  }

  switch (current.kind) {
    case 'slot':
    case 'covenant':
      return next.kind === current.kind && current.slotId === next.slotId
    case 'wheel':
      return (
        next.kind === 'wheel' &&
        current.slotId === next.slotId &&
        current.wheelIndex === next.wheelIndex
      )
    case 'picker':
    case 'posse':
      return true
    case 'team-management-slot':
      return (
        next.kind === 'team-management-slot' &&
        current.teamId === next.teamId &&
        current.slotId === next.slotId
      )
    case 'team-management-wheel':
      return (
        next.kind === 'team-management-wheel' &&
        current.teamId === next.teamId &&
        current.slotId === next.slotId &&
        current.wheelIndex === next.wheelIndex
      )
    case 'team-management-covenant':
      return (
        next.kind === 'team-management-covenant' &&
        current.teamId === next.teamId &&
        current.slotId === next.slotId
      )
  }
}
