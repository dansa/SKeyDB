import {describe, expect, it} from 'vitest'

import {
  buildIngameTokenDictionaries,
  buildTokenDictionaryFromEntries,
  type LineupTokenEntry,
} from './ingame-token-dictionaries'

describe('buildTokenDictionaryFromEntries', () => {
  it('maps public ids and lineup tokens when entries are unique', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'awakeners',
      entries: [
        {id: 'awakener-0001', lineupToken: 'x'},
        {id: 'awakener-0002', lineupToken: 'y'},
      ],
    })

    expect(result.byIdToken.get('awakener-0001')).toBe('x')
    expect(result.byIdToken.get('awakener-0002')).toBe('y')
    expect(result.byTokenId.get('x')).toBe('awakener-0001')
    expect(result.byTokenId.get('y')).toBe('awakener-0002')
    expect(result.issues).toEqual([])
  })

  it('reports duplicate tokens and keeps ambiguous reverse mapping candidates', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'wheels',
      entries: [
        {id: 'wheel-0001', lineupToken: 'x'},
        {id: 'wheel-0002', lineupToken: 'x'},
      ],
    })

    expect(result.byTokenId.has('x')).toBe(false)
    expect(result.byTokenIds.get('x')).toEqual(['wheel-0001', 'wheel-0002'])
    expect(result.byIdToken.get('wheel-0001')).toBe('x')
    expect(result.byIdToken.get('wheel-0002')).toBe('x')
    expect(result.issues).toEqual([{category: 'wheels', kind: 'duplicate_token', token: 'x'}])
  })
})

describe('buildIngameTokenDictionaries', () => {
  it('builds non-empty dictionaries from public V3 lineupToken fields', () => {
    const result = buildIngameTokenDictionaries()

    expect(result.awakeners.byIdToken.size).toBeGreaterThan(40)
    expect(result.wheels.byIdToken.size).toBeGreaterThan(100)
    expect(result.covenants.byIdToken.size).toBe(21)
    expect(result.posses.byIdToken.size).toBe(52)
    expect(result.issues).toEqual([])
  })

  it('uses current public V3 ids and tokens for known lineup examples', () => {
    const result = buildIngameTokenDictionaries()

    expect(result.awakeners.byIdToken.get('awakener-0056')).toBe('4')
    expect(result.awakeners.byIdToken.get('awakener-0058')).toBe('xr')
    expect(result.wheels.byIdToken.get('wheel-0128')).toBe('yi')
    expect(result.wheels.byIdToken.get('wheel-0170')).toBe('y0')
    expect(result.covenants.byIdToken.get('covenant-0020')).toBe('w')
    expect(result.posses.byIdToken.get('posse-0002')).toBe('h')
    expect(result.posses.byIdToken.get('posse-0052')).toBe('6')

    expect(result.awakeners.byTokenId.get('4')).toBe('awakener-0056')
    expect(result.awakeners.byTokenId.get('xr')).toBe('awakener-0058')
    expect(result.wheels.byTokenId.get('yi')).toBe('wheel-0128')
    expect(result.wheels.byTokenId.get('y0')).toBe('wheel-0170')
    expect(result.covenants.byTokenId.get('w')).toBe('covenant-0020')
    expect(result.posses.byTokenId.get('h')).toBe('posse-0002')
    expect(result.posses.byTokenId.get('6')).toBe('posse-0052')
  })
})

describe('lineup token entry type guard', () => {
  it('accepts the public id plus lineupToken shape', () => {
    const entry: LineupTokenEntry = {id: 'awakener-0001', lineupToken: 'x1'}

    expect(entry.id).toBe('awakener-0001')
    expect(entry.lineupToken).toBe('x1')
  })
})
