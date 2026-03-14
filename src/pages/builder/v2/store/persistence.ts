import {getBrowserLocalStorage} from '@/domain/storage'

import {
  loadBuilderDraft,
  saveBuilderDraft,
  type BuilderDraftPayload,
} from '../../builder-persistence'
import {createInitialTeams} from '../../team-collection'
import type {BuilderStore} from './types'

const AUTOSAVE_DEBOUNCE_MS = 300

export function loadInitialBuilderState(): {teams: BuilderStore['teams']; activeTeamId: string} {
  const storage = getBrowserLocalStorage()
  const persisted = loadBuilderDraft(storage)
  if (persisted) {
    return {teams: persisted.teams, activeTeamId: persisted.activeTeamId}
  }
  const teams = createInitialTeams()
  return {teams, activeTeamId: teams[0].id}
}

export function subscribeAutosave(store: {
  getState: () => Pick<BuilderStore, 'teams' | 'activeTeamId'>
  subscribe: (listener: () => void) => () => void
}): () => void {
  const storage = getBrowserLocalStorage()
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastTeams: BuilderStore['teams'] | null = null
  let lastActiveTeamId: string | null = null

  const unsubscribe = store.subscribe(() => {
    const {teams, activeTeamId} = store.getState()
    if (teams === lastTeams && activeTeamId === lastActiveTeamId) {
      return
    }
    lastTeams = teams
    lastActiveTeamId = activeTeamId

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      timeoutId = null
      saveBuilderDraft(storage, {teams, activeTeamId})
    }, AUTOSAVE_DEBOUNCE_MS)
  })

  return () => {
    unsubscribe()
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
  }
}

export function replaceBuilderDraft(
  store: {setState: (state: Partial<BuilderStore>) => void},
  payload: BuilderDraftPayload,
): void {
  const storage = getBrowserLocalStorage()
  store.setState({teams: payload.teams, activeTeamId: payload.activeTeamId})
  saveBuilderDraft(storage, payload)
}
