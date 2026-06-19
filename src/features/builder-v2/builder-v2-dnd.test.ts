import {describe, expect, it} from 'vitest'

import type {WheelSlotIndex} from '../builder/types'
import {
  createBuilderV2PickerAwakenerDragPayload,
  createBuilderV2PickerCovenantDragPayload,
  createBuilderV2PickerPosseDragPayload,
  createBuilderV2PickerWheelDragPayload,
  createBuilderV2TeamAwakenerDragPayload,
  createBuilderV2TeamCovenantDragPayload,
  createBuilderV2TeamManagementCovenantDragPayload,
  createBuilderV2TeamManagementSlotDragPayload,
  createBuilderV2TeamManagementWheelDragPayload,
  createBuilderV2TeamPosseDragPayload,
  createBuilderV2TeamWheelDragPayload,
  isBuilderV2DragPayload,
  makeBuilderV2CovenantDndId,
  makeBuilderV2PickerDndId,
  makeBuilderV2PosseDndId,
  makeBuilderV2SlotDndId,
  makeBuilderV2TeamManagementCovenantDndId,
  makeBuilderV2TeamManagementSlotDndId,
  makeBuilderV2TeamManagementWheelDndId,
  makeBuilderV2WheelDndId,
  parseBuilderV2DndId,
  resolveBuilderV2DndAction,
  resolveBuilderV2EffectiveDropTarget,
  type BuilderV2DragPayload,
} from './builder-v2-dnd'
import type {
  BuilderV2ActivePosseView,
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2PosseOption,
  BuilderV2SlotView,
  BuilderV2TeamSummary,
  BuilderV2WheelOption,
} from './BuilderV2ModelTypes'
import {filterBuilderV2TeamSortDroppables} from './useBuilderV2Dnd'

