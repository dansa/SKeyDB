import type {EntityRef} from '@/domain/entities/types'
import type {BannerFeaturedUnit, EventCategory} from '@/domain/timeline'

import {resolveTimelineFeaturedAsset} from './timelineDetailResolution'

export type EventMetaTone =
  | 'amber'
  | 'blue'
  | 'champagne'
  | 'gold'
  | 'green'
  | 'orange'
  | 'price'
  | 'red'
  | 'rose'
  | 'slate'
  | 'teal'
  | 'violet'

export const CATEGORY_TONE: Record<EventCategory, EventMetaTone> = {
  story: 'amber',
  raid: 'red',
  battlepass: 'green',
  'gameplay-event': 'amber',
  'd-tide': 'red',
  curriculum: 'green',
  login: 'teal',
  skin: 'rose',
  'wheel-event': 'blue',
  anniversary: 'teal',
  milestone: 'gold',
  preorder: 'orange',
  bundle: 'champagne',
  maintenance: 'slate',
  collab: 'violet',
  other: 'amber',
}

export interface EventArt {
  url: string | undefined
  isWheel: boolean
  artAlign?: string
  detailTargets: EventDetailTarget[]
}

export interface EventDetailTarget {
  label: string
  ref: EntityRef
}

export function resolveEventArt(
  featured: BannerFeaturedUnit[] | undefined,
  customArt: string | undefined,
  artAlign?: string,
): EventArt | null {
  const assets = featured?.map((unit) => resolveTimelineFeaturedAsset(unit)) ?? []
  const detailTargets = assets.flatMap((asset) =>
    asset.detailRef ? [{label: asset.label, ref: asset.detailRef}] : [],
  )
  if (customArt) return {url: customArt, isWheel: false, artAlign, detailTargets}
  if (assets.length === 0) return null
  const primaryAsset = assets[0]
  return {url: primaryAsset.url, isWheel: primaryAsset.isWheel, artAlign, detailTargets}
}
