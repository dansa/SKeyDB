import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  BUILDER_PERSISTENCE_KEY,
  clearBuilderDraft,
  loadBuilderDraft,
  saveBuilderDraft,
} from '../../builder-persistence'
import {useBuilderStore} from './builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

describe('persistence integration', () => {
  afterEach(() => {
    clearBuilderDraft(window.localStorage)
    resetStore()
  })

  it('store loads persisted draft on creation', () => {
    const teams = [
      {
        id: 'persisted-team',
        name: 'Persisted',
        posseId: undefined,
        slots: [
          {slotId: 'slot-1', wheels: [null, null] as [null, null]},
          {slotId: 'slot-2', wheels: [null, null] as [null, null]},
          {slotId: 'slot-3', wheels: [null, null] as [null, null]},
          {slotId: 'slot-4', wheels: [null, null] as [null, null]},
        ],
      },
    ]
    saveBuilderDraft(window.localStorage, {teams, activeTeamId: 'persisted-team'})

    const loaded = loadBuilderDraft(window.localStorage)
    expect(loaded).toBeTruthy()
    expect(loaded?.teams[0]?.id).toBe('persisted-team')
  })

  it('autosave writes to localStorage after debounce', () => {
    vi.useFakeTimers()
    resetStore()

    useBuilderStore.getState().renameTeam(useBuilderStore.getState().teams[0].id, 'Autosaved Name')

    vi.advanceTimersByTime(400)

    const raw = window.localStorage.getItem(BUILDER_PERSISTENCE_KEY) ?? ''
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw) as {payload: {teams: {name: string}[]}}
    expect(parsed.payload.teams[0].name).toBe('Autosaved Name')

    vi.useRealTimers()
  })

  it('autosave does not fire before debounce period', () => {
    vi.useFakeTimers()
    resetStore()
    clearBuilderDraft(window.localStorage)

    useBuilderStore.getState().renameTeam(useBuilderStore.getState().teams[0].id, 'Too Early')

    vi.advanceTimersByTime(100)

    const raw = window.localStorage.getItem(BUILDER_PERSISTENCE_KEY)
    expect(raw).toBeNull()

    vi.advanceTimersByTime(300)
    const rawAfter = window.localStorage.getItem(BUILDER_PERSISTENCE_KEY)
    expect(rawAfter).toBeTruthy()

    vi.useRealTimers()
  })
})
