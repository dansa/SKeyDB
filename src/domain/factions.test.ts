import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FACTION_TINT,
  getFactionIcon,
  getFactionLabel,
  getFactionTint,
  normalizeFactionId,
} from './factions'

describe('factions domain', () => {
  it('normalizes faction ids', () => {
    expect(normalizeFactionId(' aequor ')).toBe('AEQUOR')
    expect(normalizeFactionId('Chaos')).toBe('CHAOS')
  })

  it('returns canonical tints and fallback tint', () => {
    expect(getFactionTint('AEQUOR')).toBe('#6aabec')
    expect(getFactionTint('caro')).toBe('#e46161')
    expect(getFactionTint('unknown')).toBe(DEFAULT_FACTION_TINT)
    expect(getFactionTint(undefined)).toBe(DEFAULT_FACTION_TINT)
  })

  it('returns canonical labels with fallback to the given value', () => {
    expect(getFactionLabel('AEQUOR')).toBe('Aequor')
    expect(getFactionLabel('ultra')).toBe('Ultra')
    expect(getFactionLabel('XFACTION')).toBe('XFACTION')
  })

  it('returns icons for known factions and undefined for unknown ids', () => {
    expect(getFactionIcon('AEQUOR')).toEqual(expect.any(String))
    expect(getFactionIcon('CHAOS')).toEqual(expect.any(String))
    expect(getFactionIcon('unknown')).toBeUndefined()
    expect(getFactionIcon(undefined)).toBeUndefined()
  })
})
