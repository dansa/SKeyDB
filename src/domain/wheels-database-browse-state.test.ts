import {describe, expect, it} from 'vitest'

import {
  parseWheelsDatabaseBrowseState,
  patchWheelsDatabaseBrowseState,
  WHEELS_DATABASE_BROWSE_DEFAULTS,
} from './wheels-database-browse-state'

describe('wheels-database-browse-state', () => {
  it('parses known wheel browse params and falls back safely for invalid values', () => {
    const state = parseWheelsDatabaseBrowseState(
      new URLSearchParams(
        'q=merciful&realm=CARO&rarity=N&mainstat=KEYFLARE_REGEN&sort=RARITY&dir=DESC',
      ),
    )

    expect(state).toEqual({
      query: 'merciful',
      realmFilter: 'CARO',
      rarityFilter: 'N',
      mainstatFilter: 'KEYFLARE_REGEN',
      sortKey: 'RARITY',
      sortDirection: 'DESC',
    })

    expect(
      parseWheelsDatabaseBrowseState(
        new URLSearchParams('realm=missing&mainstat=nope&sort=ALPHABETICAL&dir=side'),
      ),
    ).toEqual({
      ...WHEELS_DATABASE_BROWSE_DEFAULTS,
      sortKey: 'ALPHABETICAL',
      sortDirection: 'ASC',
    })
    expect(WHEELS_DATABASE_BROWSE_DEFAULTS.sortKey).toBe('RARITY')
    expect(WHEELS_DATABASE_BROWSE_DEFAULTS.sortDirection).toBe('DESC')
  })

  it('normalizes padded or whitespace-only query params on read', () => {
    expect(parseWheelsDatabaseBrowseState(new URLSearchParams('q=%20merciful%20')).query).toBe(
      'merciful',
    )
    expect(parseWheelsDatabaseBrowseState(new URLSearchParams('q=%20%20%20')).query).toBe('')
  })

  it('patches wheel browse params while preserving unrelated query values', () => {
    const nextParams = patchWheelsDatabaseBrowseState(new URLSearchParams('foo=bar&q= merciful '), {
      realmFilter: 'CARO',
      rarityFilter: 'SSR',
      mainstatFilter: 'KEYFLARE_REGEN',
      sortKey: 'RARITY',
    })

    expect(nextParams.toString()).toBe(
      'foo=bar&q=merciful&realm=CARO&rarity=SSR&mainstat=KEYFLARE_REGEN',
    )
  })

  it('uses per-sort defaults when patching params', () => {
    const nextParams = patchWheelsDatabaseBrowseState(new URLSearchParams('foo=bar'), {
      sortKey: 'ALPHABETICAL',
    })

    expect(nextParams.toString()).toBe('foo=bar&sort=ALPHABETICAL')
  })

  it('elides wheel browse defaults when patching params', () => {
    const nextParams = patchWheelsDatabaseBrowseState(
      new URLSearchParams(
        'q=merciful&realm=CARO&rarity=SSR&mainstat=KEYFLARE_REGEN&sort=RARITY&dir=DESC',
      ),
      WHEELS_DATABASE_BROWSE_DEFAULTS,
    )

    expect(nextParams.toString()).toBe('')
  })
})
