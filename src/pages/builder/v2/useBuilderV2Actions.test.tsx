import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it} from 'vitest'

import {buildQuickLineupSteps} from '../quick-lineup'
import {useBuilderStore} from './store/builder-store'
import {useBuilderV2Actions} from './useBuilderV2Actions'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function seedAwakener(teamIndex: number, awakenerName: string, realm: string, slotIndex = 0) {
  const state = useBuilderStore.getState()
  const team = state.teams[teamIndex]
  const nextSlots = team.slots.map((slot, index) =>
    index === slotIndex
      ? {
          ...slot,
          awakenerName,
          realm,
          level: 60,
          wheels: [null, null] as [null, null],
          covenantId: undefined,
        }
      : slot,
  )

  const nextTeams = state.teams.map((entry, index) =>
    index === teamIndex ? {...entry, slots: nextSlots} : entry,
  )
  state.setTeams(nextTeams)
}

function seedSupportAwakener(
  teamIndex: number,
  awakenerName: string,
  realm: string,
  slotIndex = 0,
) {
  const state = useBuilderStore.getState()
  const team = state.teams[teamIndex]
  const nextSlots = team.slots.map((slot, index) =>
    index === slotIndex
      ? {
          ...slot,
          awakenerName,
          realm,
          level: 90,
          isSupport: true,
          wheels: [null, null] as [null, null],
          covenantId: undefined,
        }
      : slot,
  )

  const nextTeams = state.teams.map((entry, index) =>
    index === teamIndex ? {...entry, slots: nextSlots} : entry,
  )
  state.setTeams(nextTeams)
}

function seedWheel(teamIndex: number, wheelId: string, slotIndex = 0, wheelIndex = 0) {
  const state = useBuilderStore.getState()
  const team = state.teams[teamIndex]
  const nextSlots = team.slots.map((slot, index) =>
    index === slotIndex
      ? {
          ...slot,
          wheels: slot.wheels.map((wheel, currentIndex) =>
            currentIndex === wheelIndex ? wheelId : wheel,
          ) as [string | null, string | null],
        }
      : slot,
  )

  const nextTeams = state.teams.map((entry, index) =>
    index === teamIndex ? {...entry, slots: nextSlots} : entry,
  )
  state.setTeams(nextTeams)
}

