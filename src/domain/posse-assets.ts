const posseAssets = import.meta.glob('../assets/posse/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.png$/i, '')
}

const posseAssetBySlug = new Map(
  Object.entries(posseAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

export function getPosseAssetBySlug(assetSlug: string): string | undefined {
  return posseAssetBySlug.get(assetSlug)
}
