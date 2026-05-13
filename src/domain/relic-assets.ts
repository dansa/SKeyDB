import {resolvePublicAssetBySourceAssetId} from '@/data-access/public-data/assetRepository'

const relicAssets = import.meta.glob<string>('../assets/relics/*.webp', {
  eager: true,
  import: 'default',
})

function toRelicAssetModulePath(sourcePath: string): string {
  return sourcePath.replace(/^src\/assets\//, '../assets/')
}

function getRelicAssetUrl(sourcePath: string | undefined): string | undefined {
  if (!sourcePath) return undefined
  return relicAssets[toRelicAssetModulePath(sourcePath.replaceAll('\\', '/'))]
}

export function getRelicAssetByAssetId(assetId: string): string | undefined {
  const asset = resolvePublicAssetBySourceAssetId(assetId, {kind: 'relic', slot: 'icon'})
  return getRelicAssetUrl(asset?.availability.path)
}

export function getRelicPortraitAssetByAssetId(assetId: string): string | undefined {
  return getRelicAssetByAssetId(assetId)
}

export function getRelicPortraitAssetByIngameId(ingameId: string): string | undefined {
  return getRelicPortraitAssetByAssetId(`Icon_Creation_Unique_${ingameId.trim().toUpperCase()}`)
}
