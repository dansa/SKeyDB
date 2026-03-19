import {describe, expect, it} from 'vitest'

import type {TeamSlot} from '../types'
import {
  getQuickLineupActiveTarget,
  getQuickLineupStepContextLabel,
  getQuickLineupStepForTarget,
  isQuickLineupSlotActive,
} from './quick-lineup-model'

function createSlot(slotId: string, awakenerName?: string): TeamSlot {
  return {
    awakenerName,
    covenantId: undefined,
    isSupport: false,
    level: 1,
    realm: undefined,
    slotId,
    wheels: [null, null],
  }
}

describe('quick-lineup-model', () => {
  const slots = [createSlot('slot-1', 'agrippa'), createSlot('slot-2')]

  it('formats step labels for every target type', () => {
    expect(getQuickLineupStepContextLabel({kind: 'posse'}, slots)).toBe('Team Posse')
    expect(getQuickLineupStepContextLabel({kind: 'awakener', slotId: 'slot-1'}, slots)).toBe(
      'Agrippa -> Awakener',
    )
    expect(
      getQuickLineupStepContextLabel({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1}, slots),
    ).toBe('Agrippa -> Wheel 2')
    expect(getQuickLineupStepContextLabel({kind: 'covenant', slotId: 'slot-2'}, slots)).toBe(
      'Slot 2 -> Covenant',
    )
  })

  it('marks only the active slot target for the current step', () => {
    expect(getQuickLineupActiveTarget('slot-1', {kind: 'awakener', slotId: 'slot-1'})).toBe(
      'awakener',
    )
    expect(
      getQuickLineupActiveTarget('slot-1', {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0}),
    ).toBe('wheel-0')
    expect(
      getQuickLineupActiveTarget('slot-1', {kind: 'wheel', slotId: 'slot-1', wheelIndex: 1}),
    ).toBe('wheel-1')
    expect(getQuickLineupActiveTarget('slot-1', {kind: 'covenant', slotId: 'slot-1'})).toBe(
      'covenant',
    )
    expect(getQuickLineupActiveTarget('slot-2', {kind: 'awakener', slotId: 'slot-1'})).toBeNull()
    expect(getQuickLineupActiveTarget('slot-1', {kind: 'posse'})).toBeNull()
    expect(isQuickLineupSlotActive('slot-1', {kind: 'covenant', slotId: 'slot-1'})).toBe(true)
    expect(isQuickLineupSlotActive('slot-2', {kind: 'covenant', slotId: 'slot-1'})).toBe(false)
  })

  it('rebuilds the matching quick-lineup step for each slot target', () => {
    expect(getQuickLineupStepForTarget('slot-1', 'awakener')).toEqual({
      kind: 'awakener',
      slotId: 'slot-1',
    })
    expect(getQuickLineupStepForTarget('slot-1', 'wheel-0')).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(getQuickLineupStepForTarget('slot-1', 'wheel-1')).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 1,
    })
    expect(getQuickLineupStepForTarget('slot-1', 'covenant')).toEqual({
      kind: 'covenant',
      slotId: 'slot-1',
    })
  })
})
