import {describe, expect, it} from 'vitest'

import type {TeamSlot} from '../../types'
import {useBuilderStore} from './builder-store'
import type {QuickLineupStep} from './types'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function createFilledSlot(
  slotId: string,
  awakenerName: string,
  overrides: Partial<TeamSlot> = {},
): TeamSlot {
  return {
    slotId,
    awakenerName,
    realm: 'AEQUOR',
    level: 60,
    wheels: [null, null],
    ...overrides,
  }
}

function buildSteps(slots: TeamSlot[]): QuickLineupStep[] {
  return [
    ...slots.flatMap<QuickLineupStep>((slot) => [
      {kind: 'awakener', slotId: slot.slotId},
      {kind: 'wheel', slotId: slot.slotId, wheelIndex: 0},
      {kind: 'wheel', slotId: slot.slotId, wheelIndex: 1},
      {kind: 'covenant', slotId: slot.slotId},
    ]),
    {kind: 'posse'},
  ]
}

function getQuickLineupState() {
  const state = useBuilderStore.getState()
  return {
    activeSelection: state.activeSelection,
    pickerTab: state.pickerTab,
    quickLineupStepIndex: state.quickLineupSessionState?.currentStepIndex ?? 0,
    quickLineupSteps: state.quickLineupSessionState?.steps ?? null,
    teams: state.teams,
  }
}

function setActiveTeamSlots(nextSlots: TeamSlot[], preferredStep?: QuickLineupStep | null) {
  const state = useBuilderStore.getState() as {
    setActiveTeamSlots: (nextSlots: TeamSlot[], preferredStep?: QuickLineupStep | null) => void
  }

  state.setActiveTeamSlots(nextSlots, preferredStep)
}

