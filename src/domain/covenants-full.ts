import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicRecordSnapshots} from '@/data-access/public-data/recordSnapshots'

import {descriptionArgsSchema, type DescriptionArg} from './awakener-source-schema'

export interface CovenantSetEffectRecord {
  set: number
  descriptionTemplate: string
  descriptionArgs: Record<string, DescriptionArg>
}

export interface CovenantFullRecord {
  id: string
  name: string
  assetId: string
  setEffects: CovenantSetEffectRecord[]
  lore?: string
}

const publicCovenantRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  setEffects: z.array(
    z.object({
      set: z.number(),
      descriptionTemplate: z.string(),
      descriptionArgs: descriptionArgsSchema,
    }),
  ),
  lore: z.string().optional(),
})

const publicCovenantRecordsSchema = z.array(publicCovenantRecordSchema)

type PublicCovenantRecord = z.infer<typeof publicCovenantRecordSchema>

let covenantsFullCache: CovenantFullRecord[] | null = null

function getCovenantPublicAssetId(covenantId: string): string {
  const assetIndexId = resolvePublicEntityAsset(covenantId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? '') : ''
}

function adaptPublicCovenant(record: PublicCovenantRecord): CovenantFullRecord {
  return {
    ...record,
    assetId: getCovenantPublicAssetId(record.id),
  }
}

export function getCovenantsFull(): CovenantFullRecord[] {
  if (covenantsFullCache) {
    return covenantsFullCache
  }

  covenantsFullCache = publicCovenantRecordsSchema
    .parse(getPublicRecordSnapshots('covenants'))
    .map(adaptPublicCovenant)
  return covenantsFullCache
}
