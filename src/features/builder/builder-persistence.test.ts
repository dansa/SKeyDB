import {describe, expect, it} from 'vitest'

import {
  BUILDER_PERSISTENCE_KEY,
  clearBuilderDraft,
  LEGACY_BUILDER_PERSISTENCE_KEY,
  loadBuilderDraft,
  saveBuilderDraft,
} from './builder-persistence'
import type {Team} from './types'

type LegacyTeamSlot = Omit<Team['slots'][number], 'awakenerId'> & {awakenerName?: string}
type LegacyTeam = Omit<Team, 'slots'> & {slots: LegacyTeamSlot[]}

function createStorage(entries?: readonly (readonly [string, string])[]) {
  const storage = new Map<string, string>(entries)
  return {
    backing: storage,
    api: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  }
}

function createTeamFixture(): Team {
  return {
    id: 'team-alpha',
    name: 'Team Alpha',
    posseId: 'posse-0001',
    slots: [
      {
        slotId: 'slot-1',
        awakenerId: 'awakener-0021',
        realm: 'AEQUOR',
        level: 60,
        wheels: ['wheel-0001', 'wheel-0014'],
      },
      {slotId: 'slot-2', wheels: [null, null]},
      {slotId: 'slot-3', wheels: [null, null]},
      {slotId: 'slot-4', wheels: [null, null]},
    ],
  }
}

