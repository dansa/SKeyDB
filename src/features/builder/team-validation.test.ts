import {describe, expect, it} from 'vitest'

import {validateBuilderTeamsStrict} from './team-validation'
import type {Team} from './types'

function makeTeam(name: string, awakenerId: string): Team {
  return {
    id: `${name}-id`,
    name,
    slots: [
      {slotId: `${name}-slot-1`, awakenerId, realm: 'CHAOS', wheels: [null, null]},
      {slotId: `${name}-slot-2`, wheels: [null, null]},
      {slotId: `${name}-slot-3`, wheels: [null, null]},
      {slotId: `${name}-slot-4`, wheels: [null, null]},
    ],
  }
}

describe('team validation', () => {
  it('treats same-identity public IDs as duplicate awakeners', () => {
    const result = validateBuilderTeamsStrict([
      makeTeam('Ramona', 'awakener-0042'),
      makeTeam('Ramona Timeworn', 'awakener-0020'),
    ])

    expect(result.isValid).toBe(false)
    expect(result.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({code: 'DUPLICATE_AWAKENER'})]),
    )
  })
})
