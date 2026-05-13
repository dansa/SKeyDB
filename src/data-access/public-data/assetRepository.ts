import assetsIndexJson from '@/data/public-v3/indexes/assets.json'

import type {EntityKind, PublicAssetRecord, PublicAssetsIndex, PublicAssetSlot} from './contract'
import {publicAssetsIndexSchema} from './schemas'

let assetsIndexCache: PublicAssetsIndex | undefined

function getPublicAssetsIndex(): PublicAssetsIndex {
  assetsIndexCache ??= publicAssetsIndexSchema.parse(assetsIndexJson)
  return assetsIndexCache
}

export function resolvePublicAsset(assetId: string): PublicAssetRecord | undefined {
  return getPublicAssetsIndex().assets[assetId]
}

export function resolvePublicAssetBySourceAssetId(
  sourceAssetId: string,
  filters: {kind?: EntityKind; slot?: PublicAssetSlot} = {},
): PublicAssetRecord | undefined {
  return Object.values(getPublicAssetsIndex().assets).find(
    (asset) =>
      asset.assetId === sourceAssetId &&
      (!filters.kind || asset.kind === filters.kind) &&
      (!filters.slot || asset.slot === filters.slot),
  )
}

export function resolvePublicEntityAsset(
  entityId: string,
  slot: PublicAssetSlot,
): string | undefined {
  return getPublicAssetsIndex().entities[entityId]?.[slot]
}
