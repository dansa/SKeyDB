import {z} from 'zod'

import rawBanners from '@/data/timeline/banners.json'
import rawEvents from '@/data/timeline/events.json'

import {getAwakeners} from './awakeners'
import {
  BANNER_TAGS,
  BANNER_TYPES,
  EVENT_CATEGORIES,
  normalizeEventCategory,
  parseGameDate,
  type BannerEntry,
  type EventEntry,
} from './timeline'
import {
  resolveTimelineBannerDerivedPool,
  resolveTimelineBannerPoolSlots,
  resolveTimelineBannerUnit,
  type DerivedPoolInput,
  type FeaturedInput,
  type PoolSlotInput,
} from './timeline-banner-pools'
import {getWheels} from './wheels'

interface BannerInput {
  id: string
  title: string
  type: BannerEntry['type']
  tags?: BannerEntry['tags']
  description?: string
  startDate: string
  endDate: string
  featured?: FeaturedInput[]
  poolSlots?: PoolSlotInput[]
  derivedPool?: DerivedPoolInput
  customArt?: string
  customTags?: string[]
  pinned?: boolean
  pricing?: string
  preliminary?: boolean
}

const nonEmptyStringSchema = z.string().trim().min(1)
const gameDateSchema = z.string().regex(/^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}$/)

const featuredInputSchema: z.ZodType<FeaturedInput> = z.union([
  nonEmptyStringSchema,
  z.object({
    name: nonEmptyStringSchema,
    kind: z.enum(['awakener', 'wheel', 'wheel-auto', 'placeholder']).optional(),
    customArt: nonEmptyStringSchema.optional(),
    realmId: nonEmptyStringSchema.optional(),
    detailLink: z.boolean().optional(),
  }),
])

const poolSlotInputSchema: z.ZodType<PoolSlotInput> = z.object({
  pool: z.array(featuredInputSchema).min(1),
  linked: z.boolean().optional(),
  count: z.number().int().positive().optional(),
})

const derivedPoolInputSchema: z.ZodType<DerivedPoolInput> = z.object({
  availabilityTypes: z.array(nonEmptyStringSchema).optional(),
  awakenerSlots: z.number().int().nonnegative().optional(),
  excludeNames: z.array(nonEmptyStringSchema).optional(),
  linkedPairs: z.boolean().optional(),
  limitedAwakenerType: nonEmptyStringSchema.optional(),
  slotCount: z.number().int().positive().optional(),
  wheelSlots: z.number().int().nonnegative().optional(),
})

const bannerInputSchema: z.ZodType<BannerInput> = z
  .object({
    id: nonEmptyStringSchema,
    title: nonEmptyStringSchema,
    type: z.enum(BANNER_TYPES),
    tags: z.array(z.enum(BANNER_TAGS)).optional(),
    description: z.string().optional(),
    startDate: gameDateSchema,
    endDate: gameDateSchema,
    featured: z.array(featuredInputSchema).optional(),
    poolSlots: z.array(poolSlotInputSchema).optional(),
    derivedPool: derivedPoolInputSchema.optional(),
    customArt: nonEmptyStringSchema.optional(),
    customTags: z.array(nonEmptyStringSchema).optional(),
    pinned: z.boolean().optional(),
    pricing: nonEmptyStringSchema.optional(),
    preliminary: z.boolean().optional(),
  })
  .superRefine((banner, ctx) => {
    if (banner.poolSlots && banner.derivedPool) {
      ctx.addIssue({
        code: 'custom',
        path: ['derivedPool'],
        message: 'Use either poolSlots or derivedPool, not both.',
      })
    }
  })

const eventInputSchema: z.ZodType<EventInput> = z.object({
  id: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  category: z.enum(EVENT_CATEGORIES).optional(),
  description: z.string().optional(),
  startDate: gameDateSchema,
  endDate: gameDateSchema,
  pinned: z.boolean().optional(),
  featured: z.union([featuredInputSchema, z.array(featuredInputSchema)]).optional(),
  customArt: nonEmptyStringSchema.optional(),
  pricing: nonEmptyStringSchema.optional(),
  preliminary: z.boolean().optional(),
  rerun: z.boolean().optional(),
  artAlign: nonEmptyStringSchema.optional(),
})

interface EventInput {
  id: string
  title: string
  category?: EventEntry['category']
  description?: string
  startDate: string
  endDate: string
  pinned?: boolean
  featured?: FeaturedInput | FeaturedInput[]
  customArt?: string
  pricing?: string
  preliminary?: boolean
  rerun?: boolean
  artAlign?: string
}

const timelineEventAssets = import.meta.glob<string>('../assets/events/*', {
  eager: true,
  import: 'default',
})

const timelineBannerAssets = import.meta.glob<string>('../assets/banners/*', {
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

function resolveBundledBannerAsset(value: string): string | undefined {
  const normalized = value.replace(/^\/+/, '')
  if (!normalized.startsWith('banners/')) return undefined
  const fileName = normalized.slice('banners/'.length)
  return timelineBannerAssets[`../assets/banners/${fileName}`]
}

function resolveCustomArt(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/events/')) return resolveBundledEventAsset(value)
  if (value.startsWith('/banners/')) return resolveBundledBannerAsset(value)
  if (value.startsWith('/')) return value
  return undefined
}

const bannerPoolResolutionContext = {
  awakeners: getAwakeners(),
  resolveCustomArt,
  wheels: getWheels(),
}

function resolveUnit(input: FeaturedInput) {
  return resolveTimelineBannerUnit(input, bannerPoolResolutionContext)
}

function resolveFeaturedList(input: FeaturedInput | FeaturedInput[]) {
  return (Array.isArray(input) ? input : [input]).map(resolveUnit)
}

function resolvePoolSlots(input: PoolSlotInput[]) {
  return resolveTimelineBannerPoolSlots(input, bannerPoolResolutionContext)
}

function resolveDerivedPool(input: DerivedPoolInput, bannerId: string) {
  return resolveTimelineBannerDerivedPool(input, bannerId, bannerPoolResolutionContext)
}

function loadBanner(raw: BannerInput): BannerEntry {
  const entry: BannerEntry = {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    tags: raw.tags,
    description: cleanDescription(raw.description),
    customArt: resolveCustomArt(raw.customArt),
    customTags: raw.customTags,
    pinned: raw.pinned,
    pricing: raw.pricing,
    preliminary: raw.preliminary,
    startDate: parseGameDate(raw.startDate),
    endDate: parseGameDate(raw.endDate),
  }
  if (raw.featured) {
    entry.featured = raw.featured.map(resolveUnit)
  }
  if (raw.poolSlots) {
    entry.poolSlots = resolvePoolSlots(raw.poolSlots)
  }
  if (raw.derivedPool) {
    entry.poolSlots = resolveDerivedPool(raw.derivedPool, raw.id)
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
    preliminary: raw.preliminary,
    customArt: resolveCustomArt(raw.customArt),
    pricing: raw.pricing,
    rerun: raw.rerun,
    artAlign: raw.artAlign,
  }
  if (raw.featured) {
    entry.featured = resolveFeaturedList(raw.featured)
  }
  return entry
}

export function loadTimelineBanners(input: unknown): BannerEntry[] {
  return z.array(bannerInputSchema).parse(input).map(loadBanner)
}

export function loadTimelineEvents(input: unknown): EventEntry[] {
  return z.array(eventInputSchema).parse(input).map(loadEvent)
}

export const timelineBanners: BannerEntry[] = loadTimelineBanners(rawBanners)
export const timelineEvents: EventEntry[] = loadTimelineEvents(rawEvents)