describe('useBuilderV2Actions', () => {
  beforeEach(() => {
    resetStore()
  })

  it('requests an awakener transfer instead of duplicating across teams when dupes are off', () => {
    act(() => {
      useBuilderStore.getState().addTeam()
    })

    seedAwakener(1, 'agrippa', 'AEQUOR')

    const team1Id = useBuilderStore.getState().teams[0].id
    act(() => {
      useBuilderStore.getState().setActiveTeamId(team1Id)
      useBuilderStore.getState().setActiveSelection({kind: 'awakener', slotId: 'slot-1'})
    })

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerAwakenerClick('agrippa')
    })

    expect(useBuilderStore.getState().pendingTransfer).toMatchObject({
      kind: 'awakener',
      awakenerName: 'agrippa',
      fromTeamId: useBuilderStore.getState().teams[1].id,
      toTeamId: team1Id,
      targetSlotId: 'slot-1',
    })
    expect(useBuilderStore.getState().teams[0].slots[0].awakenerName).toBeUndefined()
  })

  it('requests a wheel transfer instead of duplicating across teams when dupes are off', () => {
    act(() => {
      useBuilderStore.getState().addTeam()
    })

    seedAwakener(0, 'goliath', 'CHAOS')
    seedAwakener(1, 'agrippa', 'AEQUOR')
    seedWheel(1, 'O01')

    const team1Id = useBuilderStore.getState().teams[0].id
    act(() => {
      useBuilderStore.getState().setActiveTeamId(team1Id)
      useBuilderStore
        .getState()
        .setActiveSelection({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
    })

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerWheelClick('O01')
    })

    expect(useBuilderStore.getState().pendingTransfer).toMatchObject({
      kind: 'wheel',
      wheelId: 'O01',
      fromTeamId: useBuilderStore.getState().teams[1].id,
      toTeamId: team1Id,
      targetSlotId: 'slot-1',
      targetWheelIndex: 0,
    })
    expect(useBuilderStore.getState().teams[0].slots[0].wheels[0]).toBeNull()
  })

  it('requests a posse transfer instead of duplicating across teams when dupes are off', () => {
    act(() => {
      useBuilderStore.getState().addTeam()
    })

    const team1Id = useBuilderStore.getState().teams[0].id
    const team2Id = useBuilderStore.getState().teams[1].id

    act(() => {
      useBuilderStore.getState().setActiveTeamId(team2Id)
      useBuilderStore.getState().setPosseForActiveTeam('01')
      useBuilderStore.getState().setActiveTeamId(team1Id)
    })

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handleSetActivePosse('01')
    })

    expect(useBuilderStore.getState().pendingTransfer).toMatchObject({
      kind: 'posse',
      posseId: '01',
      fromTeamId: team2Id,
      toTeamId: team1Id,
    })
    expect(useBuilderStore.getState().teams[0].posseId).toBeUndefined()
  })

  it('derives a transfer dialog that can confirm the pending move', () => {
    act(() => {
      useBuilderStore.getState().addTeam()
    })

    seedAwakener(1, 'agrippa', 'AEQUOR')

    const team1Id = useBuilderStore.getState().teams[0].id
    const team2Id = useBuilderStore.getState().teams[1].id
    act(() => {
      useBuilderStore.getState().setActiveTeamId(team1Id)
      useBuilderStore.getState().setActiveSelection({kind: 'awakener', slotId: 'slot-1'})
    })

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerAwakenerClick('agrippa')
    })

    expect(result.current.transferDialog?.title).toMatch(/Move Agrippa/i)
    expect(result.current.transferDialog?.message).toMatch(/Team 2/i)
    expect(result.current.transferDialog?.message).toMatch(/Team 1/i)

    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    expect(useBuilderStore.getState().pendingTransfer).toBeNull()
    expect(useBuilderStore.getState().teams[0].slots[0].awakenerName).toBe('agrippa')
    expect(useBuilderStore.getState().teams[1].id).toBe(team2Id)
    expect(useBuilderStore.getState().teams[1].slots[0].awakenerName).toBeUndefined()
  })

  it('shows a toast when wheel picker actions are triggered without a slot target', () => {
    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerWheelClick('O01')
    })

    expect(result.current.toastEntries.map((entry) => entry.message)).toContain(
      'Select a wheel slot on a unit card first.',
    )
  })

  it('shows a toast when covenant picker actions are triggered without a slot target', () => {
    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerCovenantClick('c01')
    })

    expect(result.current.toastEntries.map((entry) => entry.message)).toContain(
      'Select a covenant slot on a unit card first.',
    )
  })

  it('requires confirmation before resetting a populated current team', () => {
    seedAwakener(0, 'agrippa', 'AEQUOR')

    act(() => {
      useBuilderStore.getState().setActiveSelection({kind: 'awakener', slotId: 'slot-1'})
    })

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.requestResetTeam(useBuilderStore.getState().teams[0].id, 'Team 1')
    })

    expect(result.current.resetTeamDialog?.title).toBe('Reset Team 1')
    expect(useBuilderStore.getState().teams[0]?.slots[0]?.awakenerName).toBe('agrippa')

    act(() => {
      result.current.resetTeamDialog?.onConfirm()
    })

    expect(result.current.resetTeamDialog).toBeNull()
    expect(useBuilderStore.getState().teams[0]?.slots[0]?.awakenerName).toBeUndefined()
    expect(useBuilderStore.getState().activeSelection).toBeNull()
  })

  it('defers picker completion until a duplicate transfer is resolved and does not advance on cancel', () => {
    act(() => {
      useBuilderStore.getState().addTeam()
    })

    seedAwakener(1, 'agrippa', 'AEQUOR')
    const team1Id = useBuilderStore.getState().teams[0].id

    act(() => {
      useBuilderStore.getState().setActiveTeamId(team1Id)
      useBuilderStore
        .getState()
        .startQuickLineup(buildQuickLineupSteps(useBuilderStore.getState().teams[0].slots))
    })

    const advanceQuickLineup = () => {
      useBuilderStore.getState().nextQuickLineupStep(0)
    }

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerAwakenerClick('agrippa', advanceQuickLineup)
    })

    expect(useBuilderStore.getState().quickLineupSessionState?.currentStepIndex).toBe(0)
    expect(result.current.transferDialog?.title).toMatch(/Move Agrippa/i)

    act(() => {
      result.current.cancelTransfer()
    })

    expect(useBuilderStore.getState().quickLineupSessionState?.currentStepIndex).toBe(0)
    expect(useBuilderStore.getState().teams[0].slots[0]?.awakenerName).toBeUndefined()

    act(() => {
      result.current.handlePickerAwakenerClick('agrippa', advanceQuickLineup)
    })

    act(() => {
      result.current.transferDialog?.onConfirm()
    })

    expect(useBuilderStore.getState().quickLineupSessionState?.currentStepIndex).toBe(1)
    expect(useBuilderStore.getState().activeSelection).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
  })

  it('runs deferred picker completion after using support for a duplicate awakener', () => {
    act(() => {
      useBuilderStore.getState().addTeam()
    })

    seedAwakener(1, 'agrippa', 'AEQUOR')
    const team1Id = useBuilderStore.getState().teams[0].id

    act(() => {
      useBuilderStore.getState().setActiveTeamId(team1Id)
      useBuilderStore
        .getState()
        .startQuickLineup(buildQuickLineupSteps(useBuilderStore.getState().teams[0].slots))
    })

    const advanceQuickLineup = () => {
      useBuilderStore.getState().nextQuickLineupStep(0)
    }

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerAwakenerClick('agrippa', advanceQuickLineup)
    })

    expect(result.current.transferDialog?.supportLabel).toBe('Use as Support')

    act(() => {
      result.current.transferDialog?.onSupport?.()
    })

    expect(useBuilderStore.getState().quickLineupSessionState?.currentStepIndex).toBe(1)
    expect(useBuilderStore.getState().teams[0].slots[0]).toMatchObject({
      awakenerName: 'agrippa',
      isSupport: true,
      level: 90,
    })
  })

  it('keeps support state on a same-team support move instead of consuming the owning team copy', () => {
    act(() => {
      useBuilderStore.getState().addTeam()
    })

    seedAwakener(0, 'hameln', 'ULTRA', 2)
    seedSupportAwakener(1, 'hameln', 'ULTRA', 2)

    const team2Id = useBuilderStore.getState().teams[1].id
    act(() => {
      useBuilderStore.getState().setActiveTeamId(team2Id)
      useBuilderStore.getState().setActiveSelection({kind: 'awakener', slotId: 'slot-4'})
    })

    const {result} = renderHook(() => useBuilderV2Actions())

    act(() => {
      result.current.handlePickerAwakenerClick('hameln')
    })

    expect(useBuilderStore.getState().pendingTransfer).toBeNull()
    expect(useBuilderStore.getState().teams[0].slots[2]).toMatchObject({
      awakenerName: 'hameln',
    })
    expect(useBuilderStore.getState().teams[1].slots[2]).toMatchObject({
      awakenerName: undefined,
      isSupport: undefined,
    })
    expect(useBuilderStore.getState().teams[1].slots[3]).toMatchObject({
      awakenerName: 'hameln',
      isSupport: true,
      level: 90,
    })
  })
})
