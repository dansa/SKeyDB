const cardAssets = import.meta.glob<string>('../assets/awk-cards/*.webp', {
  eager: true,
  import: 'default',
})

const portraitAssets = import.meta.glob<string>('../assets/awk-portraits/*.webp', {
  eager: true,
  import: 'default',
})

const explicitSlugByAwakenerName: Record<string, string> = {
  '24': 'mason',
  jenkins: 'jenkin',
}

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

function trimEdgeDashes(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && value[start] === '-') {
    start += 1
  }
  while (end > start && value[end - 1] === '-') {
    end -= 1
  }
  return value.slice(start, end)
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

  return trimEdgeDashes(
    normalizedName
      .replace(/['"]/g, '')
      .replace(/[:\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-'),
  )
}

export function getAwakenerCardAsset(name: string): string | undefined {
  return cardAssetBySlug.get(toAwakenerAssetSlug(name))
}

export function getAwakenerPortraitAsset(name: string): string | undefined {
  return portraitAssetBySlug.get(toAwakenerAssetSlug(name))
}
