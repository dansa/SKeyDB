import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const awakenersPath = path.join(repoRoot, 'src', 'data', 'awakeners-lite.json')
const registryPath = path.join(repoRoot, 'src', 'data', 'id-registry.json')

function toRegistryKey(name) {
  return name.trim().toLowerCase()
}

function sortObjectByValue(record) {
  return Object.fromEntries(Object.entries(record).sort((a, b) => a[1] - b[1]))
}

async function main() {
  const awakeners = JSON.parse(await fs.readFile(awakenersPath, 'utf8'))

  let registry = { awakeners: {}, nextAwakenerId: 1 }
  try {
    registry = JSON.parse(await fs.readFile(registryPath, 'utf8'))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      // Create registry on first run.
    } else {
      throw error
    }
  }

  registry.awakeners = registry.awakeners ?? {}
  registry.nextAwakenerId = Number.isInteger(registry.nextAwakenerId) ? registry.nextAwakenerId : 1

  const usedIds = new Set(Object.values(registry.awakeners))

  for (const awakener of awakeners) {
    const key = toRegistryKey(awakener.name)
    let id = registry.awakeners[key]

    if (!Number.isInteger(id) || id <= 0) {
      while (usedIds.has(registry.nextAwakenerId)) {
        registry.nextAwakenerId += 1
      }
      id = registry.nextAwakenerId
      registry.awakeners[key] = id
      usedIds.add(id)
      registry.nextAwakenerId += 1
    }

    awakener.id = id
  }

  registry.awakeners = sortObjectByValue(registry.awakeners)

  await fs.writeFile(awakenersPath, `${JSON.stringify(awakeners, null, 2)}\n`)
  await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`)

  console.log(`Synced ${awakeners.length} awakeners with stable numeric ids.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

