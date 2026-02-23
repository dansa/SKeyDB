import { describe, expect, it } from 'vitest'
import type { Team } from './types'
import { BUILDER_PERSISTENCE_KEY, loadBuilderDraft, saveBuilderDraft } from './builder-persistence'

function createTeamFixture(): Team {
  return {
    id: 'team-alpha',
    name: 'Team Alpha',
    posseId: '01-encounter-in-pure-white',
    slots: [
      { slotId: 'slot-1', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: ['B01', 'C01'] },
      { slotId: 'slot-2', wheels: [null, null] },
      { slotId: 'slot-3', wheels: [null, null] },
      { slotId: 'slot-4', wheels: [null, null] },
    ],
  }
}

describe('builder-persistence', () => {
  it('saves and loads draft payload with versioned envelope', () => {
    const storage = new Map<string, string>()
    const teams = [createTeamFixture()]

    saveBuilderDraft(
      {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
      { teams, activeTeamId: 'team-alpha' },
    )

    const raw = storage.get(BUILDER_PERSISTENCE_KEY)
    expect(raw).toBeTruthy()
    expect(raw).toContain('"version":1')

    const loaded = loadBuilderDraft({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    })
    expect(loaded).toEqual({ teams, activeTeamId: 'team-alpha' })
  })

  it('returns null for malformed or unsupported payloads', () => {
    const storage = new Map<string, string>([
      [BUILDER_PERSISTENCE_KEY, '{"version":999,"payload":{"teams":[],"activeTeamId":""}}'],
    ])

    const loaded = loadBuilderDraft({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    })
    expect(loaded).toBeNull()
  })

  it('rejects malformed slot payloads during load', () => {
    const storage = new Map<string, string>([
      [
        BUILDER_PERSISTENCE_KEY,
        JSON.stringify({
          version: 1,
          payload: {
            activeTeamId: 'team-alpha',
            teams: [
              {
                id: 'team-alpha',
                name: 'Team Alpha',
                slots: [
                  { slotId: 'slot-1', wheels: ['SR19', null] },
                  { slotId: 'slot-2', wheels: [null, null] },
                  { slotId: 'slot-3', wheels: [null, null] },
                  { slotId: 'slot-4', wheels: [null, null] },
                ],
              },
            ],
          },
        }),
      ],
    ])

    const loaded = loadBuilderDraft({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    })
    expect(loaded).toBeNull()
  })
})
