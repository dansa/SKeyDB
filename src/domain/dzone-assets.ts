const monsterPreviewAssets = import.meta.glob<string>('../assets/monster-preview/*.webp', {
  eager: true,
  import: 'default',
})

function getAssetNameFromModulePath(modulePath: string): string {
  const filename = modulePath.split('/').at(-1) ?? ''
  return filename.replace(/\.webp$/, '')
}

export function buildDzoneMonsterPreviewAssetMap(
  assetsByModulePath: Record<string, string>,
): Map<string, string> {
  const assetByName = new Map<string, string>()

  for (const [modulePath, assetUrl] of Object.entries(assetsByModulePath)) {
    const assetName = getAssetNameFromModulePath(modulePath)
    if (assetByName.has(assetName)) {
      throw new Error(`Duplicate D-zone monster preview asset basename "${assetName}".`)
    }
    assetByName.set(assetName, assetUrl)
  }

  return assetByName
}

const monsterPreviewAssetByName = buildDzoneMonsterPreviewAssetMap(monsterPreviewAssets)

export function getDzoneMonsterPreviewAssetNames(): string[] {
  return [...monsterPreviewAssetByName.keys()]
}

export function getDzoneMonsterPreviewAsset(assetName: string | undefined): string | undefined {
  if (!assetName) return undefined
  return monsterPreviewAssetByName.get(assetName.trim())
}
