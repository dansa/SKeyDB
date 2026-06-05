import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

const DEFAULT_QUALITY = 90
const DEFAULT_EFFORT = 6
const DEFAULT_LOSSY_MIN_BYTES = 64 * 1024
const DEFAULT_MIN_SAVINGS_RATIO = 0

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const defaultAssetsDir = path.join(repoRoot, 'src', 'assets')
const rewriteExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
])

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/')
}

function parseNumberOption(rawValue, optionName) {
  const value = Number(rawValue)
  if (!Number.isFinite(value)) {
    throw new Error(`${optionName} must be a number.`)
  }
  return value
}

export function parseArgs(argv) {
  const options = {
    dryRun: false,
    assetsDir: defaultAssetsDir,
    quality: DEFAULT_QUALITY,
    effort: DEFAULT_EFFORT,
    lossyMinBytes: DEFAULT_LOSSY_MIN_BYTES,
    minSavingsRatio: DEFAULT_MIN_SAVINGS_RATIO,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--dir') {
      const next = argv[index + 1]
      if (!next) {
        throw new Error('--dir requires a path.')
      }
      options.assetsDir = path.resolve(repoRoot, next)
      index += 1
    } else if (arg === '--quality') {
      options.quality = parseNumberOption(argv[index + 1], '--quality')
      index += 1
    } else if (arg === '--effort') {
      options.effort = parseNumberOption(argv[index + 1], '--effort')
      index += 1
    } else if (arg === '--lossy-min-kib') {
      options.lossyMinBytes = parseNumberOption(argv[index + 1], '--lossy-min-kib') * 1024
      index += 1
    } else if (arg === '--min-savings') {
      options.minSavingsRatio = parseNumberOption(argv[index + 1], '--min-savings') / 100
      index += 1
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (options.quality < 1 || options.quality > 100) {
    throw new Error('--quality must be between 1 and 100.')
  }
  if (options.effort < 0 || options.effort > 6) {
    throw new Error('--effort must be between 0 and 6.')
  }
  if (options.lossyMinBytes < 0) {
    throw new Error('--lossy-min-kib must be 0 or greater.')
  }
  if (options.minSavingsRatio < 0 || options.minSavingsRatio >= 1) {
    throw new Error('--min-savings must be between 0 and 99.')
  }

  return options
}

async function collectPngFiles(rootDir) {
  const entries = await fs.readdir(rootDir, {withFileTypes: true})
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(rootDir, entry.name)
      if (entry.isDirectory()) {
        return collectPngFiles(entryPath)
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
        return [entryPath]
      }
      return []
    }),
  )
  return files.flat()
}

async function collectRewriteFiles(rootDir) {
  const entries = await fs.readdir(rootDir, {withFileTypes: true})
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
        return []
      }

      const entryPath = path.join(rootDir, entry.name)
      if (entry.isDirectory()) {
        return collectRewriteFiles(entryPath)
      }
      if (entry.isFile() && rewriteExtensions.has(path.extname(entry.name))) {
        return [entryPath]
      }
      return []
    }),
  )
  return files.flat()
}

function groupByDirectory(files) {
  const groups = new Map()
  for (const file of files) {
    const dir = path.dirname(file)
    const group = groups.get(dir) ?? []
    group.push(file)
    groups.set(dir, group)
  }
  return [...groups.entries()]
}

