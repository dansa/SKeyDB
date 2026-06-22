import {describe, expect, it} from 'vitest'

import type {DzoneResolvedMonster} from '@/domain/dzone'
import type {PublicRelicRecord} from '@/domain/relics'

import {buildDzoneMonsterPopoverEntry, buildDzoneRelicPopoverEntry} from './dzone-popover-entries'

describe('D-zone database popover entries', () => {
  it('places monster description before characteristic sections without badge chips', () => {
    const monster: DzoneResolvedMonster = {
      id: 'dzone-monster-9999',
      name: '"Test Beast"',
      assetName: 'Portrait_Test',
      badges: ['Elite'],
      characteristicIds: ['enemy-characteristic-0001'],
      descriptionTemplate: 'A test creature from the deep.',
      characteristics: [
        {
          id: 'enemy-characteristic-0001',
          name: 'Dominion',
          descriptionTemplate: 'Immensely powerful foes that spawn anomalies.',
        },
      ],
    }

    const entry = buildDzoneMonsterPopoverEntry({monster})

    expect(entry.label).toBe('')
    expect(entry.attributeRows).toBeUndefined()
    expect(entry.descriptionSections).toEqual([
      {label: 'Description', description: 'A test creature from the deep.', tone: 'lore'},
      {
        label: 'Dominion',
        description: 'Immensely powerful foes that spawn anomalies.',
      },
    ])
  })

  it('normalizes repeated HP bars into total HP while preserving per-bar detail', () => {
    const monster = {
      id: 'dzone-monster-9999',
      name: '"Test Beast"',
      assetName: 'Portrait_Test',
      characteristicIds: [],
      descriptionTemplate: 'A test creature from the deep.',
      characteristics: [],
      alertStats: {
        alertId: 'alert-4',
        alertName: 'Alert IV',
        level: 73,
        hp: 401964,
        hpBars: 3,
      },
    } satisfies DzoneResolvedMonster

    const entry = buildDzoneMonsterPopoverEntry({monster})

    expect(entry.label).toBe('Level 73 · HP 1.2M total · 3 bars')
    expect(entry.labelSegments).toEqual([
      {text: 'Level '},
      {text: '73', tone: 'value'},
      {text: ' · HP '},
      {text: '1.2M', tone: 'value'},
      {text: ' total'},
      {text: ' · '},
      {text: '3 bars'},
    ])
    expect(entry.attributeRows).toEqual([{label: 'HP bars', value: '402K × 3'}])
  })

  it('formats large selected HP compactly', () => {
    const monster = {
      id: 'dzone-monster-9999',
      name: '"Test Beast"',
      assetName: 'Portrait_Test',
      characteristicIds: [],
      descriptionTemplate: 'A test creature from the deep.',
      characteristics: [],
      alertStats: {
        alertId: 'alert-1',
        alertName: 'Alert I',
        level: 70,
        hp: 100000,
        hpBars: 1,
      },
    } satisfies DzoneResolvedMonster

    const entry = buildDzoneMonsterPopoverEntry({monster})

    expect(entry.label).toBe('Level 70 · HP 100K')
    expect(entry.label).not.toContain('bars')
    expect(entry.attributeRows).toBeUndefined()
  })

  it('adds variable HP bar values and rouse semantics as compact attribute rows', () => {
    const monster = {
      id: 'dzone-monster-9999',
      name: '"Test Beast"',
      assetName: 'Portrait_Test',
      characteristicIds: [],
      descriptionTemplate: 'A test creature from the deep.',
      characteristics: [],
      alertStats: {
        alertId: 'alert-4',
        alertName: 'Alert IV',
        level: 75,
        hp: 51307,
        hpBars: 3,
        hpBarValues: [51307, 102614, 27706],
        effectiveHp: 181627,
        hpBarSource: 'beforeDeathCommandHp',
        hpBarPhases: [
          {bar: 1, hp: 51307, maxHp: 51307, kind: 'base'},
          {
            bar: 2,
            hp: 102614,
            maxHp: 102614,
            kind: 'maxHpMultiplier',
            maxHpMultiplier: 2,
          },
          {
            bar: 3,
            hp: 27706,
            maxHp: 102614,
            kind: 'maxHpMultiplierPartialRevive',
            maxHpMultiplier: 2,
            healPercent: 0.27,
          },
        ],
      },
    } satisfies DzoneResolvedMonster

    const entry = buildDzoneMonsterPopoverEntry({monster})

    expect(entry.label).toBe('Level 75 · HP 181.6K total · 3 bars')
    expect(entry.attributeRows).toEqual([
      {label: 'HP bars', value: '51.3K › 102.6K › 27.7K'},
      {label: 'Rouse', value: 'Bar 2 max HP ×2; Bar 3 revives at 27%'},
    ])
  })

  it('omits relic metadata from the label and marks lore as flavor text', () => {
    const relic: PublicRelicRecord = {
      id: 'relic-9004',
      kind: 'relic',
      name: '"Aequor Ring"',
      assets: {},
      descriptionArgs: {},
      descriptionTemplate: 'Increase the Relic Capacity by +1.',
      rarity: 'SSR',
      relicType: 'D-Zone Initial Relic',
      lore: 'The sleepers in the abyssal ocean begin to stir.',
    }

    const entry = buildDzoneRelicPopoverEntry({record: relic})

    expect(entry.label).toBe('')
    expect(entry.attributeRows).toBeUndefined()
    expect(entry.descriptionSections?.at(-1)).toEqual({
      label: 'Lore',
      description: 'The sleepers in the abyssal ocean begin to stir.',
      tone: 'lore',
    })
  })
})
