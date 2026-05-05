import {describe, expect, it} from 'vitest'

import {getCovenants, type Covenant} from './covenants'
import {searchCovenants} from './covenants-search'

function makeCovenant(overrides: Pick<Covenant, 'id' | 'name'>): Covenant {
  return {
    assetId: `covenant-icon-${overrides.id}`,
    lineupToken: overrides.id,
    ...overrides,
  }
}

describe('searchCovenants', () => {
  it('sorts same-priority direct matches by display name', () => {
    const covenants = [
      makeCovenant({id: '002', name: 'Beta Echo'}),
      makeCovenant({id: '001', name: 'Alpha Echo'}),
    ]

    expect(searchCovenants(covenants, 'echo').map((covenant) => covenant.name)).toEqual([
      'Alpha Echo',
      'Beta Echo',
    ])
  })

  it('does not expose raw asset ids as user-facing search hits', () => {
    expect(searchCovenants(getCovenants(), 'covenant-icon-001')).toEqual([])
  })

  it('matches generated covenant search supplemental values', () => {
    const covenants = [makeCovenant({id: 'covenant-0001', name: 'Machine Oath'})]

    expect(searchCovenants(covenants, '6').map((covenant) => covenant.name)).toEqual([
      'Machine Oath',
    ])
  })
})
