import {describe, expect, it} from 'vitest'

import {
  DATABASE_AVAILABILITY_FILTER_IDS,
  formatAwakenerAvailabilityLabel,
  getAvailabilityFilterLabel,
} from './database-browse-state'
import {WHEEL_AVAILABILITY_LABELS} from './wheel-availability'
import {
  getWheelAvailabilityFilterLabel,
  WHEELS_DATABASE_AVAILABILITY_FILTER_IDS,
} from './wheels-database-browse-state'

describe('shared availability filters', () => {
  it('keeps all shared filters in the same order, with wheel-only sources appended', () => {
    expect(WHEELS_DATABASE_AVAILABILITY_FILTER_IDS).toEqual([
      ...DATABASE_AVAILABILITY_FILTER_IDS,
      'EVENT',
      'BATTLE_PASS',
    ])
    expect(DATABASE_AVAILABILITY_FILTER_IDS).toEqual([
      'ALL',
      'LIMITED',
      'PERMANENT',
      'WELFARE',
      'LIMITED_FADED_LEGACY',
      'LIMITED_ASTRAL_REIGN',
    ])
  })

  it('uses identical labels for shared filter values and detail metadata', () => {
    for (const id of DATABASE_AVAILABILITY_FILTER_IDS) {
      expect(getWheelAvailabilityFilterLabel(id)).toBe(getAvailabilityFilterLabel(id))
    }
    expect(getAvailabilityFilterLabel('WELFARE')).toBe('Shop / Welfare')
    expect(formatAwakenerAvailabilityLabel('WELFARE')).toBe(WHEEL_AVAILABILITY_LABELS.WELFARE)
  })
})