describe('builder-v2 DnD payload creators', () => {
  it('creates normalized picker payloads from option DTOs', () => {
    expect(createBuilderV2PickerAwakenerDragPayload(createAwakenerOption())).toMatchObject({
      kind: 'awakener',
      source: 'picker',
      id: 'awakener-1',
      preview: {
        kind: 'awakener',
        variant: 'item',
        id: 'awakener-1',
        title: 'Aster',
        subtitle: 'CHAOS',
        imageSrc: '/aster.png',
        imageAlt: 'Aster',
        badges: [
          {label: 'Team 2', tone: 'status'},
          {label: 'Realm limit', tone: 'danger'},
        ],
      },
    })
    expect(createBuilderV2PickerWheelDragPayload(createWheelOption())).toMatchObject({
      kind: 'wheel',
      source: 'picker',
      id: 'wheel-1',
      preview: {
        title: 'Blazing Wheel',
        subtitle: 'Crit Rate',
        badges: [
          {label: 'SSR', tone: 'quiet'},
          {label: 'Team 1', tone: 'status'},
          {label: 'BiS', tone: 'recommendation'},
        ],
      },
    })
    expect(createBuilderV2PickerCovenantDragPayload(createCovenantOption())).toMatchObject({
      kind: 'covenant',
      source: 'picker',
      id: 'covenant-1',
      preview: {
        badges: [
          {label: 'In use', tone: 'status'},
          {label: '#1', tone: 'recommendation'},
        ],
      },
    })
    expect(createBuilderV2PickerPosseDragPayload(createPosseOption())).toMatchObject({
      kind: 'posse',
      source: 'picker',
      id: 'posse-1',
      preview: {
        subtitle: 'CHAOS',
        badges: [{label: 'Unowned', tone: 'danger'}],
      },
    })
  })

  it('creates normalized team payloads with source coordinates from occupied surfaces', () => {
    const slot = createSlotView()
    const team = createTeamSummary({
      slots: [
        {
          ...createTeamSummary().slots[0],
          wheelCount: 1,
          wheels: [
            {
              id: 'wheel-1',
              name: 'First Wheel',
              assetSrc: '/wheel-1.png',
              miniAssetSrc: '/mini-wheel-1.png',
              enlightenLevel: null,
              isOwned: true,
            },
            null,
          ],
          hasCovenant: true,
          covenant: {id: 'covenant-1', name: 'First Covenant', assetSrc: '/covenant.png'},
        },
      ],
    })
    const activePosse: BuilderV2ActivePosseView = {
      id: 'posse-1',
      name: 'Night Pact',
      realm: 'CHAOS',
      assetSrc: '/posse.png',
    }

    expect(createBuilderV2TeamAwakenerDragPayload(slot)).toMatchObject({
      kind: 'awakener',
      source: 'team',
      id: 'awakener-1',
      slotId: 'slot-1',
      preview: {title: 'Aster', subtitle: 'Slot 1', variant: 'slot'},
    })
    expect(createBuilderV2TeamWheelDragPayload(slot, 1)).toMatchObject({
      kind: 'wheel',
      source: 'team',
      id: 'wheel-2',
      slotId: 'slot-1',
      wheelIndex: 1,
      preview: {
        title: 'Second Wheel',
        subtitle: 'Slot 1 / Wheel 2',
        badges: [
          {label: 'Slot 1', tone: 'quiet'},
          {label: 'Wheel 2', tone: 'quiet'},
        ],
      },
    })
    expect(createBuilderV2TeamCovenantDragPayload(slot)).toMatchObject({
      kind: 'covenant',
      source: 'team',
      id: 'covenant-1',
      slotId: 'slot-1',
      preview: {title: 'First Covenant', subtitle: 'Slot 1'},
    })
    expect(createBuilderV2TeamPosseDragPayload(activePosse)).toMatchObject({
      kind: 'posse',
      source: 'team',
      id: 'posse-1',
      preview: {title: 'Night Pact', subtitle: 'CHAOS'},
    })
    expect(createBuilderV2TeamManagementSlotDragPayload(team, team.slots[0])).toMatchObject({
      kind: 'awakener',
      source: 'team-management',
      id: 'awakener-1',
      teamId: 'team-1',
      slotId: 'slot-1',
      preview: {title: 'Aster', subtitle: 'Team 1 / Slot 1', variant: 'item'},
    })
    expect(createBuilderV2TeamManagementWheelDragPayload(team, team.slots[0], 0)).toMatchObject({
      kind: 'wheel',
      source: 'team-management',
      id: 'wheel-1',
      teamId: 'team-1',
      slotId: 'slot-1',
      wheelIndex: 0,
      preview: {title: 'First Wheel', subtitle: 'Team 1 / Slot 1 / Wheel 1'},
    })
    expect(createBuilderV2TeamManagementCovenantDragPayload(team, team.slots[0])).toMatchObject({
      kind: 'covenant',
      source: 'team-management',
      id: 'covenant-1',
      teamId: 'team-1',
      slotId: 'slot-1',
      preview: {title: 'First Covenant', subtitle: 'Team 1 / Slot 1'},
    })
  })

  it('returns null for empty team surfaces', () => {
    const emptySlot = createSlotView({
      awakener: null,
      wheelSlots: [createWheelSlot(0, null, null), createWheelSlot(1, null, null)],
      covenantId: undefined,
      covenantName: null,
      covenantAssetSrc: undefined,
    })

    expect(createBuilderV2TeamAwakenerDragPayload(emptySlot)).toBeNull()
    expect(createBuilderV2TeamWheelDragPayload(emptySlot, 0)).toBeNull()
    expect(createBuilderV2TeamCovenantDragPayload(emptySlot)).toBeNull()
    expect(createBuilderV2TeamPosseDragPayload(null)).toBeNull()
    expect(
      createBuilderV2TeamManagementWheelDragPayload(
        createTeamSummary(),
        createTeamSummary().slots[0],
        0,
      ),
    ).toBeNull()
    expect(
      createBuilderV2TeamManagementCovenantDragPayload(
        createTeamSummary(),
        createTeamSummary().slots[0],
      ),
    ).toBeNull()
  })

  it('narrows valid drag payloads and rejects malformed values', () => {
    const pickerPayload = createBuilderV2PickerAwakenerDragPayload(createAwakenerOption())
    const teamPayload = createBuilderV2TeamWheelDragPayload(createSlotView(), 0)

    expect(isBuilderV2DragPayload(pickerPayload)).toBe(true)
    expect(isBuilderV2DragPayload(teamPayload)).toBe(true)
    expect(isBuilderV2DragPayload({...pickerPayload, kind: 'picker-awakener'})).toBe(false)
    expect(isBuilderV2DragPayload({...pickerPayload, source: 'bench'})).toBe(false)
    expect(isBuilderV2DragPayload({...teamPayload, slotId: ''})).toBe(false)
    expect(isBuilderV2DragPayload({...teamPayload, wheelIndex: 2})).toBe(false)
    expect(isBuilderV2DragPayload({...pickerPayload, preview: {title: 'Aster'}})).toBe(false)
    expect(
      isBuilderV2DragPayload({
        ...pickerPayload,
        preview: {...pickerPayload.preview, kind: 'wheel'},
      }),
    ).toBe(false)
    expect(
      isBuilderV2DragPayload({
        ...pickerPayload,
        preview: {...pickerPayload.preview, id: 'awakener-2'},
      }),
    ).toBe(false)
    expect(isBuilderV2DragPayload(null)).toBe(false)
  })
})