describe('builder-persistence', () => {
  it('saves and loads draft payload with versioned envelope', () => {
    const storage = createStorage()
    const teams = [createTeamFixture()]

    saveBuilderDraft(storage.api, {teams, activeTeamId: 'team-alpha'})

    const raw = storage.backing.get(BUILDER_PERSISTENCE_KEY)
    expect(raw).toBeTruthy()
    expect(raw).toContain('"version":2')

    const loaded = loadBuilderDraft(storage.api)
    expect(loaded).toEqual({teams, activeTeamId: 'team-alpha'})
    expect(loaded?.teams[0]?.slots[0]?.awakenerId).toBe('awakener-0021')
    expect('awakenerName' in (loaded?.teams[0]?.slots[0] ?? {})).toBe(false)
  })

  it('serializes builder drafts with canonical V2 public ids', () => {
    const storage = createStorage()

    saveBuilderDraft(storage.api, {teams: [createTeamFixture()], activeTeamId: 'team-alpha'})

    const raw = storage.backing.get(BUILDER_PERSISTENCE_KEY)
    expect(raw).toBeTruthy()
    const persisted = JSON.parse(raw ?? '{}') as {
      payload: {teams: {posseId?: string; slots: {awakenerId?: string; wheels: unknown[]}[]}[]}
    }
    expect(persisted.payload.teams[0]?.posseId).toBe('posse-0001')
    expect(persisted.payload.teams[0]?.slots[0]).toMatchObject({
      awakenerId: 'awakener-0021',
      wheels: ['wheel-0001', 'wheel-0014'],
    })
    expect(JSON.stringify(persisted.payload)).not.toContain('"goliath"')
    expect(JSON.stringify(persisted.payload)).not.toContain('"B01"')
  })

  it('fails closed instead of saving unmapped runtime ids into a V2 envelope', () => {
    const storage = createStorage()
    const team = createTeamFixture()
    team.slots[0] = {
      ...team.slots[0],
      wheels: ['UNKNOWN-WHEEL', null],
    }

    expect(saveBuilderDraft(storage.api, {teams: [team], activeTeamId: 'team-alpha'})).toBe(false)
    expect(storage.backing.has(BUILDER_PERSISTENCE_KEY)).toBe(false)
  })

  it('returns null for malformed or unsupported payloads', () => {
    const storage = createStorage([
      [BUILDER_PERSISTENCE_KEY, '{"version":999,"payload":{"teams":[],"activeTeamId":""}}'],
    ])

    const loaded = loadBuilderDraft(storage.api)
    expect(loaded).toBeNull()
  })

  it('rejects malformed slot payloads during load', () => {
    const storage = createStorage([
      [
        BUILDER_PERSISTENCE_KEY,
        JSON.stringify({
          version: 2,
          payload: {
            activeTeamId: 'team-alpha',
            teams: [
              {
                id: 'team-alpha',
                name: 'Team Alpha',
                slots: [
                  {slotId: 'slot-1', wheels: ['SR19', null]},
                  {slotId: 'slot-2', wheels: [null, null]},
                  {slotId: 'slot-3', wheels: [null, null]},
                  {slotId: 'slot-4', wheels: [null, null]},
                ],
              },
            ],
          },
        }),
      ],
    ])

    const loaded = loadBuilderDraft(storage.api)
    expect(loaded).toBeNull()
  })

  it('round-trips support slot state in builder draft storage', () => {
    const storage = createStorage()
    const teams = [
      {
        ...createTeamFixture(),
        slots: [
          {
            slotId: 'slot-1',
            awakenerId: 'awakener-0021',
            realm: 'AEQUOR',
            level: 90,
            isSupport: true,
            wheels: ['wheel-0001', 'wheel-0014'] as [string, string],
          },
          {slotId: 'slot-2', wheels: [null, null] as [null, null]},
          {slotId: 'slot-3', wheels: [null, null] as [null, null]},
          {slotId: 'slot-4', wheels: [null, null] as [null, null]},
        ],
      },
    ]

    saveBuilderDraft(storage.api, {teams, activeTeamId: 'team-alpha'})

    const loaded = loadBuilderDraft(storage.api)

    expect(loaded?.teams[0]?.slots[0]?.isSupport).toBe(true)
  })

  it('falls back to V1 draft storage and immediately migrates to V2', () => {
    const legacyEnvelope = {
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      payload: {teams: [createTeamFixture()], activeTeamId: 'team-alpha'},
    }
    const storage = createStorage([
      [LEGACY_BUILDER_PERSISTENCE_KEY, JSON.stringify(legacyEnvelope)],
    ])

    const loaded = loadBuilderDraft(storage.api)

    expect(loaded).toEqual(legacyEnvelope.payload)
    expect(loaded?.teams[0]?.slots[0]?.awakenerId).toBe('awakener-0021')
    expect('awakenerName' in (loaded?.teams[0]?.slots[0] ?? {})).toBe(false)
    expect(storage.backing.has(LEGACY_BUILDER_PERSISTENCE_KEY)).toBe(true)
    expect(storage.backing.get(BUILDER_PERSISTENCE_KEY)).toContain('"version":2')
  })

  it('returns canonical runtime ids on the first legacy V1 draft load', () => {
    const legacyTeam: LegacyTeam = {
      id: 'team-alpha',
      name: 'Team Alpha',
      posseId: 'encounter-in-pure-white',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['B01', 'C01'],
          covenantId: '022',
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ],
    }
    const storage = createStorage([
      [
        LEGACY_BUILDER_PERSISTENCE_KEY,
        JSON.stringify({
          version: 1,
          updatedAt: '2026-01-01T00:00:00.000Z',
          payload: {teams: [legacyTeam], activeTeamId: 'team-alpha'},
        }),
      ],
    ])

    const loaded = loadBuilderDraft(storage.api)

    expect(loaded?.teams[0]?.posseId).toBe('posse-0001')
    expect(loaded?.teams[0]?.slots[0]).toMatchObject({
      awakenerId: 'awakener-0021',
      wheels: ['wheel-0001', 'wheel-0014'],
      covenantId: 'covenant-0020',
    })
    expect('awakenerName' in (loaded?.teams[0]?.slots[0] ?? {})).toBe(false)
  })

  it('prefers valid V2 storage over stale V1 storage', () => {
    const v2Team = createTeamFixture()
    const staleLegacyTeam = {...createTeamFixture(), id: 'team-legacy', name: 'Legacy Team'}
    const storage = createStorage([
      [
        LEGACY_BUILDER_PERSISTENCE_KEY,
        JSON.stringify({
          version: 1,
          updatedAt: '2026-01-01T00:00:00.000Z',
          payload: {teams: [staleLegacyTeam], activeTeamId: 'team-legacy'},
        }),
      ],
    ])
    saveBuilderDraft(storage.api, {teams: [v2Team], activeTeamId: 'team-alpha'})

    expect(loadBuilderDraft(storage.api)).toEqual({teams: [v2Team], activeTeamId: 'team-alpha'})
  })

  it('does not fall back to V1 when present V2 storage is invalid', () => {
    const storage = createStorage([
      [
        BUILDER_PERSISTENCE_KEY,
        JSON.stringify({version: 2, payload: {teams: [], activeTeamId: 'team-alpha'}}),
      ],
      [
        LEGACY_BUILDER_PERSISTENCE_KEY,
        JSON.stringify({
          version: 1,
          updatedAt: '2026-01-01T00:00:00.000Z',
          payload: {teams: [createTeamFixture()], activeTeamId: 'team-alpha'},
        }),
      ],
    ])

    expect(loadBuilderDraft(storage.api)).toBeNull()
  })

  it('rejects unknown canonical V2 wheel ids instead of dropping equipment', () => {
    const storage = createStorage([
      [
        BUILDER_PERSISTENCE_KEY,
        JSON.stringify({
          version: 2,
          updatedAt: '2026-01-01T00:00:00.000Z',
          payload: {
            activeTeamId: 'team-alpha',
            teams: [
              {
                id: 'team-alpha',
                name: 'Team Alpha',
                slots: [
                  {
                    slotId: 'slot-1',
                    awakenerId: 'awakener-0021',
                    realm: 'AEQUOR',
                    level: 60,
                    wheels: ['wheel-9999', null],
                  },
                  {slotId: 'slot-2', wheels: [null, null]},
                  {slotId: 'slot-3', wheels: [null, null]},
                  {slotId: 'slot-4', wheels: [null, null]},
                ],
              },
            ],
          },
        }),
      ],
    ])

    expect(loadBuilderDraft(storage.api)).toBeNull()
  })

  it('removes current and legacy draft keys on clear', () => {
    const storage = createStorage([
      [BUILDER_PERSISTENCE_KEY, 'current'],
      [LEGACY_BUILDER_PERSISTENCE_KEY, 'legacy'],
    ])

    clearBuilderDraft(storage.api)

    expect(storage.backing.has(BUILDER_PERSISTENCE_KEY)).toBe(false)
    expect(storage.backing.has(LEGACY_BUILDER_PERSISTENCE_KEY)).toBe(false)
  })
})
