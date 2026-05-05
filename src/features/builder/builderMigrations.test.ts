import {afterEach, describe, expect, it, vi} from 'vitest'

import type {Team} from '@/features/builder/types'

import {
  deserializeBuilderDraft,
  isBuilderDraftPayload,
  isPersistedBuilderPayload,
  normalizeBuilderDraft,
  serializeBuilderDraft,
  type PersistedBuilderPayload,
} from './builderMigrations'

afterEach(() => {
  vi.doUnmock('@/data-access/public-data/collectionRepository')
  vi.doUnmock('@/domain/persistence-id-migration')
  vi.resetModules()
})

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

describe('builderMigrations', () => {
  it('round-trips current public-id drafts through persisted payloads', () => {
    const draft = {teams: [createTeamFixture()], activeTeamId: 'team-alpha'}

    const persisted = serializeBuilderDraft(draft)

    expect(persisted).toEqual({
      activeTeamId: 'team-alpha',
      teams: [
        {
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
        },
      ],
    })
    expect(persisted && deserializeBuilderDraft(persisted)).toEqual(draft)
  })

  it('normalizes legacy V1 name-based drafts to awakenerId', () => {
    const legacyTeam = createTeamFixture()
    legacyTeam.posseId = 'encounter-in-pure-white'
    legacyTeam.slots[0] = {
      slotId: 'slot-1',
      awakenerName: 'goliath',
      faction: 'AEQUOR',
      level: 60,
      wheels: ['B01', 'C01'],
      covenantId: '022',
    } as Team['slots'][number]

    const normalized = normalizeBuilderDraft({teams: [legacyTeam], activeTeamId: 'team-alpha'})

    expect(normalized?.teams[0]?.posseId).toBe('encounter-in-pure-white')
    expect(normalized?.teams[0]?.slots[0]).toMatchObject({
      slotId: 'slot-1',
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      wheels: ['B01', 'C01'],
      covenantId: '022',
    })
    expect('awakenerName' in (normalized?.teams[0]?.slots[0] ?? {})).toBe(false)
  })

  it('fails closed for malformed or unknown persisted ids', () => {
    const malformed: PersistedBuilderPayload = {
      activeTeamId: 'team-alpha',
      teams: [
        {
          id: 'team-alpha',
          name: 'Team Alpha',
          slots: [
            {
              slotId: 'slot-1',
              awakenerId: 'awakener-9999',
              realm: 'AEQUOR',
              wheels: [null, null],
            },
            {slotId: 'slot-2', wheels: [null, null]},
            {slotId: 'slot-3', wheels: [null, null]},
            {slotId: 'slot-4', wheels: [null, null]},
          ],
        },
      ],
    }

    expect(isPersistedBuilderPayload(malformed)).toBe(true)
    expect(deserializeBuilderDraft(malformed)).toBeNull()

    const draft = createTeamFixture()
    draft.slots[0] = {...draft.slots[0], wheels: ['UNKNOWN-WHEEL', null]}
    expect(serializeBuilderDraft({teams: [draft], activeTeamId: 'team-alpha'})).toBeNull()

    const unknownAwakenerDraft = createTeamFixture()
    unknownAwakenerDraft.slots[0] = {
      ...unknownAwakenerDraft.slots[0],
      awakenerId: 'awakener-9999',
    }
    expect(
      serializeBuilderDraft({teams: [unknownAwakenerDraft], activeTeamId: 'team-alpha'}),
    ).toBeNull()
  })

  it('fails closed when serializing a no-awakener slot with non-empty data', () => {
    const team = createTeamFixture()
    team.slots[1] = {
      slotId: 'slot-2',
      realm: 'AEQUOR',
      level: 60,
      isSupport: true,
      wheels: ['wheel-0001', null],
      covenantId: 'covenant-0020',
    }

    expect(serializeBuilderDraft({teams: [team], activeTeamId: 'team-alpha'})).toBeNull()
  })

  it('fails closed when serializing an unknown legacy awakenerName with non-empty data', () => {
    const team = createTeamFixture()
    team.slots[1] = {
      slotId: 'slot-2',
      awakenerName: 'unknown legacy awakener',
      realm: 'AEQUOR',
      level: 60,
      isSupport: true,
      wheels: ['wheel-0001', null],
      covenantId: 'covenant-0020',
    } as Team['slots'][number]

    expect(serializeBuilderDraft({teams: [team], activeTeamId: 'team-alpha'})).toBeNull()
  })

  it('preserves support slot state', () => {
    const team = createTeamFixture()
    team.slots[0] = {...team.slots[0], isSupport: true}

    const persisted = serializeBuilderDraft({teams: [team], activeTeamId: 'team-alpha'})

    expect(persisted?.teams[0]?.slots[0]?.isSupport).toBe(true)
    expect(persisted && deserializeBuilderDraft(persisted)?.teams[0]?.slots[0]?.isSupport).toBe(
      true,
    )
  })

  it('deserializes current catalog awakener ids without requiring the legacy name map', async () => {
    vi.resetModules()
    vi.doMock('@/data-access/public-data/collectionRepository', () => ({
      getPublicBuilderCatalog: () => ({
        schemaVersion: 3,
        options: {
          awakeners: ['awakener-9000'],
          wheels: [],
          covenants: [],
          posses: [],
        },
        lineupTokens: {},
        groups: {},
      }),
    }))
    vi.doMock('@/domain/persistence-id-migration', () => ({
      AWAKENER_NAME_V1_TO_CURRENT: {},
      COVENANT_ID_V1_TO_CURRENT: {},
      POSSE_ID_V1_TO_CURRENT: {},
      WHEEL_ID_V1_TO_CURRENT: {},
      migrateAwakenerNameV1ToCurrent: () => undefined,
      migrateCovenantIdV1ToCurrent: () => undefined,
      migratePosseIdV1ToCurrent: () => undefined,
      migrateWheelIdV1ToCurrent: () => undefined,
    }))

    const {deserializeBuilderDraft: deserializeWithMockedCatalog} =
      await import('./builderMigrations')

    const deserialized = deserializeWithMockedCatalog({
      activeTeamId: 'team-alpha',
      teams: [
        {
          id: 'team-alpha',
          name: 'Team Alpha',
          slots: [
            {
              slotId: 'slot-1',
              awakenerId: 'awakener-9000',
              realm: 'AEQUOR',
              level: 60,
              wheels: [null, null],
            },
            {slotId: 'slot-2', wheels: [null, null]},
            {slotId: 'slot-3', wheels: [null, null]},
            {slotId: 'slot-4', wheels: [null, null]},
          ],
        },
      ],
    })

    expect(deserialized?.teams[0]?.slots[0]?.awakenerId).toBe('awakener-9000')
  })

  it('guards legacy draft payload shape before normalization', () => {
    expect(isBuilderDraftPayload({teams: [createTeamFixture()], activeTeamId: 'team-alpha'})).toBe(
      true,
    )
    expect(isBuilderDraftPayload({teams: [], activeTeamId: ''})).toBe(false)
  })
})
