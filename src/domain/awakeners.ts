import {z} from 'zod'

import awakenersLite from '@/data/awakeners-lite.json'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

const rawAwakenersSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1),
    ingameId: z.string().trim().min(1).optional(),
    faction: z.string().trim().min(1),
    realm: z.string().trim().min(1),
    rarity: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    aliases: z.array(z.string().trim().min(1)).optional(),
    stats: liteStatsSchema.optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    unreleased: z.boolean().optional(),
  }),
)

export interface AwakenerLiteStats {
  CON: number
  ATK: number
  DEF: number
}

export interface Awakener {
  id: number
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
}

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

const parsedAwakeners = rawAwakenersSchema.parse(awakenersLite).map((awakener): Awakener => {
  const aliases = Array.from(new Set([awakener.name, ...(awakener.aliases ?? [])]))

  return {
    id: awakener.id,
    name: awakener.name,
    ingameId: awakener.ingameId?.toUpperCase(),
    faction: awakener.faction,
    realm: awakener.realm,
    rarity: awakener.rarity,
    type: awakener.type,
    aliases,
    stats: awakener.stats,
    tags: awakener.tags ?? [],
    unreleased: awakener.unreleased,
  }
})
assertUniqueIngameIds(parsedAwakeners)

export function getAwakeners(): Awakener[] {
  return parsedAwakeners
}
