import {describe, expect, it} from 'vitest'

import {useBuilderStore} from './builder-store'
import {selectActiveTeam, selectActiveTeamSlots, selectIsQuickLineupActive} from './selectors'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

describe('builder store integration', () => {
  it('selectors derive correct values from initial state', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const activeTeam = selectActiveTeam(state)
    expect(activeTeam).toBeDefined()
    expect(activeTeam?.name).toBe('Team 1')
    expect(selectActiveTeamSlots(state)).toHaveLength(4)
    expect(selectIsQuickLineupActive(state)).toBe(false)
  })

  it('selection slice interacts correctly with picker slice', () => {
    resetStore()
    useBuilderStore.getState().setPickerTab('posses')
    expect(useBuilderStore.getState().pickerTab).toBe('posses')
    useBuilderStore.getState().toggleWheelSelection('slot-1', 0)
    expect(useBuilderStore.getState().pickerTab).toBe('wheels')
  })

  it('quick lineup flow: start → navigate → finish', () => {
    resetStore()
    const steps = [
      {kind: 'awakener' as const, slotId: 'slot-1'},
      {kind: 'wheel' as const, slotId: 'slot-1', wheelIndex: 0},
      {kind: 'wheel' as const, slotId: 'slot-1', wheelIndex: 1},
      {kind: 'posse' as const},
    ]

    useBuilderStore.getState().startQuickLineup(steps)
    let state = useBuilderStore.getState()
    expect(state.quickLineupSteps).toHaveLength(4)
    expect(state.quickLineupStepIndex).toBe(0)
    expect(state.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
    expect(state.pickerTab).toBe('awakeners')

    useBuilderStore.getState().nextQuickLineupStep()
    state = useBuilderStore.getState()
    expect(state.quickLineupStepIndex).toBe(1)
    expect(state.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
    expect(state.pickerTab).toBe('wheels')

    useBuilderStore.getState().nextQuickLineupStep()
    state = useBuilderStore.getState()
    expect(state.quickLineupStepIndex).toBe(2)

    useBuilderStore.getState().nextQuickLineupStep()
    state = useBuilderStore.getState()
    expect(state.quickLineupStepIndex).toBe(3)
    expect(state.pickerTab).toBe('posses')

    useBuilderStore.getState().nextQuickLineupStep()
    state = useBuilderStore.getState()
    expect(state.quickLineupSteps).toBeNull()
    expect(state.activeSelection).toBeNull()
  })

  it('quick lineup cancel restores original team', () => {
    resetStore()
    const teamId = useBuilderStore.getState().teams[0].id
    useBuilderStore.getState().setPosseForActiveTeam('original-posse')

    const steps = [{kind: 'awakener' as const, slotId: 'slot-1'}]
    useBuilderStore.getState().startQuickLineup(steps)

    useBuilderStore.getState().setPosseForActiveTeam('changed-during-lineup')
    expect(useBuilderStore.getState().teams[0].posseId).toBe('changed-during-lineup')

    useBuilderStore.getState().cancelQuickLineup()
    const team = useBuilderStore.getState().teams.find((t) => t.id === teamId)
    expect(team?.posseId).toBe('original-posse')
    expect(useBuilderStore.getState().quickLineupSteps).toBeNull()
  })

  it('quick lineup prevStep navigates backward', () => {
    resetStore()
    const steps = [
      {kind: 'awakener' as const, slotId: 'slot-1'},
      {kind: 'wheel' as const, slotId: 'slot-1', wheelIndex: 0},
    ]
    useBuilderStore.getState().startQuickLineup(steps)
    useBuilderStore.getState().nextQuickLineupStep()
    expect(useBuilderStore.getState().quickLineupStepIndex).toBe(1)

    useBuilderStore.getState().prevQuickLineupStep()
    expect(useBuilderStore.getState().quickLineupStepIndex).toBe(0)
    expect(useBuilderStore.getState().activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
  })

  it('quick lineup prevStep does not go below 0', () => {
    resetStore()
    const steps = [{kind: 'awakener' as const, slotId: 'slot-1'}]
    useBuilderStore.getState().startQuickLineup(steps)
    useBuilderStore.getState().prevQuickLineupStep()
    expect(useBuilderStore.getState().quickLineupStepIndex).toBe(0)
  })

  it('multi-team workflow: add teams, switch, modify independently', () => {
    resetStore()
    useBuilderStore.getState().addTeam()
    useBuilderStore.getState().addTeam()
    const teamIds = useBuilderStore.getState().teams.map((t) => t.id)

    useBuilderStore.getState().setActiveTeamId(teamIds[0])
    useBuilderStore.getState().setPosseForActiveTeam('posse-a')

    useBuilderStore.getState().setActiveTeamId(teamIds[1])
    useBuilderStore.getState().setPosseForActiveTeam('posse-b')

    useBuilderStore.getState().setActiveTeamId(teamIds[2])
    useBuilderStore.getState().setPosseForActiveTeam('posse-c')

    const teams = useBuilderStore.getState().teams
    expect(teams[0].posseId).toBe('posse-a')
    expect(teams[1].posseId).toBe('posse-b')
    expect(teams[2].posseId).toBe('posse-c')
  })
})
