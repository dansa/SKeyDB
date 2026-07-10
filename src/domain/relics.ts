import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicRelicCatalogRecords} from '@/data-access/public-data/catalogScopes/relicsCatalog'
import {loadPublicRecord} from '@/data-access/public-data/recordRepository'

import {getAwakeners} from './awakeners'
import {resolveDescriptionTemplate} from './description-args'
import {publicDescriptionArgsSchema} from './public-description-args.schema'

export const RELIC_CATEGORIES = [
  'ASTRAL_REIGN',
  'FADED_LEGACY',
  'DIMENSIONAL_IMAGE',
  'EVENT',
  'PENDULUM',
  'OTHER',
] as const

export const RELIC_RARITIES = ['SSR', 'SR', 'N'] as const
export const RELIC_TYPES = ['Relic', 'Pendulum', 'Event', 'Dimensional Image'] as const

export type RelicCategory = (typeof RELIC_CATEGORIES)[number]
export type RelicRarity = (typeof RELIC_RARITIES)[number]
export type RelicType = (typeof RELIC_TYPES)[number]

const nonEmptyStringSchema = z.string().trim().min(1)
const relicIdSchema = z.string().regex(/^relic-\d{4}$/)
const relicVariantIdSchema = z.string().regex(/^relic-variant-\d{4}$/)
const awakenerIdSchema = z.string().regex(/^awakener-\d{4}$/)
const relicCategorySchema = z.enum(RELIC_CATEGORIES)
const relicRaritySchema = z.enum(RELIC_RARITIES)
const relicTypeSchema = z.enum(RELIC_TYPES)
const relicRouteSchema = z.object({
  slug: nonEmptyStringSchema,
  canonicalPath: nonEmptyStringSchema,
})

const publicRelicCatalogRecordSchema = z
  .object({
    kind: z.literal('relic'),
    id: relicIdSchema,
    name: nonEmptyStringSchema,
    route: relicRouteSchema,
    assets: z.record(nonEmptyStringSchema, nonEmptyStringSchema).default({}),
    aliases: z.array(nonEmptyStringSchema).default([]),
    categories: z.array(relicCategorySchema).min(1),
    defaultVariantId: relicVariantIdSchema,
    relicType: relicTypeSchema,
    rarity: relicRaritySchema.optional(),
    variantCount: z.number().int().positive(),
    ownerAwakenerId: awakenerIdSchema.optional(),
    ownerAwakenerName: nonEmptyStringSchema.optional(),
  })
  .loose()

export const publicRelicVariantSchema = z
  .object({
    id: relicVariantIdSchema,
    name: nonEmptyStringSchema,
    label: nonEmptyStringSchema,
    variantType: nonEmptyStringSchema,
    tier: nonEmptyStringSchema,
    category: relicCategorySchema.nullish(),
    rarity: relicRaritySchema.optional(),
    ownerAwakenerId: awakenerIdSchema.optional(),
    ownerAwakenerName: nonEmptyStringSchema.optional(),
    mechanicOwner: nonEmptyStringSchema.optional(),
    descriptionTemplate: z.string().default(''),
    descriptionArgs: publicDescriptionArgsSchema.default({}),
    lore: z.string().optional(),
  })
  .loose()

export const publicRelicRecordSchema = publicRelicCatalogRecordSchema
  .extend({
    schemaVersion: z.literal(3),
    descriptionTemplate: z.string().default(''),
    descriptionArgs: publicDescriptionArgsSchema.default({}),
    lore: z.string().optional(),
    variants: z.array(publicRelicVariantSchema).min(1),
  })
  .superRefine((record, ctx) => {
    if (record.variantCount !== record.variants.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'variantCount must match variants.length',
        path: ['variantCount'],
      })
    }

    const variantIds = new Set(record.variants.map((variant) => variant.id))
    if (variantIds.size !== record.variants.length) {
      ctx.addIssue({code: 'custom', message: 'variant ids must be unique', path: ['variants']})
    }
    if (!variantIds.has(record.defaultVariantId)) {
      ctx.addIssue({
        code: 'custom',
        message: 'defaultVariantId must reference a family variant',
        path: ['defaultVariantId'],
      })
    }

    for (const [index, variant] of record.variants.entries()) {
      if (variant.category && !record.categories.includes(variant.category)) {
        ctx.addIssue({
          code: 'custom',
          message: 'variant category must be included in family categories',
          path: ['variants', index, 'category'],
        })
      }
    }
  })

export type PublicRelicVariant = z.infer<typeof publicRelicVariantSchema>
export type PublicRelicRecord = z.infer<typeof publicRelicRecordSchema>

function renderRelicDescription(
  descriptionTemplate: string,
  descriptionArgs: z.infer<typeof publicDescriptionArgsSchema>,
): string {
  return resolveDescriptionTemplate(descriptionTemplate, descriptionArgs).replace(
    /\[(?:(?:[A-Za-z]+|\{[^}\]]+\}):)?(?:StateArg|DescArg|Arg)\d+\]/g,
    '?',
  )
}

export interface Relic {
  id: string
  kind: 'PORTRAIT' | 'GENERIC'
  relicType: RelicType
  categories: RelicCategory[]
  rarity?: RelicRarity
  aliases: string[]
  variantCount: number
  defaultVariantId: string
  route: z.infer<typeof relicRouteSchema>
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  assetId: string
  name: string
  description: string
}

export type RelicKind = Relic['kind']
export type PortraitRelic = Relic & {
  kind: 'PORTRAIT'
  ownerAwakenerId: string
}

