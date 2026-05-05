import {describe, expect, it} from 'vitest'

import {
  buildDatabaseEntityDetailPath,
  formatAwakenerNameForUi,
  getRealmLabel,
  getWheelMainstatLabel,
} from './display'

describe('entity display facade', () => {
  it('centralizes display-only labels and generated route helpers', () => {
    expect(formatAwakenerNameForUi('ramona: timeworn')).toBe('Ramona: Timeworn')
    expect(getRealmLabel('CHAOS')).toBe('Chaos')
    expect(buildDatabaseEntityDetailPath('wheels', 'deus-ex-machina')).toBe(
      '/database/wheels/deus-ex-machina',
    )
    expect(getWheelMainstatLabel({mainstatKey: 'KEYFLARE_REGEN'})).toBe('Keyflare Regen')
  })
})
