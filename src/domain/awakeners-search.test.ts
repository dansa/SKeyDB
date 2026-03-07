import {describe, expect, it} from 'vitest'

import {getAwakeners} from './awakeners'
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
    const results = searchAwakeners(awakeners, 'Bleed')

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((a) => a.tags.includes('Bleed'))).toBe(true)
  })

  it('does not cross-match similar tags like STR Up and STR Down', () => {
    const awakeners = getAwakeners()
    const results = searchAwakeners(awakeners, 'STR Up')

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((a) => a.tags.includes('STR Up'))).toBe(true)
    expect(results.some((a) => a.tags.includes('STR Down') && !a.tags.includes('STR Up'))).toBe(
      false,
    )
  })
})
