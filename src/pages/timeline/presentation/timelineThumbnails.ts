import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import type {BannerFeaturedUnit} from '@/domain/timeline'
import {getWheelMiniAssetById} from '@/domain/wheel-assets'

import {
  findTimelineSignatureWheel,
  findTimelineWheel,
  resolveTimelineFeaturedAsset,
} from '../timelineDetailResolution'

export function resolveTimelineThumbnail(unit: BannerFeaturedUnit) {
  const asset = resolveTimelineFeaturedAsset(unit)
  let small: string | undefined
  if (!unit.customArt) {
    if (unit.kind === 'awakener') small = getAwakenerPortraitAsset(unit.name)
    if (unit.kind === 'wheel' || unit.kind === 'wheel-auto') {
      const wheel =
        unit.kind === 'wheel' ? findTimelineWheel(unit.name) : findTimelineSignatureWheel(unit.name)
      if (wheel) small = getWheelMiniAssetById(wheel.id)
    }
  }
  return {asset, isSmall: Boolean(small), url: small ?? asset.url}
}
