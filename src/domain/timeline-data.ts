import rawBanners from '@/data/timeline/banners.json'
import rawEvents from '@/data/timeline/events.json'

import {
  normalizeEventCategory,
  parseGameDate,
  type BannerEntry,
  type BannerFeaturedUnit,
  type BannerPoolSlot,
  type EventEntry,
} from './timeline'
import {getWheels} from './wheels'

type FeaturedInput = string | {name: string; kind?: 'awakener' | 'wheel' | 'wheel-auto'}

interface PoolSlotInput {
  pool: FeaturedInput[]
  linked?: boolean
  count?: number
}

interface BannerInput {
  id: string
  title: string
  type: BannerEntry['type']
  description?: string
  startDate: string
  endDate: string
  featured?: FeaturedInput[]
  poolSlots?: PoolSlotInput[]
  customArt?: string
  pinned?: boolean
}

interface EventInput {
  id: string
  title: string
  category?: EventEntry['category']
  description?: string
  startDate: string
  endDate: string
  pinned?: boolean
  featured?: string
  customArt?: string
  pricing?: string
  artAlign?: string
}

const timelineEventAssets = import.meta.glob<string>('../assets/events/*', {
  eager: true,
  import: 'default',
})

function cleanDescription(desc: string | undefined): string | undefined {
  if (!desc) return desc
  return desc.replace(/ *\n */g, '\n').trim()
}

function resolveBundledEventAsset(value: string): string | undefined {
  const normalized = value.replace(/^\/+/, '')
  if (!normalized.startsWith('events/')) return undefined
  const fileName = normalized.slice('events/'.length)
  return timelineEventAssets[`../assets/events/${fileName}`]
}

function resolveCustomArt(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/events/')) return resolveBundledEventAsset(value)
  if (value.startsWith('/')) return value
  return undefined
}

function resolveUnit(input: FeaturedInput): BannerFeaturedUnit {
  if (typeof input !== 'string') {
    return {name: input.name, kind: input.kind ?? 'awakener'}
  }
  const lower = input.toLowerCase()
  if (getWheels().some((w) => w.name.toLowerCase() === lower)) {
    return {name: input, kind: 'wheel'}
  }
  return {name: input, kind: 'awakener'}
}

function resolvePoolSlots(input: PoolSlotInput[]): BannerPoolSlot[] {
  const out: BannerPoolSlot[] = []
  for (const slot of input) {
    const resolved: BannerPoolSlot = {
      pool: slot.pool.map(resolveUnit),
      linked: slot.linked,
    }
    const copies = slot.count ?? 1
    for (let i = 0; i < copies; i++) {
      out.push({pool: [...resolved.pool], linked: resolved.linked})
    }
  }
  return out
}

function loadBanner(raw: BannerInput): BannerEntry {
  const entry: BannerEntry = {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    description: cleanDescription(raw.description),
    customArt: resolveCustomArt(raw.customArt),
    pinned: raw.pinned,
    startDate: parseGameDate(raw.startDate),
    endDate: parseGameDate(raw.endDate),
  }
  if (raw.featured) {
    entry.featured = raw.featured.map(resolveUnit)
  }
  if (raw.poolSlots) {
    entry.poolSlots = resolvePoolSlots(raw.poolSlots)
  }
  return entry
}

function loadEvent(raw: EventInput): EventEntry {
  const entry: EventEntry = {
    id: raw.id,
    title: raw.title,
    description: cleanDescription(raw.description),
    startDate: parseGameDate(raw.startDate),
    endDate: parseGameDate(raw.endDate),
    category: normalizeEventCategory(raw.category),
    pinned: raw.pinned,
    customArt: resolveCustomArt(raw.customArt),
    pricing: raw.pricing,
    artAlign: raw.artAlign,
  }
  if (raw.featured) {
    entry.featured = [resolveUnit(raw.featured)]
  }
  return entry
}

export const timelineBanners: BannerEntry[] = (rawBanners as BannerInput[]).map(loadBanner)
export const timelineEvents: EventEntry[] = (rawEvents as EventInput[]).map(loadEvent)
