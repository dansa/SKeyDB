const portraitRelicAssets = import.meta.glob<string>('../assets/relics/portraits/*.png', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.png$/i, '')
}

const portraitRelicAssetById = new Map(
  Object.entries(portraitRelicAssets).map(([assetPath, url]) => [
    basenameWithoutExt(assetPath),
    url,
  ]),
)

export function getRelicPortraitAssetByAssetId(assetId: string): string | undefined {
  return portraitRelicAssetById.get(assetId)
}

export function getRelicPortraitAssetByIngameId(ingameId: string): string | undefined {
  return getRelicPortraitAssetByAssetId(`Icon_Creation_Unique_${ingameId.trim().toUpperCase()}`)
}
