import {describe, expect, it} from 'vitest'

import {
  DEFAULT_REALM_ACCENT,
  getAwakenerRealmBadge,
  getRealmAccent,
  getRealmBadge,
  getRealmIcon,
  getRealmLabel,
  normalizeRealmId,
} from './realms'

describe('realms domain', () => {
  it('normalizes realm ids', () => {
    expect(normalizeRealmId(' aequor ')).toBe('AEQUOR')
    expect(normalizeRealmId('Chaos')).toBe('CHAOS')
  })

  it('returns canonical accents and fallback accent', () => {
    expect(getRealmAccent('AEQUOR')).toBe('#6aabec')
    expect(getRealmAccent('caro')).toBe('#e46161')
    expect(getRealmAccent('unknown')).toBe(DEFAULT_REALM_ACCENT)
    expect(getRealmAccent(undefined)).toBe(DEFAULT_REALM_ACCENT)
  })

  it('returns canonical labels with fallback to the given value', () => {
    expect(getRealmLabel('AEQUOR')).toBe('Aequor')
    expect(getRealmLabel('ultra')).toBe('Ultra')
    expect(getRealmLabel('FADED_LEGACY')).toBe('Faded Legacy')
    expect(getRealmLabel('OTHER')).toBe('Other')
    expect(getRealmLabel('XREALM')).toBe('XREALM')
  })

  it('returns icons for known realms and undefined for unknown ids', () => {
    expect(getRealmIcon('AEQUOR')).toEqual(expect.any(String))
    expect(getRealmIcon('CHAOS')).toEqual(expect.any(String))
    expect(getRealmIcon('unknown')).toBeUndefined()
    expect(getRealmIcon(undefined)).toBeUndefined()
  })

  it('returns badge assets for known realms and undefined for unknown ids', () => {
    expect(getRealmBadge('AEQUOR')).toEqual(expect.any(String))
    expect(getRealmBadge('caro')).toEqual(expect.any(String))
    expect(getRealmBadge('unknown')).toBeUndefined()
    expect(getRealmBadge(undefined)).toBeUndefined()
  })

  it.each([
    ['aequor', 'Benthos: Aequor'],
    ['caro', 'Propagation: Caro'],
    ['chaos', 'Primordia: Chaos'],
    ['ultra', 'Singularity: Ultra'],
  ])('keeps the standard and Divine database badges distinct for %s', (realm, label) => {
    const regular = getAwakenerRealmBadge({realm, tags: []})
    const divine = getAwakenerRealmBadge({realm, tags: ['Divine Realm']})
    expect(regular).toEqual({
      src: expect.stringContaining(`${realm}-regular`),
      label: getRealmLabel(realm),
    })
    expect(divine).toEqual({src: expect.stringContaining(`${realm}-divine`), label})
    expect(getRealmBadge(realm)).not.toBe(regular?.src)
  })
})
