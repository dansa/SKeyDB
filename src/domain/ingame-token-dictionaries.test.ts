import { describe, expect, it } from 'vitest'
import {
  buildIngameTokenDictionaries,
  buildTokenDictionaryFromEntries,
  type CanonicalTokenEntry,
} from './ingame-token-dictionaries'

describe('buildTokenDictionaryFromEntries', () => {
  it('maps ids and tokens when entries are unique', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'awakeners',
      ids: ['a', 'b'],
      sourceEntries: [
        { id: 'a', token: 'x' },
        { id: 'b', token: 'y' },
      ],
    })

    expect(result.byIdToken.get('a')).toBe('x')
    expect(result.byIdToken.get('b')).toBe('y')
    expect(result.byTokenId.get('x')).toBe('a')
    expect(result.byTokenId.get('y')).toBe('b')
    expect(result.issues).toEqual([])
  })

  it('reports duplicate tokens and excludes ambiguous mappings', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'wheels',
      ids: ['a', 'b'],
      sourceEntries: [
        { id: 'a', token: 'x' },
        { id: 'b', token: 'x' },
      ],
    })

    expect(result.byTokenId.has('x')).toBe(false)
    expect(result.byIdToken.get('a')).toBe('x')
    expect(result.byIdToken.get('b')).toBe('x')
    expect(result.issues.some((issue) => issue.kind === 'duplicate_token')).toBe(true)
  })

  it('reports missing ids from the canonical catalog', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'posses',
      ids: ['a', 'b'],
      sourceEntries: [{ id: 'a', token: 'x' }],
    })

    expect(result.byIdToken.get('a')).toBe('x')
    expect(result.byIdToken.has('b')).toBe(false)
    expect(result.issues.some((issue) => issue.kind === 'missing_token_for_id' && issue.id === 'b')).toBe(true)
  })

  it('reports unknown source ids', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'awakeners',
      ids: ['a'],
      sourceEntries: [{ id: 'z', token: 'x' }],
    })

    expect(result.issues.some((issue) => issue.kind === 'unknown_source_id' && issue.id === 'z')).toBe(true)
  })
})

describe('buildIngameTokenDictionaries', () => {
  it('builds non-empty awakeners and wheels dictionaries from raw data', () => {
    const result = buildIngameTokenDictionaries()
    expect(result.awakeners.byIdToken.size).toBeGreaterThan(40)
    expect(result.wheels.byIdToken.size).toBeGreaterThan(100)
  })

  it('uses canonical posse ids rather than display names in the tracked token file', () => {
    const result = buildIngameTokenDictionaries()

    expect(result.posses.byIdToken.get('manor-echoes')).toBe('3')
    expect(result.posses.byIdToken.has('Manor Echoes')).toBe(false)
    expect(
      result.issues.some((issue) => issue.category === 'posses' && issue.kind === 'unknown_source_id'),
    ).toBe(false)
  })

  it('produces issue metadata for unresolved mappings', () => {
    const result = buildIngameTokenDictionaries()
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

describe('raw token data type guard', () => {
  it('accepts basic raw token entry shape', () => {
    const entry: CanonicalTokenEntry = { id: 'a', token: 'x1' }
    expect(entry.id).toBe('a')
    expect(entry.token).toBe('x1')
  })
})
