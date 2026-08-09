import {describe, expect, it} from 'vitest'

import {sanitizeDatabaseEntitySearch} from './database-entity-search'

describe('database-entity-search', () => {
  it('keeps only posse browse params for posse routes', () => {
    expect(
      sanitizeDatabaseEntitySearch(
        'posses',
        '?q=sigil&realm=CHAOS&mainstat=KEYFLARE_REGEN&type=WARDEN',
      ),
    ).toBe('?q=sigil&realm=CHAOS')
  })

  it('keeps only covenant browse params for covenant routes', () => {
    expect(
      sanitizeDatabaseEntitySearch('covenants', '?q=oath&realm=CHAOS&mainstat=KEYFLARE_REGEN'),
    ).toBe('?q=oath')
  })

  it('keeps only wheel browse params for wheel routes', () => {
    expect(
      sanitizeDatabaseEntitySearch('wheels', '?q=merciful&type=WARDEN&mainstat=KEYFLARE_REGEN'),
    ).toBe('?q=merciful&mainstat=KEYFLARE_REGEN')
  })

  it('keeps only awakener browse params for awakener routes', () => {
    expect(
      sanitizeDatabaseEntitySearch('awakeners', '?q=alpha&type=WARDEN&mainstat=KEYFLARE_REGEN'),
    ).toBe('?q=alpha&type=WARDEN')
  })

  it('keeps valid relic detail state only when requested', () => {
    const search = '?q=memory&variant=relic-variant-0004&mainstat=KEYFLARE_REGEN'

    expect(sanitizeDatabaseEntitySearch('relics', search)).toBe('?q=memory')
    expect(sanitizeDatabaseEntitySearch('relics', search, {includeDetailState: true})).toBe(
      '?q=memory&variant=relic-variant-0004',
    )
    expect(
      sanitizeDatabaseEntitySearch('relics', '?variant=relic-variant-4', {
        includeDetailState: true,
      }),
    ).toBe('')
  })
})
