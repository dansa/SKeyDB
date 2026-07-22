import {describe, expect, it, vi} from 'vitest'

import {
  createBuilderV2EditingState,
  getPickerTabForSelection,
  getToggledBuilderV2EditingTarget,
  isSameSelection,
  selectBuilderV2TeamPosseEditTarget,
  selectBuilderV2TeamSlotEditTarget,
} from './builder-v2-editing-mode'

describe('builder-v2 editing mode helpers', () => {
  it('maps slot selections to the matching picker tab and clears team target', () => {
    expect(createBuilderV2EditingState({kind: 'awakener', slotId: 'slot-1'})).toEqual({
      activeSelection: {kind: 'awakener', slotId: 'slot-1'},
      activeTeamTarget: null,
      pickerTab: 'awakeners',
    })
    expect(createBuilderV2EditingState({kind: 'wheel', slotId: 'slot-2', wheelIndex: 1})).toEqual({
      activeSelection: {kind: 'wheel', slotId: 'slot-2', wheelIndex: 1},
      activeTeamTarget: null,
      pickerTab: 'wheels',
    })
    expect(createBuilderV2EditingState({kind: 'covenant', slotId: 'slot-3'})).toEqual({
      activeSelection: {kind: 'covenant', slotId: 'slot-3'},
      activeTeamTarget: null,
      pickerTab: 'covenants',
    })
  })

  it('maps posse and empty targets to coherent legacy state', () => {
    expect(createBuilderV2EditingState({kind: 'posse'})).toEqual({
      activeSelection: null,
      activeTeamTarget: {kind: 'posse'},
      pickerTab: 'posses',
    })
    expect(createBuilderV2EditingState(null)).toEqual({
      activeSelection: null,
      activeTeamTarget: null,
      pickerTab: null,
    })
  })

  it('toggles the same slot selection off without affecting different targets', () => {
    expect(
      getToggledBuilderV2EditingTarget(
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
      ),
    ).toBeNull()
    expect(
      getToggledBuilderV2EditingTarget(
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 1},
      ),
    ).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 1})
  })

  it('keeps picker tab mapping explicit by selection kind', () => {
    expect(getPickerTabForSelection({kind: 'awakener', slotId: 'slot-1'})).toBe('awakeners')
    expect(getPickerTabForSelection({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})).toBe(
      'wheels',
    )
    expect(getPickerTabForSelection({kind: 'covenant', slotId: 'slot-1'})).toBe('covenants')
  })

  it('compares wheel selections by socket and other selections by slot', () => {
    expect(
      isSameSelection({kind: 'covenant', slotId: 'slot-1'}, {kind: 'covenant', slotId: 'slot-1'}),
    ).toBe(true)
    expect(
      isSameSelection({kind: 'awakener', slotId: 'slot-1'}, {kind: 'covenant', slotId: 'slot-1'}),
    ).toBe(false)
    expect(
      isSameSelection(
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 1},
      ),
    ).toBe(false)
  })

  it('selects a team and slot target once while preserving an existing matching target', () => {
    const commands = {
      selectAwakenerSlot: vi.fn(),
      selectCovenantSlot: vi.fn(),
      selectWheelSlot: vi.fn(),
      setActiveTeam: vi.fn(),
    }

    selectBuilderV2TeamSlotEditTarget({
      commands,
      slotId: 'slot-2',
      state: {
        activeSelection: {kind: 'awakener', slotId: 'slot-1'},
        activeTeamId: 'team-1',
      },
      target: {kind: 'wheel', wheelIndex: 1},
      teamId: 'team-2',
    })

    expect(commands.setActiveTeam).toHaveBeenCalledWith('team-2')
    expect(commands.selectWheelSlot).toHaveBeenCalledWith('slot-2', 1)

    commands.selectWheelSlot.mockClear()
    commands.setActiveTeam.mockClear()
    selectBuilderV2TeamSlotEditTarget({
      commands,
      slotId: 'slot-2',
      state: {
        activeSelection: {kind: 'wheel', slotId: 'slot-2', wheelIndex: 1},
        activeTeamId: 'team-2',
      },
      target: {kind: 'wheel', wheelIndex: 1},
      teamId: 'team-2',
    })

    expect(commands.setActiveTeam).not.toHaveBeenCalled()
    expect(commands.selectWheelSlot).not.toHaveBeenCalled()
  })

  it('selects a team posse target only when it is not already active', () => {
    const commands = {selectPosse: vi.fn(), setActiveTeam: vi.fn()}

    selectBuilderV2TeamPosseEditTarget({
      commands,
      state: {activeTeamId: 'team-1', activeTeamTarget: null},
      teamId: 'team-2',
    })

    expect(commands.setActiveTeam).toHaveBeenCalledWith('team-2')
    expect(commands.selectPosse).toHaveBeenCalledOnce()

    commands.selectPosse.mockClear()
    commands.setActiveTeam.mockClear()
    selectBuilderV2TeamPosseEditTarget({
      commands,
      state: {activeTeamId: 'team-2', activeTeamTarget: {kind: 'posse'}},
      teamId: 'team-2',
    })

    expect(commands.setActiveTeam).not.toHaveBeenCalled()
    expect(commands.selectPosse).not.toHaveBeenCalled()
  })
})