describe('builder-v2 DnD id helpers', () => {
  it('round trips V2 drop target ids', () => {
    expect(parseBuilderV2DndId(makeBuilderV2SlotDndId('slot-1'))).toEqual({
      kind: 'slot',
      slotId: 'slot-1',
    })
    expect(parseBuilderV2DndId(makeBuilderV2CovenantDndId('slot-1'))).toEqual({
      kind: 'covenant',
      slotId: 'slot-1',
    })
    expect(parseBuilderV2DndId(makeBuilderV2WheelDndId('slot-1', 0))).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(parseBuilderV2DndId(makeBuilderV2PosseDndId())).toEqual({kind: 'posse'})
    expect(parseBuilderV2DndId(makeBuilderV2PickerDndId())).toEqual({kind: 'picker'})
    expect(parseBuilderV2DndId(makeBuilderV2TeamManagementSlotDndId('team-1', 'slot-1'))).toEqual({
      kind: 'team-management-slot',
      teamId: 'team-1',
      slotId: 'slot-1',
    })
    expect(
      parseBuilderV2DndId(makeBuilderV2TeamManagementWheelDndId('team-1', 'slot-1', 1)),
    ).toEqual({
      kind: 'team-management-wheel',
      teamId: 'team-1',
      slotId: 'slot-1',
      wheelIndex: 1,
    })
    expect(
      parseBuilderV2DndId(makeBuilderV2TeamManagementCovenantDndId('team-1', 'slot-1')),
    ).toEqual({
      kind: 'team-management-covenant',
      teamId: 'team-1',
      slotId: 'slot-1',
    })
  })

  it('parses wheel ids with colons in slot ids from the last separator', () => {
    expect(parseBuilderV2DndId(makeBuilderV2WheelDndId('team:slot:alpha', 1))).toEqual({
      kind: 'wheel',
      slotId: 'team:slot:alpha',
      wheelIndex: 1,
    })
  })

  it('rejects non-V2, unknown, malformed, and invalid wheel-index ids', () => {
    expect(parseBuilderV2DndId('builder:slot:slot-1')).toBeNull()
    expect(parseBuilderV2DndId('builder-v2:unknown:slot-1')).toBeNull()
    expect(parseBuilderV2DndId('builder-v2:slot:')).toBeNull()
    expect(parseBuilderV2DndId('builder-v2:wheel:slot-1:2')).toBeNull()
    expect(parseBuilderV2DndId('builder-v2:wheel:slot-1:-1')).toBeNull()
    expect(parseBuilderV2DndId('builder-v2:wheel::0')).toBeNull()
    expect(parseBuilderV2DndId('builder-v2:team-management-wheel:team-1:slot-1:2')).toBeNull()
    expect(parseBuilderV2DndId('builder-v2:picker:wheel')).toBeNull()
    expect(parseBuilderV2DndId(null)).toBeNull()
    expect(parseBuilderV2DndId(1)).toBeNull()
  })
})

describe('builder-v2 DnD collision helpers', () => {
  it('filters team-sort droppables to sortable team row ids', () => {
    const droppables = [
      {id: 'team-1'},
      {id: makeBuilderV2TeamManagementSlotDndId('team-2', 'slot-1')},
      {id: makeBuilderV2TeamManagementWheelDndId('team-2', 'slot-1', 0)},
      {id: makeBuilderV2TeamManagementCovenantDndId('team-2', 'slot-1')},
      {id: 'team-2'},
      {id: makeBuilderV2SlotDndId('slot-1')},
      {id: 2},
    ]

    expect(
      filterBuilderV2TeamSortDroppables(droppables, new Set(['team-1', 'team-2'])).map(
        (droppable) => droppable.id,
      ),
    ).toEqual(['team-1', 'team-2'])
  })
})

