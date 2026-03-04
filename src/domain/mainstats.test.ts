import { describe, expect, it } from 'vitest'
import { getMainstatIcon, getMainstats, getWheelFilterMainstats, normalizeMainstatLabel } from './mainstats'

describe('mainstats', () => {
  it('exposes all supported mainstats with stable metadata', () => {
    const mainstats = getMainstats()
    expect(mainstats).toHaveLength(11)
    expect(mainstats.map((entry) => entry.key)).toEqual([
      'CRIT_RATE',
      'CRIT_DMG',
      'REALM_MASTERY',
      'DMG_AMP',
      'ALIEMUS_REGEN',
      'KEYFLARE_REGEN',
      'SIGIL_YIELD',
      'DEATH_RESISTANCE',
      'ATK',
      'DEF',
      'CON',
    ])
    expect(mainstats.every((entry) => /^\d{3}$/.test(entry.iconId))).toBe(true)
  })

  it('resolves canonical labels from aliases', () => {
    expect(normalizeMainstatLabel('crit damage')).toBe('Crit DMG')
    expect(normalizeMainstatLabel('damage amplification')).toBe('DMG Amp')
    expect(normalizeMainstatLabel('silver key recharge')).toBeNull()
  })

  it('exposes wheel-filter subset separately', () => {
    const wheelMainstats = getWheelFilterMainstats()
    expect(wheelMainstats).toHaveLength(8)
    expect(wheelMainstats.every((entry) => entry.wheelFilter)).toBe(true)
  })

  it('returns icon asset for known mainstat keys', () => {
    expect(typeof getMainstatIcon('ATK')).toBe('string')
    expect(typeof getMainstatIcon('DEF')).toBe('string')
    expect(typeof getMainstatIcon('CON')).toBe('string')
    expect(typeof getMainstatIcon('CRIT_RATE')).toBe('string')
  })

  it('returns undefined for unknown mainstat key', () => {
    expect(getMainstatIcon('NONEXISTENT' as never)).toBeUndefined()
  })
})
