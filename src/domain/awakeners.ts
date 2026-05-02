import {z} from 'zod'

import publicAwakenersFull from '@/data/public-v2/full/awakeners.json'
import publicAwakenersLite from '@/data/public-v2/lite/awakeners.json'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

const publicAwakenersLiteSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('awakeners'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^awakener-\d{4}$/),
        numericId: z.number().int().positive(),
        name: z.string().trim().min(1),
        ingameId: z.string().trim().min(1).optional(),
        faction: z.string().trim().min(1),
        realm: z.string().trim().min(1),
        rarity: z.string().trim().min(1).optional(),
        type: z.string().trim().min(1).optional(),
        assets: z
          .object({
            portraitKey: z.string().trim().min(1).optional(),
            iconKey: z.string().trim().min(1).optional(),
          })
          .optional(),
        aliases: z.array(z.string().trim().min(1)).optional(),
        searchTags: z.array(z.string().trim().min(1)).optional(),
        lineupToken: z.string().trim().min(1),
      }),
    ),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((envelope) => envelope.recordCount === envelope.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

const publicAwakenersFullSchema = z
  .object({
    records: z.array(
      z.object({
        id: z.string().regex(/^awakener-\d{4}$/),
        baseStatsLv1: liteStatsSchema,
      }),
    ),
  })
  .loose()

export interface AwakenerLiteStats {
  CON: number
  ATK: number
  DEF: number
}

export interface Awakener {
  id: string
  numericId?: number
  name: string
  ingameId?: string
  faction: string
  realm: string
  rarity?: string
  type?: string
  aliases: string[]
  stats?: AwakenerLiteStats
  tags: string[]
  unreleased?: boolean
  lineupToken: string
}

const publicFullAwakenerById = new Map(
  publicAwakenersFullSchema
    .parse(publicAwakenersFull)
    .records.map((awakener) => [awakener.id, awakener]),
)

function assertUniqueIngameIds(awakeners: Awakener[]) {
  const awakenerNameByIngameId = new Map<string, string>()
  for (const awakener of awakeners) {
    if (!awakener.ingameId) {
      continue
    }
    const existingName = awakenerNameByIngameId.get(awakener.ingameId)
    if (existingName) {
      throw new Error(
        `Duplicate awakener ingameId "${awakener.ingameId}" for "${existingName}" and "${awakener.name}".`,
      )
    }
    awakenerNameByIngameId.set(awakener.ingameId, awakener.name)
  }
}

function getPublicStats(publicId: string): AwakenerLiteStats {
  const stats = publicFullAwakenerById.get(publicId)?.baseStatsLv1
  if (!stats) {
    throw new Error(`Missing public V2 stats for awakener "${publicId}".`)
  }
  return stats
}

function resolveCanonicalAwakenerName(awakener: {
  name: string
  aliases?: string[]
  assets?: {portraitKey?: string}
}): string {
  const alias = awakener.aliases?.find((entry) => !entry.trim().startsWith('g-'))?.trim()
  if (alias) {
    return alias
  }
  const portraitKey = awakener.assets?.portraitKey?.trim()
  if (portraitKey) {
    return portraitKey.replace(/-/g, ': ')
  }
  return awakener.name.trim().toLowerCase()
}

const parsedAwakeners = publicAwakenersLiteSchema
  .parse(publicAwakenersLite)
  .records.map((awakener): Awakener => {
    const name = resolveCanonicalAwakenerName(awakener)
    const aliases = Array.from(new Set([name, awakener.name, ...(awakener.aliases ?? [])]))
    const tags = Array.from(new Set(awakener.searchTags ?? []))

    return {
      id: awakener.id,
      numericId: awakener.numericId,
      name,
      ingameId: awakener.ingameId?.toUpperCase(),
      faction: awakener.faction,
      realm: awakener.realm,
      rarity: awakener.rarity,
      type: awakener.type,
      aliases,
      stats: getPublicStats(awakener.id),
      tags,
      lineupToken: awakener.lineupToken,
    }
  })
assertUniqueIngameIds(parsedAwakeners)

export function getAwakeners(): Awakener[] {
  return parsedAwakeners
}
