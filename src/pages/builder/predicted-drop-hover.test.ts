import { describe, expect, it } from 'vitest'
import { resolvePredictedDropHover } from './predicted-drop-hover'
import type { TeamSlot } from './types'

function makeSlots(): Map<string, TeamSlot> {
  return new Map<string, TeamSlot>([
    [
      'slot-1',
      {
        slotId: 'slot-1',
        awakenerName: 'goliath',
        faction: 'AEQUOR',
        level: 60,
        wheels: [null, 'B02'],
      },
    ],
    [
      'slot-2',
      {
        slotId: 'slot-2',
        wheels: [null, null],
      },
    ],
  ])
}

describe('resolvePredictedDropHover', () => {
  it('predicts direct wheel drop target', () => {
    const result = resolvePredictedDropHover(
      { kind: 'picker-wheel', wheelId: 'B01' },
      'dropzone:wheel:slot-1:1',
      makeSlots(),
    )

    expect(result).toEqual({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 1 })
  })

  it('predicts first empty wheel on slot-level wheel drops', () => {
    const result = resolvePredictedDropHover(
      { kind: 'team-wheel', slotId: 'slot-3', wheelIndex: 0, wheelId: 'B01' },
      'slot-1',
      makeSlots(),
    )

    expect(result).toEqual({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 0 })
  })

  it('predicts covenant drop on valid awakener slot only', () => {
    const result = resolvePredictedDropHover(
      { kind: 'picker-covenant', covenantId: '001' },
      'slot-1',
      makeSlots(),
    )
    const blockedResult = resolvePredictedDropHover(
      { kind: 'picker-covenant', covenantId: '001' },
      'slot-2',
      makeSlots(),
    )

    expect(result).toEqual({ kind: 'covenant', slotId: 'slot-1' })
    expect(blockedResult).toBeNull()
  })
})

