import {reconcileQuickLineupSessionAfterSlotsChange} from '../../quick-lineup'
import {
  addTeam,
  applyTeamTemplate,
  createInitialTeams,
  deleteTeam,
  renameTeam,
  reorderTeams,
  resetTeam,
  type TeamTemplateId,
} from '../../team-collection'
import type {BuilderGet, BuilderSet, TeamsSlice} from './types'

export function createTeamsSlice(set: BuilderSet, get: BuilderGet): TeamsSlice {
  const initialTeams = createInitialTeams()

  return {
    teams: initialTeams,
    activeTeamId: initialTeams[0].id,

    addTeam: () => {
      set((state) => {
        const result = addTeam(state.teams)
        state.teams = result.nextTeams
        if (result.addedTeamId) {
          state.activeTeamId = result.addedTeamId
        }
      })
    },

    deleteTeam: (teamId: string) => {
      set((state) => {
        const result = deleteTeam(state.teams, teamId, state.activeTeamId)
        state.teams = result.nextTeams
        state.activeTeamId = result.nextActiveTeamId
      })
    },

    renameTeam: (teamId: string, name: string) => {
      set((state) => {
        state.teams = renameTeam(state.teams, teamId, name)
      })
    },

    reorderTeams: (sourceTeamId: string, targetTeamId: string) => {
      set((state) => {
        state.teams = reorderTeams(state.teams, sourceTeamId, targetTeamId)
      })
    },

    resetTeam: (teamId: string) => {
      set((state) => {
        state.teams = resetTeam(state.teams, teamId)
      })
    },

    applyTemplate: (templateId: TeamTemplateId) => {
      set((state) => {
        const result = applyTeamTemplate(state.teams, templateId)
        state.teams = result.nextTeams
      })
    },

    setActiveTeamId: (teamId: string) => {
      set((state) => {
        if (state.teams.some((t) => t.id === teamId)) {
          state.activeTeamId = teamId
        }
      })
    },

    setActiveTeamSlots: (nextSlots, preferredStep = null) => {
      set((state) => {
        const teamIndex = state.teams.findIndex((t) => t.id === state.activeTeamId)
        if (teamIndex !== -1) {
          state.teams[teamIndex].slots = nextSlots
        }
      })

      const quickLineupSessionState = get().quickLineupSessionState
      if (!quickLineupSessionState) {
        return
      }

      const nextSession = reconcileQuickLineupSessionAfterSlotsChange(
        quickLineupSessionState,
        nextSlots,
        preferredStep,
      )
      get().setQuickLineupSessionState(nextSession)
    },

    updateActiveTeam: (updater) => {
      set((state) => {
        const teamIndex = state.teams.findIndex((t) => t.id === state.activeTeamId)
        if (teamIndex !== -1) {
          state.teams[teamIndex] = updater(state.teams[teamIndex])
        }
      })
    },

    setTeams: (teams) => {
      set((state) => {
        state.teams = teams
      })
    },

    setPosseForActiveTeam: (posseId) => {
      set((state) => {
        const teamIndex = state.teams.findIndex((t) => t.id === state.activeTeamId)
        if (teamIndex !== -1) {
          state.teams[teamIndex].posseId = posseId
        }
      })
    },
  }
}
