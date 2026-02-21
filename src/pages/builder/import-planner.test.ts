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
})
