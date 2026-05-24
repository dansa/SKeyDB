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
      'Primary formula: Lv + 30, then × growth',
    )
    expect(entry.detailLinks?.[0]?.entry.description).toContain(
      'CON: +1.55/Lv · Lv.1 49 · Lv.60 140 · Lv.90 186',
    )
    expect(entry.detailLinks?.[0]?.entry.description).toContain(
      'Crit Rate: +1.6%/10 Lv · Lv.60 14.6%',
    )
    expect(entry.detailLinks?.[0]?.entry.description).not.toContain('E3+0')
  })

  it('includes default-maxed Gnostic stat levels in primary breakpoints', () => {
    const entry = buildScalingInfoEntry({
      stats: {
        CON: '25',
        ATK: '25',
        DEF: '24',
        CritRate: '5%',
        CritDamage: '50%',
        AliemusRegen: '0',
        KeyflareRegen: '15',
        RealmMastery: '2',
        SigilYield: '1.2%',
        DamageAmplification: '0%',
        DeathResistance: '0%',
      },
      primaryScalingBase: 20,
      statScaling: {
        CON: 1.15,
        ATK: 1.15,
        DEF: 1.1,
      },
      substatScaling: {},
      talents: {
        T4: {
          id: 'talent.saya.gnostic-potential',
          ownerAwakenerId: 57,
          displayName: 'Gnostic Potential',
          family: 'gnostic_potential',
          maxLevel: 5,
          defaultMaxed: true,
          descriptionTemplate: 'This Awakener gains [Arg1] Levels of Base Attributes.',
          descriptionArgs: {
            Arg1: {
              kind: 'linear',
              base: '2',
              gainPerLevel: '2',
            },
          },
        },
        extraTalents: [],
      },
    })

    expect(entry.description).toContain('including default Gnostic +10 stat levels')
    expect(entry.detailLinks?.[0]?.entry.description).toContain(
      'Primary formula: Lv + 20 + default Gnostic +10, then × growth',
    )
    expect(entry.detailLinks?.[0]?.entry.description).toContain(
      'ATK: +1.15/Lv · Lv.1 36 · Lv.60 104 · Lv.90 138',
    )
  })

  it('uses the selected Gnostic level for adjustable Gnostic talents', () => {
    const record = {
      stats: {
        CON: '25',
        ATK: '25',
        DEF: '24',
        CritRate: '5%',
        CritDamage: '50%',
        AliemusRegen: '0',
        KeyflareRegen: '15',
        RealmMastery: '2',
        SigilYield: '1.2%',
        DamageAmplification: '0%',
        DeathResistance: '0%',
      },
      primaryScalingBase: 20 as const,
      statScaling: {
        CON: 1.15,
        ATK: 1.15,
        DEF: 1.1,
      },
      substatScaling: {},
      talents: {
        T4: {
          id: 'talent.test.gnostic-potential',
          ownerAwakenerId: 57,
          displayName: 'Gnostic Potential',
          family: 'gnostic_potential',
          maxLevel: 5,
          descriptionTemplate: 'This Awakener gains [Arg1] Levels of Base Attributes.',
          descriptionArgs: {
            Arg1: {
              kind: 'linear',
              base: '2',
              gainPerLevel: '2',
            },
          },
        },
        extraTalents: [],
      },
    }

    const levelThree = buildScalingInfoEntry(record, {gnosticPotentialLevel: 3})

    expect(levelThree.description).toContain('including Gnostic +6 stat levels')
    expect(levelThree.detailLinks?.[0]?.entry.description).toContain(
      'Primary formula: Lv + 20 + Gnostic +6, then × growth',
    )
    expect(levelThree.detailLinks?.[0]?.entry.description).toContain(
      'ATK: +1.15/Lv · Lv.1 32 · Lv.60 99 · Lv.90 134',
    )
  })
})
