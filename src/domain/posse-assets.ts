const posseAssets = import.meta.glob<string>('../assets/posse/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '').replace(/^\d{2}-/, '')
}

const posseAssetById = new Map(
  Object.entries(posseAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

export function getPosseAssetById(posseId: string): string | undefined {
  return posseAssetById.get(posseId)
}
