import {describe, expect, it} from 'vitest'

import type {PublicRelicRecord, Relic} from '@/domain/relics'

import {resolveRelicDetailRoutePolicy} from './relic-detail-route-policy'

const relic: Relic = {
  aliases: [],
  assetId: 'Icon_Creation_Test',
  categories: ['ASTRAL_REIGN', 'FADED_LEGACY'],
  defaultVariantCategory: 'ASTRAL_REIGN',
  defaultVariantId: 'relic-variant-0001',
  description: 'Test family',
  id: 'relic-0001',
  kind: 'GENERIC',
  name: 'Test Family',
  rarity: 'SSR',
  relicType: 'Relic',
  route: {canonicalPath: '/database/relics/test-family', slug: 'test-family'},
  variantCategoryTiers: [
    {category: 'ASTRAL_REIGN', tier: 'Silver'},
    {category: 'ASTRAL_REIGN', tier: 'Gold'},
    {category: 'FADED_LEGACY', tier: 'Cursed'},
  ],
  variantCount: 3,
  variantTiers: ['Silver', 'Gold', 'Cursed'],
}

const record: PublicRelicRecord = {
  aliases: [],
  assets: {icon: 'asset-relic-icon'},
  categories: relic.categories,
  defaultVariantId: relic.defaultVariantId,
  descriptionArgs: {},
  descriptionTemplate: 'Test family',
  id: relic.id,
  kind: 'relic',
  name: relic.name,
  relicType: 'Relic',
  route: relic.route,
  schemaVersion: 3,
  variantCategoryTiers: relic.variantCategoryTiers,
  variantCount: 3,
  variantTiers: relic.variantTiers,
  variants: [
    {
      category: 'ASTRAL_REIGN',
      descriptionArgs: {},
      descriptionTemplate: 'Silver effect',
      id: 'relic-variant-0001',
      label: 'Astral Reign - Silver',
      name: 'Test Family',
      tier: 'Silver',
      variantType: 'STANDARD',
    },
    {
      category: 'ASTRAL_REIGN',
      descriptionArgs: {},
      descriptionTemplate: 'Gold effect',
      id: 'relic-variant-0002',
      label: 'Astral Reign - Gold',
      name: 'Test Family',
      tier: 'Gold',
      variantType: 'STANDARD',
    },
    {
      category: 'FADED_LEGACY',
      descriptionArgs: {},
      descriptionTemplate: 'Cursed effect',
      id: 'relic-variant-0003',
      label: 'Faded Legacy - Cursed',
      name: 'Test Family',
      tier: 'Cursed',
      variantType: 'STANDARD',
    },
  ],
}

const location = {
  hash: '#effect',
  pathname: '/database/relics/test-family',
  search: '',
}

describe('resolveRelicDetailRoutePolicy', () => {
  it('keeps a valid exact variant deep link unchanged', () => {
    const resolution = resolveRelicDetailRoutePolicy({
      location: {...location, search: '?variant=relic-variant-0002'},
      record,
      routeItem: {kind: 'relic', item: relic, variantId: 'relic-variant-0002'},
    })

    expect(resolution.renderItem.variantId).toBe('relic-variant-0002')
    expect(resolution.replaceTarget).toBeNull()
  })

  it('selects and canonicalizes a filter-preferred variant', () => {
    const resolution = resolveRelicDetailRoutePolicy({
      location: {...location, search: '?category=FADED_LEGACY&tier=CURSED'},
      record,
      routeItem: {kind: 'relic', item: relic},
    })

    expect(resolution.renderItem.variantId).toBe('relic-variant-0003')
    expect(resolution.replaceTarget).toEqual({
      ...location,
      search: '?category=FADED_LEGACY&tier=CURSED&variant=relic-variant-0003',
    })
  })

  it.each([
    ['?tier=GOLD', 'relic-variant-0002'],
    ['?category=FADED_LEGACY', 'relic-variant-0003'],
  ])('honors an individual browse filter in %s', (search, expectedVariantId) => {
    const resolution = resolveRelicDetailRoutePolicy({
      location: {...location, search},
      record,
      routeItem: {kind: 'relic', item: relic},
    })

    expect(resolution.renderItem.variantId).toBe(expectedVariantId)
    expect(resolution.replaceTarget?.search).toContain(`variant=${expectedVariantId}`)
  })

  it('falls back to the family default for a stale or foreign variant', () => {
    const resolution = resolveRelicDetailRoutePolicy({
      location: {...location, search: '?tier=GOLD&variant=relic-variant-9999'},
      record,
      routeItem: {kind: 'relic', item: relic, variantId: 'relic-variant-9999'},
    })

    expect(resolution.renderItem.variantId).toBe(record.defaultVariantId)
    expect(resolution.replaceTarget?.search).toBe('?tier=GOLD&variant=relic-variant-0001')
  })

  it('canonicalizes a missing variant to the family default without active filters', () => {
    const resolution = resolveRelicDetailRoutePolicy({
      location,
      record,
      routeItem: {kind: 'relic', item: relic},
    })

    expect(resolution.renderItem.variantId).toBe(record.defaultVariantId)
    expect(resolution.replaceTarget?.search).toBe('?variant=relic-variant-0001')
  })
})
