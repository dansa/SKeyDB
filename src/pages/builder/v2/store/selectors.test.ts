import {describe, expect, it} from 'vitest'

import type {InternalQuickLineupSession} from '../../quick-lineup'
import {
  selectIsQuickLineupActive,
  selectQuickLineupStepIndex,
  selectQuickLineupSteps,
} from './selectors'
import type {BuilderStore, QuickLineupStep} from './types'

function createBuilderStoreWithQuickLineup(
  session: InternalQuickLineupSession | null,
): BuilderStore {
  const staleSteps: QuickLineupStep[] = [{kind: 'posse'}]

  return {
    activeSelection: null,
    activeTeamId: 'team-1',
    addTeam: () => undefined,
    allowDupes: false,
    applyTemplate: () => undefined,
    awakenerFilter: 'all',
    awakenerSortDirection: 'asc',
    awakenerSortGroupByRealm: false,
    awakenerSortKey: 'name',
    cancelQuickLineup: () => undefined,
    clearSelection: () => undefined,
    deleteTeam: () => undefined,
    displayUnowned: true,
    finishQuickLineup: () => undefined,
    jumpToQuickLineupStep: () => undefined,
    nextQuickLineupStep: () => undefined,
    pickerSearchByTab: {
      awakeners: '',
      covenants: '',
      posses: '',
      wheels: '',
    },
    pickerTab: 'awakeners',
    posseFilter: 'all',
    prevQuickLineupStep: () => undefined,
    promoteMatchingWheelMainstats: false,
    promoteRecommendedGear: false,
    quickLineupOriginalTeam: null,
    quickLineupSessionState: session,
    quickLineupStepIndex: 999,
    quickLineupSteps: staleSteps,
    renameTeam: () => undefined,
    reorderTeams: () => undefined,
    resetTeam: () => undefined,
    setActiveSelection: () => undefined,
    setActiveTeamId: () => undefined,
    setActiveTeamSlots: () => undefined,
    setAllowDupes: () => undefined,
    setAwakenerFilter: () => undefined,
    setAwakenerSortGroupByRealm: () => undefined,
    setAwakenerSortKey: () => undefined,
    setDisplayUnowned: () => undefined,
    setPickerSearchQuery: () => undefined,
    setPickerTab: () => undefined,
    setPosseFilter: () => undefined,
    setPosseForActiveTeam: () => undefined,
    setPromoteMatchingWheelMainstats: () => undefined,
    setPromoteRecommendedGear: () => undefined,
    setQuickLineupSessionState: () => undefined,
    setSinkUnownedToBottom: () => undefined,
    setTeams: () => undefined,
    setWheelMainstatFilter: () => undefined,
    setWheelRarityFilter: () => undefined,
    sinkUnownedToBottom: false,
    skipQuickLineupStep: () => undefined,
    startQuickLineup: () => undefined,
    teams: [{id: 'team-1', name: 'Team 1', slots: [], posseId: undefined}],
    toggleAwakenerSelection: () => undefined,
    toggleAwakenerSortDirection: () => undefined,
    toggleCovenantSelection: () => undefined,
    toggleWheelSelection: () => undefined,
    updateActiveTeam: () => undefined,
    wheelMainstatFilter: 'all',
    wheelRarityFilter: 'all',
  } as unknown as BuilderStore
}

describe('quick lineup selectors', () => {
  it('derive quick-lineup activity and step data from the session source of truth', () => {
    const session: InternalQuickLineupSession = {
      currentStepIndex: 2,
      history: [0, 1, 2],
      originalTeam: {
        id: 'team-1',
        name: 'Team 1',
        posseId: undefined,
        slots: [],
      },
      steps: [
        {kind: 'awakener', slotId: 'slot-1'},
        {kind: 'wheel', slotId: 'slot-1', wheelIndex: 0},
        {kind: 'posse'},
      ],
      teamId: 'team-1',
    }

    const state = createBuilderStoreWithQuickLineup(session)

    expect(selectIsQuickLineupActive(state)).toBe(true)
    expect(selectQuickLineupStepIndex(state)).toBe(2)
    expect(selectQuickLineupSteps(state)).toEqual(session.steps)
  })

  it('falls back to inactive defaults when there is no session', () => {
    const state = createBuilderStoreWithQuickLineup(null)

    expect(selectIsQuickLineupActive(state)).toBe(false)
    expect(selectQuickLineupStepIndex(state)).toBe(0)
    expect(selectQuickLineupSteps(state)).toBeNull()
  })
})
