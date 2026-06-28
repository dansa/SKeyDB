import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import sharp from 'sharp'

export const DEFAULT_CANVAS_SIZE = 64
export const DEFAULT_RENDER_WIDTH = 68
export const DEFAULT_QUALITY = 95
export const DEFAULT_EFFORT = 6

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

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const plan = await createWheelMiniAssetPlan(options)

  console.log(summarizePlan(plan, options))

  if (plan.coverage.missingMiniNames.length > 0) {
    console.log(`Missing minis: ${plan.coverage.missingMiniNames.join(', ')}`)
  }
  if (plan.coverage.extraMiniNames.length > 0) {
    console.log(`Extra minis: ${plan.coverage.extraMiniNames.join(', ')}`)
  }

  if (options.check) {
    if (
      plan.changedItems.length > 0 ||
      plan.coverage.missingMiniNames.length > 0 ||
      plan.coverage.extraMiniNames.length > 0
    ) {
      process.exitCode = 1
    }
    return
  }

  if (options.dryRun) {
    console.log('Dry run only. No files changed.')
    return
  }

  await applyWheelMiniAssetPlan(plan)
  console.log(
    `Wrote ${plan.changedItems.length} wheel mini asset(s). Removed ${plan.coverage.extraMiniNames.length} stale mini asset(s).`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
