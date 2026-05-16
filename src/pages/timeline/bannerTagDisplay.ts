import type {BannerEntry, BannerTag} from '@/domain/timeline'

export const BANNER_TAG_LABEL: Record<BannerTag, string> = {
  awaken: 'New Awakener',
  limited: 'Limited',
  standard: 'Standard',
  rerun: 'Rerun',
  selector: 'Selector',
  wheel: 'Wheel',
  combo: 'Combo',
  premium: 'Paid',
  collab: 'Collab',
  preliminary: 'Preliminary',
}

export const BANNER_TAG_COLOR: Record<BannerTag, string> = {
  awaken: 'text-amber-300/95',
  limited: 'text-sky-300/90',
  standard: 'text-slate-400/80',
  rerun: 'text-violet-300/90',
  selector: 'text-pink-300/90',
  wheel: 'text-cyan-300/90',
  combo: 'text-emerald-300/95',
  premium: 'text-amber-300/95',
  collab: 'text-fuchsia-300/90',
  preliminary: 'text-amber-200/76',
}

export function getBannerDisplayTags(banner: BannerEntry): BannerTag[] {
  if (banner.tags && banner.tags.length > 0) return banner.tags
  return banner.preliminary ? ([banner.type, 'preliminary'] satisfies BannerTag[]) : [banner.type]
}

function isBannerTag(tag: string): tag is BannerTag {
  return tag in BANNER_TAG_LABEL
}

export function getBannerTagLabel(tag: string): string {
  return isBannerTag(tag) ? BANNER_TAG_LABEL[tag] : tag
}

export function getBannerTagColor(tag: string, fallbackClass: string): string {
  return isBannerTag(tag) ? BANNER_TAG_COLOR[tag] : fallbackClass
}
