import {describe, expect, it} from 'vitest'

import {timelineBanners} from '@/domain/timeline-data'
import {getWheels} from '@/domain/wheels'

import {
  findTimelineAwakener,
  findTimelineSignatureWheel,
  findTimelineWheel,
  resolveTimelineFeaturedAsset,
} from './timelineDetailResolution'

describe('timelineDetailResolution', () => {
  it('resolves the archived Pontos banner from the current signature wheel record', () => {
    const banner = timelineBanners.find((entry) => entry.id === 'banner-pontos')
    const featuredWheel = banner?.featured?.[1]
    expect(featuredWheel).toMatchObject({name: 'Pontos', kind: 'wheel-auto'})
    if (!featuredWheel) throw new Error('Missing Pontos signature wheel')
    const wheel = getWheels().find((entry) => entry.id === 'wheel-0171')
    expect(wheel).toBeDefined()
    const asset = resolveTimelineFeaturedAsset(featuredWheel)
    expect(asset).toMatchObject({
      label: wheel?.name,
      realmId: wheel?.realm,
      detailRef: {kind: 'wheel', id: 'wheel-0171'},
      linkTo: '/database/wheels/living-cage',
      isWheel: true,
    })
    expect(asset.url).toBeTruthy()
  })

  it('preserves overrides and link opt-outs on automatic signature wheel entries', () => {
    const asset = resolveTimelineFeaturedAsset({
      name: 'Pontos',
      kind: 'wheel-auto',
      customArt: '/custom/pontos-wheel.webp',
      realmId: 'CUSTOM_REALM',
      detailLink: false,
    })
    expect(asset).toMatchObject({
      label: findTimelineSignatureWheel('Pontos')?.name,
      url: '/custom/pontos-wheel.webp',
      realmId: 'CUSTOM_REALM',
      isWheel: true,
      detailRef: undefined,
      linkTo: undefined,
    })
  })

  it('resolves timeline entities through case-insensitive indexes', () => {
    expect(findTimelineAwakener('ARACHNE')?.name).toBe('arachne')
    expect(findTimelineWheel('ETERNAL WEAVE')?.name).toBe('Eternal Weave')
    expect(findTimelineSignatureWheel('aRaChNe')?.name).toBe('Eternal Weave')
  })

  it('keeps custom artwork while resolving database metadata', () => {
    const asset = resolveTimelineFeaturedAsset({
      name: 'ETERNAL WEAVE',
      kind: 'wheel',
      customArt: '/custom/eternal-weave.webp',
      realmId: 'CUSTOM_REALM',
    })

    expect(asset).toMatchObject({
      detailRef: {kind: 'wheel', id: 'wheel-0128'},
      isWheel: true,
      label: 'ETERNAL WEAVE',
      linkTo: '/database/wheels/eternal-weave',
      realmId: 'CUSTOM_REALM',
      url: '/custom/eternal-weave.webp',
    })
  })

  it('suppresses detail targets only when detailLink is false', () => {
    const asset = resolveTimelineFeaturedAsset({
      name: 'Arachne',
      kind: 'awakener',
      detailLink: false,
    })

    expect(asset.label).toBe('Arachne')
    expect(asset.linkTo).toBeUndefined()
    expect(asset.detailRef).toBeUndefined()
    expect(asset.realmId).toBeDefined()
  })

  it('keeps unresolved auto wheels inert while preserving wheel semantics', () => {
    const asset = resolveTimelineFeaturedAsset({
      name: 'No Such Awakener',
      kind: 'wheel-auto',
    })

    expect(asset).toEqual({
      detailRef: undefined,
      isWheel: true,
      label: 'No Such Awakener',
      linkTo: undefined,
      realmId: undefined,
      url: undefined,
    })
  })
})
