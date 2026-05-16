import type {BannerFeaturedUnit, BannerPoolSlot} from '@/domain/timeline'

import {resolveTimelineFeaturedAsset, type TimelineFeaturedAsset} from './timelineDetailResolution'

export type SliceAsset = TimelineFeaturedAsset

export interface ResolvedVisualSlot {
  assets: SliceAsset[]
  cycleFrameIndex: number
}

export function getVisualSlotSignature(slot: ResolvedVisualSlot): string {
  return [
    String(slot.cycleFrameIndex),
    ...slot.assets.map((asset) =>
      [
        asset.label,
        asset.url ?? 'no-url',
        asset.linkTo ?? 'no-link',
        asset.detailRef ? `${asset.detailRef.kind}:${asset.detailRef.id}` : 'no-detail-ref',
        asset.realmId ?? 'no-realm',
        asset.isWheel ? 'wheel' : 'awakener',
      ].join(':'),
    ),
  ].join('|')
}

export function getFeaturedGridTemplate(assets: SliceAsset[]): string {
  return `repeat(${String(Math.min(assets.length, 4))}, minmax(0, 1fr))`
}

function getFeaturedUnitCacheKey(unit: BannerFeaturedUnit): string {
  return [
    unit.kind,
    unit.name,
    unit.customArt ?? '',
    unit.realmId ?? '',
    unit.detailLink === false ? 'no-detail' : 'detail',
  ].join('\u0000')
}

function createFeaturedAssetResolver() {
  const cache = new Map<string, SliceAsset>()

  return (unit: BannerFeaturedUnit): SliceAsset => {
    const cacheKey = getFeaturedUnitCacheKey(unit)
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const asset = resolveTimelineFeaturedAsset(unit)
    cache.set(cacheKey, asset)
    return asset
  }
}

export function resolveFeaturedAssets(featured: BannerFeaturedUnit[]): SliceAsset[] {
  const resolveAsset = createFeaturedAssetResolver()
  return featured.map(resolveAsset)
}

export function resolvePoolSlots(poolSlots: BannerPoolSlot[]): ResolvedVisualSlot[] {
  const visual: ResolvedVisualSlot[] = []
  const resolveAsset = createFeaturedAssetResolver()
  poolSlots.forEach((slot, frameIdx) => {
    if (slot.pool.length === 0) return

    visual.push({
      assets: slot.pool.map(resolveAsset),
      cycleFrameIndex: frameIdx,
    })
    if (slot.linked) {
      visual.push({
        assets: slot.pool.map((unit) =>
          resolveAsset({
            name: unit.name,
            kind: 'wheel-auto',
            detailLink: unit.detailLink,
          }),
        ),
        cycleFrameIndex: frameIdx,
      })
    }
  })
  return visual
}

export function getPoolGridTemplate(total: number): string {
  return `repeat(${String(Math.max(total, 1))}, minmax(0, 1fr))`
}

export function getPoolPreloadUrls(visualSlots: ResolvedVisualSlot[]): string[] {
  const urls = new Set<string>()

  visualSlots.forEach((slot) => {
    slot.assets.forEach((asset) => {
      if (asset.url) {
        urls.add(asset.url)
      }
    })
  })

  return [...urls]
}

export function expandFeatured(featured: BannerFeaturedUnit[]): BannerFeaturedUnit[] {
  if (featured.length !== 1 || featured[0].kind !== 'awakener') {
    return featured
  }
  return [
    featured[0],
    {name: featured[0].name, kind: 'wheel-auto', detailLink: featured[0].detailLink},
  ]
}
