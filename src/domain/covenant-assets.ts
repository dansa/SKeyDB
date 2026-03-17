const covenantAssets = import.meta.glob<string>('../assets/covenants/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

const covenantAssetByAssetId = new Map(
  Object.entries(covenantAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

export function getCovenantAssetById(covenantId: string): string | undefined {
  return covenantAssetByAssetId.get(`Icon_Trinket_${covenantId}`)
}