describe('builder-v2 DnD action resolver', () => {
  it('assigns picker awakeners to the owning slot for slot-owned targets', () => {
    const payload = createBuilderV2PickerAwakenerDragPayload(createAwakenerOption())

    expect(resolveBuilderV2DndAction(payload, {kind: 'slot', slotId: 'slot-1'})).toEqual({
      kind: 'assign-awakener',
      awakenerId: 'awakener-1',
      slotId: 'slot-1',
    })
    expect(
      resolveBuilderV2DndAction(payload, {kind: 'wheel', slotId: 'slot-2', wheelIndex: 1}),
    ).toEqual({
      kind: 'assign-awakener',
      awakenerId: 'awakener-1',
      slotId: 'slot-2',
    })
    expect(resolveBuilderV2DndAction(payload, {kind: 'covenant', slotId: 'slot-3'})).toEqual({
      kind: 'assign-awakener',
      awakenerId: 'awakener-1',
      slotId: 'slot-3',
    })
  })

  it('assigns picker wheels to explicit wheel targets with a wheel index', () => {
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerWheelDragPayload(createWheelOption()), {
        kind: 'wheel',
        slotId: 'slot-1',
        wheelIndex: 0,
      }),
    ).toEqual({
      kind: 'assign-wheel',
      wheelId: 'wheel-1',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
  })

  it('assigns picker wheels to slot-level targets without choosing a wheel index', () => {
    const payload = createBuilderV2PickerWheelDragPayload(createWheelOption())

    expect(resolveBuilderV2DndAction(payload, {kind: 'slot', slotId: 'slot-1'})).toEqual({
      kind: 'assign-wheel',
      wheelId: 'wheel-1',
      slotId: 'slot-1',
    })
    expect(resolveBuilderV2DndAction(payload, {kind: 'covenant', slotId: 'slot-2'})).toEqual({
      kind: 'assign-wheel',
      wheelId: 'wheel-1',
      slotId: 'slot-2',
    })
  })

  it('predicts and resolves slot-level wheel drops to the first empty wheel socket', () => {
    const payload = createBuilderV2PickerWheelDragPayload(createWheelOption())
    const slots = [
      createSlotView({
        wheelSlots: [createWheelSlot(0, 'wheel-1', 'First Wheel'), createWheelSlot(1, null, null)],
        wheels: ['wheel-1', null],
      }),
    ]

    expect(
      resolveBuilderV2EffectiveDropTarget(payload, {kind: 'slot', slotId: 'slot-1'}, slots),
    ).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1})
    expect(
      resolveBuilderV2DndAction(payload, {kind: 'covenant', slotId: 'slot-1'}, {slots}),
    ).toEqual({
      kind: 'assign-wheel',
      wheelId: 'wheel-1',
      slotId: 'slot-1',
      wheelIndex: 1,
    })
  })

  it('rejects broad wheel drops on filled or unawakened slots', () => {
    const payload = createBuilderV2PickerWheelDragPayload(createWheelOption())
    const fullSlot = createSlotView()
    const emptySlot = createSlotView({
      awakener: null,
      isEmpty: true,
      wheels: [null, null],
      wheelSlots: [createWheelSlot(0, null, null), createWheelSlot(1, null, null)],
      covenantId: undefined,
      covenantName: null,
      covenantAssetSrc: undefined,
    })

    expect(
      resolveBuilderV2EffectiveDropTarget(payload, {kind: 'slot', slotId: 'slot-1'}, [fullSlot]),
    ).toBeNull()
    expect(
      resolveBuilderV2DndAction(payload, {kind: 'slot', slotId: 'slot-1'}, {slots: [fullSlot]}),
    ).toBeNull()
    expect(
      resolveBuilderV2EffectiveDropTarget(payload, {kind: 'slot', slotId: 'slot-1'}, [emptySlot]),
    ).toBeNull()
    expect(
      resolveBuilderV2EffectiveDropTarget(
        payload,
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        [emptySlot],
      ),
    ).toBeNull()
    expect(
      resolveBuilderV2DndAction(
        payload,
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        {slots: [emptySlot]},
      ),
    ).toBeNull()
  })

  it('assigns picker covenants to the owning slot for covenant, slot, and wheel targets', () => {
    const payload = createBuilderV2PickerCovenantDragPayload(createCovenantOption())

    expect(resolveBuilderV2DndAction(payload, {kind: 'covenant', slotId: 'slot-1'})).toEqual({
      kind: 'assign-covenant',
      covenantId: 'covenant-1',
      slotId: 'slot-1',
    })
    expect(resolveBuilderV2DndAction(payload, {kind: 'slot', slotId: 'slot-2'})).toEqual({
      kind: 'assign-covenant',
      covenantId: 'covenant-1',
      slotId: 'slot-2',
    })
    expect(
      resolveBuilderV2DndAction(payload, {kind: 'wheel', slotId: 'slot-3', wheelIndex: 1}),
    ).toEqual({
      kind: 'assign-covenant',
      covenantId: 'covenant-1',
      slotId: 'slot-3',
    })
  })

  it('predicts covenant drops to the owning covenant slot across card child targets', () => {
    const payload = createBuilderV2PickerCovenantDragPayload(createCovenantOption())

    expect(
      resolveBuilderV2EffectiveDropTarget(
        payload,
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        [createSlotView()],
      ),
    ).toEqual({kind: 'covenant', slotId: 'slot-1'})
  })

  it('rejects covenant drops on empty slot child targets', () => {
    const payload = createBuilderV2PickerCovenantDragPayload(createCovenantOption())
    const emptySlot = createSlotView({
      awakener: null,
      isEmpty: true,
      wheels: [null, null],
      wheelSlots: [createWheelSlot(0, null, null), createWheelSlot(1, null, null)],
      covenantId: undefined,
      covenantName: null,
      covenantAssetSrc: undefined,
    })

    expect(
      resolveBuilderV2EffectiveDropTarget(
        payload,
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        [emptySlot],
      ),
    ).toBeNull()
    expect(
      resolveBuilderV2DndAction(
        payload,
        {kind: 'covenant', slotId: 'slot-1'},
        {slots: [emptySlot]},
      ),
    ).toBeNull()
  })

  it('assigns picker posses only to the posse target', () => {
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerPosseDragPayload(createPosseOption()), {
        kind: 'posse',
      }),
    ).toEqual({kind: 'assign-posse', posseId: 'posse-1'})
  })

  it('removes team awakeners, wheels, and covenants when dropped on the picker target', () => {
    const slot = createSlotView()

    expect(
      resolveBuilderV2DndAction(createRequiredTeamAwakenerDragPayload(slot), {kind: 'picker'}),
    ).toEqual({kind: 'remove-awakener', slotId: 'slot-1'})
    expect(
      resolveBuilderV2DndAction(createRequiredTeamWheelDragPayload(slot, 1), {kind: 'picker'}),
    ).toEqual({kind: 'remove-wheel', slotId: 'slot-1', wheelIndex: 1})
    expect(
      resolveBuilderV2DndAction(createRequiredTeamCovenantDragPayload(slot), {kind: 'picker'}),
    ).toEqual({kind: 'remove-covenant', slotId: 'slot-1'})
  })

  it('moves team wheels to another wheel target while preserving source and target coordinates', () => {
    expect(
      resolveBuilderV2DndAction(createRequiredTeamWheelDragPayload(createSlotView(), 0), {
        kind: 'wheel',
        slotId: 'slot-2',
        wheelIndex: 1,
      }),
    ).toEqual({
      kind: 'move-wheel',
      fromSlotId: 'slot-1',
      fromWheelIndex: 0,
      toSlotId: 'slot-2',
      toWheelIndex: 1,
    })
  })

  it('moves team wheels to slot-level targets by deferring wheel index selection to the model', () => {
    const payload = createRequiredTeamWheelDragPayload(createSlotView(), 0)

    expect(resolveBuilderV2DndAction(payload, {kind: 'slot', slotId: 'slot-2'})).toEqual({
      kind: 'move-wheel-to-slot',
      fromSlotId: 'slot-1',
      fromWheelIndex: 0,
      toSlotId: 'slot-2',
    })
    expect(resolveBuilderV2DndAction(payload, {kind: 'covenant', slotId: 'slot-3'})).toEqual({
      kind: 'move-wheel-to-slot',
      fromSlotId: 'slot-1',
      fromWheelIndex: 0,
      toSlotId: 'slot-3',
    })
  })

  it('predicts team wheel card drops to the first empty wheel socket', () => {
    const sourceSlot = createSlotView()
    const targetSlot = createSlotView({
      slotId: 'slot-2',
      slotLabel: 'Slot 2',
      wheelSlots: [createWheelSlot(0, null, null), createWheelSlot(1, 'wheel-3', 'Third Wheel')],
      wheels: [null, 'wheel-3'],
    })

    expect(
      resolveBuilderV2DndAction(
        createRequiredTeamWheelDragPayload(sourceSlot, 0),
        {kind: 'slot', slotId: 'slot-2'},
        {slots: [sourceSlot, targetSlot]},
      ),
    ).toEqual({
      kind: 'move-wheel',
      fromSlotId: 'slot-1',
      fromWheelIndex: 0,
      toSlotId: 'slot-2',
      toWheelIndex: 0,
    })
  })

  it('moves team awakeners and their loadout to another slot-owned target', () => {
    const payload = createRequiredTeamAwakenerDragPayload(createSlotView())

    expect(resolveBuilderV2DndAction(payload, {kind: 'slot', slotId: 'slot-2'})).toEqual({
      kind: 'move-awakener',
      fromSlotId: 'slot-1',
      toSlotId: 'slot-2',
    })
    expect(
      resolveBuilderV2DndAction(payload, {kind: 'wheel', slotId: 'slot-3', wheelIndex: 0}),
    ).toEqual({
      kind: 'move-awakener',
      fromSlotId: 'slot-1',
      toSlotId: 'slot-3',
    })
    expect(resolveBuilderV2DndAction(payload, {kind: 'covenant', slotId: 'slot-4'})).toEqual({
      kind: 'move-awakener',
      fromSlotId: 'slot-1',
      toSlotId: 'slot-4',
    })
  })

  it('swaps team-management slots with source and target team coordinates', () => {
    const team = createTeamSummary()
    const payload = createRequiredTeamManagementSlotDragPayload(team, team.slots[0])

    expect(
      resolveBuilderV2DndAction(payload, {
        kind: 'team-management-slot',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'swap-team-slots',
      sourceTeamId: 'team-1',
      sourceSlotId: 'slot-1',
      targetTeamId: 'team-2',
      targetSlotId: 'slot-4',
    })
  })

  it('uses child team-management gear targets as owning slots for whole-card swaps', () => {
    const team = createTeamSummary()
    const payload = createRequiredTeamManagementSlotDragPayload(team, team.slots[0])

    expect(
      resolveBuilderV2DndAction(payload, {
        kind: 'team-management-wheel',
        teamId: 'team-2',
        slotId: 'slot-4',
        wheelIndex: 1,
      }),
    ).toEqual({
      kind: 'swap-team-slots',
      sourceTeamId: 'team-1',
      sourceSlotId: 'slot-1',
      targetTeamId: 'team-2',
      targetSlotId: 'slot-4',
    })
    expect(
      resolveBuilderV2DndAction(payload, {
        kind: 'team-management-covenant',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'swap-team-slots',
      sourceTeamId: 'team-1',
      sourceSlotId: 'slot-1',
      targetTeamId: 'team-2',
      targetSlotId: 'slot-4',
    })
  })

  it('assigns picker loadout items to team-management slots', () => {
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerAwakenerDragPayload(createAwakenerOption()), {
        kind: 'team-management-slot',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'assign-awakener-to-team-slot',
      awakenerId: 'awakener-1',
      teamId: 'team-2',
      slotId: 'slot-4',
    })
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerWheelDragPayload(createWheelOption()), {
        kind: 'team-management-wheel',
        teamId: 'team-2',
        slotId: 'slot-4',
        wheelIndex: 1,
      }),
    ).toEqual({
      kind: 'assign-wheel-to-team-slot',
      wheelId: 'wheel-1',
      teamId: 'team-2',
      slotId: 'slot-4',
      wheelIndex: 1,
    })
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerWheelDragPayload(createWheelOption()), {
        kind: 'team-management-slot',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'assign-wheel-to-team-slot',
      wheelId: 'wheel-1',
      teamId: 'team-2',
      slotId: 'slot-4',
    })
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerCovenantDragPayload(createCovenantOption()), {
        kind: 'team-management-covenant',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'assign-covenant-to-team-slot',
      covenantId: 'covenant-1',
      teamId: 'team-2',
      slotId: 'slot-4',
    })
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerCovenantDragPayload(createCovenantOption()), {
        kind: 'team-management-slot',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'assign-covenant-to-team-slot',
      covenantId: 'covenant-1',
      teamId: 'team-2',
      slotId: 'slot-4',
    })
  })

  it('moves team-management wheels to explicit wheel targets, broad slots, and the picker', () => {
    const team = createTeamSummary({
      slots: [
        {
          ...createTeamSummary().slots[0],
          wheelCount: 1,
          wheels: [
            {
              id: 'wheel-1',
              name: 'First Wheel',
              assetSrc: '/wheel-1.png',
              miniAssetSrc: '/mini-wheel-1.png',
              enlightenLevel: null,
              isOwned: true,
            },
            null,
          ],
        },
      ],
    })
    const payload = createRequiredTeamManagementWheelDragPayload(team, team.slots[0], 0)

    expect(
      resolveBuilderV2DndAction(payload, {
        kind: 'team-management-wheel',
        teamId: 'team-2',
        slotId: 'slot-4',
        wheelIndex: 1,
      }),
    ).toEqual({
      kind: 'move-team-wheel',
      sourceTeamId: 'team-1',
      sourceSlotId: 'slot-1',
      sourceWheelIndex: 0,
      targetTeamId: 'team-2',
      targetSlotId: 'slot-4',
      targetWheelIndex: 1,
    })
    expect(
      resolveBuilderV2DndAction(payload, {
        kind: 'team-management-slot',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'move-team-wheel-to-team-slot',
      sourceTeamId: 'team-1',
      sourceSlotId: 'slot-1',
      sourceWheelIndex: 0,
      targetTeamId: 'team-2',
      targetSlotId: 'slot-4',
    })
    expect(resolveBuilderV2DndAction(payload, {kind: 'picker'})).toEqual({
      kind: 'remove-team-wheel',
      teamId: 'team-1',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
  })

  it('moves team-management covenants to team slots and the picker', () => {
    const team = createTeamSummary({
      slots: [
        {
          ...createTeamSummary().slots[0],
          hasCovenant: true,
          covenant: {id: 'covenant-1', name: 'First Covenant', assetSrc: '/covenant.png'},
        },
      ],
    })
    const payload = createRequiredTeamManagementCovenantDragPayload(team, team.slots[0])

    expect(
      resolveBuilderV2DndAction(payload, {
        kind: 'team-management-covenant',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'move-team-covenant',
      sourceTeamId: 'team-1',
      sourceSlotId: 'slot-1',
      targetTeamId: 'team-2',
      targetSlotId: 'slot-4',
    })
    expect(
      resolveBuilderV2DndAction(payload, {
        kind: 'team-management-slot',
        teamId: 'team-2',
        slotId: 'slot-4',
      }),
    ).toEqual({
      kind: 'move-team-covenant',
      sourceTeamId: 'team-1',
      sourceSlotId: 'slot-1',
      targetTeamId: 'team-2',
      targetSlotId: 'slot-4',
    })
    expect(resolveBuilderV2DndAction(payload, {kind: 'picker'})).toEqual({
      kind: 'remove-team-covenant',
      teamId: 'team-1',
      slotId: 'slot-1',
    })
  })

  it('removes team-management slots when dropped on the picker target', () => {
    const team = createTeamSummary()
    const payload = createRequiredTeamManagementSlotDragPayload(team, team.slots[0])

    expect(resolveBuilderV2DndAction(payload, {kind: 'picker'})).toEqual({
      kind: 'remove-team-slot',
      teamId: 'team-1',
      slotId: 'slot-1',
    })
  })

  it('moves team covenants to another covenant target while preserving source and target slots', () => {
    expect(
      resolveBuilderV2DndAction(createRequiredTeamCovenantDragPayload(createSlotView()), {
        kind: 'covenant',
        slotId: 'slot-2',
      }),
    ).toEqual({kind: 'move-covenant', fromSlotId: 'slot-1', toSlotId: 'slot-2'})
    expect(
      resolveBuilderV2DndAction(createRequiredTeamCovenantDragPayload(createSlotView()), {
        kind: 'slot',
        slotId: 'slot-3',
      }),
    ).toEqual({kind: 'move-covenant', fromSlotId: 'slot-1', toSlotId: 'slot-3'})
    expect(
      resolveBuilderV2DndAction(createRequiredTeamCovenantDragPayload(createSlotView()), {
        kind: 'wheel',
        slotId: 'slot-4',
        wheelIndex: 0,
      }),
    ).toEqual({kind: 'move-covenant', fromSlotId: 'slot-1', toSlotId: 'slot-4'})
  })

  it('returns null for same-source same-target wheel and covenant drops', () => {
    const slot = createSlotView()

    expect(
      resolveBuilderV2DndAction(createRequiredTeamWheelDragPayload(slot, 0), {
        kind: 'wheel',
        slotId: 'slot-1',
        wheelIndex: 0,
      }),
    ).toBeNull()
    expect(
      resolveBuilderV2DndAction(createRequiredTeamAwakenerDragPayload(slot), {
        kind: 'slot',
        slotId: 'slot-1',
      }),
    ).toBeNull()
    expect(
      resolveBuilderV2DndAction(createRequiredTeamCovenantDragPayload(slot), {
        kind: 'covenant',
        slotId: 'slot-1',
      }),
    ).toBeNull()
  })

  it('returns null for null targets and unsupported target combinations', () => {
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerWheelDragPayload(createWheelOption()), null),
    ).toBeNull()
    expect(
      resolveBuilderV2DndAction(createBuilderV2PickerPosseDragPayload(createPosseOption()), {
        kind: 'slot',
        slotId: 'slot-1',
      }),
    ).toBeNull()
    expect(
      resolveBuilderV2DndAction(createRequiredTeamWheelDragPayload(createSlotView(), 0), {
        kind: 'posse',
      }),
    ).toBeNull()
  })
})

