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
