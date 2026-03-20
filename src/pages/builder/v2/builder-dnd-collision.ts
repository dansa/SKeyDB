import {closestCenter, pointerWithin, type CollisionDetection} from '@dnd-kit/core'

import {parseCovenantDropZoneId, parseWheelDropZoneId, POSSE_DROP_ZONE_ID} from '../dnd-ids'
import type {DragData} from '../types'

interface BuilderShellRect {
  bottom: number
  left: number
  right: number
  top: number
}

interface BuilderCollisionRect {
  bottom: number
  left: number
  right: number
  top: number
}

interface BuilderCollisionArgs {
  active: {
    data: {
      current?: unknown
    }
  }
  droppableContainers: {
    id: string | number
  }[]
  droppableRects: Map<string | number, BuilderCollisionRect>
  pointerCoordinates: {x: number; y: number} | null
}

type BuilderCollisionResult = ReturnType<CollisionDetection>

function isSlotDropZoneId(id: string): boolean {
  return id.startsWith('slot-')
}

function isCardAssignmentDropZoneId(id: string): boolean {
  return (
    isSlotDropZoneId(id) ||
    parseWheelDropZoneId(id) !== null ||
    parseCovenantDropZoneId(id) !== null
  )
}

function filterDroppableContainers(
  args: BuilderCollisionArgs,
  predicate: (id: string) => boolean,
): BuilderCollisionArgs {
  return {
    ...args,
    droppableContainers: args.droppableContainers.filter((container) =>
      predicate(String(container.id)),
    ),
  }
}

function getBuilderShellRect(
  droppableContainers: BuilderCollisionArgs['droppableContainers'],
  droppableRects: BuilderCollisionArgs['droppableRects'],
): BuilderShellRect | null {
  let shellRect: BuilderShellRect | null = null

  for (const container of droppableContainers) {
    const rect = droppableRects.get(container.id)
    if (!rect) {
      continue
    }

    shellRect = shellRect
      ? {
          bottom: Math.max(shellRect.bottom, rect.bottom),
          left: Math.min(shellRect.left, rect.left),
          right: Math.max(shellRect.right, rect.right),
          top: Math.min(shellRect.top, rect.top),
        }
      : {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        }
  }

  return shellRect
}

function isPointerInsideShell(
  pointerCoordinates: BuilderCollisionArgs['pointerCoordinates'],
  shellRect: BuilderShellRect | null,
): boolean {
  if (!pointerCoordinates || !shellRect) {
    return false
  }

  return (
    pointerCoordinates.x >= shellRect.left &&
    pointerCoordinates.x <= shellRect.right &&
    pointerCoordinates.y >= shellRect.top &&
    pointerCoordinates.y <= shellRect.bottom
  )
}

function runPointerWithin(args: BuilderCollisionArgs): BuilderCollisionResult {
  return pointerWithin(args as Parameters<typeof pointerWithin>[0])
}

function runClosestCenter(args: BuilderCollisionArgs): BuilderCollisionResult {
  return closestCenter(args as Parameters<typeof closestCenter>[0])
}

function detectPickerCollision(
  args: BuilderCollisionArgs,
  predicate: (id: string) => boolean,
  allowClosestCenterWithinShell: boolean,
): BuilderCollisionResult {
  const scopedArgs = filterDroppableContainers(args, predicate)
  if (scopedArgs.droppableContainers.length === 0) {
    return []
  }

  const pointerCollisions = runPointerWithin(scopedArgs)
  if (pointerCollisions.length > 0) {
    return pointerCollisions
  }

  if (!allowClosestCenterWithinShell) {
    return []
  }

  const shellRect = getBuilderShellRect(scopedArgs.droppableContainers, scopedArgs.droppableRects)
  if (!isPointerInsideShell(args.pointerCoordinates, shellRect)) {
    return []
  }

  return runClosestCenter(scopedArgs)
}

function isPickerDrag(data: DragData | undefined): boolean {
  return Boolean(data?.kind.startsWith('picker-'))
}

function resolveBuilderCollision(args: BuilderCollisionArgs): BuilderCollisionResult {
  const activeDrag = args.active.data.current as DragData | undefined

  if (!activeDrag || !isPickerDrag(activeDrag)) {
    const pointerCollisions = runPointerWithin(args)
    return pointerCollisions.length > 0 ? pointerCollisions : runClosestCenter(args)
  }

  if (activeDrag.kind === 'picker-posse') {
    return detectPickerCollision(args, (id) => id === POSSE_DROP_ZONE_ID, false)
  }

  return detectPickerCollision(args, isCardAssignmentDropZoneId, true)
}

export const builderCollisionDetection: CollisionDetection = (args) =>
  resolveBuilderCollision(args as unknown as BuilderCollisionArgs)