function createAwakenerOption(
  overrides: Partial<BuilderV2AwakenerOption> = {},
): BuilderV2AwakenerOption {
  return {
    id: 'awakener-1',
    name: 'Aster',
    displayName: 'Aster',
    realm: 'CHAOS',
    portraitSrc: '/aster.png',
    inUse: true,
    inUseLabel: 'Team 2',
    owned: true,
    level: 60,
    enlightenLevel: null,
    blocked: true,
    blockReason: 'Realm limit',
    ...overrides,
  }
}

function createRequiredTeamAwakenerDragPayload(slot: BuilderV2SlotView): BuilderV2DragPayload {
  const payload = createBuilderV2TeamAwakenerDragPayload(slot)
  if (!payload) {
    throw new Error('Expected occupied awakener slot fixture')
  }
  return payload
}

function createRequiredTeamWheelDragPayload(
  slot: BuilderV2SlotView,
  wheelIndex: WheelSlotIndex,
): BuilderV2DragPayload {
  const payload = createBuilderV2TeamWheelDragPayload(slot, wheelIndex)
  if (!payload) {
    throw new Error('Expected occupied wheel slot fixture')
  }
  return payload
}

function createRequiredTeamCovenantDragPayload(slot: BuilderV2SlotView): BuilderV2DragPayload {
  const payload = createBuilderV2TeamCovenantDragPayload(slot)
  if (!payload) {
    throw new Error('Expected assigned covenant fixture')
  }
  return payload
}

