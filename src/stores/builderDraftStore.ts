import {createStore} from 'zustand/vanilla'

import type {BuilderDraftPayload} from '@/features/builder/builderMigrations'
import {createEmptyTeamSlots} from '@/features/builder/constants'
import {
  createQuickLineupSession,
  findNextQuickLineupStepIndex,
  findQuickLineupStepIndex,
  getQuickLineupStepAtIndex,
  getQuickLineupStepPickerTab,
  getQuickLineupStepSelection,
  goBackQuickLineupHistory,
  goToQuickLineupStep,
  reconcileQuickLineupSessionAfterSlotsChange,
  type InternalQuickLineupSession,
} from '@/features/builder/quick-lineup'
import {renameTeam} from '@/features/builder/team-collection'
import type {
  ActiveSelection,
  PickerTab,
  QuickLineupStep,
  Team,
  TeamSlot,
} from '@/features/builder/types'

export type TeamRenameSurface = 'header' | 'list'

export interface BuilderDraftFocus {
  pickerTab: PickerTab | null
  selection: ActiveSelection
}

export type BuilderDraftState = BuilderDraftPayload & {
  activeSelection: ActiveSelection
  editingTeamId: string | null
  editingTeamName: string
  editingTeamSurface: TeamRenameSurface | null
  quickLineupState: InternalQuickLineupSession | null
  hydrateBuilderDraft: (nextDraft: BuilderDraftPayload) => void
  replaceBuilderDraft: (nextDraft: BuilderDraftPayload) => void
  resetBuilderDraft: () => BuilderDraftPayload
  setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void
  setActiveTeamId: (activeTeamId: string) => void
  setActiveSelection: (
    selection: ActiveSelection | ((prev: ActiveSelection) => ActiveSelection),
  ) => void
  updateActiveTeam: (mutator: (team: Team) => Team) => void
  setActiveTeamSlots: (nextSlots: TeamSlot[]) => BuilderDraftFocus | null
  beginTeamRename: (teamId: string, currentName: string, surface?: TeamRenameSurface) => void
  setEditingTeamName: (editingTeamName: string) => void
  cancelTeamRename: () => void
  commitTeamRename: (teamId: string) => void
  startQuickLineup: () => BuilderDraftFocus | null
  advanceQuickLineupStep: (nextSlotsOverride?: TeamSlot[]) => BuilderDraftFocus | null
  goBackQuickLineupStep: () => BuilderDraftFocus | null
  finishQuickLineup: () => BuilderDraftFocus
  cancelQuickLineup: () => BuilderDraftFocus | null
  jumpToQuickLineupStep: (step: QuickLineupStep) => BuilderDraftFocus | null
  restoreQuickLineupFocus: () => BuilderDraftFocus | null
  reconcileQuickLineupAfterSlotsChange: (
    nextSlots: TeamSlot[],
    preferredStep?: QuickLineupStep | null,
  ) => BuilderDraftFocus | null
}

export function createDefaultBuilderDraft(): BuilderDraftPayload {
  return {
    teams: [
      {
        id: 'team-1',
        name: 'Team 1',
        slots: createEmptyTeamSlots(),
      },
    ],
    activeTeamId: 'team-1',
  }
}

function getEffectiveActiveTeamId(teams: Team[], activeTeamId: string): string {
  return teams.some((team) => team.id === activeTeamId) ? activeTeamId : (teams[0]?.id ?? '')
}

function getEffectiveActiveTeam(teams: Team[], activeTeamId: string): Team | undefined {
  const effectiveActiveTeamId = getEffectiveActiveTeamId(teams, activeTeamId)
  return teams.find((team) => team.id === effectiveActiveTeamId) ?? teams[0]
}

function clearTransientDraftState() {
  return {
    activeSelection: null,
    editingTeamId: null,
    editingTeamName: '',
    editingTeamSurface: null,
    quickLineupState: null,
  }
}

function getQuickLineupFocus(session: InternalQuickLineupSession | null): BuilderDraftFocus {
  if (!session) {
    return {pickerTab: null, selection: null}
  }

  const currentStep = getQuickLineupStepAtIndex(session, session.currentStepIndex)
  if (!currentStep) {
    return {pickerTab: null, selection: null}
  }

  return {
    pickerTab: getQuickLineupStepPickerTab(currentStep),
    selection: getQuickLineupStepSelection(currentStep),
  }
}

