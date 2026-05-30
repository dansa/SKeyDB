import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

import {awakenerOverlaysDatasetSchema, type AwakenerOverlayRecord} from './awakener-source-schema'
import {
  adaptPublicV3OverlayRecord,
  parsePublicV3OverlayCatalogRecord,
} from './public-v3-awakener-record-adapters'

let awakenerOverlaysCache: AwakenerOverlayRecord[] | null = null
let overlayByNameCache: Map<string, AwakenerOverlayRecord> | null = null

function buildOverlayLookup(overlays: AwakenerOverlayRecord[]): Map<string, AwakenerOverlayRecord> {
  const byName = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlays) {
    byName.set(overlay.displayName, overlay)
    for (const alias of overlay.aliases) {
      byName.set(alias, overlay)
    }
  }

  return byName
}

export function getAwakenerOverlays(): AwakenerOverlayRecord[] {
  if (awakenerOverlaysCache) {
    return awakenerOverlaysCache
  }

  awakenerOverlaysCache = awakenerOverlaysDatasetSchema.parse(
    getPublicCatalogRecords('overlays').map((record) =>
      adaptPublicV3OverlayRecord(parsePublicV3OverlayCatalogRecord(record)),
    ),
  )
  overlayByNameCache = buildOverlayLookup(awakenerOverlaysCache)
  return awakenerOverlaysCache
}

export function resolveAwakenerOverlay(
  name: string,
  overlays: AwakenerOverlayRecord[] = getAwakenerOverlays(),
): AwakenerOverlayRecord | null {
  if (!overlayByNameCache || overlays !== awakenerOverlaysCache) {
    overlayByNameCache = buildOverlayLookup(overlays)
  }
  return overlayByNameCache.get(name) ?? null
}