function createRequiredTeamManagementSlotDragPayload(
  team: BuilderV2TeamSummary,
  slot: BuilderV2TeamSummary['slots'][number],
): BuilderV2DragPayload {
  const payload = createBuilderV2TeamManagementSlotDragPayload(team, slot)
  if (!payload) {
    throw new Error('Expected occupied team management slot fixture')
  }
  return payload
}

function createRequiredTeamManagementWheelDragPayload(
  team: BuilderV2TeamSummary,
  slot: BuilderV2TeamSummary['slots'][number],
  wheelIndex: WheelSlotIndex,
): BuilderV2DragPayload {
  const payload = createBuilderV2TeamManagementWheelDragPayload(team, slot, wheelIndex)
  if (!payload) {
    throw new Error('Expected occupied team management wheel fixture')
  }
  return payload
}

function createRequiredTeamManagementCovenantDragPayload(
  team: BuilderV2TeamSummary,
  slot: BuilderV2TeamSummary['slots'][number],
): BuilderV2DragPayload {
  const payload = createBuilderV2TeamManagementCovenantDragPayload(team, slot)
  if (!payload) {
    throw new Error('Expected assigned team management covenant fixture')
  }
  return payload
}

function createWheelOption(overrides: Partial<BuilderV2WheelOption> = {}): BuilderV2WheelOption {
  return {
    id: 'wheel-1',
    name: 'Blazing Wheel',
    rarity: 'SSR',
    realm: 'CHAOS',
    mainstat: 'Crit Rate',
    mainstatKey: 'CRIT_RATE',
    assetSrc: '/wheel.png',
    inUse: true,
    inUseLabel: 'Team 1',
    owned: true,
    enlightenLevel: null,
    recommended: true,
    recommendationLabel: 'BiS',
    recommendedMainstatKey: null,
    ...overrides,
  }
}

