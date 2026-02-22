import { describe, expect, it } from 'vitest'
import { matchesWheelMainstat, wheelMainstatFilterOptions } from './wheel-mainstats'

describe('wheel mainstat helpers', () => {
  it('contains all expected filter options', () => {
    expect(wheelMainstatFilterOptions.map((option) => option.id)).toEqual([
      'ALL',
      'CRIT_RATE',
      'CRIT_DMG',
      'REALM_MASTERY',
      'DMG_AMP',
      'ALIEMUS_REGEN',
      'KEYFLARE_REGEN',
      'SIGIL_YIELD',
      'DEATH_RESISTANCE',
    ])
  })

  it('matches canonical mainstat keys', () => {
    expect(matchesWheelMainstat('CRIT_RATE', 'CRIT_RATE')).toBe(true)
    expect(matchesWheelMainstat('CRIT_DMG', 'CRIT_DMG')).toBe(true)
    expect(matchesWheelMainstat('DMG_AMP', 'DMG_AMP')).toBe(true)
    expect(matchesWheelMainstat('REALM_MASTERY', 'REALM_MASTERY')).toBe(true)
  })

  it('returns false for empty or unrelated mainstat keys', () => {
    expect(matchesWheelMainstat('', 'CRIT_RATE')).toBe(false)
    expect(matchesWheelMainstat('KEYFLARE_REGEN', 'ALIEMUS_REGEN')).toBe(false)
  })

  it('always matches when filter is ALL', () => {
    expect(matchesWheelMainstat('', 'ALL')).toBe(true)
    expect(matchesWheelMainstat('anything', 'ALL')).toBe(true)
  })
})
