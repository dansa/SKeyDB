import {describe, expect, it} from 'vitest'

import type {Relic} from '@/domain/relics'

import {getRelicCardAccent, getRelicPrimaryCategory} from './relic-database-presentation'

const reorderedFamily: Relic = {
  aliases: [],
  assetId: '',
  categories: ['FADED_LEGACY', 'ASTRAL_REIGN'],
  defaultVariantCategory: 'ASTRAL_REIGN',
  defaultVariantId: 'relic-variant-0338',
  description: '',
  id: 'relic-0207',
  kind: 'GENERIC',
  name: 'Malignant Child',
  rarity: 'N',
  relicType: 'Relic',
  route: {canonicalPath: '/database/relics/malignant-child', slug: 'malignant-child'},
  variantCount: 5,
  variantCategoryTiers: [
    {category: 'ASTRAL_REIGN', tier: 'Silver'},
    {category: 'FADED_LEGACY', tier: 'Silver'},
  ],
  variantTiers: ['Silver'],
}

describe('getRelicPrimaryCategory', () => {
  it('uses the explicit default-variant category when family categories are reordered', () => {
    expect(getRelicPrimaryCategory(reorderedFamily)).toBe('ASTRAL_REIGN')
    expect(getRelicCardAccent(reorderedFamily, [])).toBe('#d8b25f')
  })
})