function createCovenantOption(
  overrides: Partial<BuilderV2CovenantOption> = {},
): BuilderV2CovenantOption {
  return {
    id: 'covenant-1',
    name: 'First Covenant',
    assetSrc: '/covenant.png',
    inUse: true,
    recommended: true,
    recommendationLabel: '#1',
    ...overrides,
  }
}

function createPosseOption(overrides: Partial<BuilderV2PosseOption> = {}): BuilderV2PosseOption {
  return {
    id: 'posse-1',
    name: 'Night Pact',
    realm: 'CHAOS',
    assetSrc: '/posse.png',
    inUse: false,
    isActive: false,
    owned: false,
    recommended: false,
    blocked: false,
    statusLabel: 'Unowned',
    ...overrides,
  }
}

function createSlotView(overrides: Partial<BuilderV2SlotView> = {}): BuilderV2SlotView {
  return {
    slotId: 'slot-1',
    slotNumber: 1,
    slotLabel: 'Slot 1',
    awakener: {
      id: 'awakener-1',
      name: 'Aster',
      displayName: 'Aster',
      realm: 'CHAOS',
      level: 60,
      enlightenLevel: null,
      cardSrc: '/aster-card.png',
      portraitSrc: '/aster.png',
      isSupport: false,
    },
    isSelected: false,
    isEmpty: false,
    wheels: ['wheel-1', 'wheel-2'],
    wheelSlots: [
      createWheelSlot(0, 'wheel-1', 'First Wheel'),
      createWheelSlot(1, 'wheel-2', 'Second Wheel'),
    ],
    covenantId: 'covenant-1',
    covenantName: 'First Covenant',
    covenantAssetSrc: '/covenant.png',
    isCovenantSelected: false,
    ...overrides,
  }
}

