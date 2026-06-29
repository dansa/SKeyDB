import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import sharp from 'sharp'

export const DEFAULT_CANVAS_SIZE = 64
export const DEFAULT_RENDER_WIDTH = 68
export const DEFAULT_QUALITY = 95
export const DEFAULT_EFFORT = 6
export const MINI_MANIFEST_FILE_NAME = 'wheel-mini-assets.manifest.json'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const defaultWheelsDir = path.join(repoRoot, 'src', 'assets', 'wheels')
const defaultMiniDir = path.join(defaultWheelsDir, 'Mini')

function parseNumberOption(rawValue, optionName) {
  const value = Number(rawValue)
  if (!Number.isFinite(value)) {
    throw new Error(`${optionName} must be a number.`)
  }
  return value
}

export function parseArgs(argv) {
  const options = {
    check: false,
    dryRun: false,
    wheelsDir: defaultWheelsDir,
    miniDir: defaultMiniDir,
    canvasSize: DEFAULT_CANVAS_SIZE,
    renderWidth: DEFAULT_RENDER_WIDTH,
    quality: DEFAULT_QUALITY,
    effort: DEFAULT_EFFORT,
    sharpen: true,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--check') {
      options.check = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--wheels-dir') {
      const next = argv[index + 1]
      if (!next) {
        throw new Error('--wheels-dir requires a path.')
      }
      options.wheelsDir = path.resolve(repoRoot, next)
      index += 1
    } else if (arg === '--mini-dir') {
      const next = argv[index + 1]
      if (!next) {
        throw new Error('--mini-dir requires a path.')
      }
      options.miniDir = path.resolve(repoRoot, next)
      index += 1
    } else if (arg === '--canvas-size') {
      options.canvasSize = parseNumberOption(argv[index + 1], '--canvas-size')
      index += 1
    } else if (arg === '--render-width') {
      options.renderWidth = parseNumberOption(argv[index + 1], '--render-width')
      index += 1
    } else if (arg === '--quality') {
      options.quality = parseNumberOption(argv[index + 1], '--quality')
      index += 1
    } else if (arg === '--effort') {
      options.effort = parseNumberOption(argv[index + 1], '--effort')
      index += 1
    } else if (arg === '--no-sharpen') {
      options.sharpen = false
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (!Number.isInteger(options.canvasSize) || options.canvasSize <= 0) {
    throw new Error('--canvas-size must be a positive integer.')
  }
  if (!Number.isInteger(options.renderWidth) || options.renderWidth < options.canvasSize) {
    throw new Error('--render-width must be an integer greater than or equal to --canvas-size.')
  }
  if (options.quality < 1 || options.quality > 100) {
    throw new Error('--quality must be between 1 and 100.')
  }
  if (options.effort < 0 || options.effort > 6) {
    throw new Error('--effort must be between 0 and 6.')
  }

  return options
}

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/')
}

export function fullWheelNameToMiniName(fullWheelName) {
  if (!/^Weapon_Full_.*\.webp$/i.test(fullWheelName)) {
    throw new Error(`Unexpected full wheel asset name: ${fullWheelName}`)
  }
  return fullWheelName.replace(/^Weapon_Full_/i, 'Weapon_Mini_')
}

async function collectWebpNames(dir, pattern) {
  const entries = await fs.readdir(dir, {withFileTypes: true})
  return entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => entry.name)
    .sort()
}

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath)
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function hashFile(filePath) {
  return hashBuffer(await fs.readFile(filePath))
}

function getManifestPath(miniDir) {
  return path.join(miniDir, MINI_MANIFEST_FILE_NAME)
}

function getGeneratorManifestOptions(options) {
  return {
    canvasSize: options.canvasSize ?? DEFAULT_CANVAS_SIZE,
    renderWidth: options.renderWidth ?? DEFAULT_RENDER_WIDTH,
    quality: options.quality ?? DEFAULT_QUALITY,
    effort: options.effort ?? DEFAULT_EFFORT,
    sharpen: options.sharpen ?? true,
  }
}

