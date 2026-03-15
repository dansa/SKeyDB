import {createEmptyTeamSlots} from '../../constants'
import {
  cloneTeam,
  findNextQuickLineupStepIndex,
  findPreviousQuickLineupStepIndex,
  findQuickLineupStepIndex,
  getQuickLineupStepAtIndex,
  goToQuickLineupStep,
  normalizeQuickLineupStepForSlots,
  type InternalQuickLineupSession,
} from '../../quick-lineup'
import type {BuilderGet, BuilderSet, QuickLineupSlice, QuickLineupStep} from './types'

export function createQuickLineupSlice(set: BuilderSet, get: BuilderGet): QuickLineupSlice {
  return {
    quickLineupSessionState: null,

    setQuickLineupSessionState: (session) => {
      set((state) => {
        applyQuickLineupSessionState(state, session)
      })
    },

    startQuickLineup: (steps: QuickLineupStep[]) => {
      set((state) => {
        const activeTeam = state.teams.find((team) => team.id === state.activeTeamId)
        if (!activeTeam || steps.length === 0) {
          return
        }

        const session: InternalQuickLineupSession = {
          currentStepIndex: 0,
          history: [0],
          originalTeam: cloneTeam(activeTeam),
          steps,
          teamId: activeTeam.id,
        }

        activeTeam.posseId = undefined
        activeTeam.slots = createEmptyTeamSlots()
        applyQuickLineupSessionState(state, session)
      })
    },

    finishQuickLineup: () => {
      set((state) => {
        applyQuickLineupSessionState(state, null)
      })
    },

    cancelQuickLineup: () => {
      set((state) => {
        const session = state.quickLineupSessionState
        if (session) {
          const teamIndex = state.teams.findIndex((team) => team.id === session.teamId)
          if (teamIndex !== -1) {
            state.teams[teamIndex] = cloneTeam(session.originalTeam)
          }
        }
        applyQuickLineupSessionState(state, null)
      })
    },

    nextQuickLineupStep: (expectedStepIndex) => {
      const state = get()
      const session = state.quickLineupSessionState
      if (!session) {
        return
      }

      if (expectedStepIndex !== undefined && session.currentStepIndex !== expectedStepIndex) {
        return
      }

      const activeTeam = state.teams.find((team) => team.id === state.activeTeamId)
      const nextStepIndex = findNextQuickLineupStepIndex(session, activeTeam?.slots ?? [])
      if (nextStepIndex === null) {
        state.finishQuickLineup()
        return
      }

      const nextSession = goToQuickLineupStep(session, nextStepIndex)
      state.setQuickLineupSessionState(nextSession)
    },

    prevQuickLineupStep: (expectedStepIndex) => {
      const state = get()
      const session = state.quickLineupSessionState
      if (!session) {
        return
      }

      if (expectedStepIndex !== undefined && session.currentStepIndex !== expectedStepIndex) {
        return
      }

      const activeTeam = state.teams.find((team) => team.id === state.activeTeamId)
      const previousStepIndex = findPreviousQuickLineupStepIndex(session, activeTeam?.slots ?? [])
      if (previousStepIndex === null) {
        return
      }

      const nextSession = goToQuickLineupStep(session, previousStepIndex)
      if (!nextSession) {
        return
      }

      state.setQuickLineupSessionState(nextSession)
    },

    skipQuickLineupStep: (expectedStepIndex) => {
      get().nextQuickLineupStep(expectedStepIndex)
    },

    jumpToQuickLineupStep: (step: QuickLineupStep) => {
      const state = get()
      const session = state.quickLineupSessionState
      if (!session) {
        return
      }

      const activeTeam = state.teams.find((team) => team.id === state.activeTeamId)
      const normalizedStep = normalizeQuickLineupStepForSlots(step, activeTeam?.slots ?? [])
      const nextStepIndex = findQuickLineupStepIndex(session, normalizedStep)
      if (nextStepIndex === -1) {
        return
      }

      const nextSession = goToQuickLineupStep(session, nextStepIndex)
      state.setQuickLineupSessionState(nextSession)
    },
  }
}

function applyQuickLineupSessionState(
  state: {
    activeSelection: {kind: string; slotId?: string; wheelIndex?: number} | null
    pickerTab: string
    quickLineupSessionState: InternalQuickLineupSession | null
  },
  session: InternalQuickLineupSession | null,
): void {
  state.quickLineupSessionState = session

  if (!session) {
    state.activeSelection = null
    return
  }

  const currentStep = getQuickLineupStepAtIndex(session, session.currentStepIndex)
  if (!currentStep) {
    state.activeSelection = null
    return
  }

  applyStepSelection(state, currentStep)
}

interface SelectionTarget {
  activeSelection: {kind: string; slotId?: string; wheelIndex?: number} | null
  pickerTab: string
}

function applyStepSelection(state: SelectionTarget, step: QuickLineupStep): void {
  if (step.kind === 'awakener') {
    state.activeSelection = {kind: 'awakener', slotId: step.slotId}
    state.pickerTab = 'awakeners'
  } else if (step.kind === 'wheel') {
    state.activeSelection = {kind: 'wheel', slotId: step.slotId, wheelIndex: step.wheelIndex}
    state.pickerTab = 'wheels'
  } else if (step.kind === 'covenant') {
    state.activeSelection = {kind: 'covenant', slotId: step.slotId}
    state.pickerTab = 'covenants'
  } else {
    state.activeSelection = null
    state.pickerTab = 'posses'
  }
}
