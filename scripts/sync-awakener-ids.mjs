import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const awakenersPath = path.join(repoRoot, 'src', 'data', 'awakeners-lite.json')

async function main() {
  const awakeners = JSON.parse(await fs.readFile(awakenersPath, 'utf8'))
  const usedIds = new Set()
  let nextAwakenerId = 1

  for (const awakener of awakeners) {
    const id = awakener.id

    if (!Number.isInteger(id) || id <= 0) {
      continue
    }
    if (usedIds.has(id)) {
      throw new Error(`Duplicate awakener id detected in data: ${id}`)
    }
    usedIds.add(id)
    nextAwakenerId = Math.max(nextAwakenerId, id + 1)
  }

  for (const awakener of awakeners) {
    if (Number.isInteger(awakener.id) && awakener.id > 0) {
      continue
    }
    while (usedIds.has(nextAwakenerId)) {
      nextAwakenerId += 1
    }
    awakener.id = nextAwakenerId
    usedIds.add(nextAwakenerId)
    nextAwakenerId += 1
  }

  await fs.writeFile(awakenersPath, `${JSON.stringify(awakeners, null, 2)}\n`)

  console.log(`Synced ${awakeners.length} awakeners with stable numeric ids from current data.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
