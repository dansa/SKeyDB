import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicOrisonCatalogRecords} from '@/data-access/public-data/catalogScopes/orisonsCatalog'

import {publicDescriptionArgsSchema} from './public-description-args.schema'

export const ORISON_TYPES = ['STANDARD', 'SPECIAL'] as const
export const ORISON_VARIANT_TIERS = ['Common', 'Advanced', 'Unique', 'Cursed'] as const
export type OrisonType = (typeof ORISON_TYPES)[number]
export type OrisonVariantTier = (typeof ORISON_VARIANT_TIERS)[number]

const nonEmpty = z.string().trim().min(1)
const idSchema = z.string().regex(/^orison-\d{4}$/)
const variantIdSchema = z.string().regex(/^orison-variant-\d{4}$/)
const routeSchema = z.object({slug: nonEmpty, canonicalPath: nonEmpty})
const assetsSchema = z.record(nonEmpty, nonEmpty)

export const publicOrisonCatalogRecordSchema = z
  .object({
    kind: z.literal('orison'),
    id: idSchema,
    name: nonEmpty,
    route: routeSchema,
    assets: assetsSchema,
    realm: nonEmpty.optional(),
    orisonType: z.enum(ORISON_TYPES),
    variantCount: z.number().int().positive(),
    defaultVariantId: variantIdSchema,
    aliases: z.array(nonEmpty).default([]),
    variantTiers: z.array(z.enum(ORISON_VARIANT_TIERS)).min(1),
  })
  .loose()

export const publicOrisonVariantSchema = z
  .object({
    id: variantIdSchema,
    name: nonEmpty,
    tier: z.enum(ORISON_VARIANT_TIERS),
    descriptionTemplate: z.string().default(''),
    descriptionArgs: publicDescriptionArgsSchema.default({}),
    orisonType: z.enum(ORISON_TYPES),
    assets: assetsSchema,
  })
  .loose()

export const publicOrisonRecordSchema = publicOrisonCatalogRecordSchema
  .extend({
    schemaVersion: z.literal(3),
    descriptionTemplate: z.string().default(''),
    descriptionArgs: publicDescriptionArgsSchema.default({}),
    variants: z.array(publicOrisonVariantSchema).min(1),
  })
  .superRefine((record, ctx) => {
    if (record.variantCount !== record.variants.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'variantCount must match variants.length',
        path: ['variantCount'],
      })
    }
    const ids = new Set(record.variants.map((variant) => variant.id))
    if (ids.size !== record.variants.length) {
      ctx.addIssue({code: 'custom', message: 'variant ids must be unique', path: ['variants']})
    }
    if (!ids.has(record.defaultVariantId)) {
      ctx.addIssue({
        code: 'custom',
        message: 'defaultVariantId must reference a family variant',
        path: ['defaultVariantId'],
      })
    }
  })

export type PublicOrisonRecord = z.infer<typeof publicOrisonRecordSchema>
export type PublicOrisonVariant = z.infer<typeof publicOrisonVariantSchema>

export interface Orison {
  id: string
  name: string
  route: z.infer<typeof routeSchema>
  aliases: string[]
  realm?: string
  orisonType: OrisonType
  variantCount: number
  defaultVariantId: string
  variantTiers: OrisonVariantTier[]
  assetId: string
}

const parsedOrisons = getPublicOrisonCatalogRecords().map((raw): Orison => {
  const record = publicOrisonCatalogRecordSchema.parse(raw)
  const assetIndexId = resolvePublicEntityAsset(record.id, 'icon')
  return {...record, assetId: assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? '') : ''}
})
const orisonById = new Map(parsedOrisons.map((orison) => [orison.id, orison]))

export function getOrisons(): Orison[] {
  return parsedOrisons
}

export function getOrisonById(id: string): Orison | undefined {
  return orisonById.get(id)
}

export function getOrisonVariantById(record: PublicOrisonRecord, id: string) {
  return record.variants.find((variant) => variant.id === id)
}

export function getDefaultOrisonVariant(record: PublicOrisonRecord): PublicOrisonVariant {
  const variant = getOrisonVariantById(record, record.defaultVariantId)
  if (!variant) throw new Error(`Orison family "${record.id}" is missing its default variant.`)
  return variant
}

export async function loadOrisonRecordById(id: string): Promise<PublicOrisonRecord | undefined> {
  const {loadPublicRecord} = await import('@/data-access/public-data/recordRepository')
  const record = await loadPublicRecord('orisons', id)
  const catalogOrison = getOrisonById(id)
  return record
    ? publicOrisonRecordSchema.parse({
        ...record,
        variantTiers: record.variantTiers ?? catalogOrison?.variantTiers,
      })
    : undefined
}
