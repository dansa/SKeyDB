import {describe, expect, it} from 'vitest'

import {
  findTimelineAwakener,
  findTimelineSignatureWheel,
  findTimelineWheel,
  resolveTimelineFeaturedAsset,
} from './timelineDetailResolution'

describe('timelineDetailResolution', () => {
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
