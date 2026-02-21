const wheelAssets = import.meta.glob('../assets/wheels/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.png$/i, '')
}

const wheelAssetByAssetId = new Map(
  Object.entries(wheelAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

export function getWheelAssetById(wheelId: string): string | undefined {
  return wheelAssetByAssetId.get(`Weapon_Full_${wheelId}`)
}

