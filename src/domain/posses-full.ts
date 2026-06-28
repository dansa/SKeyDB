import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicPosseCatalogRecords} from '@/data-access/public-data/catalogScopes/possesCatalog'

import {
  publicDescriptionArgsSchema,
  type PublicDescriptionArg,
} from './public-description-args.schema'

export interface PosseFullRecord {
  id: string
  name: string
  realm: string
  assetId: string
  assetCrystalId?: string
  assetBadgeId?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  descriptionTemplate: string
  descriptionArgs: Record<string, PublicDescriptionArg>
  lore?: string
  acquisitionSource?: string
}

const publicPosseRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  realm: z.string(),
  ownerAwakenerId: z.string().optional(),
  ownerAwakenerName: z.string().optional(),
  descriptionTemplate: z.string().default(''),
  descriptionArgs: publicDescriptionArgsSchema.default({}),
  lore: z.string().optional(),
  acquisitionSource: z.string().optional(),
})

const publicPosseRecordsSchema = z.array(publicPosseRecordSchema)

type PublicPosseRecord = z.infer<typeof publicPosseRecordSchema>

let possesFullCache: PosseFullRecord[] | null = null

function getPossePublicAssetId(posseId: string, slot: string): string | undefined {
  const assetIndexId = resolvePublicEntityAsset(posseId, slot)
  return assetIndexId ? resolvePublicAsset(assetIndexId)?.assetId : undefined
}

function adaptPublicPosse(record: PublicPosseRecord): PosseFullRecord {
  return {
    ...record,
    assetId: getPossePublicAssetId(record.id, 'icon') ?? '',
    assetCrystalId: getPossePublicAssetId(record.id, 'crystal'),
    assetBadgeId: getPossePublicAssetId(record.id, 'badge'),
  }
}

export function getPossesFull(): PosseFullRecord[] {
  if (possesFullCache) {
    return possesFullCache
  }

  possesFullCache = publicPosseRecordsSchema
    .parse(getPublicPosseCatalogRecords())
    .map(adaptPublicPosse)
  return possesFullCache
}

export function getPosseFullById(
  posseId: string,
  records: PosseFullRecord[],
): PosseFullRecord | undefined {
  return records.find((record) => record.id === posseId)
}
