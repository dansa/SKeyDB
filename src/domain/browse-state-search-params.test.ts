import {describe, expect, it} from 'vitest'

import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  patchSearchParams,
  setSearchParam,
} from './browse-state-search-params'

describe('browse-state-search-params', () => {
  it('parses enum params with a safe fallback', () => {
    expect(
      parseEnumSearchParam('ALPHABETICAL', ['ALPHABETICAL', 'RARITY'] as const, 'RARITY'),
    ).toBe('ALPHABETICAL')
    expect(parseEnumSearchParam('missing', ['ALPHABETICAL', 'RARITY'] as const, 'RARITY')).toBe(
      'RARITY',
    )
  })

  it('normalizes query text by trimming surrounding whitespace', () => {
    expect(normalizeBrowseQuery(' merciful ')).toBe('merciful')
    expect(normalizeBrowseQuery('   ')).toBe('')
  })

  it('preserves unrelated params while eliding empty values', () => {
    const nextParams = patchSearchParams(
      new URLSearchParams('foo=bar&q=alpha'),
      {query: '  beta  '},
      (searchParams) => ({query: normalizeBrowseQuery(searchParams.get('q'))}),
      (searchParams, nextState) => {
        setSearchParam(searchParams, 'q', normalizeBrowseQuery(nextState.query))
        setSearchParam(searchParams, 'realm', undefined)
      },
    )

    expect(nextParams.toString()).toBe('foo=bar&q=beta')
  })
})
