import {z} from 'zod'

import {getPublicAwakenerCatalogRecords} from '@/data-access/public-data/catalogScopes/awakenersCatalog'

import {
  awakenerRosterDatasetSchema,
  fullStatsSchema,
  primaryScalingBaseSchema,
  statScalingSchema,
  substatScalingSchema,
  type AwakenerRosterRecord,
} from './awakener-source-schema'

const numericBaseStatsSchema = z.object({
  CON: z.number().optional(),
  ATK: z.number().optional(),
  DEF: z.number().optional(),
})

const numericSubstatScalingSchema = z.record(z.string(), z.number())

const publicAwakenerRosterRecordSchema = z.object({
  id: z.string(),
  numericId: z.number(),
  baseStatsLv1: numericBaseStatsSchema,
  faction: z.string(),
  ingameId: z.string().optional(),
  name: z.string(),
  primaryScalingBase: primaryScalingBaseSchema,
  rarity: z.string().optional(),
  realm: z.string(),
  searchTags: z.array(z.string()).optional(),
  statScaling: statScalingSchema,
  substatScaling: numericSubstatScalingSchema,
  type: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  route: z
    .object({
      slug: z.string().optional(),
    })
    .optional(),
})

const publicAwakenerRosterRecordsSchema = z.array(publicAwakenerRosterRecordSchema)

type PublicAwakenerRosterRecord = z.infer<typeof publicAwakenerRosterRecordSchema>

let awakenerRosterCache: AwakenerRosterRecord[] | null = null

function adaptPublicAwakener(record: PublicAwakenerRosterRecord): AwakenerRosterRecord {
  const assetKey = record.route?.slug ?? record.id
  const fullStats = {
    CON: record.baseStatsLv1.CON ?? 0,
    ATK: record.baseStatsLv1.ATK ?? 0,
    DEF: record.baseStatsLv1.DEF ?? 0,
    CritRate: 0,
    CritDamage: 0,
    AliemusRegen: 0,
    KeyflareRegen: 0,
    RealmMastery: 0,
    SigilYield: 0,
    DamageAmplification: 0,
    DeathResistance: 0,
  }

  return {
    id: record.numericId,
    key: assetKey,
    displayName: record.name,
    ingameId: record.ingameId,
    faction: record.faction,
    realm: record.realm,
    rarity: record.rarity,
    type: record.type,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    stats: fullStatsSchema.parse(
      Object.fromEntries(Object.entries(fullStats).map(([key, value]) => [key, String(value)])),
    ),
    primaryScalingBase: record.primaryScalingBase,
    statScaling: record.statScaling,
    substatScaling: substatScalingSchema.parse(
      Object.fromEntries(recordSubstatScalingEntries(record)),
    ),
    assets: {portraitKey: assetKey, iconKey: assetKey},
  }
}

function recordSubstatScalingEntries(record: PublicAwakenerRosterRecord): [string, string][] {
  return Object.entries(record.substatScaling).map(([key, value]) => [key, String(value)])
}

export function getAwakenerRoster(): AwakenerRosterRecord[] {
  if (awakenerRosterCache) {
    return awakenerRosterCache
  }

  awakenerRosterCache = awakenerRosterDatasetSchema.parse(
    publicAwakenerRosterRecordsSchema
      .parse(getPublicAwakenerCatalogRecords())
      .map(adaptPublicAwakener),
  )
  return awakenerRosterCache
}

export function getAwakenerRosterById(
  awakenerId: number,
  roster: AwakenerRosterRecord[],
): AwakenerRosterRecord | undefined {
  return roster.find((entry) => entry.id === awakenerId)
}

export function buildAwakenerRosterMap(
  roster: AwakenerRosterRecord[],
): Map<number, AwakenerRosterRecord> {
  return new Map(roster.map((entry) => [entry.id, entry]))
}
