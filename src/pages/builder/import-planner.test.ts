import { describe, expect, it } from 'vitest'
import type { Team } from './types'
import { applySingleImportStrategy, prepareImport } from './import-planner'

function makeTeam(name: string, overrides?: Partial<Team>): Team {
  return {
    id: `${name}-id`,
    name,
    slots: [
      { slotId: 'slot-1', wheels: [null, null] },
      { slotId: 'slot-2', wheels: [null, null] },
      { slotId: 'slot-3', wheels: [null, null] },
      { slotId: 'slot-4', wheels: [null, null] },
    ],
    ...overrides,
  }
}

describe('import planner', () => {
  it('requires strategy for single-team imports with duplicate awakeners', () => {
    const current = [
      makeTeam('Team 1', {
        slots: [
          { slotId: 'slot-1', awakenerName: 'ramona', faction: 'CHAOS', wheels: [null, null] },
          { slotId: 'slot-2', wheels: [null, null] },
          { slotId: 'slot-3', wheels: [null, null] },
          { slotId: 'slot-4', wheels: [null, null] },
        ],
      }),
    ]
    const incoming = makeTeam('Imported', {
      slots: [
        { slotId: 'slot-1', awakenerName: 'ramona: timeworn', faction: 'CHAOS', wheels: [null, null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    })

    const result = prepareImport({ kind: 'single', team: incoming }, current)
    expect(result.status).toBe('requires_strategy')
  })

  it('applies move strategy by removing duplicates from existing teams', () => {
    const current = [
      makeTeam('Team 1', {
        posseId: 'taverns-opening',
        slots: [
          { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: ['SR19', null] },
          { slotId: 'slot-2', wheels: [null, null] },
          { slotId: 'slot-3', wheels: [null, null] },
          { slotId: 'slot-4', wheels: [null, null] },
        ],
      }),
    ]
    const imported = makeTeam('Imported', {
      posseId: 'taverns-opening',
      slots: [
        { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: ['SR19', null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    })

    const result = applySingleImportStrategy(current, imported, 'move')
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.teams[0].slots[0].awakenerName).toBeUndefined()
    expect(result.teams[0].posseId).toBeUndefined()
    expect(result.teams.at(-1)?.slots[0].awakenerName).toBe('goliath')
  })

  it('applies skip strategy by dropping conflicting entries from imported team', () => {
    const current = [
      makeTeam('Team 1', {
        posseId: 'taverns-opening',
        slots: [
          { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: ['SR19', null] },
          { slotId: 'slot-2', wheels: [null, null] },
          { slotId: 'slot-3', wheels: [null, null] },
          { slotId: 'slot-4', wheels: [null, null] },
        ],
      }),
    ]
    const imported = makeTeam('Imported', {
      posseId: 'taverns-opening',
      slots: [
        { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: ['SR19', null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    })

    const result = applySingleImportStrategy(current, imported, 'skip')
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    const importedTeam = result.teams.at(-1)!
    expect(importedTeam.posseId).toBeUndefined()
    expect(importedTeam.slots[0].awakenerName).toBeUndefined()
    expect(importedTeam.slots[0].wheels).toEqual([null, null])
  })

  it('renames imported default team names to next Team X number', () => {
    const current = [makeTeam('Team 1'), makeTeam('Team 2')]
    const incoming = makeTeam('Team 1')

    const result = prepareImport({ kind: 'single', team: incoming }, current)
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.teams.at(-1)?.name).toBe('Team 3')
  })

  it('treats both wheel slots as globally unique for import conflicts', () => {
    const current = [
      makeTeam('Team 1', {
        slots: [
          { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: ['SR19', 'SR20'] },
          { slotId: 'slot-2', wheels: [null, null] },
          { slotId: 'slot-3', wheels: [null, null] },
          { slotId: 'slot-4', wheels: [null, null] },
        ],
      }),
    ]
    const incoming = makeTeam('Imported', {
      slots: [
        { slotId: 'slot-1', awakenerName: 'ramona', faction: 'CHAOS', wheels: ['C01', 'SR20'] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    })

    const result = prepareImport({ kind: 'single', team: incoming }, current)
    expect(result.status).toBe('requires_strategy')
  })

  it('keeps explicit multi-team names (for example Wave labels) on full import', () => {
    const incomingTeams = [
      makeTeam('Wave 1'),
      makeTeam('Wave 1 Extra'),
      makeTeam('Wave 2'),
      makeTeam('Wave 2 Extra'),
      makeTeam('Wave 3'),
    ]

    const result = prepareImport({ kind: 'multi', teams: incomingTeams, activeTeamIndex: 0 }, [makeTeam('Team 1')])
    expect(result.status).toBe('requires_replace')
    if (result.status !== 'requires_replace') return
    expect(result.teams.map((team) => team.name)).toEqual([
      'Wave 1',
      'Wave 1 Extra',
      'Wave 2',
      'Wave 2 Extra',
      'Wave 3',
    ])
  })

  it('requires duplicate override when imported payload is duplicate-illegal under strict rules', () => {
    const incomingTeams = [
      makeTeam('Wave 1', {
        slots: [
          { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: [null, null] },
          { slotId: 'slot-2', wheels: [null, null] },
          { slotId: 'slot-3', wheels: [null, null] },
          { slotId: 'slot-4', wheels: [null, null] },
        ],
      }),
      makeTeam('Wave 2', {
        slots: [
          { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: [null, null] },
          { slotId: 'slot-2', wheels: [null, null] },
          { slotId: 'slot-3', wheels: [null, null] },
          { slotId: 'slot-4', wheels: [null, null] },
        ],
      }),
    ]

    const result = prepareImport({ kind: 'multi', teams: incomingTeams, activeTeamIndex: 0 }, [makeTeam('Team 1')])
    expect(result.status).toBe('requires_duplicate_override')
  })

  it('allows duplicate imports directly when duplicate enforcement is disabled', () => {
    const current = [
      makeTeam('Team 1', {
        slots: [
          { slotId: 'slot-1', awakenerName: 'ramona', faction: 'CHAOS', wheels: [null, null] },
          { slotId: 'slot-2', wheels: [null, null] },
          { slotId: 'slot-3', wheels: [null, null] },
          { slotId: 'slot-4', wheels: [null, null] },
        ],
      }),
    ]
    const incoming = makeTeam('Imported', {
      slots: [
        { slotId: 'slot-1', awakenerName: 'ramona: timeworn', faction: 'CHAOS', wheels: [null, null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    })

    const result = prepareImport({ kind: 'single', team: incoming }, current, { allowDupes: true })
    expect(result.status).toBe('ready')
  })

  it('requires duplicate override after skip strategy if the existing builder state is already duplicate-illegal', () => {
    const current = [
      makeTeam('Team 1', { posseId: 'manor-echoes' }),
      makeTeam('Team 2', { posseId: 'manor-echoes' }),
    ]
    const imported = makeTeam('Imported', {
      posseId: 'manor-echoes',
      slots: [
        { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', wheels: [null, null] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    })

    const result = applySingleImportStrategy(current, imported, 'skip')
    expect(result.status).toBe('requires_duplicate_override')
  })
})