describe('quick lineup slice', () => {
  it('starts quick lineup by snapshotting and clearing the active team before selecting the first step', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const originalSlots: TeamSlot[] = [
      createFilledSlot('slot-1', 'Goliath', {
        covenantId: 'covenant-a',
        wheels: ['wheel-a', 'wheel-b'],
      }),
      {slotId: 'slot-2', wheels: [null, null] as [null, null]},
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]

    setActiveTeamSlots(originalSlots)
    state.setPosseForActiveTeam('posse-a')

    state.startQuickLineup(buildSteps(originalSlots))

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupSteps).toHaveLength(17)
    expect(nextState.quickLineupStepIndex).toBe(0)
    expect(nextState.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
    expect(nextState.pickerTab).toBe('awakeners')
    expect(nextState.teams[0]?.posseId).toBeUndefined()
    expect(nextState.teams[0]?.slots).toEqual([
      {slotId: 'slot-1', wheels: [null, null]},
      {slotId: 'slot-2', wheels: [null, null]},
      {slotId: 'slot-3', wheels: [null, null]},
      {slotId: 'slot-4', wheels: [null, null]},
    ])
  })

  it('skips an empty awakener step to the next awakener instead of entering empty gear steps', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const slots: TeamSlot[] = state.teams[0]?.slots ?? []

    state.startQuickLineup(buildSteps(slots))
    state.skipQuickLineupStep()

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupStepIndex).toBe(4)
    expect(nextState.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
    expect(nextState.pickerTab).toBe('awakeners')
  })

  it('forces empty-slot gear jumps back to the slot awakener step', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const slots: TeamSlot[] = state.teams[0]?.slots ?? []

    state.startQuickLineup(buildSteps(slots))

    state.jumpToQuickLineupStep({kind: 'wheel', slotId: 'slot-2', wheelIndex: 0})

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupStepIndex).toBe(4)
    expect(nextState.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
    expect(nextState.pickerTab).toBe('awakeners')
  })

  it('moves backward linearly from the current step instead of using jump history', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const seededSlots: TeamSlot[] = [
      createFilledSlot('slot-1', 'Goliath'),
      createFilledSlot('slot-2', 'Castor'),
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]

    setActiveTeamSlots(seededSlots)
    state.startQuickLineup(buildSteps(seededSlots))
    setActiveTeamSlots(seededSlots)
    state.jumpToQuickLineupStep({kind: 'covenant', slotId: 'slot-2'})

    state.prevQuickLineupStep()

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupStepIndex).toBe(6)
    expect(nextState.activeSelection).toEqual({
      kind: 'wheel',
      slotId: 'slot-2',
      wheelIndex: 1,
    })
    expect(nextState.pickerTab).toBe('wheels')
  })

  it('cancels quick lineup by restoring the original team snapshot', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const originalSlots: TeamSlot[] = [
      createFilledSlot('slot-1', 'Goliath', {
        covenantId: 'covenant-a',
        wheels: ['wheel-a', 'wheel-b'],
      }),
      {slotId: 'slot-2', wheels: [null, null] as [null, null]},
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]

    setActiveTeamSlots(originalSlots)
    state.setPosseForActiveTeam('posse-a')
    state.startQuickLineup(buildSteps(originalSlots))
    state.setPosseForActiveTeam('posse-b')

    state.cancelQuickLineup()

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupSteps).toBeNull()
    expect(nextState.teams[0]?.posseId).toBe('posse-a')
    expect(nextState.teams[0]?.slots).toEqual(originalSlots)
  })

  it('keeps the mutated team when finishing quick lineup', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const originalSlots: TeamSlot[] = state.teams[0]?.slots ?? []
    const mutatedSlots: TeamSlot[] = [
      createFilledSlot('slot-1', 'Goliath'),
      {slotId: 'slot-2', wheels: [null, null] as [null, null]},
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]

    state.startQuickLineup(buildSteps(originalSlots))
    setActiveTeamSlots(mutatedSlots)
    state.finishQuickLineup()

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupSteps).toBeNull()
    expect(nextState.teams[0]?.slots).toEqual(mutatedSlots)
  })

  it('reconciles to the preferred target step after swapping slots during quick lineup', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const seededSlots: TeamSlot[] = [
      createFilledSlot('slot-1', 'Goliath', {wheels: ['wheel-a', null]}),
      {slotId: 'slot-2', wheels: [null, null] as [null, null]},
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]
    const swappedSlots: TeamSlot[] = [
      {slotId: 'slot-1', wheels: [null, null] as [null, null]},
      createFilledSlot('slot-2', 'Goliath', {wheels: ['wheel-a', null]}),
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]
    const preferredStep: QuickLineupStep = {kind: 'awakener', slotId: 'slot-2'}

    setActiveTeamSlots(seededSlots)
    state.startQuickLineup(buildSteps(seededSlots))
    setActiveTeamSlots(seededSlots)
    state.nextQuickLineupStep()
    expect(getQuickLineupState().activeSelection).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })

    setActiveTeamSlots(swappedSlots, preferredStep)

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupStepIndex).toBe(4)
    expect(nextState.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
    expect(nextState.pickerTab).toBe('awakeners')
  })

  it('ignores duplicate skip events for the same rendered step', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const seededSlots: TeamSlot[] = [
      createFilledSlot('slot-1', 'Goliath'),
      {slotId: 'slot-2', wheels: [null, null] as [null, null]},
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]

    setActiveTeamSlots(seededSlots)
    state.startQuickLineup(buildSteps(seededSlots))
    setActiveTeamSlots(seededSlots)

    state.skipQuickLineupStep(0)
    state.skipQuickLineupStep(0)

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupStepIndex).toBe(1)
    expect(nextState.activeSelection).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
  })

  it('ignores duplicate back events for the same rendered step', () => {
    resetStore()
    const state = useBuilderStore.getState()
    const seededSlots: TeamSlot[] = [
      createFilledSlot('slot-1', 'Goliath'),
      createFilledSlot('slot-2', 'Castor'),
      {slotId: 'slot-3', wheels: [null, null] as [null, null]},
      {slotId: 'slot-4', wheels: [null, null] as [null, null]},
    ]

    setActiveTeamSlots(seededSlots)
    state.startQuickLineup(buildSteps(seededSlots))
    setActiveTeamSlots(seededSlots)
    state.jumpToQuickLineupStep({kind: 'covenant', slotId: 'slot-2'})

    state.prevQuickLineupStep(7)
    state.prevQuickLineupStep(7)

    const nextState = getQuickLineupState()
    expect(nextState.quickLineupStepIndex).toBe(6)
    expect(nextState.activeSelection).toEqual({
      kind: 'wheel',
      slotId: 'slot-2',
      wheelIndex: 1,
    })
  })
})
