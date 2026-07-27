import {describe, expect, it} from 'vitest'

import {
  COVENANT_DATABASE_BROWSE_DEFAULTS,
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
  POSSE_DATABASE_BROWSE_DEFAULTS,
  POSSE_DATABASE_REALM_FILTER_IDS,
  POSSE_DATABASE_TYPE_FILTER_IDS,
} from './simple-artifact-database-browse-state'

describe('simple-artifact-database-browse-state', () => {
  it('parses posse browse params and falls back safely for invalid values', () => {
    const state = parsePosseDatabaseBrowseState(
      new URLSearchParams('q=sigil&realm=CHAOS&type=PRIMORDIAL_MEMORY'),
    )

    expect(state).toEqual({
      query: 'sigil',
      realmFilter: 'CHAOS',
      typeFilter: 'PRIMORDIAL_MEMORY',
    })
    expect(parsePosseDatabaseBrowseState(new URLSearchParams('realm=missing'))).toEqual(
      POSSE_DATABASE_BROWSE_DEFAULTS,
    )
  })

  it('patches posse params in canonical entity-scoped form', () => {
    const nextParams = patchPosseDatabaseBrowseState(
      new URLSearchParams('foo=bar&q=%20sigil%20&mainstat=KEYFLARE_REGEN'),
      {realmFilter: 'CHAOS'},
    )

    expect(nextParams.toString()).toBe('q=sigil&realm=CHAOS')
  })

  it('parses covenant search and patches it in canonical entity-scoped form', () => {
    const state = parseCovenantDatabaseBrowseState(new URLSearchParams('q=%20oath%20'))
    const nextParams = patchCovenantDatabaseBrowseState(
      new URLSearchParams('foo=bar&q=%20oath%20&realm=CHAOS'),
      {},
    )

    expect(state).toEqual({query: 'oath'})
    expect(nextParams.toString()).toBe('q=oath')
    expect(parseCovenantDatabaseBrowseState(new URLSearchParams())).toEqual(
      COVENANT_DATABASE_BROWSE_DEFAULTS,
    )
  })

  it('orders posse realm filters with Faded Legacy after Ultra and before Other', () => {
    expect(POSSE_DATABASE_REALM_FILTER_IDS).toEqual([
      'ALL',
      'AEQUOR',
      'CARO',
      'CHAOS',
      'ULTRA',
      'FADED_LEGACY',
      'OTHER',
    ])
  })

  it('defaults posse type filtering to all and orders its controls consistently', () => {
    expect(POSSE_DATABASE_BROWSE_DEFAULTS.typeFilter).toBe('ALL')
    expect(POSSE_DATABASE_TYPE_FILTER_IDS).toEqual(['ALL', 'NORMAL', 'PRIMORDIAL_MEMORY'])
  })
})
