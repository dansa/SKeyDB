import {describe, expect, it} from 'vitest'

import {
  awakenersByIdForTests,
  teamSlotsForTests,
  teamSlotsForTestsWithTwoFactions,
} from './fixtures'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignCovenantToSlot,
  assignWheelToSlot,
  clearCovenantAssignment,
  clearSlotAssignment,
  clearWheelAssignment,
  swapSlotAssignments,
  swapWheelAssignments,
} from './team-state'

describe('builder team state', () => {
  it('assigns, moves, and clears awakeners by public id', () => {
    const slots = teamSlotsForTests()
    const result = assignAwakenerToSlot(slots, 'awakener-0021', 'slot-2', awakenersByIdForTests)

    expect(result.changed).toBe(true)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerId).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerId).toBe(
      'awakener-0021',
    )
    expect(
      'awakenerName' in (result.nextSlots.find((slot) => slot.slotId === 'slot-2') ?? {}),
    ).toBe(false)

    const cleared = clearSlotAssignment(result.nextSlots, 'slot-2')
    expect(cleared.changed).toBe(true)
    expect(cleared.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerId).toBeUndefined()
  })

  it('prevents duplicate alternate-form identities by public id', () => {
    const slots = teamSlotsForTests()
    const withRamona = assignAwakenerToSlot(slots, 'awakener-0042', 'slot-2', awakenersByIdForTests)
    const withTimeworn = assignAwakenerToSlot(
      withRamona.nextSlots,
      'awakener-0020',
      'slot-3',
      awakenersByIdForTests,
    )

    expect(
      withTimeworn.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerId,
    ).toBeUndefined()
    expect(withTimeworn.nextSlots.find((slot) => slot.slotId === 'slot-3')?.awakenerId).toBe(
      'awakener-0020',
    )
  })

  it('does not clear source when target slot id is invalid', () => {
    const slots = teamSlotsForTests()
    const result = assignAwakenerToSlot(slots, 'awakener-0021', 'not-a-slot', awakenersByIdForTests)

    expect(result.changed).toBe(false)
    expect(result.nextSlots).toEqual(slots)
  })

  it('moves assignment when target slot is valid', () => {
    const slots = teamSlotsForTests()
    const result = assignAwakenerToSlot(slots, 'awakener-0021', 'slot-2', awakenersByIdForTests)

    expect(result.changed).toBe(true)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerId).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerId).toBe(
      'awakener-0021',
    )
  })

  it('is a no-op when assigning to the same slot', () => {
    const slots = teamSlotsForTests()
    const result = assignAwakenerToSlot(slots, 'awakener-0021', 'slot-1', awakenersByIdForTests)

    expect(result.changed).toBe(false)
    expect(result.nextSlots).toBe(slots)
  })

  it('swaps source and target slot payloads', () => {
    const slots = teamSlotsForTests()
    const result = swapSlotAssignments(slots, 'slot-1', 'slot-2')

    expect(result.changed).toBe(true)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerId).toBe(
      'awakener-0032',
    )
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerId).toBe(
      'awakener-0021',
    )
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.wheels).not.toBe(
      slots[1].wheels,
    )
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).not.toBe(
      slots[0].wheels,
    )
  })

  it('blocks adding a third realm', () => {
    const slots = teamSlotsForTestsWithTwoFactions()
    const result = assignAwakenerToSlot(slots, 'awakener-0008', 'slot-3', awakenersByIdForTests)

    expect(result.nextSlots).toBe(slots)
    expect(result.changed).toBe(false)
    expect(result.violation).toBe('TOO_MANY_REALMS_IN_TEAM')
  })

  it('allows replacing the only out-faction member', () => {
    const slots = teamSlotsForTestsWithTwoFactions()
    const result = assignAwakenerToSlot(slots, 'awakener-0008', 'slot-1', awakenersByIdForTests)

    expect(result.violation).toBeUndefined()
    expect(result.changed).toBe(true)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerId).toBe(
      'awakener-0008',
    )
  })

  it('treats alternate forms as globally unique within the team', () => {
    const slots = teamSlotsForTests()
    const withRamona = assignAwakenerToSlot(slots, 'awakener-0042', 'slot-2', awakenersByIdForTests)
    const withTimeworn = assignAwakenerToSlot(
      withRamona.nextSlots,
      'awakener-0020',
      'slot-3',
      awakenersByIdForTests,
    )

    expect(
      withTimeworn.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerId,
    ).toBeUndefined()
    expect(withTimeworn.nextSlots.find((slot) => slot.slotId === 'slot-3')?.awakenerId).toBe(
      'awakener-0020',
    )
  })

  it('allows replacing an alternate form in the same slot', () => {
    const slots = teamSlotsForTests()
    const withTimeworn = assignAwakenerToSlot(
      slots,
      'awakener-0020',
      'slot-2',
      awakenersByIdForTests,
    )
    const replacedWithBase = assignAwakenerToSlot(
      withTimeworn.nextSlots,
      'awakener-0042',
      'slot-2',
      awakenersByIdForTests,
    )

    expect(replacedWithBase.nextSlots.find((slot) => slot.slotId === 'slot-2')?.awakenerId).toBe(
      'awakener-0042',
    )
  })

  it('preserves wheels and covenant when replacing an awakener in place', () => {
    const slots = teamSlotsForTests()
    const gearedSlots = assignWheelToSlot(slots, 'slot-2', 0, 'wheel-0050').nextSlots
    const covenantedSlots = assignCovenantToSlot(gearedSlots, 'slot-2', 'c01').nextSlots
    const result = assignAwakenerToSlot(
      covenantedSlots,
      'awakener-0042',
      'slot-2',
      awakenersByIdForTests,
    )

    const targetSlot = result.nextSlots.find((slot) => slot.slotId === 'slot-2')
    expect(targetSlot?.awakenerId).toBe('awakener-0042')
    expect(targetSlot?.wheels).toEqual(['wheel-0050', null])
    expect(targetSlot?.covenantId).toBe('c01')
  })

  it('does not move an already slotted awakener when adding to first empty slot', () => {
    const slots = [
      {
        slotId: 'slot-1',
        awakenerId: 'awakener-0032',
        realm: 'AEQUOR',
        level: 60,
        wheels: [null, null] as [null, null],
      },
      {
        slotId: 'slot-2',
        awakenerId: 'awakener-0042',
        realm: 'CHAOS',
        level: 60,
        wheels: [null, null] as [null, null],
      },
      {
        slotId: 'slot-3',
        awakenerId: 'awakener-0021',
        realm: 'AEQUOR',
        level: 60,
        wheels: [null, null] as [null, null],
      },
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]

    const result = assignAwakenerToFirstEmptySlot(slots, 'awakener-0021', awakenersByIdForTests)
    expect(result.changed).toBe(false)
    expect(result.nextSlots).toBe(slots)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-3')?.awakenerId).toBe(
      'awakener-0021',
    )
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-4')?.awakenerId).toBeUndefined()
  })

  it('clears a filled slot when removing via picker dropzone', () => {
    const slots = teamSlotsForTests()
    const result = clearSlotAssignment(slots, 'slot-1')

    expect(result.changed).toBe(true)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.awakenerId).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.realm).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.level).toBeUndefined()
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.wheels).toEqual([null, null])
  })

  it('assigns and clears wheel values on a specific wheel slot', () => {
    const slots = teamSlotsForTests()
    const withWheel = assignWheelToSlot(slots, 'slot-2', 1, 'demo-wheel')
    const clearedWheel = clearWheelAssignment(withWheel.nextSlots, 'slot-2', 1)

    expect(withWheel.changed).toBe(true)
    expect(clearedWheel.changed).toBe(true)
    expect(withWheel.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).toEqual([
      null,
      'demo-wheel',
    ])
    expect(clearedWheel.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).toEqual([
      null,
      null,
    ])
  })

  it('does not assign the same wheel to both wheel sockets in one slot', () => {
    const slots = teamSlotsForTests()
    const withWheel = assignWheelToSlot(slots, 'slot-2', 0, 'demo-wheel')
    const duplicate = assignWheelToSlot(withWheel.nextSlots, 'slot-2', 1, 'demo-wheel')

    expect(duplicate.changed).toBe(false)
    expect(duplicate.violation).toBe('INVALID_BUILD_RULES')
    expect(duplicate.nextSlots).toBe(withWheel.nextSlots)
    expect(duplicate.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).toEqual([
      'demo-wheel',
      null,
    ])
  })

  it('blocks assigning wheels to slots without an awakener', () => {
    const slots = teamSlotsForTests()
    const result = assignWheelToSlot(slots, 'slot-3', 0, 'demo-wheel')

    expect(result.changed).toBe(false)
    expect(result.nextSlots).toBe(slots)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-3')?.wheels).toEqual([null, null])
  })

  it('returns same slots when assigning an unchanged wheel value', () => {
    const slots = teamSlotsForTests()
    const withWheel = assignWheelToSlot(slots, 'slot-1', 0, 'wheel-a')
    const unchanged = assignWheelToSlot(withWheel.nextSlots, 'slot-1', 0, 'wheel-a')

    expect(unchanged.changed).toBe(false)
    expect(unchanged.nextSlots).toBe(withWheel.nextSlots)
  })

  it('swaps wheels correctly when source and target are on the same slot', () => {
    const slots = teamSlotsForTests()
    const withFirstWheel = assignWheelToSlot(slots, 'slot-1', 0, 'wheel-a')
    const withTwoWheels = assignWheelToSlot(withFirstWheel.nextSlots, 'slot-1', 1, 'wheel-b')

    const result = swapWheelAssignments(withTwoWheels.nextSlots, 'slot-1', 0, 'slot-1', 1)
    expect(result.changed).toBe(true)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.wheels).toEqual([
      'wheel-b',
      'wheel-a',
    ])
  })

  it('does not swap a wheel into a slot that already carries the same wheel', () => {
    const slots = teamSlotsForTests()
    const preparedSlots = slots.map((slot) => {
      if (slot.slotId === 'slot-1') {
        return {...slot, wheels: ['wheel-a', null] as [string, null]}
      }
      if (slot.slotId === 'slot-2') {
        return {...slot, wheels: ['wheel-a', null] as [string, null]}
      }
      return slot
    })

    const result = swapWheelAssignments(preparedSlots, 'slot-1', 0, 'slot-2', 1)

    expect(result.changed).toBe(false)
    expect(result.violation).toBe('INVALID_BUILD_RULES')
    expect(result.nextSlots).toBe(preparedSlots)
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-1')?.wheels).toEqual([
      'wheel-a',
      null,
    ])
    expect(result.nextSlots.find((slot) => slot.slotId === 'slot-2')?.wheels).toEqual([
      'wheel-a',
      null,
    ])
  })

  it('assigns and clears covenant values on an awakener slot', () => {
    const slots = teamSlotsForTests()
    const withCovenant = assignCovenantToSlot(slots, 'slot-1', '001')
    const cleared = clearCovenantAssignment(withCovenant.nextSlots, 'slot-1')

    expect(withCovenant.changed).toBe(true)
    expect(cleared.changed).toBe(true)
    expect(withCovenant.nextSlots.find((slot) => slot.slotId === 'slot-1')?.covenantId).toBe('001')
    expect(cleared.nextSlots.find((slot) => slot.slotId === 'slot-1')?.covenantId).toBeUndefined()
  })

  it('returns same slots when assigning an unchanged covenant value', () => {
    const slots = teamSlotsForTests()
    const withCovenant = assignCovenantToSlot(slots, 'slot-1', '001')
    const unchanged = assignCovenantToSlot(withCovenant.nextSlots, 'slot-1', '001')

    expect(unchanged.changed).toBe(false)
    expect(unchanged.nextSlots).toBe(withCovenant.nextSlots)
  })

  it('reports unchanged when clearing an already empty slot even if the array is remapped', () => {
    const slots = teamSlotsForTests()
    const result = clearSlotAssignment(slots, 'slot-3')

    expect(result.changed).toBe(false)
    expect(result.nextSlots).not.toBe(slots)
    expect(result.nextSlots).toEqual(slots)
  })

  it('reports unchanged for same-wheel swaps', () => {
    const slots = teamSlotsForTests()
    const result = swapWheelAssignments(slots, 'slot-1', 0, 'slot-1', 0)

    expect(result.changed).toBe(false)
    expect(result.nextSlots).toBe(slots)
  })
})