function createTeamSummary(overrides: Partial<BuilderV2TeamSummary> = {}): BuilderV2TeamSummary {
  return {
    id: 'team-1',
    name: 'Team 1',
    isActive: true,
    deployedCount: 1,
    slotNames: ['Aster', 'Empty', 'Empty', 'Empty'],
    slots: [
      {
        slotId: 'slot-1',
        label: 'Slot 1',
        slotNumber: 1,
        name: 'Aster',
        awakener: {
          id: 'awakener-1',
          name: 'Aster',
          displayName: 'Aster',
          realm: 'CHAOS',
          level: 60,
          enlightenLevel: null,
          cardSrc: '/aster-card.png',
          portraitSrc: '/aster.png',
          isOwned: true,
          isSupport: false,
        },
        portraitSrc: '/aster.png',
        cardSrc: '/aster-card.png',
        isEmpty: false,
        isSupport: false,
        wheelCount: 0,
        wheels: [null, null],
        hasCovenant: false,
        covenant: null,
      },
    ],
    posseName: null,
    posseRealm: null,
    posseAssetSrc: undefined,
    isPosseOwned: true,
    isEmpty: false,
    ...overrides,
  }
}

function createWheelSlot(
  wheelIndex: WheelSlotIndex,
  wheelId: string | null,
  wheelName: string | null,
): BuilderV2SlotView['wheelSlots'][number] {
  return {
    wheelIndex,
    label: `Wheel ${String(wheelIndex + 1)}`,
    wheelId,
    wheelName,
    miniAssetSrc: wheelId ? `/mini-${wheelId}.png` : undefined,
    assetSrc: wheelId ? `/${wheelId}.png` : undefined,
    enlightenLevel: null,
    isSelected: false,
  }
}
