import {resolvePublicAssetBySourceAssetId} from '@/data-access/public-data/assetRepository'

const orisonAssets = import.meta.glob<string>('../assets/icons/*.webp', {
  eager: true,
  import: 'default',
})

function getAssetUrl(sourcePath: string | undefined): string | undefined {
  if (!sourcePath) return undefined
  const modulePath = sourcePath.replaceAll('\\', '/').replace(/^src\/assets\//, '../assets/')
  return orisonAssets[modulePath]
}

export function getOrisonAssetByAssetId(assetId: string): string | undefined {
  const asset = resolvePublicAssetBySourceAssetId(assetId, {kind: 'orison', slot: 'icon'})
  return getAssetUrl(asset?.availability.path)
}