export function createBuilderDraftStore(
  initialDraft: BuilderDraftPayload = createDefaultBuilderDraft(),
) {
  return createStore<BuilderDraftState>()((set, get) => ({
    ...initialDraft,
    ...clearTransientDraftState(),
    hydrateBuilderDraft: (nextDraft) => {
      set({
        teams: nextDraft.teams,
        activeTeamId: nextDraft.activeTeamId,
        ...clearTransientDraftState(),
      })
    },
    replaceBuilderDraft: (nextDraft) => {
      set({
        teams: nextDraft.teams,
        activeTeamId: nextDraft.activeTeamId,
        ...clearTransientDraftState(),
      })
    },
    resetBuilderDraft: () => {
      const nextDraft = createDefaultBuilderDraft()
      set({
        teams: nextDraft.teams,
        activeTeamId: nextDraft.activeTeamId,
        ...clearTransientDraftState(),
      })
      return nextDraft
    },
    setTeams: (teams) => {
      set((state) => {
        const nextTeams = typeof teams === 'function' ? teams(state.teams) : teams
        return {
          teams: nextTeams,
          activeTeamId: getEffectiveActiveTeamId(nextTeams, state.activeTeamId),
        }
      })
    },
    setActiveTeamId: (activeTeamId) => {
      set((state) => ({
        activeTeamId: state.teams.some((team) => team.id === activeTeamId)
          ? activeTeamId
          : getEffectiveActiveTeamId(state.teams, state.activeTeamId),
      }))
    },
    setActiveSelection: (selection) => {
      set((state) => ({
        activeSelection:
          typeof selection === 'function' ? selection(state.activeSelection) : selection,
      }))
    },
    updateActiveTeam: (mutator) => {
      set((state) => {
        const activeTeam = getEffectiveActiveTeam(state.teams, state.activeTeamId)
        if (!activeTeam) {
          return {}
        }
        const nextActiveTeamId = getEffectiveActiveTeamId(state.teams, state.activeTeamId)
        return {
          teams: state.teams.map((team) => (team.id === activeTeam.id ? mutator(team) : team)),
          activeTeamId: nextActiveTeamId,
        }
      })
    },
    setActiveTeamSlots: (nextSlots) => {
      get().updateActiveTeam((team) => ({...team, slots: nextSlots}))
      return get().reconcileQuickLineupAfterSlotsChange(nextSlots)
    },
    beginTeamRename: (teamId, currentName, surface = 'list') => {
      set({editingTeamId: teamId, editingTeamName: currentName, editingTeamSurface: surface})
    },
    setEditingTeamName: (editingTeamName) => {
      set({editingTeamName})
    },
    cancelTeamRename: () => {
      set({editingTeamId: null, editingTeamName: '', editingTeamSurface: null})
    },
    commitTeamRename: (teamId) => {
      const trimmed = get().editingTeamName.trim()
      if (trimmed) {
        set((state) => ({teams: renameTeam(state.teams, teamId, trimmed)}))
      }
      get().cancelTeamRename()
    },
    startQuickLineup: () => {
      const state = get()
      const activeTeam = getEffectiveActiveTeam(state.teams, state.activeTeamId)
      if (!activeTeam) {
        return null
      }
      const nextSession = createQuickLineupSession(activeTeam)
      const focus = getQuickLineupFocus(nextSession)
      set((current) => ({
        teams: current.teams.map((team) =>
          team.id === activeTeam.id
            ? {...team, posseId: undefined, slots: createEmptyTeamSlots()}
            : team,
        ),
        activeTeamId: activeTeam.id,
        quickLineupState: nextSession,
        activeSelection: focus.selection,
      }))
      return focus
    },
    advanceQuickLineupStep: (nextSlotsOverride) => {
      const state = get()
      if (!state.quickLineupState) {
        return null
      }
      const activeTeam = getEffectiveActiveTeam(state.teams, state.activeTeamId)
      const nextStepIndex = findNextQuickLineupStepIndex(
        state.quickLineupState,
        nextSlotsOverride ?? activeTeam?.slots ?? [],
      )
      if (nextStepIndex === null) {
        const focus = getQuickLineupFocus(null)
        set({quickLineupState: null, activeSelection: focus.selection})
        return focus
      }
      const nextSession = goToQuickLineupStep(state.quickLineupState, nextStepIndex)
      if (!nextSession) {
        const focus = getQuickLineupFocus(null)
        set({quickLineupState: null, activeSelection: focus.selection})
        return focus
      }
      const focus = getQuickLineupFocus(nextSession)
      set({quickLineupState: nextSession, activeSelection: focus.selection})
      return focus
    },
    goBackQuickLineupStep: () => {
      const state = get()
      if (!state.quickLineupState) {
        return null
      }
      const nextSession = goBackQuickLineupHistory(state.quickLineupState)
      if (!nextSession) {
        return null
      }
      const focus = getQuickLineupFocus(nextSession)
      set({quickLineupState: nextSession, activeSelection: focus.selection})
      return focus
    },
    finishQuickLineup: () => {
      const focus = getQuickLineupFocus(null)
      set({quickLineupState: null})
      return focus
    },
    cancelQuickLineup: () => {
      const state = get()
      if (!state.quickLineupState) {
        return null
      }
      const {originalTeam, teamId} = state.quickLineupState
      const focus = getQuickLineupFocus(null)
      set((current) => ({
        teams: current.teams.map((team) => (team.id === teamId ? originalTeam : team)),
        quickLineupState: null,
        activeSelection: focus.selection,
      }))
      return focus
    },
    jumpToQuickLineupStep: (step) => {
      const state = get()
      if (!state.quickLineupState) {
        return null
      }
      const nextStepIndex = findQuickLineupStepIndex(state.quickLineupState, step)
      if (nextStepIndex === -1) {
        return null
      }
      const nextSession = goToQuickLineupStep(state.quickLineupState, nextStepIndex)
      if (!nextSession) {
        return null
      }
      const focus = getQuickLineupFocus(nextSession)
      set({quickLineupState: nextSession, activeSelection: focus.selection})
      return focus
    },
    restoreQuickLineupFocus: () => {
      const focus = getQuickLineupFocus(get().quickLineupState)
      set({activeSelection: focus.selection})
      return focus
    },
    reconcileQuickLineupAfterSlotsChange: (nextSlots, preferredStep = null) => {
      const state = get()
      if (!state.quickLineupState) {
        return null
      }
      const nextSession = reconcileQuickLineupSessionAfterSlotsChange(
        state.quickLineupState,
        nextSlots,
        preferredStep,
      )
      const focus = getQuickLineupFocus(nextSession)
      set({quickLineupState: nextSession, activeSelection: focus.selection})
      return focus
    },
  }))
}

export const builderDraftStore = createBuilderDraftStore()