async function readWheelMiniManifest(miniDir) {
  const manifest = await readIfExists(getManifestPath(miniDir))
  if (!manifest) {
    return null
  }

  return JSON.parse(manifest.toString('utf8'))
}

export async function collectWheelMiniAssetCoverage({
  wheelsDir = defaultWheelsDir,
  miniDir = defaultMiniDir,
} = {}) {
  const fullWheelNames = await collectWebpNames(wheelsDir, /^Weapon_Full_.*\.webp$/i)
  const miniWheelNames = await collectWebpNames(miniDir, /^Weapon_Mini_.*\.webp$/i)
  const expectedMiniNames = fullWheelNames.map(fullWheelNameToMiniName)
  const fullWheelNameSet = new Set(fullWheelNames)
  const miniWheelNameSet = new Set(miniWheelNames)

  return {
    fullWheelNames,
    miniWheelNames,
    missingMiniNames: expectedMiniNames.filter((name) => !miniWheelNameSet.has(name)),
    extraMiniNames: miniWheelNames.filter(
      (name) => !fullWheelNameSet.has(name.replace(/^Weapon_Mini_/i, 'Weapon_Full_')),
    ),
  }
}

export async function createWheelMiniManifest(plan, options = {}) {
  const assets = await Promise.all(
    plan.items.map(async (item) => ({
      full: path.basename(item.inputPath),
      fullSha256: await hashFile(item.inputPath),
      mini: path.basename(item.outputPath),
      miniSha256: hashBuffer(item.output),
    })),
  )

  return {
    schemaVersion: 1,
    generator: getGeneratorManifestOptions(options),
    assets,
  }
}

export async function writeWheelMiniManifest(plan, options = {}) {
  const manifest = await createWheelMiniManifest(plan, options)
  await fs.writeFile(getManifestPath(plan.miniDir), `${JSON.stringify(manifest, null, 2)}\n`)
}

