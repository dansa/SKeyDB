import {describe, expect, it, vi} from 'vitest'

import {createBuilderWheelActions} from './createBuilderWheelActions'
import type {ActiveSelection, TeamSlot, WheelUsageLocation} from './types'

function buildSlots(): TeamSlot[] {
  return [
    {
      slotId: 'slot-1',
      awakenerName: 'goliath',
      realm: 'AEQUOR',
      level: 60,
      wheels: ['B01', null],
    },
    {
      slotId: 'slot-2',
      awakenerName: 'miryam',
      realm: 'CHAOS',
      level: 60,
      wheels: [null, null],
    },
  ]
}

function createActions(options?: {
  teamSlots?: TeamSlot[]
  resolvedActiveSelection?: ActiveSelection
  usedWheelByTeamOrder?: Map<string, WheelUsageLocation>
  allowDupes?: boolean
}) {
  const setActiveTeamSlots = vi.fn()
  const setActiveSelection = vi.fn()
  const requestWheelTransfer = vi.fn()
  const clearPendingDelete = vi.fn()
  const clearTransfer = vi.fn()
  const showToast = vi.fn()

  const teamSlots = options?.teamSlots ?? buildSlots()
  const usedWheelByTeamOrder =
    options?.usedWheelByTeamOrder ??
    new Map([
      [
        'B01',
        {
          teamOrder: 0,
          teamId: 'team-1',
          slotId: 'slot-1',
          wheelIndex: 0,
        },
      ],
    ])

  return {
    actions: createBuilderWheelActions({
      clearPendingDelete,
      clearTransfer,
      effectiveActiveTeamId: 'team-1',
      requestWheelTransfer,
      resolvedActiveSelection: options?.resolvedActiveSelection ?? null,
      setActiveSelection,
      setActiveTeamSlots,
      showToast,
      teamSlots,
      usedWheelByTeamOrder,
      allowDupes: options?.allowDupes ?? false,
    }),
    clearPendingDelete,
    clearTransfer,
    requestWheelTransfer,
    setActiveSelection,
    setActiveTeamSlots,
    showToast,
  }
}

describe('createBuilderWheelActions', () => {
  it('swaps wheel ownership within the active team when picker wheel is already used', () => {
    const {actions, setActiveSelection, setActiveTeamSlots} = createActions()

    actions.handleDropPickerWheel('B01', 'slot-2', 1)

    expect(setActiveTeamSlots).toHaveBeenCalledTimes(1)
    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({slotId: 'slot-1', wheels: [null, null]}),
      expect.objectContaining({slotId: 'slot-2', wheels: [null, 'B01']}),
    ])
    expect(setActiveSelection).toHaveBeenCalledWith({
      kind: 'wheel',
      slotId: 'slot-2',
      wheelIndex: 1,
    })
  })

  it('requests transfer when wheel belongs to another team', () => {
    const usedWheelByTeamOrder = new Map([
      [
        'B01',
        {
          teamOrder: 1,
          teamId: 'team-2',
          slotId: 'slot-3',
          wheelIndex: 0,
        },
      ],
    ])
    const {actions, requestWheelTransfer, setActiveTeamSlots} = createActions({
      usedWheelByTeamOrder,
    })

    actions.handleDropPickerWheel('B01', 'slot-2', 0)

    expect(setActiveTeamSlots).not.toHaveBeenCalled()
    expect(requestWheelTransfer).toHaveBeenCalledWith({
      wheelId: 'B01',
      fromTeamId: 'team-2',
      fromSlotId: 'slot-3',
      fromWheelIndex: 0,
      toTeamId: 'team-1',
      targetSlotId: 'slot-2',
      targetWheelIndex: 0,
    })
  })

  it('fills first empty wheel when awakener card is active and picker wheel is clicked', () => {
    const {actions, setActiveSelection, setActiveTeamSlots} = createActions({
      resolvedActiveSelection: {kind: 'awakener', slotId: 'slot-2'},
      usedWheelByTeamOrder: new Map(),
    })

    actions.handlePickerWheelClick('B02')

    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({slotId: 'slot-1', wheels: ['B01', null]}),
      expect.objectContaining({slotId: 'slot-2', wheels: ['B02', null]}),
    ])
    expect(setActiveSelection).not.toHaveBeenCalled()
  })

  it('assigns duplicate wheel directly when dupes are enabled', () => {
    const usedWheelByTeamOrder = new Map([
      [
        'B01',
        {
          teamOrder: 1,
          teamId: 'team-2',
          slotId: 'slot-3',
          wheelIndex: 0,
        },
      ],
    ])
    const {actions, requestWheelTransfer, setActiveTeamSlots} = createActions({
      resolvedActiveSelection: {kind: 'wheel', slotId: 'slot-2', wheelIndex: 0},
      usedWheelByTeamOrder,
      allowDupes: true,
    })

    actions.handlePickerWheelClick('B01')

    expect(requestWheelTransfer).not.toHaveBeenCalled()
    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({slotId: 'slot-1', wheels: ['B01', null]}),
      expect.objectContaining({slotId: 'slot-2', wheels: ['B01', null]}),
    ])
  })

  it('assigns duplicate wheel directly when target slot is support', () => {
    const usedWheelByTeamOrder = new Map([
      [
        'B01',
        {
          teamOrder: 1,
          teamId: 'team-2',
          slotId: 'slot-3',
          wheelIndex: 0,
        },
      ],
    ])
    const {actions, requestWheelTransfer, setActiveTeamSlots} = createActions({
      teamSlots: [
        {
          slotId: 'slot-1',
          awakenerName: 'goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['B01', null],
        },
        {
          slotId: 'slot-2',
          awakenerName: 'miryam',
          realm: 'CHAOS',
          level: 90,
          isSupport: true,
          wheels: [null, null],
        },
      ],
      resolvedActiveSelection: {kind: 'wheel', slotId: 'slot-2', wheelIndex: 0},
      usedWheelByTeamOrder,
    })

    actions.handlePickerWheelClick('B01')

    expect(requestWheelTransfer).not.toHaveBeenCalled()
    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({slotId: 'slot-1', wheels: ['B01', null]}),
      expect.objectContaining({slotId: 'slot-2', wheels: ['B01', null], isSupport: true}),
    ])
  })

  it('swaps wheel assignments between active-team slots when dragging between wheel sockets', () => {
    const {actions, setActiveSelection, setActiveTeamSlots} = createActions({
      teamSlots: [
        {
          slotId: 'slot-1',
          awakenerName: 'goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['B01', null],
        },
        {
          slotId: 'slot-2',
          awakenerName: 'miryam',
          realm: 'CHAOS',
          level: 60,
          wheels: [null, 'B02'],
        },
      ],
    })

    actions.handleDropTeamWheel('slot-1', 0, 'slot-2', 1)

    expect(setActiveTeamSlots).toHaveBeenCalledWith([
      expect.objectContaining({slotId: 'slot-1', wheels: ['B02', null]}),
      expect.objectContaining({slotId: 'slot-2', wheels: [null, 'B01']}),
    ])
    expect(setActiveSelection).toHaveBeenCalledWith({
      kind: 'wheel',
      slotId: 'slot-2',
      wheelIndex: 1,
    })
  })
})
