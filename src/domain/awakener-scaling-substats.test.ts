import {describe, expect, it} from 'vitest'

import {
  inferAwakenerScalingSubstatRole,
  matchesAwakenerScalingSubstatRoleFilter,
} from './awakener-scaling-substats'

describe('awakener-scaling-substats', () => {
  it('infers main and sub roles from stat-specific high and low scaling values', () => {
    expect(inferAwakenerScalingSubstatRole({DamageAmplification: 1.6}, 'DamageAmplification')).toBe(
      'MAIN',
    )
    expect(inferAwakenerScalingSubstatRole({DamageAmplification: 0.8}, 'DamageAmplification')).toBe(
      'SUB',
    )
    expect(inferAwakenerScalingSubstatRole({AliemusRegen: 0.8}, 'AliemusRegen')).toBe('MAIN')
    expect(inferAwakenerScalingSubstatRole({AliemusRegen: 0.4}, 'AliemusRegen')).toBe('SUB')
    expect(inferAwakenerScalingSubstatRole({AliemusRegen: 0}, 'AliemusRegen')).toBeNull()
  })

  it('keeps Any matching either main or sub positive scaling', () => {
    expect(
      matchesAwakenerScalingSubstatRoleFilter(
        {DamageAmplification: 0.8},
        'DamageAmplification',
        'ANY',
      ),
    ).toBe(true)
    expect(
      matchesAwakenerScalingSubstatRoleFilter(
        {DamageAmplification: 0},
        'DamageAmplification',
        'ANY',
      ),
    ).toBe(false)
  })
})
