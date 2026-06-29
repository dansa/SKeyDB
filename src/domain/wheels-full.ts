import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicWheelCatalogRecords} from '@/data-access/public-data/catalogScopes/wheelsCatalog'

import {
  publicDescriptionArgsSchema,
  type PublicDescriptionArg,
} from './public-description-args.schema'
import {buildWheelMainstatSeriesKey, type WheelMainstatKey} from './wheel-mainstat-scaling'

export interface WheelFullRecord {
  id: string
  assetId: string
  name: string
  rarity: 'SSR' | 'SR' | 'R' | 'N'
  realm: 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA' | 'NEUTRAL' | 'OTHER'
  awakener?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  aliases: string[]
  searchTags: string[]
  mainstatKey: WheelMainstatKey
  mainstatSeriesKey: string
  descriptionTemplate: string
  descriptionArgs: Record<string, PublicDescriptionArg>
  lore?: string
}

const publicWheelRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  rarity: z.enum(['SSR', 'SR', 'R', 'N']),
  realm: z.enum(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL', 'OTHER']),
  ownerAwakenerId: z.string().optional(),
  ownerAwakenerName: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  searchTags: z.array(z.string()).optional(),
  mainstatKey: z.custom<WheelMainstatKey>((value) => typeof value === 'string'),
  mainstatSeriesKey: z.string().optional(),
  descriptionTemplate: z.string().default(''),
  descriptionArgs: publicDescriptionArgsSchema.default({}),
  lore: z.string().optional(),
})

const publicWheelRecordsSchema = z.array(publicWheelRecordSchema)

type PublicWheelRecord = z.infer<typeof publicWheelRecordSchema>

let wheelsFullCache: WheelFullRecord[] | null = null

function getWheelPublicAssetId(wheelId: string): string {
  const assetIndexId = resolvePublicEntityAsset(wheelId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? 'TBD') : 'TBD'
}

function adaptPublicWheel(record: PublicWheelRecord): WheelFullRecord {
  return {
    ...record,
    assetId: getWheelPublicAssetId(record.id),
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    awakener: record.ownerAwakenerName,
    mainstatSeriesKey:
      record.mainstatSeriesKey ?? buildWheelMainstatSeriesKey(record.rarity, record.mainstatKey),
  }
}

export function getWheelsFull(): WheelFullRecord[] {
  if (wheelsFullCache) {
    return wheelsFullCache
  }

  wheelsFullCache = publicWheelRecordsSchema
    .parse(getPublicWheelCatalogRecords())
    .map(adaptPublicWheel)
  return wheelsFullCache
}

export function getWheelFullById(
  wheelId: string,
  records: WheelFullRecord[],
): WheelFullRecord | undefined {
  return records.find((record) => record.id === wheelId)
}
