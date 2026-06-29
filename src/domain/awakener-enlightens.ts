import {getPublicEnlightenCatalogRecords} from '@/data-access/public-data/catalogScopes/enlightensCatalog'

import {
  awakenerEnlightensDatasetSchema,
  type AwakenerEnlightenRecord,
} from './awakener-source-schema'
import {
  adaptPublicV3EnlightenRecord,
  parsePublicV3EnlightenCatalogRecord,
} from './public-v3-awakener-record-adapters'

let awakenerEnlightensCache: AwakenerEnlightenRecord[] | null = null

export function getAwakenerEnlightens(): AwakenerEnlightenRecord[] {
  if (awakenerEnlightensCache) {
    return awakenerEnlightensCache
  }

  awakenerEnlightensCache = awakenerEnlightensDatasetSchema.parse(
    getPublicEnlightenCatalogRecords().map((record) =>
      adaptPublicV3EnlightenRecord(parsePublicV3EnlightenCatalogRecord(record)),
    ),
  )
  return awakenerEnlightensCache
}

export function getAwakenerEnlightenById(
  enlightenId: string,
  enlightens: AwakenerEnlightenRecord[],
): AwakenerEnlightenRecord | undefined {
  return enlightens.find((entry) => entry.id === enlightenId)
}

export function getAwakenerEnlightensForAwakener(
  awakenerId: number,
  enlightens: AwakenerEnlightenRecord[],
): AwakenerEnlightenRecord[] {
  return enlightens.filter((entry) => entry.ownerAwakenerId === awakenerId)
}
