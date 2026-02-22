import { describe, expect, it } from 'vitest'
import { awakenersByNameForTests, teamSlotsForTests, teamSlotsForTestsWithTwoFactions } from './fixtures'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignWheelToSlot,
  clearSlotAssignment,
  clearWheelAssignment,
  swapWheelAssignments,
  swapSlotAssignments,
} from './team-state'

describe('builder team state', () => {
  it('does not clear source when target slot id is invalid', () => {
    const slots = teamSlotsForTests()
    const result = assignAwakenerToSlot(slots, 'Goliath', 'not-a-slot', awakenersByNameForTests)

    expect(result.nextSlots).toEqual(slots)
  })

  it('moves assignment when target slot is valid', () => {
    const slots = teamSlotsForTests()
    const result = assignAwakenerToSlot(slots, 'Goliath', 'slot-2', awakenersByNameForTests)

    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerName).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerName).toBe('Goliath')
  })

  it('is a no-op when assigning to the same slot', () => {
    const slots = teamSlotsForTests()
    const result = assignAwakenerToSlot(slots, 'Goliath', 'slot-1', awakenersByNameForTests)

    expect(result.nextSlots).toBe(slots)
  })

  it('swaps source and target slot payloads', () => {
    const slots = teamSlotsForTests()
    const result = swapSlotAssignments(slots, 'slot-1', 'slot-2')

    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerName).toBe('Miryam')
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerName).toBe('Goliath')
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.wheels).not.toBe(slots[1].wheels)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).not.toBe(slots[0].wheels)
  })

  it('blocks adding a third faction', () => {
    const slots = teamSlotsForTestsWithTwoFactions()
    const result = assignAwakenerToSlot(slots, 'Castor', 'slot-3', awakenersByNameForTests)

    expect(result.nextSlots).toBe(slots)
    expect(result.violation).toBe('TOO_MANY_FACTIONS_IN_TEAM')
  })

  it('allows replacing the only out-faction member', () => {
    const slots = teamSlotsForTestsWithTwoFactions()
    const result = assignAwakenerToSlot(slots, 'Castor', 'slot-1', awakenersByNameForTests)

    expect(result.violation).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerName).toBe('Castor')
  })

  it('treats alternate forms as globally unique within the team', () => {
    const slots = teamSlotsForTests()
    const withRamona = assignAwakenerToSlot(slots, 'Ramona', 'slot-2', awakenersByNameForTests)
    const withTimeworn = assignAwakenerToSlot(
      withRamona.nextSlots,
      'Ramona: Timeworn',
      'slot-3',
      awakenersByNameForTests,
    )

    expect(withTimeworn.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerName).toBeUndefined()
    expect(withTimeworn.nextSlots.find((slot) => slot.slotId === 'slot-3')?.awakenerName).toBe('Ramona: Timeworn')
  })

  it('allows replacing an alternate form in the same slot', () => {
    const slots = teamSlotsForTests()
    const withTimeworn = assignAwakenerToSlot(slots, 'Ramona: Timeworn', 'slot-2', awakenersByNameForTests)
    const replacedWithBase = assignAwakenerToSlot(withTimeworn.nextSlots, 'Ramona', 'slot-2', awakenersByNameForTests)

    expect(replacedWithBase.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerName).toBe('Ramona')
  })

  it('does not move an already slotted awakener when adding to first empty slot', () => {
    const slots = [
      { slotId: 'slot-1', awakenerName: 'Miryam', faction: 'AEQUOR', level: 60, wheels: [null, null] as [null, null] },
      { slotId: 'slot-2', awakenerName: 'Ramona', faction: 'CHAOS', level: 60, wheels: [null, null] as [null, null] },
      { slotId: 'slot-3', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: [null, null] as [null, null] },
      { slotId: 'slot-4', wheels: [null, null] as [null, null] },
    ]

    const result = assignAwakenerToFirstEmptySlot(slots, 'Goliath', awakenersByNameForTests)
    expect(result.nextSlots).toBe(slots)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-3')?.awakenerName).toBe('Goliath')
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-4')?.awakenerName).toBeUndefined()
  })

  it('clears a filled slot when removing via picker dropzone', () => {
    const slots = teamSlotsForTests()
    const result = clearSlotAssignment(slots, 'slot-1')

    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerName).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.faction).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.level).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.wheels).toEqual([null, null])
  })

  it('assigns and clears wheel values on a specific wheel slot', () => {
    const slots = teamSlotsForTests()
    const withWheel = assignWheelToSlot(slots, 'slot-2', 1, 'demo-wheel')
    const clearedWheel = clearWheelAssignment(withWheel.nextSlots, 'slot-2', 1)

    expect(withWheel.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).toEqual([null, 'demo-wheel'])
    expect(clearedWheel.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).toEqual([null, null])
  })

  it('blocks assigning wheels to slots without an awakener', () => {
    const slots = teamSlotsForTests()
    const result = assignWheelToSlot(slots, 'slot-3', 0, 'demo-wheel')

    expect(result.nextSlots).toBe(slots)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-3')?.wheels).toEqual([null, null])
  })

  it('swaps wheels correctly when source and target are on the same slot', () => {
    const slots = teamSlotsForTests()
    const withFirstWheel = assignWheelToSlot(slots, 'slot-1', 0, 'wheel-a')
    const withTwoWheels = assignWheelToSlot(withFirstWheel.nextSlots, 'slot-1', 1, 'wheel-b')

    const result = swapWheelAssignments(withTwoWheels.nextSlots, 'slot-1', 0, 'slot-1', 1)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.wheels).toEqual(['wheel-b', 'wheel-a'])
  })
})
