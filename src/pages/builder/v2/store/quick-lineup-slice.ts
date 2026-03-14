import type {BuilderGet, BuilderSet, QuickLineupSlice, QuickLineupStep} from './types'

export function createQuickLineupSlice(set: BuilderSet, get: BuilderGet): QuickLineupSlice {
  return {
    quickLineupSteps: null,
    quickLineupStepIndex: 0,
    quickLineupOriginalTeam: null,

    startQuickLineup: (steps: QuickLineupStep[]) => {
      set((state) => {
        const activeTeam = state.teams.find((t) => t.id === state.activeTeamId)
        if (!activeTeam || steps.length === 0) {
          return
        }
        state.quickLineupSteps = steps
        state.quickLineupStepIndex = 0
        state.quickLineupOriginalTeam = JSON.parse(JSON.stringify(activeTeam)) as typeof activeTeam
        applyStepSelection(state, steps[0])
      })
    },

    finishQuickLineup: () => {
      set((state) => {
        state.quickLineupSteps = null
        state.quickLineupStepIndex = 0
        state.quickLineupOriginalTeam = null
        state.activeSelection = null
      })
    },

    cancelQuickLineup: () => {
      set((state) => {
        if (state.quickLineupOriginalTeam) {
          const teamIndex = state.teams.findIndex((t) => t.id === state.activeTeamId)
          if (teamIndex !== -1) {
            state.teams[teamIndex] = state.quickLineupOriginalTeam
          }
        }
        state.quickLineupSteps = null
        state.quickLineupStepIndex = 0
        state.quickLineupOriginalTeam = null
        state.activeSelection = null
      })
    },

    nextQuickLineupStep: () => {
      set((state) => {
        if (!state.quickLineupSteps) {
          return
        }
        const nextIndex = state.quickLineupStepIndex + 1
        if (nextIndex >= state.quickLineupSteps.length) {
          state.quickLineupSteps = null
          state.quickLineupStepIndex = 0
          state.quickLineupOriginalTeam = null
          state.activeSelection = null
          return
        }
        state.quickLineupStepIndex = nextIndex
        applyStepSelection(state, state.quickLineupSteps[nextIndex])
      })
    },

    prevQuickLineupStep: () => {
      set((state) => {
        if (!state.quickLineupSteps || state.quickLineupStepIndex <= 0) {
          return
        }
        const prevIndex = state.quickLineupStepIndex - 1
        state.quickLineupStepIndex = prevIndex
        applyStepSelection(state, state.quickLineupSteps[prevIndex])
      })
    },

    skipQuickLineupStep: () => {
      get().nextQuickLineupStep()
    },

    jumpToQuickLineupStep: (step: QuickLineupStep) => {
      set((state) => {
        if (!state.quickLineupSteps) {
          return
        }
        const index = state.quickLineupSteps.findIndex(
          (s) => s.kind === step.kind && matchesStep(s, step),
        )
        if (index !== -1) {
          state.quickLineupStepIndex = index
          applyStepSelection(state, state.quickLineupSteps[index])
        }
      })
    },
  }
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

function matchesStep(a: QuickLineupStep, b: QuickLineupStep): boolean {
  if (a.kind !== b.kind) {
    return false
  }
  if (a.kind === 'posse') {
    return true
  }
  if (a.kind === 'awakener' && b.kind === 'awakener') {
    return a.slotId === b.slotId
  }
  if (a.kind === 'wheel' && b.kind === 'wheel') {
    return a.slotId === b.slotId && a.wheelIndex === b.wheelIndex
  }
  if (a.kind === 'covenant' && b.kind === 'covenant') {
    return a.slotId === b.slotId
  }
  return false
}
