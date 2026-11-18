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

interface EventArt {
  url: string | undefined
  isWheel: boolean
  artAlign?: string
}

export function resolveEventArt(
  featured: BannerFeaturedUnit[] | undefined,
  customArt: string | undefined,
  artAlign?: string,
): EventArt | null {
  if (customArt) return {url: customArt, isWheel: false, artAlign}
  const primary = featured?.[0]
  if (!primary) return null
  const {url, isWheel} = resolveTimelineFeaturedAsset(primary)
  return {url, isWheel, artAlign}
}
