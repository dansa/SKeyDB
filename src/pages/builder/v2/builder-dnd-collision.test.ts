import {describe, expect, it, vi} from 'vitest'

import {POSSE_DROP_ZONE_ID} from '../dnd-ids'
import {builderCollisionDetection} from './builder-dnd-collision'

const closestCenterMock = vi.fn<(...args: unknown[]) => unknown[]>(() => [])
const pointerWithinMock = vi.fn<(...args: unknown[]) => unknown[]>(() => [])

vi.mock('@dnd-kit/core', () => {
  return {
    closestCenter: (...args: unknown[]) => closestCenterMock(...args),
    pointerWithin: (...args: unknown[]) => pointerWithinMock(...args),
  }
})

function makeRect(left: number, top: number, right: number, bottom: number) {
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  }
}

function makeArgs({
  droppableIds,
  kind,
  pointerCoordinates,
}: {
  droppableIds: string[]
  kind: 'picker-awakener' | 'picker-posse' | 'team-slot'
  pointerCoordinates?: {x: number; y: number}
}) {
  const droppableContainers = droppableIds.map((id) => ({id}))
  const droppableRects = new Map(
    droppableIds.map((id, index) => [id, makeRect(index * 100, 0, index * 100 + 80, 120)]),
  )

  return {
    active: {
      data: {
        current:
          kind === 'picker-posse'
            ? {kind, posseId: 'posse-1', posseName: 'Posse'}
            : kind === 'team-slot'
              ? {kind, slotId: 'slot-1', awakenerName: 'Goliath'}
              : {kind, awakenerName: 'Goliath'},
      },
    },
    collisionRect: makeRect(0, 0, 80, 120),
    droppableContainers,
    droppableRects,
    pointerCoordinates,
  } as never
}

describe('builderCollisionDetection', () => {
  it('ignores picker drags when the pointer never enters the builder shell', () => {
    pointerWithinMock.mockReturnValue([])
    closestCenterMock.mockReturnValue([{id: 'slot-4'}])

    const result = builderCollisionDetection(
      makeArgs({
        droppableIds: ['slot-1', 'slot-2', 'dropzone:picker'],
        kind: 'picker-awakener',
        pointerCoordinates: {x: 480, y: 32},
      }),
    )

    expect(result).toEqual([])
    expect(closestCenterMock).not.toHaveBeenCalled()
  })

  it('falls back to builder-only closest-center once the pointer is inside the builder shell', () => {
    pointerWithinMock.mockReturnValue([])
    closestCenterMock.mockReturnValue([{id: 'slot-2'}])

    const result = builderCollisionDetection(
      makeArgs({
        droppableIds: ['slot-1', 'slot-2', 'dropzone:picker'],
        kind: 'picker-awakener',
        pointerCoordinates: {x: 140, y: 32},
      }),
    )

    expect(result).toEqual([{id: 'slot-2'}])
    expect(closestCenterMock).toHaveBeenCalledWith(
      expect.objectContaining({
        droppableContainers: [{id: 'slot-1'}, {id: 'slot-2'}],
      }),
    )
  })

  it('lets posse drags target only the posse drop zone inside the builder shell', () => {
    pointerWithinMock.mockReturnValue([{id: POSSE_DROP_ZONE_ID}])

    const result = builderCollisionDetection(
      makeArgs({
        droppableIds: [POSSE_DROP_ZONE_ID, 'dropzone:picker', 'slot-1'],
        kind: 'picker-posse',
        pointerCoordinates: {x: 24, y: 24},
      }),
    )

    expect(result).toEqual([{id: POSSE_DROP_ZONE_ID}])
    expect(pointerWithinMock).toHaveBeenCalledWith(
      expect.objectContaining({
        droppableContainers: [{id: POSSE_DROP_ZONE_ID}],
      }),
    )
  })
})
