import {z} from 'zod'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

const publicAwakenerCatalogLiteRecordSchema = z.object({
  id: z.string(),
  numericId: z.number(),
  name: z.string(),
  ingameId: z.string().optional(),
  faction: z.string(),
  realm: z.string(),
  rarity: z.string().optional(),
  type: z.string().optional(),
  route: z
    .object({
      slug: z.string().optional(),
    })
    .optional(),
  aliases: z.array(z.string()).optional(),
  searchTags: z.array(z.string()).optional(),
  baseStatsLv1: liteStatsSchema,
})

const publicAwakenerCatalogLiteRecordsSchema = z.array(publicAwakenerCatalogLiteRecordSchema)

export const awakenerLiteRecordSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  ingameId: z.string().trim().min(1).optional(),
  faction: z.string().trim().min(1),
  realm: z.string().trim().min(1),
  rarity: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  aliases: z.array(z.string().trim().min(1)),
  stats: liteStatsSchema,
  tags: z.array(z.string().trim().min(1)),
  unreleased: z.boolean().optional(),
})

export const awakenerLiteDatasetSchema = z.array(awakenerLiteRecordSchema)

export type AwakenerLiteRecord = z.infer<typeof awakenerLiteRecordSchema>

let awakenersLiteCache: AwakenerLiteRecord[] | null = null

type PublicAwakenerCatalogLiteRecord = z.infer<typeof publicAwakenerCatalogLiteRecordSchema>

function getPublicAwakenerCatalogLiteRecords(): PublicAwakenerCatalogLiteRecord[] {
  // The public awakener catalog is currently the intentional lite/summary source.
  return publicAwakenerCatalogLiteRecordsSchema.parse(getPublicCatalogRecords('awakeners'))
}

function resolveCanonicalAwakenerName(record: PublicAwakenerCatalogLiteRecord) {
  const alias = record.aliases?.find((entry) => !entry.trim().startsWith('g-'))?.trim()
  if (alias) {
    return alias
  }
  const portraitKey = record.route?.slug?.trim()
  if (portraitKey) {
    return portraitKey.replace(/-/g, ': ')
  }
  return record.name.trim().toLowerCase()
}

function adaptPublicAwakenerCatalogLite(
  record: PublicAwakenerCatalogLiteRecord,
): AwakenerLiteRecord {
  const name = resolveCanonicalAwakenerName(record)

  return {
    id: record.numericId,
    name,
    ingameId: record.ingameId,
    faction: record.faction,
    realm: record.realm,
    rarity: record.rarity,
    type: record.type,
    aliases: Array.from(new Set([name, record.name, ...(record.aliases ?? [])])),
    stats: record.baseStatsLv1,
    tags: record.searchTags ?? [],
  }
}

export function getAwakenersLite(): AwakenerLiteRecord[] {
  if (awakenersLiteCache) {
    return awakenersLiteCache
  }

  awakenersLiteCache = awakenerLiteDatasetSchema.parse(
    getPublicAwakenerCatalogLiteRecords().map(adaptPublicAwakenerCatalogLite),
  )
  return awakenersLiteCache
}
