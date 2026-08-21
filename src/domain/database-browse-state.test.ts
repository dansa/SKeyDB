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
        'q=beta&realm=AEQUOR&rarity=SR&type=WARDEN&gender=Female&availability=LIMITED&faction=Lemurian&scaling=CritRate,KeyflareRegen:PRIMARY,DamageAmplification:SECONDARY&sort=RELEASE_DATE&dir=DESC&group=1',
      ),
    )

    expect(state).toEqual({
      query: 'beta',
      realmFilter: 'AEQUOR',
      rarityFilter: 'SR',
      typeFilter: 'WARDEN',
      genderFilter: 'Female',
      availabilityFilter: 'LIMITED',
      gameplayFactionFilters: ['Lemurian'],
      scalingSubstatFilters: [
        {key: 'CritRate', role: 'ANY'},
        {key: 'KeyflareRegen', role: 'PRIMARY'},
        {key: 'DamageAmplification', role: 'SECONDARY'},
      ],
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
      genderFilter: 'Male',
      availabilityFilter: 'LIMITED_ASTRAL_REIGN',
      gameplayFactionFilters: ['Lemurian'],
      scalingSubstatFilters: [
        {key: 'CritDamage', role: 'ANY'},
        {key: 'KeyflareRegen', role: 'PRIMARY'},
        {key: 'DamageAmplification', role: 'SECONDARY'},
      ],
      sortKey: 'ATK',
      sortDirection: 'DESC',
    })

    expect(nextParams.toString()).toBe(
      'foo=bar&q=alpha&realm=CHAOS&gender=Male&availability=LIMITED_ASTRAL_REIGN&faction=Lemurian&scaling=CritDamage%2CKeyflareRegen%3APRIMARY%2CDamageAmplification%3ASECONDARY&sort=ATK&dir=DESC',
    )
  })

  it('consumes only the shipped broad scaling URL shape and drops unshipped role params on write', () => {
    expect(
      parseDatabaseBrowseState(
        new URLSearchParams('scaling=KeyflareRegen,DamageAmplification&scalingRole=MAIN'),
      ),
    ).toMatchObject({
      scalingSubstatFilters: [
        {key: 'KeyflareRegen', role: 'ANY'},
        {key: 'DamageAmplification', role: 'ANY'},
      ],
    })

    const nextParams = patchDatabaseBrowseState(
      new URLSearchParams('scaling=CritRate&scalingRole=SUB&mainScaling=KeyflareRegen'),
      {},
    )

    expect(nextParams.toString()).toBe('scaling=CritRate')
  })

  it('writes the query param back in canonical trimmed form', () => {
    const nextParams = patchDatabaseBrowseState(new URLSearchParams('q=%20alpha%20'), {})

    expect(nextParams.toString()).toBe('q=alpha')
  })

  it('canonicalizes duplicate scaling filters on write', () => {
    const nextParams = patchDatabaseBrowseState(new URLSearchParams(), {
      scalingSubstatFilters: [
        {key: 'DamageAmplification', role: 'ANY'},
        {key: 'CritRate', role: 'SECONDARY'},
        {key: 'DamageAmplification', role: 'PRIMARY'},
      ],
    })

    expect(nextParams.toString()).toBe(
      'scaling=CritRate%3ASECONDARY%2CDamageAmplification%3APRIMARY',
    )
  })

  it('elides default values when patching browse params', () => {
    const nextParams = patchDatabaseBrowseState(
      new URLSearchParams('q=alpha&realm=CHAOS&sort=ATK&dir=DESC&group=1'),
      DATABASE_BROWSE_DEFAULTS,
    )

    expect(nextParams.toString()).toBe('')
  })
})
