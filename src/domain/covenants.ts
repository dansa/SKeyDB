import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicV3CovenantCatalogRecordSchema = z
  .object({
    id: z.string().regex(/^covenant-\d{4}$/),
    name: nonEmptyStringSchema,
    lineupToken: nonEmptyStringSchema,
  })
  .loose()

export interface Covenant {
  id: string
  assetId: string
  name: string
  lineupToken: string
}

function getCovenantPublicAssetId(covenantId: string): string {
  const assetIndexId = resolvePublicEntityAsset(covenantId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? 'TBD') : 'TBD'
}

const parsedCovenants = getPublicCatalogRecords('covenants').map((record): Covenant => {
  const covenant = publicV3CovenantCatalogRecordSchema.parse(record)
  return {
    id: covenant.id,
    assetId: getCovenantPublicAssetId(covenant.id),
    name: covenant.name,
    lineupToken: covenant.lineupToken,
  }
})

export function getCovenants(): Covenant[] {
  return parsedCovenants
}
