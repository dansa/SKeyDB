import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const wheelsAssetsDir = path.join(repoRoot, 'src', 'assets', 'wheels')
const wheelsDataPath = path.join(repoRoot, 'src', 'data', 'wheels-lite.json')

function getWheelRarity(id) {
  if (id.startsWith('SR')) {
    return 'SR'
  }
  if (id.startsWith('P') || id.startsWith('N')) {
    return 'R'
  }
  return 'SSR'
}

function getWheelFaction(id) {
  if (id === 'D12') {
    return 'CHAOS'
  }
  if (id.startsWith('B')) {
    return 'CARO'
  }
  if (id.startsWith('C')) {
    return 'CHAOS'
  }
  if (id.startsWith('D')) {
    return 'ULTRA'
  }
  if (id.startsWith('O')) {
    return 'AEQUOR'
  }
  return 'NEUTRAL'
}

function parseWheelFile(filename) {
  const match = filename.match(/^Weapon_Full_(.+)\.png$/i)
  if (!match) {
    return null
  }
  const id = match[1]
  return {
    id,
    assetId: `Weapon_Full_${id}`,
    name: id,
    rarity: getWheelRarity(id),
    faction: getWheelFaction(id),
    awakener: '',
    mainstatKey: '',
  }
}

async function main() {
  const existingWheelsRaw = await fs.readFile(wheelsDataPath, 'utf8')
  const existingWheels = JSON.parse(existingWheelsRaw)
  const existingById = new Map(existingWheels.map((wheel) => [wheel.id, wheel]))

  const wheelFiles = (await fs.readdir(wheelsAssetsDir))
    .filter((filename) => filename.toLowerCase().endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  const wheels = []
  const seen = new Set()
  for (const filename of wheelFiles) {
    const parsed = parseWheelFile(filename)
    if (!parsed) {
      continue
    }
    if (seen.has(parsed.id)) {
      throw new Error(`Duplicate wheel id from assets: ${parsed.id}`)
    }
    seen.add(parsed.id)
    const existing = existingById.get(parsed.id)
    wheels.push({
      ...parsed,
      name: typeof existing?.name === 'string' && existing.name.trim().length > 0 ? existing.name : parsed.name,
      awakener: typeof existing?.awakener === 'string' ? existing.awakener : parsed.awakener,
      mainstatKey: typeof existing?.mainstatKey === 'string' ? existing.mainstatKey : parsed.mainstatKey,
    })
  }

  await fs.writeFile(wheelsDataPath, `${JSON.stringify(wheels, null, 2)}\n`)
  console.log(`Synced ${wheels.length} wheels from asset filenames.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

