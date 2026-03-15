import {describe, expect, it} from 'vitest'

import type {TeamSlot} from '../../types'
import type {QuickLineupStep} from '../store/types'
import {
  getQuickLineupActiveTarget,
  getQuickLineupStepContextLabel,
  getQuickLineupStepForTarget,
  isQuickLineupSlotActive,
  type QuickLineupSlotTarget,
} from './quick-lineup-model'

function createSlot(slotId: string, overrides: Partial<TeamSlot> = {}): TeamSlot {
  return {
    slotId,
    wheels: [null, null],
    ...overrides,
  }
}

describe('quick lineup model', () => {
  it('formats context labels for awakener, wheel, covenant, and posse steps', () => {
    const slots: TeamSlot[] = [
      createSlot('slot-1', {awakenerName: 'goliath'}),
      createSlot('slot-2'),
      createSlot('slot-3'),
      createSlot('slot-4'),
    ]

    expect(getQuickLineupStepContextLabel({kind: 'awakener', slotId: 'slot-1'}, slots)).toBe(
      'Goliath -> Awakener',
    )
    expect(
      getQuickLineupStepContextLabel({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1}, slots),
    ).toBe('Goliath -> Wheel 2')
    expect(getQuickLineupStepContextLabel({kind: 'covenant', slotId: 'slot-2'}, slots)).toBe(
      'Slot 2 -> Covenant',
    )
    expect(getQuickLineupStepContextLabel({kind: 'posse'}, slots)).toBe('Team Posse')
  })

  it('derives the active target for the active slot only', () => {
    const wheelStep: QuickLineupStep = {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0}

    expect(getQuickLineupActiveTarget('slot-1', wheelStep)).toBe('wheel-0')
    expect(getQuickLineupActiveTarget('slot-2', wheelStep)).toBeNull()
    expect(isQuickLineupSlotActive('slot-1', wheelStep)).toBe(true)
    expect(isQuickLineupSlotActive('slot-2', wheelStep)).toBe(false)
    expect(getQuickLineupActiveTarget('slot-1', {kind: 'posse'})).toBeNull()
  })

  it('maps slot targets back to quick-lineup steps', () => {
    const expectations: [QuickLineupSlotTarget, QuickLineupStep][] = [
      ['awakener', {kind: 'awakener', slotId: 'slot-3'}],
      ['wheel-0', {kind: 'wheel', slotId: 'slot-3', wheelIndex: 0}],
      ['wheel-1', {kind: 'wheel', slotId: 'slot-3', wheelIndex: 1}],
      ['covenant', {kind: 'covenant', slotId: 'slot-3'}],
    ]

    for (const [target, expectedStep] of expectations) {
      expect(getQuickLineupStepForTarget('slot-3', target)).toEqual(expectedStep)
    }
  })
})
