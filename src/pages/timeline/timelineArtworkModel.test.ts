import {describe, expect, it} from 'vitest'

import type {BannerFeaturedUnit, BannerPoolSlot} from '@/domain/timeline'

import {
  expandFeatured,
  getFeaturedGridTemplate,
  getPoolGridTemplate,
  getPoolPreloadUrls,
  getVisualSlotSignature,
  resolvePoolSlots,
} from './timelineArtworkModel'

describe('timelineArtworkModel', () => {
  it('auto-expands a single awakener into its signature wheel slice', () => {
    const featured: BannerFeaturedUnit[] = [{name: 'Arachne', kind: 'awakener'}]

    expect(expandFeatured(featured)).toEqual([
      {name: 'Arachne', kind: 'awakener'},
      {name: 'Arachne', kind: 'wheel-auto', detailLink: undefined},
    ])
  })

  it('does not expand multi-featured or non-awakener featured units', () => {
    const featured: BannerFeaturedUnit[] = [
      {name: 'Arachne', kind: 'awakener'},
      {name: 'Eternal Weave', kind: 'wheel'},
    ]

    expect(expandFeatured(featured)).toBe(featured)
    expect(expandFeatured([{name: 'Eternal Weave', kind: 'wheel'}])).toEqual([
      {name: 'Eternal Weave', kind: 'wheel'},
    ])
  })

  it('resolves linked pool slots into matching awakener and wheel-auto visual slots', () => {
    const poolSlots: BannerPoolSlot[] = [
      {
        linked: true,
        pool: [{name: 'Arachne', kind: 'awakener'}],
      },
    ]

    const visualSlots = resolvePoolSlots(poolSlots)

    expect(visualSlots).toHaveLength(2)
    expect(visualSlots[0].cycleFrameIndex).toBe(0)
    expect(visualSlots[0].assets[0]).toMatchObject({
      label: 'Arachne',
      linkTo: '/database/awakeners/arachne',
      isWheel: false,
    })
    expect(visualSlots[1].cycleFrameIndex).toBe(0)
    expect(visualSlots[1].assets[0]).toMatchObject({
      label: 'Eternal Weave',
      linkTo: '/database/wheels/eternal-weave',
      isWheel: true,
    })
  })

  it('propagates detail opt-outs to linked wheel-auto visual slots', () => {
    const poolSlots: BannerPoolSlot[] = [
      {
        linked: true,
        pool: [{name: 'Arachne', kind: 'awakener', detailLink: false}],
      },
    ]

    const visualSlots = resolvePoolSlots(poolSlots)

    expect(visualSlots).toHaveLength(2)
    expect(visualSlots[0].assets[0]).toMatchObject({
      detailRef: undefined,
      label: 'Arachne',
      linkTo: undefined,
      isWheel: false,
    })
    expect(visualSlots[1].assets[0]).toMatchObject({
      detailRef: undefined,
      label: 'Eternal Weave',
      linkTo: undefined,
      isWheel: true,
    })
  })

  it('skips empty pool slots before artwork rendering', () => {
    const visualSlots = resolvePoolSlots([
      {pool: []},
      {
        pool: [{name: 'Arachne', kind: 'awakener'}],
      },
    ])

    expect(visualSlots).toHaveLength(1)
    expect(visualSlots[0].assets[0].label).toBe('Arachne')
  })

  it('deduplicates pool preload urls and skips placeholders', () => {
    const visualSlots = resolvePoolSlots([
      {
        pool: [
          {name: 'Arachne', kind: 'awakener'},
          {name: 'Arachne', kind: 'awakener'},
          {name: 'Pending Pool', kind: 'placeholder'},
        ],
      },
    ])

    const urls = getPoolPreloadUrls(visualSlots)

    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain('arachne')
  })

  it('builds stable grid templates for featured and pool artwork', () => {
    expect(getFeaturedGridTemplate([])).toBe('repeat(0, minmax(0, 1fr))')
    expect(getFeaturedGridTemplate(new Array(5).fill(null) as never[])).toBe(
      'repeat(4, minmax(0, 1fr))',
    )
    expect(getPoolGridTemplate(0)).toBe('repeat(1, minmax(0, 1fr))')
    expect(getPoolGridTemplate(3)).toBe('repeat(3, minmax(0, 1fr))')
  })

  it('builds visual slot signatures from rendered asset identity', () => {
    const [slot] = resolvePoolSlots([
      {
        pool: [{name: 'Arachne', kind: 'awakener'}],
      },
    ])

    expect(getVisualSlotSignature(slot)).toContain('Arachne')
    expect(getVisualSlotSignature(slot)).toContain('/database/awakeners/arachne')
    expect(getVisualSlotSignature(slot)).toContain('awakener:')
  })

  it('includes detail refs in visual slot signatures to force safe remounts', () => {
    const signature = getVisualSlotSignature({
      cycleFrameIndex: 0,
      assets: [
        {
          detailRef: {kind: 'awakener', id: 'awakener-a'},
          isWheel: false,
          label: 'Shared',
          linkTo: '/database/shared',
          realmId: 'AEQUOR',
          url: '/shared.webp',
        },
      ],
    })

    expect(signature).toContain('awakener:awakener-a')
    expect(signature).toContain('AEQUOR')
  })
})