export async function validateWheelMiniAssets({
  wheelsDir = defaultWheelsDir,
  miniDir = defaultMiniDir,
  canvasSize = DEFAULT_CANVAS_SIZE,
  ...options
} = {}) {
  const coverage = await collectWheelMiniAssetCoverage({wheelsDir, miniDir})
  const manifest = await readWheelMiniManifest(miniDir)
  const expectedGenerator = getGeneratorManifestOptions({canvasSize, ...options})
  const invalidMiniItems = []
  const manifestIssues = []
  const staleManifestItems = []
  const manifestByMiniName = new Map()

  if (!manifest) {
    manifestIssues.push('Missing wheel mini manifest.')
  } else if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) {
    manifestIssues.push('Wheel mini manifest has an unsupported schema.')
  } else {
    const manifestGenerator = manifest.generator ?? {}
    for (const [key, expectedValue] of Object.entries(expectedGenerator)) {
      if (manifestGenerator[key] !== expectedValue) {
        manifestIssues.push(
          `Wheel mini manifest generator ${key} is ${String(manifestGenerator[key])}, expected ${String(expectedValue)}.`,
        )
      }
    }

    for (const asset of manifest.assets) {
      if (!asset || typeof asset.mini !== 'string' || typeof asset.full !== 'string') {
        manifestIssues.push('Wheel mini manifest contains an invalid asset entry.')
        continue
      }
      manifestByMiniName.set(asset.mini, asset)
    }
  }

  for (const miniWheelName of coverage.miniWheelNames) {
    const miniPath = path.join(miniDir, miniWheelName)
    try {
      const metadata = await sharp(miniPath).metadata()
      const isExpectedFormat = metadata.format === 'webp'
      const isExpectedSize = metadata.width === canvasSize && metadata.height === canvasSize

      if (!isExpectedFormat || !isExpectedSize) {
        invalidMiniItems.push({
          miniWheelName,
          format: metadata.format ?? 'unknown',
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
        })
      }
    } catch (error) {
      invalidMiniItems.push({
        miniWheelName,
        format: 'unreadable',
        width: 0,
        height: 0,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  for (const fullWheelName of coverage.fullWheelNames) {
    const miniWheelName = fullWheelNameToMiniName(fullWheelName)
    const manifestEntry = manifestByMiniName.get(miniWheelName)

    if (!manifestEntry) {
      manifestIssues.push(`Wheel mini manifest is missing ${miniWheelName}.`)
      continue
    }

    if (manifestEntry.full !== fullWheelName) {
      manifestIssues.push(
        `Wheel mini manifest maps ${miniWheelName} to ${manifestEntry.full}, expected ${fullWheelName}.`,
      )
      continue
    }

    const fullSha256 = await hashFile(path.join(wheelsDir, fullWheelName))
    const miniSha256 = await hashFile(path.join(miniDir, miniWheelName))
    if (manifestEntry.fullSha256 !== fullSha256 || manifestEntry.miniSha256 !== miniSha256) {
      staleManifestItems.push({
        miniWheelName,
        fullWheelName,
        fullChanged: manifestEntry.fullSha256 !== fullSha256,
        miniChanged: manifestEntry.miniSha256 !== miniSha256,
      })
    }
  }

  for (const miniWheelName of manifestByMiniName.keys()) {
    if (!coverage.miniWheelNames.includes(miniWheelName)) {
      manifestIssues.push(`Wheel mini manifest has stale entry ${miniWheelName}.`)
    }
  }

  return {
    coverage,
    invalidMiniItems,
    manifestIssues,
    staleManifestItems,
  }
}

export async function createWheelMiniBuffer(inputPath, options = {}) {
  const canvasSize = options.canvasSize ?? DEFAULT_CANVAS_SIZE
  const renderWidth = options.renderWidth ?? DEFAULT_RENDER_WIDTH
  const quality = options.quality ?? DEFAULT_QUALITY
  const effort = options.effort ?? DEFAULT_EFFORT
  const shouldSharpen = options.sharpen ?? true
  const horizontalOverflow = renderWidth - canvasSize

  if (horizontalOverflow < 0) {
    throw new Error('renderWidth must be greater than or equal to canvasSize.')
  }

  let pipeline = sharp(inputPath)
    .resize({
      width: renderWidth,
      height: canvasSize,
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.cubic,
    })
    .extract({
      left: Math.floor(horizontalOverflow / 2),
      top: 0,
      width: canvasSize,
      height: canvasSize,
    })

  if (shouldSharpen) {
    pipeline = pipeline.sharpen({sigma: 1})
  }

  return pipeline
    .webp({
      quality,
      effort,
    })
    .toBuffer()
}

export async function createWheelMiniAssetPlan(options = {}) {
  const wheelsDir = options.wheelsDir ?? defaultWheelsDir
  const miniDir = options.miniDir ?? defaultMiniDir
  const coverage = await collectWheelMiniAssetCoverage({wheelsDir, miniDir})
  const items = []

  for (const fullWheelName of coverage.fullWheelNames) {
    const miniWheelName = fullWheelNameToMiniName(fullWheelName)
    const inputPath = path.join(wheelsDir, fullWheelName)
    const outputPath = path.join(miniDir, miniWheelName)
    const output = await createWheelMiniBuffer(inputPath, options)
    const current = await readIfExists(outputPath)

    items.push({
      inputPath,
      outputPath,
      relativeInputPath: normalizeRelativePath(path.relative(repoRoot, inputPath)),
      relativeOutputPath: normalizeRelativePath(path.relative(repoRoot, outputPath)),
      currentBytes: current?.byteLength ?? 0,
      outputBytes: output.byteLength,
      changed: !current || !current.equals(output),
      output,
    })
  }

  return {
    miniDir,
    coverage,
    items,
    changedItems: items.filter((item) => item.changed),
  }
}

export async function applyWheelMiniAssetPlan(plan) {
  await fs.mkdir(plan.miniDir, {recursive: true})
  for (const item of plan.changedItems) {
    await fs.writeFile(item.outputPath, item.output)
  }
  for (const miniWheelName of plan.coverage.extraMiniNames) {
    await fs.rm(path.join(plan.miniDir, miniWheelName))
  }
}

function summarizePlan(plan, options) {
  const currentBytes = plan.items.reduce((total, item) => total + item.currentBytes, 0)
  const outputBytes = plan.items.reduce((total, item) => total + item.outputBytes, 0)
  return [
    `Generated ${plan.items.length} wheel mini asset(s).`,
    `Changed: ${plan.changedItems.length}. Missing: ${plan.coverage.missingMiniNames.length}. Extra: ${plan.coverage.extraMiniNames.length}.`,
    `Canvas: ${options.canvasSize}x${options.canvasSize}. Render width: ${options.renderWidth}. Sharpen: ${options.sharpen ? 'yes' : 'no'}.`,
    `Current total: ${(currentBytes / 1024).toFixed(1)} KiB. Generated total: ${(outputBytes / 1024).toFixed(1)} KiB.`,
  ].join('\n')
}

function summarizeValidation(validation, options) {
  return [
    `Validated ${validation.coverage.miniWheelNames.length} wheel mini asset(s).`,
    `Missing: ${validation.coverage.missingMiniNames.length}. Extra: ${validation.coverage.extraMiniNames.length}. Invalid: ${validation.invalidMiniItems.length}. Manifest issues: ${validation.manifestIssues.length}. Stale: ${validation.staleManifestItems.length}.`,
    `Expected: ${options.canvasSize}x${options.canvasSize} webp.`,
  ].join('\n')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.check) {
    const validation = await validateWheelMiniAssets(options)
    console.log(summarizeValidation(validation, options))

    if (validation.coverage.missingMiniNames.length > 0) {
      console.log(`Missing minis: ${validation.coverage.missingMiniNames.join(', ')}`)
    }
    if (validation.coverage.extraMiniNames.length > 0) {
      console.log(`Extra minis: ${validation.coverage.extraMiniNames.join(', ')}`)
    }
    if (validation.invalidMiniItems.length > 0) {
      console.log(
        `Invalid minis: ${validation.invalidMiniItems
          .map((item) => `${item.miniWheelName} (${item.format}, ${item.width}x${item.height})`)
          .join(', ')}`,
      )
    }
    if (validation.manifestIssues.length > 0) {
      console.log(`Manifest issues: ${validation.manifestIssues.join(' ')}`)
    }
    if (validation.staleManifestItems.length > 0) {
      console.log(
        `Stale minis: ${validation.staleManifestItems
          .map((item) => {
            const changedParts = [
              item.fullChanged ? 'full' : '',
              item.miniChanged ? 'mini' : '',
            ].filter(Boolean)
            return `${item.miniWheelName} (${changedParts.join('+')} hash changed)`
          })
          .join(', ')}`,
      )
    }

    if (
      validation.coverage.missingMiniNames.length > 0 ||
      validation.coverage.extraMiniNames.length > 0 ||
      validation.invalidMiniItems.length > 0 ||
      validation.manifestIssues.length > 0 ||
      validation.staleManifestItems.length > 0
    ) {
      process.exitCode = 1
    }
    return
  }

  const plan = await createWheelMiniAssetPlan(options)

  console.log(summarizePlan(plan, options))

  if (plan.coverage.missingMiniNames.length > 0) {
    console.log(`Missing minis: ${plan.coverage.missingMiniNames.join(', ')}`)
  }
  if (plan.coverage.extraMiniNames.length > 0) {
    console.log(`Extra minis: ${plan.coverage.extraMiniNames.join(', ')}`)
  }

  if (options.dryRun) {
    console.log('Dry run only. No files changed.')
    return
  }

  await applyWheelMiniAssetPlan(plan)
  await writeWheelMiniManifest(plan, options)
  console.log(
    `Wrote ${plan.changedItems.length} wheel mini asset(s). Removed ${plan.coverage.extraMiniNames.length} stale mini asset(s). Updated ${MINI_MANIFEST_FILE_NAME}.`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
