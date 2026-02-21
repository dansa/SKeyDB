import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const wheelsAssetsDir = path.join(repoRoot, 'src', 'assets', 'wheels')
const wheelsDataPath = path.join(repoRoot, 'src', 'data', 'wheels-lite.json')

function parseWheelFile(filename) {
  const match = filename.match(/^Weapon_Full_(.+)\.png$/i)
  if (!match) {
    return null
  }
  const id = match[1]
  return {
    id,
    assetId: `Weapon_Full_${id}`,
  }
}

async function main() {
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
    wheels.push(parsed)
  }

  await fs.writeFile(wheelsDataPath, `${JSON.stringify(wheels, null, 2)}\n`)
  console.log(`Synced ${wheels.length} wheels from asset filenames.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

