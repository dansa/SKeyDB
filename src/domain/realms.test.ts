import {describe, expect, it} from 'vitest'

import {
  DEFAULT_REALM_ACCENT,
  getRealmAccent,
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
    expect(getRealmLabel('XREALM')).toBe('XREALM')
  })

  it('returns icons for known realms and undefined for unknown ids', () => {
    expect(getRealmIcon('AEQUOR')).toEqual(expect.any(String))
    expect(getRealmIcon('CHAOS')).toEqual(expect.any(String))
    expect(getRealmIcon('unknown')).toBeUndefined()
    expect(getRealmIcon(undefined)).toBeUndefined()
  })
})
