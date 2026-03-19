import type {TeamSlot} from '../../types'
import type {BuilderStore} from './types'

const EMPTY_TEAM_SLOTS: TeamSlot[] = []

export const selectTeams = (s: BuilderStore) => s.teams
export const selectActiveTeamId = (s: BuilderStore) => s.activeTeamId
export const selectActiveTeam = (s: BuilderStore) => s.teams.find((t) => t.id === s.activeTeamId)
export const selectActiveTeamSlots = (s: BuilderStore) =>
  s.teams.find((t) => t.id === s.activeTeamId)?.slots ?? EMPTY_TEAM_SLOTS
export const selectActiveSelection = (s: BuilderStore) => s.activeSelection
export const selectPickerTab = (s: BuilderStore) => s.pickerTab
export const selectIsQuickLineupActive = (s: BuilderStore) => s.quickLineupSessionState !== null
export const selectQuickLineupStepIndex = (s: BuilderStore) =>
  s.quickLineupSessionState?.currentStepIndex ?? 0
export const selectQuickLineupSteps = (s: BuilderStore) => s.quickLineupSessionState?.steps ?? null
export const selectPendingTransfer = (s: BuilderStore) => s.pendingTransfer
