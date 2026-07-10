import {describe, expect, it} from 'vitest'

import {
  getDefaultRelicDatabaseSortDirection,
  getRelicDatabaseCategoryFilterLabel,
  parseRelicDatabaseBrowseState,
  patchRelicDatabaseBrowseState,
  RELIC_DATABASE_BROWSE_DEFAULTS,
  RELIC_DATABASE_CATEGORY_FILTER_IDS,
  RELIC_DATABASE_SORT_OPTIONS,
  RELIC_DATABASE_TIER_FILTER_IDS,
  resetRelicDatabaseBrowseFilters,
} from './relic-database-browse-state'

describe('relic-database-browse-state', () => {
  it('declares the settled filter and sort option order', () => {
    expect(RELIC_DATABASE_CATEGORY_FILTER_IDS).toEqual([
      'ALL',
      'ASTRAL_REIGN',
      'FADED_LEGACY',
      'DIMENSIONAL_IMAGE',
      'EVENT',
      'PENDULUM',
      'OTHER',
    ])
    expect(RELIC_DATABASE_SORT_OPTIONS).toEqual(['BEST_MATCH', 'ALPHABETICAL', 'VARIANT_COUNT'])
    expect(RELIC_DATABASE_TIER_FILTER_IDS).toEqual(['ALL', 'SILVER', 'GOLD', 'CURSED'])
  })

  it('parses known browse params and trims query text', () => {
    expect(
      parseRelicDatabaseBrowseState(
        new URLSearchParams(
          'q=%20omen%20ritual%20&category=FADED_LEGACY&tier=CURSED&rarity=SSR&sort=VARIANT_COUNT&dir=ASC',
        ),
      ),
    ).toEqual({
      query: 'omen ritual',
      categoryFilter: 'FADED_LEGACY',
      tierFilter: 'CURSED',
      sortKey: 'VARIANT_COUNT',
      sortDirection: 'ASC',
    })
  })

  it('falls back safely for invalid and whitespace-only values', () => {
    expect(
      parseRelicDatabaseBrowseState(
        new URLSearchParams('q=%20%20&category=PRIVATE&rarity=R&sort=OWNER&dir=SIDEWAYS'),
      ),
    ).toEqual(RELIC_DATABASE_BROWSE_DEFAULTS)
  })

  it('uses the settled direction default for each sort', () => {
    expect(getDefaultRelicDatabaseSortDirection('BEST_MATCH')).toBe('ASC')
    expect(getDefaultRelicDatabaseSortDirection('ALPHABETICAL')).toBe('ASC')
    expect(getDefaultRelicDatabaseSortDirection('VARIANT_COUNT')).toBe('DESC')

    expect(parseRelicDatabaseBrowseState(new URLSearchParams('sort=ALPHABETICAL'))).toMatchObject({
      sortKey: 'ALPHABETICAL',
      sortDirection: 'ASC',
    })
    expect(parseRelicDatabaseBrowseState(new URLSearchParams('sort=VARIANT_COUNT'))).toMatchObject({
      sortKey: 'VARIANT_COUNT',
      sortDirection: 'DESC',
    })
  })

  it('patches canonical browse params while preserving unrelated route state', () => {
    const nextParams = patchRelicDatabaseBrowseState(
      new URLSearchParams('foo=bar&variant=relic-variant-0408&q=%20child%20'),
      {
        categoryFilter: 'ASTRAL_REIGN',
        tierFilter: 'SILVER',
        sortKey: 'VARIANT_COUNT',
      },
    )

    expect(nextParams.toString()).toBe(
      'foo=bar&variant=relic-variant-0408&q=child&category=ASTRAL_REIGN&tier=SILVER&sort=VARIANT_COUNT',
    )
  })

  it('updates a sort key with its default direction unless direction is patched explicitly', () => {
    expect(
      patchRelicDatabaseBrowseState(new URLSearchParams('sort=ALPHABETICAL&dir=DESC'), {
        sortKey: 'VARIANT_COUNT',
      }).toString(),
    ).toBe('sort=VARIANT_COUNT')

    expect(
      patchRelicDatabaseBrowseState(new URLSearchParams(), {
        sortKey: 'VARIANT_COUNT',
        sortDirection: 'ASC',
      }).toString(),
    ).toBe('sort=VARIANT_COUNT&dir=ASC')
  })

  it('can omit sort params for a persisted display preference integration', () => {
    const nextParams = patchRelicDatabaseBrowseState(
      new URLSearchParams('variant=relic-variant-0408&sort=VARIANT_COUNT&dir=ASC'),
      {categoryFilter: 'PENDULUM'},
      {includeSortParams: false},
    )

    expect(nextParams.toString()).toBe('variant=relic-variant-0408&category=PENDULUM')
  })

  it('elides defaults without deleting unrelated params', () => {
    const nextParams = patchRelicDatabaseBrowseState(
      new URLSearchParams(
        'variant=relic-variant-0408&q=child&category=PENDULUM&tier=GOLD&rarity=N&sort=ALPHABETICAL&dir=DESC',
      ),
      RELIC_DATABASE_BROWSE_DEFAULTS,
    )

    expect(nextParams.toString()).toBe('variant=relic-variant-0408')
  })

  it('resets every filter atomically while retaining sort and route state', () => {
    const nextParams = resetRelicDatabaseBrowseFilters(
      new URLSearchParams(
        'variant=relic-variant-0408&q=child&category=PENDULUM&tier=CURSED&rarity=N&sort=VARIANT_COUNT&dir=ASC',
      ),
    )

    expect(nextParams.toString()).toBe('variant=relic-variant-0408&sort=VARIANT_COUNT&dir=ASC')
  })

  it('provides human-readable category labels for controls and active chips', () => {
    expect(RELIC_DATABASE_CATEGORY_FILTER_IDS.map(getRelicDatabaseCategoryFilterLabel)).toEqual([
      'All',
      'Astral Reign',
      'Faded Legacy',
      'Dimensional Image',
      'Events',
      'Pendulum',
      'Other',
    ])
  })
})
