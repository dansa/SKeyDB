import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const possesPath = path.join(repoRoot, 'src', 'data', 'posses-lite.json')
const posseAssetsDir = path.join(repoRoot, 'src', 'assets', 'posse')

function parseAssetMeta(filename) {
  const match = filename.match(/^(\d{2})-(.+)\.png$/i)
  if (!match) {
    return null
  }
  return {
    index: Number.parseInt(match[1], 10),
    slug: match[2].toLowerCase(),
  }
}

async function main() {
  const posses = JSON.parse(await fs.readFile(possesPath, 'utf8'))
  const assetFilenames = (await fs.readdir(posseAssetsDir)).filter((name) => name.toLowerCase().endsWith('.png'))

  const indexBySlug = new Map()
  for (const filename of assetFilenames) {
    const parsed = parseAssetMeta(filename)
    if (!parsed) {
      continue
    }
    if (parsed.slug === 'temposse') {
      continue
    }
    if (indexBySlug.has(parsed.slug)) {
      throw new Error(`Duplicate posse asset slug in numbered files: ${parsed.slug}`)
    }
    indexBySlug.set(parsed.slug, parsed.index)
  }

  const missing = []
  for (const posse of posses) {
    const index = indexBySlug.get(posse.id.toLowerCase())
    if (index === undefined) {
      missing.push(posse.id)
      continue
    }
    posse.index = index
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing numbered asset files for posses: ${missing.join(', ')}. ` +
        'Add matching NN-<id>.png files or adjust posse ids.',
    )
  }

  const seenIndexes = new Set()
  for (const posse of posses) {
    if (seenIndexes.has(posse.index)) {
      throw new Error(`Duplicate posse index detected in data: ${posse.index}`)
    }
    seenIndexes.add(posse.index)
  }

  posses.sort((a, b) => a.index - b.index)

  await fs.writeFile(possesPath, `${JSON.stringify(posses, null, 2)}\n`)
  console.log(`Synced ${posses.length} posses with numeric indices from asset filenames.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