export function normalizeRelicDescriptionTemplate(template: string): string {
  return template.replace(
    /<plural value="([^"]+)" singular="([^"]+)" plural="([^"]+)">/g,
    '{plural:$1|$2|$3}',
  )
}

function isDimensionalImageCategory(categories: RelicCategory[]): boolean {
  return categories.includes('DIMENSIONAL_IMAGE')
}

const parsedRelics: Relic[] = getPublicRelicCatalogRecords().map((record): Relic => {
  const relic = publicRelicCatalogRecordSchema.parse(record)
  return {
    id: relic.id,
    kind: isDimensionalImageCategory(relic.categories) ? 'PORTRAIT' : 'GENERIC',
    relicType: relic.relicType,
    categories: relic.categories,
    rarity: relic.rarity,
    aliases: relic.aliases,
    variantCount: relic.variantCount,
    defaultVariantId: relic.defaultVariantId,
    route: relic.route,
    ownerAwakenerId: relic.ownerAwakenerId,
    ownerAwakenerName: relic.ownerAwakenerName,
    assetId: getRelicPublicAssetId(relic.id),
    name: relic.name,
    description: '',
  }
})

function assertPortraitRelicsHaveOwnerAwakenerIds(relics: Relic[]) {
  for (const relic of relics) {
    if (relic.kind === 'PORTRAIT' && !relic.ownerAwakenerId) {
      throw new Error(`Portrait relic "${relic.id}" is missing ownerAwakenerId.`)
    }
  }
}

function isPortraitRelic(relic: Relic): relic is PortraitRelic {
  return relic.kind === 'PORTRAIT' && Boolean(relic.ownerAwakenerId)
}

function buildPortraitRelicByAwakenerIdMap(relics: PortraitRelic[]): Map<string, PortraitRelic> {
  const byAwakenerId = new Map<string, PortraitRelic>()
  for (const relic of relics) {
    const existing = byAwakenerId.get(relic.ownerAwakenerId)
    if (existing) {
      throw new Error(
        `Duplicate portrait relic ownerAwakenerId "${relic.ownerAwakenerId}" for relic ids "${existing.id}" and "${relic.id}".`,
      )
    }
    byAwakenerId.set(relic.ownerAwakenerId, relic)
  }
  return byAwakenerId
}

function buildRelicByIdMap(relics: Relic[]): Map<string, Relic> {
  const byId = new Map<string, Relic>()
  for (const relic of relics) {
    const existing = byId.get(relic.id)
    if (existing) {
      throw new Error(`Duplicate relic id "${relic.id}".`)
    }
    byId.set(relic.id, relic)
  }
  return byId
}

function assertPortraitRelicsLinkedToKnownAwakeners(relics: PortraitRelic[]) {
  const knownAwakenerIds = new Set(getAwakeners().map((awakener) => awakener.id))

  for (const relic of relics) {
    if (!knownAwakenerIds.has(relic.ownerAwakenerId)) {
      throw new Error(
        `Portrait relic "${relic.id}" references unknown ownerAwakenerId "${relic.ownerAwakenerId}".`,
      )
    }
  }
}

assertPortraitRelicsHaveOwnerAwakenerIds(parsedRelics)
const portraitRelics: PortraitRelic[] = parsedRelics.filter(isPortraitRelic)
assertPortraitRelicsLinkedToKnownAwakeners(portraitRelics)
const relicById = buildRelicByIdMap(parsedRelics)
const portraitRelicByAwakenerId = buildPortraitRelicByAwakenerIdMap(portraitRelics)
const relicDescriptionByIdPromises = new Map<string, Promise<string>>()

function getRelicPublicAssetId(relicId: string): string {
  const assetIndexId = resolvePublicEntityAsset(relicId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? '') : ''
}

export function getRelics(): Relic[] {
  return parsedRelics
}

export function getRelicById(relicId: string): Relic | undefined {
  return relicById.get(relicId)
}

export function getPortraitRelics(): PortraitRelic[] {
  return portraitRelics
}

export function getPortraitRelicByAwakenerId(
  awakenerId: string | undefined,
): PortraitRelic | undefined {
  if (!awakenerId) {
    return undefined
  }
  return portraitRelicByAwakenerId.get(awakenerId)
}

export function getRelicVariantById(
  record: PublicRelicRecord,
  variantId: string,
): PublicRelicVariant | undefined {
  return record.variants.find((variant) => variant.id === variantId)
}

export function getDefaultRelicVariant(record: PublicRelicRecord): PublicRelicVariant {
  const variant = getRelicVariantById(record, record.defaultVariantId)
  if (!variant) {
    throw new Error(
      `Relic family "${record.id}" is missing default variant "${record.defaultVariantId}".`,
    )
  }
  return variant
}

export async function loadRelicRecordById(relicId: string): Promise<PublicRelicRecord | undefined> {
  const record = await loadPublicRecord('relics', relicId)
  return record ? publicRelicRecordSchema.parse(record) : undefined
}

export async function loadRelicVariantById(
  relicId: string,
  variantId: string,
): Promise<PublicRelicVariant | undefined> {
  const record = await loadRelicRecordById(relicId)
  return record ? getRelicVariantById(record, variantId) : undefined
}

export async function loadRelicDescriptionById(relicId: string): Promise<string> {
  const cachedPromise = relicDescriptionByIdPromises.get(relicId)
  if (cachedPromise) {
    return cachedPromise
  }

  const descriptionPromise = loadRelicRecordById(relicId).then((relic) => {
    if (!relic) {
      return ''
    }
    return renderRelicDescription(relic.descriptionTemplate, relic.descriptionArgs)
  })
  relicDescriptionByIdPromises.set(relicId, descriptionPromise)
  return descriptionPromise
}
