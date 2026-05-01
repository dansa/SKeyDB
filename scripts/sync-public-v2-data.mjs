import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const scopes = [
  'awakeners',
  'wheels',
  'covenants',
  'posses',
  'skills',
  'derived-skills',
  'talents',
  'enlightens',
  'overlays',
  'relics',
  'awakener-builds',
]

const defaultSourceRoot = path.resolve(repoRoot, '..', 'MomenTB-Tools', 'outputs', 'public')
const destinationRoot = path.join(repoRoot, 'src', 'data', 'public-v2')

function parseArgs(argv) {
  const options = {
    check: false,
    sourceRoot: process.env.MOMENTB_PUBLIC_DATA_SOURCE || defaultSourceRoot,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--check') {
      options.check = true
      continue
    }
    if (arg === '--source') {
      const source = argv[index + 1]
      if (!source) {
        throw new Error('--source requires a path')
      }
      options.sourceRoot = source
      index += 1
      continue
    }
    if (arg.startsWith('--source=')) {
      options.sourceRoot = arg.slice('--source='.length)
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  options.sourceRoot = path.resolve(repoRoot, options.sourceRoot)
  return options
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

async function readDirectoryFiles(directory) {
  const entries = await fs.readdir(directory, {withFileTypes: true})
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}))
}

async function listExpectedFiles(sourceRoot) {
  const expected = []
  const missing = []

  for (const scope of scopes) {
    for (const segment of ['lite', 'full']) {
      const relativePath = path.join(segment, `${scope}.json`)
      const sourcePath = path.join(sourceRoot, relativePath)
      if (await pathExists(sourcePath)) {
        expected.push(relativePath)
      } else {
        missing.push(relativePath)
      }
    }

    const recordsRelativeDir = path.join('full', `${scope}-records`)
    const recordsSourceDir = path.join(sourceRoot, recordsRelativeDir)
    if (!(await pathExists(recordsSourceDir))) {
      missing.push(recordsRelativeDir)
      continue
    }

    const recordFiles = await readDirectoryFiles(recordsSourceDir)
    if (recordFiles.length === 0) {
      missing.push(`${recordsRelativeDir}${path.sep}*.json`)
      continue
    }

    for (const fileName of recordFiles) {
      expected.push(path.join(recordsRelativeDir, fileName))
    }
  }

  return {expected, missing}
}

async function readFileIfExists(filePath) {
  try {
    return await fs.readFile(filePath)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function filesMatch(sourcePath, destinationPath) {
  const [sourceContent, destinationContent] = await Promise.all([
    fs.readFile(sourcePath),
    readFileIfExists(destinationPath),
  ])
  return destinationContent !== null && sourceContent.equals(destinationContent)
}

async function collectDestinationFiles(root) {
  if (!(await pathExists(root))) {
    return []
  }

  const files = []
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath)
        continue
      }
      if (entry.isFile()) {
        files.push(path.relative(root, entryPath))
      }
    }
  }

  await walk(root)
  return files.sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}))
}

async function removeEmptyDirectories(root) {
  if (!(await pathExists(root))) {
    return
  }

  const entries = await fs.readdir(root, {withFileTypes: true})
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => removeEmptyDirectories(path.join(root, entry.name))),
  )

  if (root === destinationRoot) {
    return
  }

  const remainingEntries = await fs.readdir(root)
  if (remainingEntries.length === 0) {
    await fs.rmdir(root)
  }
}

async function checkSource(sourceRoot) {
  if (!(await pathExists(sourceRoot))) {
    return {expected: [], missing: ['.']}
  }
  return listExpectedFiles(sourceRoot)
}

async function runCheck(sourceRoot) {
  const {expected, missing} = await checkSource(sourceRoot)
  const stale = []

  if (missing.length === 0) {
    for (const relativePath of expected) {
      const sourcePath = path.join(sourceRoot, relativePath)
      const destinationPath = path.join(destinationRoot, relativePath)
      if (!(await filesMatch(sourcePath, destinationPath))) {
        stale.push(relativePath)
      }
    }
  }

  const expectedSet = new Set(expected)
  const extra = (await collectDestinationFiles(destinationRoot)).filter(
    (relativePath) => !expectedSet.has(relativePath),
  )

  if (missing.length > 0 || stale.length > 0 || extra.length > 0) {
    console.error(
      `public-v2 check failed: missing=${missing.length} stale=${stale.length} extra=${extra.length}`,
    )
    for (const [label, files] of [
      ['missing source', missing],
      ['stale destination', stale],
      ['extra destination', extra],
    ]) {
      for (const file of files.slice(0, 20)) {
        console.error(`  ${label}: ${file}`)
      }
      if (files.length > 20) {
        console.error(`  ${label}: ... ${files.length - 20} more`)
      }
    }
    process.exitCode = 1
    return
  }

  console.log(`public-v2 check passed: ${expected.length} files current`)
}

async function syncFiles(sourceRoot) {
  const {expected, missing} = await checkSource(sourceRoot)
  if (missing.length > 0) {
    throw new Error(`Missing required public source outputs: ${missing.join(', ')}`)
  }

  const expectedSet = new Set(expected)
  const existingDestinationFiles = await collectDestinationFiles(destinationRoot)
  let copied = 0
  let unchanged = 0
  let removed = 0

  for (const relativePath of expected) {
    const sourcePath = path.join(sourceRoot, relativePath)
    const destinationPath = path.join(destinationRoot, relativePath)
    if (await filesMatch(sourcePath, destinationPath)) {
      unchanged += 1
      continue
    }

    await fs.mkdir(path.dirname(destinationPath), {recursive: true})
    await fs.copyFile(sourcePath, destinationPath)
    copied += 1
  }

  for (const relativePath of existingDestinationFiles) {
    if (expectedSet.has(relativePath)) {
      continue
    }
    await fs.rm(path.join(destinationRoot, relativePath), {force: true})
    removed += 1
  }

  await removeEmptyDirectories(destinationRoot)

  console.log(
    `public-v2 sync complete: copied=${copied} unchanged=${unchanged} removed=${removed} total=${expected.length}`,
  )
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.check) {
    await runCheck(options.sourceRoot)
    return
  }
  await syncFiles(options.sourceRoot)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
