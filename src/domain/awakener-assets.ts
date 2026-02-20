const cardAssets = import.meta.glob('../assets/awk-cards/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const portraitAssets = import.meta.glob('../assets/awk-portraits/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const explicitSlugByAwakenerName: Record<string, string> = {
  '24': 'mason',
  jenkins: 'jenkin',
}

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.png$/i, '')
}

function indexAssetMap(assets: Record<string, string>): Map<string, string> {
  return new Map(
    Object.entries(assets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
  )
}

const cardAssetBySlug = indexAssetMap(cardAssets)
const portraitAssetBySlug = indexAssetMap(portraitAssets)

export function toAwakenerAssetSlug(name: string): string {
  const normalizedName = name.trim().toLowerCase()
  const explicit = explicitSlugByAwakenerName[normalizedName]
  if (explicit) {
    return explicit
  }

  return normalizedName
    .replace(/['"]/g, '')
    .replace(/[:\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getAwakenerCardAsset(name: string): string | undefined {
  return cardAssetBySlug.get(toAwakenerAssetSlug(name))
}

export function getAwakenerPortraitAsset(name: string): string | undefined {
  return portraitAssetBySlug.get(toAwakenerAssetSlug(name))
}