export async function createWebpConversionPlan({
  assetsDir,
  encodeWebp,
  lossyMinBytes = DEFAULT_LOSSY_MIN_BYTES,
  minSavingsRatio = DEFAULT_MIN_SAVINGS_RATIO,
}) {
  const pngFiles = await collectPngFiles(assetsDir)
  const groups = groupByDirectory(pngFiles)
  const folders = []

  for (const [dir, files] of groups) {
    const conversions = []
    const blockers = []

    for (const pngPath of files.sort()) {
      const input = await fs.readFile(pngPath)
      const mode = input.byteLength >= lossyMinBytes ? 'lossy' : 'lossless'
      const output = await encodeWebp(input, pngPath, {
        lossless: mode === 'lossless',
      })
      const webpPath = pngPath.replace(/\.png$/i, '.webp')
      const savedBytes = input.byteLength - output.byteLength
      const requiredSavings = Math.ceil(input.byteLength * minSavingsRatio)

      if (mode === 'lossy' && savedBytes <= requiredSavings) {
        blockers.push({
          pngPath,
          webpPath,
          originalBytes: input.byteLength,
          webpBytes: output.byteLength,
          savedBytes,
        })
      }

      conversions.push({
        pngPath,
        webpPath,
        originalBytes: input.byteLength,
        webpBytes: output.byteLength,
        savedBytes,
        mode,
        output,
      })
    }

    folders.push({
      dir,
      relativeDir: normalizeRelativePath(path.relative(assetsDir, dir) || '.'),
      conversions,
      blockers,
      status: blockers.length === 0 ? 'convert' : 'skip',
    })
  }

  return {
    assetsDir,
    folders,
    pngCount: pngFiles.length,
    convertCount: folders
      .filter((folder) => folder.status === 'convert')
      .reduce((total, folder) => total + folder.conversions.length, 0),
    skipCount: folders
      .filter((folder) => folder.status === 'skip')
      .reduce((total, folder) => total + folder.conversions.length, 0),
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

function summarizePlan(plan) {
  const lines = [
    `Found ${plan.pngCount} PNG asset(s).`,
    `Convertible: ${plan.convertCount}. Skipped by folder policy: ${plan.skipCount}.`,
  ]

  for (const folder of plan.folders) {
    const originalBytes = folder.conversions.reduce((total, item) => total + item.originalBytes, 0)
    const webpBytes = folder.conversions.reduce((total, item) => total + item.webpBytes, 0)
    const savedBytes = originalBytes - webpBytes
    const marker = folder.status === 'convert' ? 'CONVERT' : 'SKIP'
    const losslessCount = folder.conversions.filter((item) => item.mode === 'lossless').length
    const lossyCount = folder.conversions.length - losslessCount
    lines.push(
      `${marker} ${folder.relativeDir}: ${folder.conversions.length} file(s), ${formatBytes(
        originalBytes,
      )} -> ${formatBytes(webpBytes)} (${formatBytes(savedBytes)} saved, ${lossyCount} lossy, ${losslessCount} lossless)`,
    )
    for (const blocker of folder.blockers) {
      lines.push(
        `  blocker ${path.basename(blocker.pngPath)}: ${formatBytes(
          blocker.originalBytes,
        )} -> ${formatBytes(blocker.webpBytes)}`,
      )
    }
  }

  return lines.join('\n')
}

export async function applyWebpConversionPlan(plan) {
  const converted = []

  for (const folder of plan.folders) {
    if (folder.status !== 'convert') {
      continue
    }

    for (const conversion of folder.conversions) {
      await fs.writeFile(conversion.webpPath, conversion.output)
      await fs.rm(conversion.pngPath)
      converted.push({
        from: conversion.pngPath,
        to: conversion.webpPath,
      })
    }
  }

  return converted
}

export async function rewriteConvertedPngReferences({rootDir = repoRoot, assetsDir, converted}) {
  if (converted.length === 0) {
    return []
  }

  const replacements = new Map()
  for (const item of converted) {
    const relativePng = normalizeRelativePath(path.relative(rootDir, item.from))
    const relativeWebp = normalizeRelativePath(path.relative(rootDir, item.to))
    const relativeAssetPng = normalizeRelativePath(path.relative(assetsDir, item.from))
    const relativeAssetWebp = normalizeRelativePath(path.relative(assetsDir, item.to))

    replacements.set(relativePng, relativeWebp)
    replacements.set(`/${relativePng}`, `/${relativeWebp}`)
    replacements.set(`assets/${relativeAssetPng}`, `assets/${relativeAssetWebp}`)
    replacements.set(`@/assets/${relativeAssetPng}`, `@/assets/${relativeAssetWebp}`)
    replacements.set(`../assets/${relativeAssetPng}`, `../assets/${relativeAssetWebp}`)
  }

  const convertedDirs = new Set(converted.map((item) => path.dirname(item.from)))
  for (const dir of convertedDirs) {
    const relativeDir = normalizeRelativePath(path.relative(assetsDir, dir))
    if (relativeDir && relativeDir !== '.') {
      replacements.set(`assets/${relativeDir}/*.png`, `assets/${relativeDir}/*.webp`)
    }
  }

  const rewriteFiles = await collectRewriteFiles(rootDir)
  const changed = []

  for (const filePath of rewriteFiles) {
    let content = await fs.readFile(filePath, 'utf8')
    let nextContent = content
    for (const [from, to] of replacements) {
      nextContent = nextContent.split(from).join(to)
    }

    if (nextContent !== content) {
      await fs.writeFile(filePath, nextContent, 'utf8')
      changed.push(filePath)
    }
  }

  return changed
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const sharp = (await import('sharp')).default
  const encodeWebp = (input, _pngPath, webpOptions) =>
    sharp(input)
      .webp({
        quality: options.quality,
        effort: options.effort,
        lossless: webpOptions.lossless,
      })
      .toBuffer()

  const plan = await createWebpConversionPlan({
    assetsDir: options.assetsDir,
    encodeWebp,
    lossyMinBytes: options.lossyMinBytes,
    minSavingsRatio: options.minSavingsRatio,
  })

  console.log(summarizePlan(plan))

  if (options.dryRun) {
    console.log('Dry run only. No files changed.')
    return
  }

  const converted = await applyWebpConversionPlan(plan)
  const rewritten = await rewriteConvertedPngReferences({
    rootDir: repoRoot,
    assetsDir: options.assetsDir,
    converted,
  })
  console.log(`Converted ${converted.length} PNG asset(s) to WebP.`)
  console.log(`Updated ${rewritten.length} text file(s) with .webp references.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
