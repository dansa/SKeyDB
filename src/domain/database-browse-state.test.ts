import {describe, expect, it} from 'vitest'

import {
  DATABASE_BROWSE_DEFAULTS,
  parseDatabaseBrowseState,
  patchDatabaseBrowseState,
} from './database-browse-state'

describe('database-browse-state', () => {
  it('parses known browse params and falls back safely for invalid values', () => {
    const state = parseDatabaseBrowseState(
      new URLSearchParams(
        'q=beta&realm=AEQUOR&rarity=SR&type=WARDEN&availability=LIMITED&faction=Lemurian&scaling=KeyflareRegen,DamageAmplification&sort=RELEASE_DATE&dir=DESC&group=1',
      ),
    )

    expect(state).toEqual({
      query: 'beta',
      realmFilter: 'AEQUOR',
      rarityFilter: 'SR',
      typeFilter: 'WARDEN',
      availabilityFilter: 'LIMITED',
      gameplayFactionFilters: ['Lemurian'],
      scalingSubstatFilters: ['KeyflareRegen', 'DamageAmplification'],
      sortKey: 'RELEASE_DATE',
      sortDirection: 'DESC',
      groupByRealm: true,
    })

    expect(parseDatabaseBrowseState(new URLSearchParams('realm=missing&dir=sideways'))).toEqual(
      DATABASE_BROWSE_DEFAULTS,
    )
  })

  it('normalizes padded or whitespace-only query params on read', () => {
    expect(parseDatabaseBrowseState(new URLSearchParams('q=%20alpha%20')).query).toBe('alpha')
    expect(parseDatabaseBrowseState(new URLSearchParams('q=%20%20%20')).query).toBe('')
  })

  it('patches browse params while preserving unrelated query values', () => {
    const nextParams = patchDatabaseBrowseState(new URLSearchParams('foo=bar&q=alpha'), {
      realmFilter: 'CHAOS',
      availabilityFilter: 'LIMITED_ASTRAL_REIGN',
      gameplayFactionFilters: ['Lemurian'],
      scalingSubstatFilters: ['KeyflareRegen', 'DamageAmplification'],
      sortKey: 'ATK',
      sortDirection: 'DESC',
    })

    expect(nextParams.toString()).toBe(
      'foo=bar&q=alpha&realm=CHAOS&availability=LIMITED_ASTRAL_REIGN&faction=Lemurian&scaling=KeyflareRegen%2CDamageAmplification&sort=ATK&dir=DESC',
    )
  })

  it('writes the query param back in canonical trimmed form', () => {
    const nextParams = patchDatabaseBrowseState(new URLSearchParams('q=%20alpha%20'), {})

    expect(nextParams.toString()).toBe('q=alpha')
  })

  it('elides default values when patching browse params', () => {
    const nextParams = patchDatabaseBrowseState(
      new URLSearchParams('q=alpha&realm=CHAOS&sort=ATK&dir=DESC&group=1'),
      DATABASE_BROWSE_DEFAULTS,
    )

    expect(nextParams.toString()).toBe('')
  })
})
