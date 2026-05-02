import {describe, expect, it} from 'vitest'

import {getAwakeners, type Awakener} from './awakeners'
import {searchAwakeners} from './awakeners-search'

describe('searchAwakeners', () => {
  it('matches normalized aliases like ghelot/g helot/g-helot', () => {
    const awakeners = getAwakeners()
    const a = searchAwakeners(awakeners, 'ghelot').map((x) => x.name)
    const b = searchAwakeners(awakeners, 'g helot').map((x) => x.name)
    const c = searchAwakeners(awakeners, 'g-helot').map((x) => x.name)

    expect(a[0]).toBe('helot: catena')
    expect(b[0]).toBe('helot: catena')
    expect(c[0]).toBe('helot: catena')
  })

  it('falls back to fuzzy search for typo queries', () => {
    const awakeners = getAwakeners()
    const names = searchAwakeners(awakeners, 'murhpy fauxbrn').map((x) => x.name)

    expect(names[0]).toBe('murphy: fauxborn')
  })

  it('filters out weak fuzzy matches for simple typos', () => {
    const awakeners = getAwakeners()
    const names = searchAwakeners(awakeners, 'agripa').map((x) => x.name)

    expect(names).toContain('agrippa')
    expect(names).not.toContain('aurita')
  })

  it('matches awakeners by tag via exact search', () => {
    const awakeners = getAwakeners()
    const results = searchAwakeners(awakeners, 'Draw')

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((a) => a.tags.includes('Draw'))).toBe(true)
  })

  it('does not cross-match distinct public tags', () => {
    const awakeners = getAwakeners()
    const results = searchAwakeners(awakeners, 'Divine Realm')

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((a) => a.tags.includes('Divine Realm'))).toBe(true)
    expect(results.some((a) => a.tags.includes('Dispel') && !a.tags.includes('Divine Realm'))).toBe(
      false,
    )
  })

  it('prioritizes name prefixes for single-letter queries', () => {
    const awakeners = getAwakeners()
    const names = searchAwakeners(awakeners, 'C')
      .slice(0, 6)
      .map((x) => x.name)

    expect(names).toEqual(['caecus', 'casiah', 'castor', 'celeste', 'clementine', 'corposant'])
  })

  it('clusters multi-letter name prefixes ahead of broader matches', () => {
    const awakeners = getAwakeners()
    const names = searchAwakeners(awakeners, 'Ca')
      .slice(0, 3)
      .map((x) => x.name)

    expect(names).toEqual(['caecus', 'casiah', 'castor'])
  })

  it('keeps one-character queries focused on names instead of broad tag matches', () => {
    const awakeners: Awakener[] = [
      {
        id: 'awakener-0001',
        numericId: 1,
        name: 'caecus',
        aliases: ['caecus'],
        realm: 'CHAOS',
        faction: 'Test',
        tags: [],
        lineupToken: 'a',
      },
      {
        id: 'awakener-0002',
        numericId: 2,
        name: 'agrippa',
        aliases: ['agrippa'],
        realm: 'AEQUOR',
        faction: 'Test',
        tags: ['Counter'],
        lineupToken: 'b',
      },
    ]

    expect(searchAwakeners(awakeners, 'c').map((x) => x.name)).toEqual(['caecus'])
  })

  it('can fuzzy-match normalized aliases with punctuation removed', () => {
    const awakeners = getAwakeners()
    const names = searchAwakeners(awakeners, 'ghelotcatena').map((x) => x.name)

    expect(names[0]).toBe('helot: catena')
  })

  it('does not let single-token fuzzy drift into unrelated initials', () => {
    const awakeners = getAwakeners()
    const names = searchAwakeners(awakeners, 'hamln').map((x) => x.name)

    expect(names).toContain('hameln')
    expect(names).not.toContain('ramona')
    expect(names).not.toContain('ramona: timeworn')
  })
})
