import { describe, expect, it } from 'vitest'
import {
  nextSelectionAfterWheelRemoved,
  nextSelectionAfterWheelSwap,
  shouldSetActiveWheelOnPickerAssign,
  toggleAwakenerSelection,
  toggleWheelSelection,
} from './selection-state'

describe('selection-state', () => {
  it('toggles awakener selection for the same slot', () => {
    expect(toggleAwakenerSelection({ kind: 'awakener', slotId: 'slot-1' }, 'slot-1')).toBeNull()
    expect(toggleAwakenerSelection(null, 'slot-1')).toEqual({ kind: 'awakener', slotId: 'slot-1' })
  })

  it('toggles wheel selection for the same slot/index', () => {
    expect(toggleWheelSelection({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 0 }, 'slot-1', 0)).toBeNull()
    expect(toggleWheelSelection(null, 'slot-1', 1)).toEqual({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 1 })
  })

  it('enables wheel-active landing only when wheel selection is active', () => {
    expect(shouldSetActiveWheelOnPickerAssign({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 0 })).toBe(true)
    expect(shouldSetActiveWheelOnPickerAssign({ kind: 'awakener', slotId: 'slot-1' })).toBe(false)
    expect(shouldSetActiveWheelOnPickerAssign(null)).toBe(false)
  })

  it('moves wheel selection with source/target during swap', () => {
    const sourceSelected = nextSelectionAfterWheelSwap(
      { kind: 'wheel', slotId: 'slot-1', wheelIndex: 0 },
      'slot-1',
      0,
      'slot-2',
      1,
    )
    expect(sourceSelected).toEqual({ kind: 'wheel', slotId: 'slot-2', wheelIndex: 1 })

    const targetSelected = nextSelectionAfterWheelSwap(
      { kind: 'wheel', slotId: 'slot-2', wheelIndex: 1 },
      'slot-1',
      0,
      'slot-2',
      1,
    )
    expect(targetSelected).toEqual({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 0 })
  })

  it('clears selection only when removed wheel was active', () => {
    expect(nextSelectionAfterWheelRemoved({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 0 }, 'slot-1', 0)).toBeNull()
    expect(nextSelectionAfterWheelRemoved({ kind: 'wheel', slotId: 'slot-1', wheelIndex: 0 }, 'slot-1', 1)).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
  })
})
