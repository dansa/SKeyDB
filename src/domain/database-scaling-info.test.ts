import {describe, expect, it} from 'vitest'

import {buildScalingInfoEntry} from './database-scaling-info'

describe('buildScalingInfoEntry', () => {
  it('builds scaling copy from the same Lv.60-anchored helper used by the sidebar', () => {
    const entry = buildScalingInfoEntry({
      stats: {
        CON: '140',
        ATK: '135',
        DEF: '126',
        CritRate: '14.6%',
        CritDamage: '50%',
        AliemusRegen: '0',
        KeyflareRegen: '15',
        RealmMastery: '0',
        SigilYield: '0%',
        DamageAmplification: '0%',
        DeathResistance: '0%',
      },
      primaryScalingBase: 30,
      statScaling: {
        CON: 1.55,
        ATK: 1.5,
        DEF: 1.4,
      },
      substatScaling: {
        CritRate: '1.6%',
      },
    })

    expect(entry.description).toContain('Psyche Surge adds extra secondary-stat steps after E3.')
    expect(entry.detailLinks?.[0]?.label).toBe('Show exact breakpoints')
    expect(entry.detailLinks?.[0]?.entry.description).toContain(
      'CON: +1.6/Lv · Lv.1 49 · Lv.60 140 · Lv.90 186',
    )
    expect(entry.detailLinks?.[0]?.entry.description).toContain(
      'Crit Rate: +1.6%/10 Lv · Lv.60 14.6%',
    )
    expect(entry.detailLinks?.[0]?.entry.description).not.toContain('E3+0')
  })
})
