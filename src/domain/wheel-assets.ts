const wheelAssets = import.meta.glob<string>('../assets/wheels/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

const wheelAssetByAssetId = new Map(
  Object.entries(wheelAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

export function getWheelAssetById(wheelId: string): string | undefined {
  return wheelAssetByAssetId.get(`Weapon_Full_${wheelId}`)
}
