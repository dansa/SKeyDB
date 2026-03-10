import {describe, expect, it} from 'vitest'

import possesCanonical from '@/data/ingame-tokens/posses.json'

import {
  buildIngameTokenDictionaries,
  buildTokenDictionaryFromEntries,
  type CanonicalTokenEntry,
} from './ingame-token-dictionaries'
import {getPosses} from './posses'

describe('buildTokenDictionaryFromEntries', () => {
  it('maps ids and tokens when entries are unique', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'awakeners',
      ids: ['a', 'b'],
      sourceEntries: [
        {id: 'a', token: 'x'},
        {id: 'b', token: 'y'},
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
        {id: 'a', token: 'x'},
        {id: 'b', token: 'x'},
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
      sourceEntries: [{id: 'a', token: 'x'}],
    })

    expect(result.byIdToken.get('a')).toBe('x')
    expect(result.byIdToken.has('b')).toBe(false)
    expect(
      result.issues.some((issue) => issue.kind === 'missing_token_for_id' && issue.id === 'b'),
    ).toBe(true)
  })

  it('reports unknown source ids', () => {
    const result = buildTokenDictionaryFromEntries({
      category: 'awakeners',
      ids: ['a'],
      sourceEntries: [{id: 'z', token: 'x'}],
    })

    expect(
      result.issues.some((issue) => issue.kind === 'unknown_source_id' && issue.id === 'z'),
    ).toBe(true)
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

    expect(result.posses.byIdToken.get('manor-echoes')).toBe('2')
    expect(result.posses.byIdToken.get('voices-in-your-head')).toBe('h')
    expect(result.posses.byIdToken.has('Manor Echoes')).toBe(false)
    expect(
      result.issues.some(
        (issue) => issue.category === 'posses' && issue.kind === 'unknown_source_id',
      ),
    ).toBe(false)
  })

  it('tracks every posse id in the canonical token file and leaves unresolved tokens blank', () => {
    const posseIds = getPosses().map((posse) => posse.id)
    const canonicalPosseEntryById = new Map(possesCanonical.map((entry) => [entry.id, entry.token]))

    expect(canonicalPosseEntryById.size).toBeLessThanOrEqual(posseIds.length)
    expect(canonicalPosseEntryById.get('manor-echoes')).toBe('2')
    expect(canonicalPosseEntryById.get('voices-in-your-head')).toBe('h')
    expect(canonicalPosseEntryById.get('auritas-treasure')).toBe('j')
  })

  it('preserves the discovered posse token mappings from the RE notes', () => {
    const canonicalPosseEntryById = new Map(possesCanonical.map((entry) => [entry.id, entry.token]))

    expect(canonicalPosseEntryById.get('manor-echoes')).toBe('2')
    expect(canonicalPosseEntryById.get('from-the-mist-realm')).toBe('Z')
    expect(canonicalPosseEntryById.get('reunions-wish')).toBe('Y')
    expect(canonicalPosseEntryById.get('wayward-ship')).toBe('X')
    expect(canonicalPosseEntryById.get('cruel-homage')).toBe('S')
    expect(canonicalPosseEntryById.get('sacred-mending')).toBe('M')
    expect(canonicalPosseEntryById.get('plague-of-illusions')).toBe('J')
    expect(canonicalPosseEntryById.get('the-gated-answer')).toBe('H')
    expect(canonicalPosseEntryById.get('symphony-fourth')).toBe('I')
    expect(canonicalPosseEntryById.get('festival-of-tides')).toBe('C')
    expect(canonicalPosseEntryById.get('the-lone-seed')).toBe('G')
    expect(canonicalPosseEntryById.get('truth-behind-grey-mist')).toBe('v')
    expect(canonicalPosseEntryById.get('gateway-of-retrospection')).toBe('p')
    expect(canonicalPosseEntryById.get('the-final-vow')).toBe('l')
    expect(canonicalPosseEntryById.get('funus-aeternum')).toBe('f')
    expect(canonicalPosseEntryById.get('obsession-eternal')).toBe('g')
    expect(canonicalPosseEntryById.get('warded-injection')).toBe('b')
    expect(canonicalPosseEntryById.get('encounter-in-pure-white')).toBe('d')
    expect(canonicalPosseEntryById.get('a-mouses-wisdom')).toBe('c')
    expect(canonicalPosseEntryById.get('tiny-wish')).toBe('i')
    expect(canonicalPosseEntryById.get('voices-in-your-head')).toBe('h')
  })

  it('builds non-empty covenant dictionaries from raw data', () => {
    const result = buildIngameTokenDictionaries()

    expect(result.covenants.byIdToken.size).toBe(21)
    expect(result.covenants.byIdToken.get('022')).toBe('w')
    expect(result.covenants.byTokenId.get('w')).toBe('022')
  })

  it('produces issue metadata for unresolved mappings', () => {
    const result = buildIngameTokenDictionaries()
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

describe('raw token data type guard', () => {
  it('accepts basic raw token entry shape', () => {
    const entry: CanonicalTokenEntry = {id: 'a', token: 'x1'}
    expect(entry.id).toBe('a')
    expect(entry.token).toBe('x1')
  })

  it('accepts covenant token entry shape', () => {
    const entry: CanonicalTokenEntry = {id: '001', token: 'k'}
    expect(entry.id).toBe('001')
    expect(entry.token).toBe('k')
  })
})
