import {z} from 'zod'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

import {SUBSTAT_SCALING_KEYS, type SubstatScalingKey} from './awakener-source-schema'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})
const liteSubstatScalingSchema = z.partialRecord(z.enum(SUBSTAT_SCALING_KEYS), z.number())
const PRIMARY_STAT_KEYS = ['CON', 'ATK', 'DEF'] as const
const BASIC_MAX_LEVEL = 60
const PRIMARY_STAT_FORMULA_EPSILON = 1e-9

const publicV3AwakenerCatalogRecordSchema = z
  .object({
    id: z.string().regex(/^awakener-\d{4}$/),
    numericId: z.number().int().positive(),
    name: z.string().trim().min(1),
    ingameId: z.string().trim().min(1).optional(),
    faction: z.string().trim().min(1),
    realm: z.string().trim().min(1),
    rarity: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    availabilityType: z.string().trim().min(1).optional(),
    releaseDate: z.string().trim().min(1).optional(),
    aliases: z.array(z.string().trim().min(1)).optional(),
    searchTags: z.array(z.string().trim().min(1)).optional(),
    primaryScalingBase: z.number().optional(),
    baseStatsLv1: liteStatsSchema,
    defaultPrimaryStatBonusLevel: z.number().optional(),
    statScaling: liteStatsSchema.optional(),
    substatScaling: liteSubstatScalingSchema.optional(),
    lineupToken: z.string().trim().min(1),
  })
  .loose()

export interface AwakenerLiteStats {
  CON: number
  ATK: number
  DEF: number
}

export type AwakenerStatScaling = AwakenerLiteStats
export type AwakenerLiteSubstatScaling = Partial<Record<SubstatScalingKey, number>>

export interface Awakener {
  id: string
  numericId?: number
  name: string
  ingameId?: string
  faction: string
  realm: string
  rarity?: string
  type?: string
  availabilityType?: string
  releaseDate?: string
  aliases: string[]
  stats?: AwakenerLiteStats
  defaultPrimaryStatBonusLevel?: number
  primaryScalingBase?: number
  statScaling?: AwakenerStatScaling
  substatScaling?: AwakenerLiteSubstatScaling
  tags: string[]
  unreleased?: boolean
  lineupToken: string
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

function resolveCanonicalAwakenerName(awakener: {name: string; aliases?: string[]}): string {
  const alias = awakener.aliases?.find((entry) => !entry.trim().startsWith('g-'))?.trim()
  if (alias) {
    return alias
  }
  return awakener.name.trim().toLowerCase()
}

function normalizeAwakenerLiteStatLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return BASIC_MAX_LEVEL
  }
  return Math.max(1, Math.round(level))
}

export function resolveAwakenerLiteStatsForLevel(
  awakener: Pick<
    Awakener,
    'defaultPrimaryStatBonusLevel' | 'primaryScalingBase' | 'statScaling' | 'stats'
  >,
  level: number,
): AwakenerLiteStats | undefined {
  if (!awakener.stats) {
    return undefined
  }
  const resolvedStats = {...awakener.stats}

  if (awakener.primaryScalingBase === undefined || !awakener.statScaling) {
    return resolvedStats
  }

  const normalizedLevel = normalizeAwakenerLiteStatLevel(level)
  for (const key of PRIMARY_STAT_KEYS) {
    const growthPerLevel = awakener.statScaling[key]
    if (!Number.isFinite(growthPerLevel)) {
      continue
    }
    const defaultBonusLevels = awakener.defaultPrimaryStatBonusLevel ?? 0
    resolvedStats[key] = Math.ceil(
      (awakener.primaryScalingBase + normalizedLevel + defaultBonusLevels) * growthPerLevel -
        PRIMARY_STAT_FORMULA_EPSILON,
    )
  }
  return resolvedStats
}

const parsedAwakeners = getPublicCatalogRecords('awakeners')
  .map((record) => publicV3AwakenerCatalogRecordSchema.parse(record))
  .map((awakener): Awakener => {
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
      availabilityType: awakener.availabilityType,
      releaseDate: awakener.releaseDate,
      aliases,
      stats: awakener.baseStatsLv1,
      defaultPrimaryStatBonusLevel: awakener.defaultPrimaryStatBonusLevel,
      primaryScalingBase: awakener.primaryScalingBase,
      statScaling: awakener.statScaling,
      substatScaling: awakener.substatScaling,
      tags,
      lineupToken: awakener.lineupToken,
    }
  })
assertUniqueIngameIds(parsedAwakeners)
const awakenerById = new Map(parsedAwakeners.map((awakener) => [awakener.id, awakener]))

export function getAwakeners(): Awakener[] {
  return parsedAwakeners
}

export function getAwakenerById(awakenerId: string): Awakener | undefined {
  return awakenerById.get(awakenerId)
}
